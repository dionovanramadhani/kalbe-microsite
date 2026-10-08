import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Camera, RefreshCw, X } from "lucide-react";
import jsQR from "jsqr";
import {
  isPostTestCompleted,
  isBoothDetailingCompleted,
  setBoothDetailingCompleted,
  isEarlyLifeDetailingCompleted,
  setEarlyLifeDetailingCompleted,
  unlockReward,
} from "../data/rewardStore";
import { setSymposiumJoined } from "../data/symposiumStore";
import { Toast, type ToastType } from "../components/Toast";

export interface SymposiumPageProps {
  scanType?: "symposium" | "booth" | "early-life";
}

const isQrCodeValid = (
  decodedText: string,
  scanType: "symposium" | "booth" | "early-life",
): boolean => {
  if (!decodedText || typeof decodedText !== "string") return false;

  try {
    const parsed = JSON.parse(decodedText);
    if (typeof parsed === "object" && parsed !== null) {
      const eventStr = String(parsed.event || "").toUpperCase();
      const actionStr = String(parsed.action || "").toUpperCase();

      if (scanType === "symposium") {
        return (
          eventStr.includes("SYMPOSIUM") ||
          actionStr.includes("POST_TEST") ||
          actionStr.includes("SYMPOSIUM")
        );
      }

      if (scanType === "booth") {
        return (
          eventStr.includes("BOOTH") ||
          actionStr.includes("BOOTH") ||
          actionStr.includes("DETAILING")
        );
      }

      if (scanType === "early-life") {
        return (
          eventStr.includes("EARLY_LIFE") ||
          eventStr.includes("KALBE") ||
          actionStr.includes("EARLY_LIFE") ||
          actionStr.includes("DETAILING")
        );
      }
    }
  } catch {
    const textUpper = decodedText.toUpperCase();
    if (scanType === "symposium") {
      return textUpper.includes("SYMPOSIUM") || textUpper.includes("POST_TEST");
    }
    if (scanType === "booth") {
      return textUpper.includes("BOOTH") || textUpper.includes("DETAILING");
    }
    if (scanType === "early-life") {
      return textUpper.includes("EARLY_LIFE") || textUpper.includes("KALBE");
    }
  }

  return false;
};

