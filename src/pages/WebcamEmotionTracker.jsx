import { useEffect, useRef, useState } from "react";

const WebcamEmotionTracker = () => {
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const video = videoRef.current;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();
          intervalRef.current = setInterval(captureAndSend, 60000);
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

  const captureAndSend = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas
      .toDataURL("image/jpeg", 0.7)
      .split(",")[1];

    try {
      const res = await fetch(
        "https://ureido-nonethically-rena.ngrok-free.dev/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64 }),
        }
      );

      setResult(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {result && (
        <div>
          <h3>{result.dominant_emotion}</h3>
          <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default WebcamEmotionTracker;