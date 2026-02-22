import { useEffect, useRef, useState } from "react";

const WebcamEmotionTrackerTwo = ({ studentId, classId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const startedRef = useRef(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = videoRef.current;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();
          // Capture every 5 seconds to reduce server load
          intervalRef.current = setInterval(captureAndProcess, 5000); 
        };
      } catch (err) {
        setError("Camera access denied or unavailable");
        console.error(err);
      }
    };

    startWebcam();

    return () => {
      clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const captureAndProcess = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

    try {
      // 1. Get prediction from your Python AI model
      const aiResponse = await fetch("https://ureido-nonethically-rena.ngrok-free.dev/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64 }),
      });
      const aiData = await aiResponse.json();
      setResult(aiData);

      // 2. Save the analyzed data to your Express/MongoDB backend
      await fetch("http://localhost:5000/api/metrics/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          classId,
          timestamp: new Date().toISOString(),
          metrics: aiData
        }),
      });

    } catch (e) {
      console.error("Processing error:", e);
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-900 w-full max-w-md">
      <video ref={videoRef} muted playsInline className="w-full h-auto" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Optional: Minimal feedback for the student */}
      {result && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-md text-sm flex justify-between">
            <span>Status: {result.face_detected ? "🟢 Active" : "🔴 Away"}</span>
            <span className="capitalize">Mood: {result.emotion_analysis.dominant_emotion}</span>
        </div>
      )}
      {error && <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded">{error}</div>}
    </div>
  );
};

export default WebcamEmotionTrackerTwo;