export const SymposiumPage: React.FC<SymposiumPageProps> = ({ scanType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeScanType =
    scanType ||
    (location.pathname === "/early-life-scan" || location.state?.type === "early-life"
      ? "early-life"
      : location.pathname === "/booth-scan" || location.state?.type === "booth"
        ? "booth"
        : "symposium");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isNavigatingRef = useRef(false);
  const isProcessingScanRef = useRef(false);
  const scanFrameRef = useRef<((time: number) => void) | null>(null);

  // Jika user sudah menyelesaikan misi terkait, redirect ke home
  useEffect(() => {
    if (activeScanType === "symposium" && isPostTestCompleted()) {
      navigate("/home", { replace: true });
    } else if (activeScanType === "booth" && isBoothDetailingCompleted()) {
      navigate("/home", { replace: true });
    } else if (activeScanType === "early-life" && isEarlyLifeDetailingCompleted()) {
      navigate("/home", { replace: true });
    }
  }, [navigate, activeScanType]);

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

  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
  }>({
    show: false,
    type: "error",
    message: "",
  });

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({
      show: true,
      type,
      message,
    });
  }, []);

  // Play sound effect (/assets/sound-effect/beep.mp3) with Web Audio API synthesizer fallback
  const playScanSound = useCallback((isSuccess: boolean = true) => {
    // 1. Try playing audio file first
    try {
      const audio = new Audio("/assets/sound-effect/beep.mp3");
      audio.volume = 0.85;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to Web Audio synthesizer if audio file autoplay is restricted
          playSynthesizedTone(isSuccess);
        });
      }
    } catch {
      playSynthesizedTone(isSuccess);
    }
  }, []);

  // Web Audio synthesizer tone fallback
  const playSynthesizedTone = (isSuccess: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        // @ts-expect-error webkit prefix fallback
        window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (isSuccess) {
        // High bright chime for success
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2400, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else {
        // Low double-buzz for failure
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 350);
    } catch (e) {
      console.warn("Audio synthesizer error:", e);
    }
  };

  const onScanSuccess = useCallback(
    (decodedText: string): boolean => {
      if (isNavigatingRef.current || isProcessingScanRef.current) return false;
      isProcessingScanRef.current = true;

      // Validasi QR code: jika QR yang discan salah, user tidak bisa lanjut
      const isValid = isQrCodeValid(decodedText, activeScanType);

      if (!isValid) {
        // Play failed scan audio feedback
        playScanSound(false);

        const errorMsg =
          activeScanType === "early-life"
            ? "QR Code tidak valid! Pastikan Anda memindai QR Code untuk Kalbe Early Life Solutions."
            : activeScanType === "booth"
              ? "QR Code tidak valid! Pastikan Anda memindai QR Code untuk Morinaga Booth."
              : "QR Code tidak valid! Pastikan Anda memindai QR Code untuk Symposium Morinaga.";
        
        // Show floating toaster instead of native browser alert
        showToast("error", errorMsg);

        // Resume scanning loop after short delay
        setTimeout(() => {
          isProcessingScanRef.current = false;
          if (!isNavigatingRef.current && scanFrameRef.current) {
            if (animFrameIdRef.current) {
              cancelAnimationFrame(animFrameIdRef.current);
            }
            animFrameIdRef.current = requestAnimationFrame(scanFrameRef.current);
          }
        }, 1200);
        return false;
      }

      isNavigatingRef.current = true;

      // Play successful scanner beep audio feedback
      playScanSound(true);

      // Trigger shutter flash
      setIsScanned(true);

      // Stop camera hardware immediately
      stopCameraHardware();

      if (activeScanType === "early-life") {
        setEarlyLifeDetailingCompleted(true);
        unlockReward("early-life");
        setTimeout(() => {
          setIsScanned(false);
          navigate("/home", { state: { showEarlyLifeSuccessModal: true } });
        }, 350);
      } else if (activeScanType === "booth") {
        setBoothDetailingCompleted(true);
        unlockReward("morinaga-booth");
        setTimeout(() => {
          setIsScanned(false);
          navigate("/home", { state: { showBoothSuccessModal: true } });
        }, 350);
      } else {
        setSymposiumJoined(true);
        setTimeout(() => {
          setIsScanned(false);
          navigate("/post-test", { state: { scannedData: decodedText } });
        }, 450);
      }

      return true;
    },
    [navigate, stopCameraHardware, playScanSound, showToast, activeScanType],
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
    const hasBarcodeDetector =
      typeof window !== "undefined" && "BarcodeDetector" in window;
    const barcodeDetector = hasBarcodeDetector
      ? // @ts-expect-error BarcodeDetector is a modern browser web standard
        new window.BarcodeDetector({ formats: ["qr_code"] })
      : null;

    const scanFrame = async (timestamp: number) => {
      if (!isSubscribed || isNavigatingRef.current) return;

      if (isProcessingScanRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
        return;
      }

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
              const handled = onScanSuccess(barcodes[0].rawValue);
              if (handled) return;
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
            const handled = onScanSuccess(code.data);
            if (handled) return;
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    scanFrameRef.current = scanFrame;

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
          videoRef.current
            .play()
            .then(() => {
              if (isSubscribed) {
                setIsCameraActive(true);
                setCameraError(null);
                animFrameIdRef.current = requestAnimationFrame(scanFrame);
              }
            })
            .catch((err) => {
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
      scanFrameRef.current = null;
      stopCameraHardware();
    };
  }, [retryCount, onScanSuccess, stopCameraHardware]);

  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleManualScan = () => {
    if (activeScanType === "early-life") {
      onScanSuccess(
        JSON.stringify({
          event: "KALBE_EARLY_LIFE",
          action: "DETAILING_SCAN",
          title: "Kalbe Early Life Solutions Detailing",
        }),
      );
    } else if (activeScanType === "booth") {
      onScanSuccess(
        JSON.stringify({
          event: "MORINAGA_BOOTH_2026",
          action: "DETAILING_BOOTH",
          title: "Morinaga Booth Detailing",
        }),
      );
    } else {
      onScanSuccess(
        JSON.stringify({
          event: "MORINAGA_SYMPOSIUM_2026",
          action: "CHECKIN_POST_TEST",
          redirectUrl: "/post-test",
        }),
      );
    }
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between items-center bg-cover bg-top select-none px-4 pt-2.5 pb-3 overflow-hidden"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.png')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Subtle Floating Back Button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-3 left-3.5 z-30 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-[#C70412] shadow-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
        title="Kembali ke Homepage"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Floating QR Modal Trigger Button (Right) */}
      {/* <button
        onClick={() => setShowQrModal(true)}
        className="absolute top-3 right-3.5 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-[#8E000A] shadow-sm backdrop-blur-sm transition-all active:scale-95 cursor-pointer text-[11px] font-bold border border-red-100"
        title="Lihat QR Code Contoh"
      >
        <QrCode className="w-3.5 h-3.5 text-[#C70412]" />
        <span>QR Demo</span>
      </button> */}

      {/* Top Banner: Kalbe Early Life Solutions, Morinaga Booth, or Morinaga Sympo Badge */}
      <div className="w-full flex justify-center pt-0.5 shrink-0">
        <div
          className={
            activeScanType === "early-life"
              ? "w-[180px] sm:w-[195px]"
              : activeScanType === "booth"
                ? "w-[175px] sm:w-[190px]"
                : "w-[168px] sm:w-[180px]"
          }
        >
          <img
            src={
              activeScanType === "early-life"
                ? "/assets/kalbe-early-life-solution-logo-scaner.png"
                : activeScanType === "booth"
                  ? "/assets/morinaga-booth-image-2.png"
                  : "/assets/morinaga-sympo-image.png"
            }
            alt={
              activeScanType === "early-life"
                ? "Kalbe Early Life Solutions"
                : activeScanType === "booth"
                  ? "Morinaga Booth"
                  : "Morinaga Sympo"
            }
            className="w-full h-auto object-contain drop-shadow-sm pointer-events-none"
          />
        </div>
      </div>

      {/* Center Camera Scanner Viewfinder (Responsive to desktop and mobile viewport height) */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center my-auto py-1 min-h-0">
        <div className="relative h-full max-h-[375px] sm:max-h-[395px] aspect-[366/462] max-w-[320px] sm:max-w-[330px] flex items-center justify-center">
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
      <div className="relative w-full flex justify-center items-center pt-0.5 pb-2 shrink-0 z-20">
        <button
          onClick={handleManualScan}
          className="relative group cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105"
          title="Tekan untuk Pindai Manual"
        >
          <img
            src="/assets/scan-image.png"
            alt="Scan QR"
            className="w-[62px] h-[62px] sm:w-[66px] sm:h-[66px] object-contain drop-shadow-md group-hover:brightness-110 transition-all"
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
              {activeScanType === "early-life"
                ? "QR Code Dummy Kalbe Early Life Solutions"
                : activeScanType === "booth"
                  ? "QR Code Dummy Morinaga Booth"
                  : "QR Code Dummy Symposium"}
            </h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-snug">
              Arahkan kamera smartphone lain ke QR ini, atau gunakan tombol di bawah untuk
              test instant.
            </p>

            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-inner mb-4">
              <img
                src={
                  activeScanType === "early-life"
                    ? "/assets/sample-qr-early-life.png"
                    : activeScanType === "booth"
                      ? "/assets/sample-qr-booth.png"
                      : "/assets/sample-qr-symposium.png"
                }
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

      {/* Floating Toast Notification for Scan Failures */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        duration={3500}
      />
    </div>
  );
};
