import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { X, Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import './VideoRoom.css';

const SOCKET_SERVER = 'https://hackathon-web-socket-server.onrender.com';

export default function VideoRoom({ classInfo, onClose }) {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const peersRef = useRef({});
    const localStreamRef = useRef(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [peerStreams, setPeerStreams] = useState({});
    const [myPeerId, setMyPeerId] = useState(null);
    const [studentApiResponses, setStudentApiResponses] = useState({});
    const captureVideoRef = useRef(null);
    const captureCanvasRef = useRef(null);
    const captureStreamRef = useRef(null);
    const [captureStreamReady, setCaptureStreamReady] = useState(false);

    // Get user media (webcam + mic)
    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                    audio: true
                });
                localStreamRef.current = stream;

                // Mute local audio by default to prevent feedback
                stream.getAudioTracks().forEach(track => {
                    track.enabled = !isMuted;
                });
            } catch (err) {
                console.error('Error accessing media devices:', err);
                alert('Could not access camera/microphone. Please grant permissions.');
            }
        };

        getMedia();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (captureStreamRef.current) {
                captureStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Students: separate capture stream (always-on video for compulsory 5s snapshots regardless of main video toggle)
    // Use front camera (facingMode: 'user') on mobile - back camera is often the default there
    useEffect(() => {
        if (user?.role !== 'student') return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

        const getCaptureStream = async () => {
            try {
                const videoConstraints = { width: 160, height: 120 };
                if (isMobile) {
                    videoConstraints.facingMode = 'user';
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints
                });
                captureStreamRef.current = stream;
                setCaptureStreamReady(true);
            } catch (err) {
                console.error('Capture stream failed:', err);
            }
        };
        getCaptureStream();
        return () => {
            if (captureStreamRef.current) {
                captureStreamRef.current.getTracks().forEach(track => track.stop());
                captureStreamRef.current = null;
                setCaptureStreamReady(false);
            }
        };
    }, [user?.role]);

    // Initialize PeerJS and Socket.io
    useEffect(() => {
        // Create PeerJS instance using the free cloud service
        const peer = new Peer(undefined, {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('My peer ID is:', id);
            setMyPeerId(id);

            // Connect to Socket.io server after peer is ready
            connectToSocket(id);
        });

        peer.on('call', (call) => {
            console.log('Receiving call from:', call.peer);

            // Answer the call with our stream
            call.answer(localStreamRef.current);

            // Receive remote stream
            call.on('stream', (remoteStream) => {
                console.log('Received stream from:', call.peer);
                addVideoStream(call.peer, remoteStream);
            });

            call.on('close', () => {
                console.log('Call closed with:', call.peer);
                removeVideoStream(call.peer);
            });

            peersRef.current[call.peer] = call;
        });

        peer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });

        return () => {
            // Cleanup
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePingAll = () => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send-ping', {
                classId: classInfo.id,
                message: `Hello from ${user?.name || 'Anonymous'}!`,
            });
        }
    };

    // 2. Setup the listener to catch the message and log it
    useEffect(() => {
        if (!socketRef.current) return;

        const socket = socketRef.current;

        socket.on('receive-ping', (data) => {
            console.log('hi'); // As requested
            console.log('Message Received:', data.message);
        });

        return () => {
            socket.off('receive-ping');
        };
    }, [isConnected]);

    const RETRY_DELAY_MS = 800;

    // Assign capture stream to video when ready; explicit play() for mobile autoplay
    useEffect(() => {
        const video = captureVideoRef.current;
        const stream = captureStreamRef.current;
        if (video && stream && user?.role === 'student') {
            video.srcObject = stream;
            video.play().catch(() => {});
        }
    }, [captureStreamReady, user?.role]);

    const IMAGE_ANALYZER_API = 'https://bavadharani05-image-analyzer.hf.space/predict';

    // Student: capture → API call → send response to teacher → capture next (API-driven cycle)
    // Retry when video not ready - fixes startup race and mobile issues
    useEffect(() => {
        if (user?.role !== 'student' || !isConnected || !captureStreamReady || !socketRef.current || !classInfo?.id || !myPeerId) return;

        let cancelled = false;
        let retryTimeoutId = null;

        const captureAndAnalyze = async () => {
            if (cancelled) return;

            const video = captureVideoRef.current;
            const canvas = captureCanvasRef.current;

            if (!video || !canvas || !video.srcObject || video.videoWidth === 0) {
                retryTimeoutId = setTimeout(captureAndAnalyze, RETRY_DELAY_MS);
                return;
            }

            const ctx = canvas.getContext('2d');
            const w = 160;
            const h = 120;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            if (!base64 || cancelled) {
                retryTimeoutId = setTimeout(captureAndAnalyze, RETRY_DELAY_MS);
                return;
            }

            try {
                const apiResponse = await fetch(IMAGE_ANALYZER_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_base64: base64 })
                });
                if (cancelled) return;

                const data = await apiResponse.json();
                if (cancelled) return;

                socketRef.current?.emit('student-send-analysis', {
                    classId: classInfo.id,
                    peerId: myPeerId,
                    apiResponse: data
                });
            } catch (err) {
                console.error('Image analysis API failed:', err);
                if (!cancelled) retryTimeoutId = setTimeout(captureAndAnalyze, RETRY_DELAY_MS);
                return;
            }

            if (!cancelled) {
                retryTimeoutId = setTimeout(captureAndAnalyze, 0);
            }
        };

        retryTimeoutId = setTimeout(captureAndAnalyze, 500);

        return () => {
            cancelled = true;
            if (retryTimeoutId) clearTimeout(retryTimeoutId);
        };
    }, [user?.role, isConnected, captureStreamReady, classInfo?.id, myPeerId]);

    const connectToSocket = (peerId) => {
        socketRef.current = io(SOCKET_SERVER, {
            transports: ['websocket'],
            reconnection: true
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to signaling server:', socketRef.current.id);
            setIsConnected(true);

            // Join the class room with peer ID
            socketRef.current.emit('join-class', {
                classId: classInfo.id,
                userName: user?.name || 'Anonymous',
                userRole: user?.role || 'student',
                peerId: peerId
            });
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        // Receive current participants
        socketRef.current.on('room-participants', (participantList) => {
            console.log('Room participants:', participantList);
            setParticipants(participantList);

            // Call all existing participants
            participantList.forEach(participant => {
                if (participant.peerId && participant.peerId !== peerId) {
                    connectToNewUser(participant.peerId);
                }
            });
        });

        // New user joined
        socketRef.current.on('user-joined', (participant) => {
            console.log('User joined:', participant.name, participant.peerId);
            setParticipants(prev => [...prev, participant]);

            // Add system message
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'System',
                text: `${participant.name} joined the class`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSystem: true
            }]);

            // Connect to the new user
            if (participant.peerId) {
                connectToNewUser(participant.peerId);
            }
        });

        // User left
        socketRef.current.on('user-left', (data) => {
            console.log('User left:', data.name);
            setParticipants(prev => prev.filter(p => p.id !== data.id));
            if (data.peerId) {
                setStudentApiResponses(prev => {
                    const next = { ...prev };
                    delete next[data.peerId];
                    return next;
                });
            }

            // Remove stream
            if (data.peerId) {
                removeVideoStream(data.peerId);
                if (peersRef.current[data.peerId]) {
                    peersRef.current[data.peerId].close();
                    delete peersRef.current[data.peerId];
                }
            }

            // Add system message
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'System',
                text: `${data.name} left the class`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSystem: true
            }]);
        });

        // New chat message
        socketRef.current.on('new-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Participant status updated
        socketRef.current.on('participant-updated', (update) => {
            setParticipants(prev => prev.map(p =>
                p.id === update.id ? { ...p, ...update } : p
            ));
        });

        // Teacher: receive student image analysis API response updates
        socketRef.current.on('student-analysis-update', (data) => {
            if (data?.peerId != null && data?.apiResponse != null) {
                setStudentApiResponses(prev => ({
                    ...prev,
                    [data.peerId]: data.apiResponse
                }));
            }
        });
    };

    const connectToNewUser = (userPeerId) => {
        console.log('Calling peer:', userPeerId);

        if (!localStreamRef.current) {
            console.warn('Local stream not ready yet');
            return;
        }

        const call = peerRef.current.call(userPeerId, localStreamRef.current);

        call.on('stream', (remoteStream) => {
            console.log('Received stream from:', userPeerId);
            addVideoStream(userPeerId, remoteStream);
        });

        call.on('close', () => {
            console.log('Call closed with:', userPeerId);
            removeVideoStream(userPeerId);
        });

        call.on('error', (err) => {
            console.error('Call error with', userPeerId, err);
        });

        peersRef.current[userPeerId] = call;
    };

    const addVideoStream = (peerId, stream) => {
        setPeerStreams(prev => ({
            ...prev,
            [peerId]: stream
        }));
    };

    const removeVideoStream = (peerId) => {
        setPeerStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[peerId];
            return newStreams;
        });
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        // Toggle local audio track
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
        }

        if (socketRef.current) {
            socketRef.current.emit('toggle-mic', {
                classId: classInfo.id,
                isMuted: newMutedState
            });
        }
    };

    const toggleVideo = () => {
        const newVideoState = !isVideoOn;
        setIsVideoOn(newVideoState);

        // Toggle local video track
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = newVideoState;
            });
        }

        if (socketRef.current) {
            socketRef.current.emit('toggle-video', {
                classId: classInfo.id,
                isVideoOn: newVideoState
            });
        }
    };

    const toggleChat = () => setShowChat(!showChat);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current) {
            socketRef.current.emit('send-message', {
                classId: classInfo.id,
                message: newMessage,
                sender: user?.name || 'Anonymous'
            });
            setNewMessage('');
        }
    };

    const handleLeave = () => {
        if (window.confirm('Are you sure you want to leave the class?')) {
            if (socketRef.current && classInfo?.id) {
                socketRef.current.emit('leave-class', { classId: classInfo.id });
            }
            onClose();
        }
    };

    // Get teacher from participants or use default
    const teacher = participants.find(p => p.role === 'teacher') || { name: classInfo.teacher };
    const otherParticipants = participants.filter(p => p.peerId !== myPeerId);
    const studentsList = participants.filter(p => p.role === 'student');
    const isTeacher = user?.role === 'teacher';

    return (
        <div className="video-room-overlay">
            <div className="video-room">
                {/* Header */}
                <div className="video-room-header">
                    <div>
                        <h3>{classInfo.subject}</h3>
                        <p>with {teacher.name} • {participants.length} participant{participants.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        {isConnected ? (
                            <span className="connection-status connected">🟢 Connected (PeerJS)</span>
                        ) : (
                            <span className="connection-status disconnected">🔴 Connecting...</span>
                        )}
                        <button className="video-room-close" onClick={handleLeave}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Separate capture window for students - compulsory 5s snapshots (must be visible for capture to work) */}
                {user?.role === 'student' && (
                    <div className="video-room-capture-panel">
                        <span className="video-room-capture-label">Capture for teacher</span>
                        <div className="video-room-capture-panel-inner">
                            <video
                                ref={captureVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="video-room-capture-video"
                            />
                            <canvas ref={captureCanvasRef} className="video-room-capture-canvas" />
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="video-room-content">
                    {/* Main video area */}
                    <div className="video-room-main">
                        {/* Teacher's video */}
                        <div className="main-video">
                            {teacher.peerId && peerStreams[teacher.peerId] ? (
                                <video
                                    autoPlay
                                    playsInline
                                    ref={(video) => {
                                        if (video && peerStreams[teacher.peerId]) {
                                            video.srcObject = peerStreams[teacher.peerId];
                                        }
                                    }}
                                    className="peer-video"
                                />
                            ) : (
                                <div className="video-placeholder">
                                    <Avatar name={teacher.name} size="xl" />
                                    <p className="video-label">{teacher.name} (Teacher)</p>
                                </div>
                            )}
                        </div>

                        {/* Participant thumbnails */}
                        <div className="video-thumbnails">
                            {/* Your video */}
                            <div className="video-thumbnail your-video">
                                {isVideoOn && localStreamRef.current ? (
                                    <video
                                        ref={(video) => {
                                            if (video && localStreamRef.current) {
                                                video.srcObject = localStreamRef.current;
                                            }
                                        }}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="webcam-stream"
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                ) : (
                                    <div className="video-off">
                                        <Avatar name={user?.name} size="md" />
                                    </div>
                                )}
                                <div className="video-thumbnail-label">
                                    You ({user?.role}) {isMuted && '🔇'}
                                </div>
                            </div>

                            {/* Other participants */}
                            {otherParticipants.map((participant) => (
                                <div key={participant.id} className="video-thumbnail">
                                    {peerStreams[participant.peerId] && participant.isVideoOn ? (
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={(video) => {
                                                if (video && peerStreams[participant.peerId]) {
                                                    video.srcObject = peerStreams[participant.peerId];
                                                }
                                            }}
                                            className="peer-video-small"
                                        />
                                    ) : (
                                        <div className="video-off">
                                            <Avatar name={participant.name} size="sm" />
                                        </div>
                                    )}
                                    <div className="video-thumbnail-label">
                                        {participant.name} ({participant.role}) {participant.isMuted && '🔇'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Controls bar */}
                        <div className="video-controls">
                            <div className="controls-group">
                                <button
                                    className={`control-btn ${isMuted ? 'active' : ''}`}
                                    onClick={toggleMute}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>

                                <button
                                    className={`control-btn ${!isVideoOn ? 'active' : ''}`}
                                    onClick={toggleVideo}
                                    title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                                >
                                    {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                                </button>

                                <button
                                    className="control-btn"
                                    title="Share screen"
                                    onClick={() => alert('Screen sharing coming soon!')}
                                >
                                    <MonitorUp size={20} />
                                </button>

                                <button
                                    className={`control-btn ${showChat ? 'active' : ''}`}
                                    onClick={toggleChat}
                                    title="Toggle chat"
                                >
                                    <MessageSquare size={20} />
                                    {messages.length > 0 && <span className="chat-badge">{messages.length}</span>}
                                </button>
                            </div>

                            <button className="leave-btn" onClick={handleLeave}>
                                <PhoneOff size={20} />
                                Leave Class
                            </button>
                        </div>
                    </div>

                    {/* Student list panel (teacher only) */}
                    {isTeacher && (
                        <aside className="video-students-panel">
                            <div className="students-panel-header">
                                <h4>Students</h4>
                                <span className="students-count">{studentsList.length}</span>
                            </div>
                            <div className="students-panel-list">
                                {studentsList.length === 0 ? (
                                    <p className="students-panel-empty">No students in class yet</p>
                                ) : (
                                    studentsList.map((student) => (
                                        <div key={student.id} className={`student-card ${studentApiResponses[student.peerId] ? 'student-card-with-metrics' : ''}`}>
                                            <div className="student-card-header">
                                                <div className="student-card-avatar">
                                                    <Avatar name={student.name} size="md" />
                                                </div>
                                                <div className="student-card-info">
                                                    <span className="student-card-name">{student.name}</span>
                                                    <span className="student-card-status">
                                                        {student.isMuted ? '🔇 Muted' : '🎤 Active'}
                                                        {student.isVideoOn ? ' • 📹 Video on' : ' • 📹 Video off'}
                                                    </span>
                                                </div>
                                            </div>
                                            {studentApiResponses[student.peerId] && (() => {
                                                    const data = studentApiResponses[student.peerId];
                                                    const confidence = data.confidence_level ?? 0;
                                                    const attention = data.attention_level ?? 0;
                                                    const thinking = data.thinking_level ?? 0;
                                                    const deviceDetected = data.isDeviceDetected ?? false;
                                                    const getLevelColor = (val) => val >= 80 ? 'level-high' : val >= 60 ? 'level-medium' : 'level-low';
                                                    return (
                                                        <div className="student-card-metrics">
                                                            <div className="student-metric">
                                                                <span className="student-metric-label">Confidence</span>
                                                                <div className="student-metric-bar-wrap">
                                                                    <div className={`student-metric-bar student-metric-fill ${getLevelColor(confidence)}`} style={{ '--metric-width': `${confidence}%` }} />
                                                                </div>
                                                                <span className="student-metric-value">{confidence}%</span>
                                                            </div>
                                                            <div className="student-metric">
                                                                <span className="student-metric-label">Attention</span>
                                                                <div className="student-metric-bar-wrap">
                                                                    <div className={`student-metric-bar student-metric-fill ${getLevelColor(attention)}`} style={{ '--metric-width': `${attention}%` }} />
                                                                </div>
                                                                <span className="student-metric-value">{attention}%</span>
                                                            </div>
                                                            <div className="student-metric">
                                                                <span className="student-metric-label">Thinking</span>
                                                                <div className="student-metric-bar-wrap">
                                                                    <div className={`student-metric-bar student-metric-fill ${getLevelColor(thinking)}`} style={{ '--metric-width': `${thinking}%` }} />
                                                                </div>
                                                                <span className="student-metric-value">{thinking}%</span>
                                                            </div>
                                                            <div className={`student-metric-badge ${deviceDetected ? 'device-detected' : 'device-clear'}`}>
                                                                {deviceDetected ? '📱 Device detected' : '✓ No device'}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>
                    )}

                    {/* Chat sidebar */}
                    {showChat && (
                        <div className="video-chat">
                            <div className="chat-header">
                                <h4>Class Chat (Live)</h4>
                            </div>

                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <p className="chat-empty">No messages yet. Start the conversation!</p>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className={`chat-message ${msg.isSystem ? 'system-message' : ''}`}>
                                            <div className="chat-message-header">
                                                <strong>{msg.sender}</strong>
                                                <span className="chat-time">{msg.time}</span>
                                            </div>
                                            <p>{msg.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="chat-input"
                                    disabled={!isConnected}
                                />
                                <Button type="submit" variant="primary" size="sm" disabled={!isConnected}>
                                    Send
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
