import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, RefreshCw, QrCode, X } from "lucide-react";
import jsQR from "jsqr";
import { isPostTestCompleted } from "../data/rewardStore";

export const SymposiumPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isNavigatingRef = useRef(false);

  // Jika user sudah menyelesaikan post-test, tidak boleh masuk lagi ke symposium
  useEffect(() => {
    if (isPostTestCompleted()) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Stop camera tracks physically
  const stopCameraHardware = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Play loud, crisp, and piercing scanner "beep" tone using dual-harmonic synthesis
  const playBeepSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        // @ts-expect-error webkit prefix fallback
        window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Primary high-pitch oscillator (2400Hz - high piercing scanner beep)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(2400, now);

      // Secondary harmonic oscillator (3200Hz - adds sharpness/bite to the sound)
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(3200, now);

      // Master Gain for maximum clear output
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.65, now);
      // Quick exponential decay over 180ms
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.18);
      osc2.stop(now + 0.18);

      // Auto close audio context
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 350);
    } catch (e) {
      console.warn("Audio playback not allowed or failed:", e);
    }
  }, []);

  const onScanSuccess = useCallback(
    (decodedText: string) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      // Play scanner beep audio feedback
      playBeepSound();

      // Trigger shutter flash
      setIsScanned(true);

      // Stop camera hardware immediately
      stopCameraHardware();

      setTimeout(() => {
        setIsScanned(false);
        navigate("/post-test", { state: { scannedData: decodedText } });
      }, 450);
    },
    [navigate, stopCameraHardware, playBeepSound]
  );

  const handleBackToHome = () => {
    stopCameraHardware();
    navigate("/home");
  };

  useEffect(() => {
    let isSubscribed = true;
    const canvas = document.createElement("canvas");
    const canvasCtx = canvas.getContext("2d", { willReadFrequently: true });

    let lastScanTime = 0;
    // Check if high-performance hardware-accelerated BarcodeDetector is supported
    const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
    const barcodeDetector = hasBarcodeDetector
      // @ts-expect-error BarcodeDetector is a modern browser web standard
      ? new window.BarcodeDetector({ formats: ["qr_code"] })
      : null;

    const scanFrame = async (timestamp: number) => {
      if (!isSubscribed || isNavigatingRef.current) return;

      const video = videoRef.current;
      // Throttle scanning calculation to every 100ms (10 FPS) so the main thread & CSS laser animation stays 60fps buttery smooth
      if (
        video &&
        video.readyState >= video.HAVE_CURRENT_DATA &&
        timestamp - lastScanTime >= 100
      ) {
        lastScanTime = timestamp;

        try {
          if (barcodeDetector) {
            // Hardware-accelerated browser QR detector (Instant & 0 CPU overhead)
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              onScanSuccess(barcodes[0].rawValue);
              return;
            }
          }
        } catch {
          // Fallback to jsQR if detector fails on frame
        }

        // jsQR fallback with optimized downscaled processing area
        if (canvasCtx && video.videoWidth > 0) {
          // Downscale to max width 640px for super fast matrix processing
          const scale = Math.min(1, 640 / video.videoWidth);
          const scanWidth = Math.floor(video.videoWidth * scale);
          const scanHeight = Math.floor(video.videoHeight * scale);

          if (canvas.width !== scanWidth || canvas.height !== scanHeight) {
            canvas.width = scanWidth;
            canvas.height = scanHeight;
          }

          canvasCtx.drawImage(video, 0, 0, scanWidth, scanHeight);
          const imageData = canvasCtx.getImageData(0, 0, scanWidth, scanHeight);

          // Test with invert detection enabled so high contrast or red/white QRs are instantly detected
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
            onScanSuccess(code.data);
            return;
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setTimeout(() => {
        if (isSubscribed) {
          setCameraError("Perangkat tidak mendukung akses kamera.");
        }
      }, 0);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().then(() => {
            if (isSubscribed) {
              setIsCameraActive(true);
              setCameraError(null);
              animFrameIdRef.current = requestAnimationFrame(scanFrame);
            }
          }).catch((err) => {
            console.warn("Video play error:", err);
          });
        }
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
      stopCameraHardware();
    };
  }, [retryCount, onScanSuccess, stopCameraHardware]);

  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleManualScan = () => {
    onScanSuccess(
      JSON.stringify({
        event: "MORINAGA_SYMPOSIUM_2026",
        action: "CHECKIN_POST_TEST",
        redirectUrl: "/post-test",
      })
    );
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
        onClick={handleBackToHome}
        className="absolute top-3.5 left-3.5 z-30 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-[#C70412] shadow-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
        title="Kembali ke Homepage"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Floating QR Modal Trigger Button (Right) */}
      <button
        onClick={() => setShowQrModal(true)}
        className="absolute top-3.5 right-3.5 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-[#8E000A] shadow-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer text-[11px] font-bold border border-red-100"
        title="Lihat QR Code Contoh"
      >
        <QrCode className="w-3.5 h-3.5 text-[#C70412]" />
        <span>QR Demo</span>
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
            {/* Direct Native HTML5 Video Stream */}
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
          onClick={handleManualScan}
          className="relative group cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105"
          title="Tekan untuk Pindai Manual"
        >
          <img
            src="/assets/scan-image.png"
            alt="Scan QR"
            className="w-[70px] h-[70px] object-contain drop-shadow-md group-hover:brightness-110 transition-all"
          />
        </button>
      </div>

      {/* Sample QR Modal for Easy Testing */}
      {showQrModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="relative bg-white rounded-2xl p-5 max-w-[300px] w-full flex flex-col items-center text-center shadow-2xl border border-red-100">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-[15px] font-bold text-[#8E000A] mb-1">
              QR Code Dummy Symposium
            </h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-snug">
              Arahkan kamera smartphone lain ke QR ini, atau gunakan tombol di bawah untuk test instant.
            </p>

            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-inner mb-4">
              <img
                src="/assets/sample-qr-symposium.png"
                alt="Sample QR Code"
                className="w-[180px] h-[180px] object-contain"
              />
            </div>

            <button
              onClick={() => {
                setShowQrModal(false);
                handleManualScan();
              }}
              style={{
                background: "linear-gradient(90deg, #C70412 0%, #8E000A 100%)",
              }}
              className="w-full py-2.5 rounded-lg text-white font-bold text-[12px] uppercase tracking-wide cursor-pointer active:scale-95 transition"
            >
              Simulasikan Scan Sukses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
