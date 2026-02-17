import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { X, Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import './VideoRoom.css';

const SOCKET_SERVER = 'http://localhost:5000';

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
            // Cleanup local stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            if (socketRef.current) {
                socketRef.current.emit('leave-class', { classId: classInfo.id });
            }
            onClose();
        }
    };

    // Get teacher from participants or use default
    const teacher = participants.find(p => p.role === 'teacher') || { name: classInfo.teacher };
    const otherParticipants = participants.filter(p => p.peerId !== myPeerId);

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
                                        autoPlay
                                        muted
                                        playsInline
                                        ref={(video) => {
                                            if (video && localStreamRef.current) {
                                                video.srcObject = localStreamRef.current;
                                            }
                                        }}
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
