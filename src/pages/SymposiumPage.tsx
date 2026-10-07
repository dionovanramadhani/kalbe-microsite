import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, RefreshCw } from "lucide-react";

export const SymposiumPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isSubscribed = true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((stream) => {
        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.warn("Video playback error:", err);
          });
        }
        setIsCameraActive(true);
        setCameraError(null);
      })
      .catch((err) => {
        console.warn("Camera access denied or unavailable:", err);
        if (isSubscribed) {
          setIsCameraActive(false);
          setCameraError("Akses kamera belum diizinkan atau tidak tersedia.");
        }
      });

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [retryCount]);

  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleScan = () => {
    setIsScanned(true);
    setTimeout(() => {
      alert("Berhasil memindai! Check-In Symposium Morinaga telah tercatat.");
      setIsScanned(false);
    }, 600);
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between items-center bg-cover bg-top select-none px-4 pt-3 pb-4 overflow-hidden"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.png')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Subtle Floating Back Button */}
      <button
        onClick={() => navigate("/home")}
        className="absolute top-3.5 left-3.5 z-30 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-[#C70412] shadow-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
        title="Kembali ke Homepage"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Top Banner: Morinaga Sympo Badge (Rocket + Banner) */}
      <div className="w-full flex justify-center pt-1.5 shrink-0">
        <div className="w-[165px] sm:w-[178px]">
          <img
            src="/assets/morinaga-sympo-image.png"
            alt="Morinaga Sympo"
            className="w-full h-auto object-contain drop-shadow-sm pointer-events-none"
          />
        </div>
      </div>

      {/* Center Camera Scanner Viewfinder */}
      <div className="relative w-full flex-1 flex items-center justify-center py-2 min-h-0">
        <div className="relative w-full max-w-[350px] aspect-[366/462] max-h-[355px] sm:max-h-[375px] flex items-center justify-center shrink-0">
          {/* Video Feed Container with 45-degree chamfered polygon clip-path matching frame */}
          <div
            className="relative w-full h-full bg-[#111116] overflow-hidden flex items-center justify-center"
            style={{
              clipPath:
                "polygon(22px 0%, calc(100% - 22px) 0%, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0% calc(100% - 22px), 0% 22px)",
            }}
          >
            {/* Live Camera Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Active Scanner Laser Beam Animation */}
            {isCameraActive && <div className="animate-scan-laser z-20" />}

            {/* Fallback View / Permission Request */}
            {!isCameraActive && (
              <div className="z-10 flex flex-col items-center justify-center px-4 text-center text-white/90">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2.5">
                  <Camera className="w-6 h-6 text-white/80" />
                </div>
                <p className="text-[12px] font-medium leading-relaxed mb-3 max-w-[220px]">
                  {cameraError || "Menghubungkan ke kamera pemindai..."}
                </p>
                <button
                  onClick={handleManualRetry}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C70412] hover:bg-[#8E000A] text-white text-[11px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Aktifkan Kamera</span>
                </button>
              </div>
            )}

            {/* Shutter Flash Animation Effect */}
            {isScanned && (
              <div className="absolute inset-0 bg-white/80 z-30 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Futuristic Red Camera Overlay Frame */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `url('/assets/scanner-frame-camera.png')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      </div>

      {/* Bottom Floating Scanner Action Button */}
      <div className="relative w-full flex justify-center items-center pt-1 pb-1 shrink-0 z-20">
        <button
          onClick={handleScan}
          className="relative group cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105"
          title="Tekan untuk Pindai"
        >
          <img
            src="/assets/scan-image.png"
            alt="Scan QR"
            className="w-[70px] h-[70px] object-contain drop-shadow-md group-hover:brightness-110 transition-all"
          />
        </button>
      </div>
    </div>
  );
};
