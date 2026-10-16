import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Camera, RefreshCw, X } from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import {
  isPostTestCompleted,
  isBoothDetailingCompleted,
  setBoothDetailingCompleted,
  isEarlyLifeDetailingCompleted,
  setEarlyLifeDetailingCompleted,
  unlockReward,
} from "../data/rewardStore";
import { setSymposiumJoined, getSymposiumMasterData } from "../data/symposiumStore";
import { Toast, type ToastType } from "../components/Toast";
import { useModalAnimation } from "../utils/useModalAnimation";
import {
  getKalbeSymposiumsList,
  getKalbeBoothsList,
  insertKalbeBoothParticipant,
  getCachedKalbeBooths,
  getCachedKalbeSymposiums,
} from "../utils/kalbeApi";
import type { KalbeBoothResponse, KalbeSymposiumResponse } from "../admin/adminApi";

export interface SymposiumPageProps {
  scanType?: "symposium" | "booth" | "early-life";
}

export interface ParsedQrResult {
  isValid: boolean;
  type: "symposium" | "early-life" | "booth" | null;
  boothId: string | null;
  sympoId: string | null;
  matchedBooth?: KalbeBoothResponse;
  rawText: string;
}

const parseQrData = (
  decodedText: string,
  booths: KalbeBoothResponse[] = [],
  sympos: KalbeSymposiumResponse[] = [],
): ParsedQrResult => {
  if (!decodedText || typeof decodedText !== "string") {
    return { isValid: false, type: null, boothId: null, sympoId: null, rawText: "" };
  }

  const trimmed = decodedText.trim();
  let boothId: string | null = null;
  let sympoId: string | null = null;
  let detectedType: "symposium" | "early-life" | "booth" | null = null;

  // 0. Check if scanned content directly matches an uploaded booth or symposium QR code content or URL
  const boothByQr = booths.find(
    (b) =>
      (b.qr_code_content && (b.qr_code_content.trim() === trimmed || b.qr_code_content.trim().toLowerCase() === trimmed.toLowerCase())) ||
      (b.qr_code && b.qr_code.trim() === trimmed)
  );
  if (boothByQr) {
    boothId = boothByQr.id;
    const bName = boothByQr.name.toLowerCase();
    detectedType = bName.includes("early") || bName.includes("life") ? "early-life" : "booth";
  }

  const sympoByQr = sympos.find(
    (s) =>
      (s.qr_code_content && (s.qr_code_content.trim() === trimmed || s.qr_code_content.trim().toLowerCase() === trimmed.toLowerCase())) ||
      (s.qr_code && s.qr_code.trim() === trimmed)
  );
  if (sympoByQr) {
    sympoId = sympoByQr.id;
    detectedType = "symposium";
  }

  // 1. Try parsing as URL
  try {
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.includes("://") ||
      trimmed.startsWith("/")
    ) {
      const urlObj = new URL(trimmed, window.location.origin);

      const bId =
        urlObj.searchParams.get("booth_id") ||
        urlObj.searchParams.get("boothId") ||
        urlObj.searchParams.get("booth");
      if (bId) boothId = bId;

      const sId =
        urlObj.searchParams.get("symposium_id") ||
        urlObj.searchParams.get("symposiumId") ||
        urlObj.searchParams.get("sympo_id");
      if (sId) sympoId = sId;

      const typeParam = (urlObj.searchParams.get("type") || "").toLowerCase();
      const nameParam = (urlObj.searchParams.get("name") || "").toLowerCase();

      if (
        typeParam === "early-life" ||
        typeParam === "early_life" ||
        nameParam.includes("early") ||
        nameParam.includes("life")
      ) {
        detectedType = "early-life";
      } else if (
        typeParam === "morinaga" ||
        typeParam === "booth" ||
        nameParam.includes("morinaga")
      ) {
        detectedType = "booth";
      } else if (typeParam === "symposium" || nameParam.includes("symposium")) {
        detectedType = "symposium";
      }

      if (
        urlObj.pathname.includes("post-test") ||
        urlObj.pathname.includes("symposium")
      ) {
        detectedType = "symposium";
      }
    }
  } catch {
    // Ignore URL parse error
  }

  // 2. Try parsing as JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) {
      if (parsed.booth_id || parsed.boothId || parsed.booth) {
        boothId = String(parsed.booth_id || parsed.boothId || parsed.booth);
      }
      if (parsed.symposium_id || parsed.symposiumId || parsed.sympo_id) {
        sympoId = String(parsed.symposium_id || parsed.symposiumId || parsed.sympo_id);
      }

      const pType = String(parsed.type || "").toLowerCase();
      const pEvent = String(parsed.event || "").toUpperCase();
      const pAction = String(parsed.action || "").toUpperCase();
      const pTitle = String(parsed.title || "").toUpperCase();
      const combined = `${pType} ${pEvent} ${pAction} ${pTitle}`;

      if (
        combined.includes("EARLY_LIFE") ||
        combined.includes("EARLY-LIFE") ||
        combined.includes("EARLY LIFE") ||
        combined.includes("EARLY")
      ) {
        detectedType = "early-life";
      } else if (
        combined.includes("MORINAGA") ||
        (combined.includes("BOOTH") && !combined.includes("EARLY"))
      ) {
        detectedType = "booth";
      } else if (
        combined.includes("SYMPOSIUM") ||
        combined.includes("POST_TEST") ||
        combined.includes("POST-TEST") ||
        combined.includes("SYMPO")
      ) {
        detectedType = "symposium";
      }
    }
  } catch {
    // Ignore JSON parse error
  }

  // 3. Check for UUID regex if boothId or sympoId not yet detected
  const uuidMatch = trimmed.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
  );
  if (uuidMatch) {
    const uuid = uuidMatch[0];
    if (!boothId && !sympoId) {
      const matchedB = booths.find((b) => b.id.toLowerCase() === uuid.toLowerCase());
      if (matchedB) {
        boothId = matchedB.id;
        const bName = matchedB.name.toLowerCase();
        if (bName.includes("early") || bName.includes("life")) {
          detectedType = "early-life";
        } else {
          detectedType = "booth";
        }
      } else {
        const matchedS = sympos.find((s) => s.id.toLowerCase() === uuid.toLowerCase());
        if (matchedS) {
          sympoId = matchedS.id;
          detectedType = "symposium";
        }
      }
    }
  }

  // 4. Resolve booth from boothId against booths list
  let matchedBooth: KalbeBoothResponse | undefined;
  if (boothId) {
    matchedBooth = booths.find((b) => b.id.toLowerCase() === boothId!.toLowerCase());
    if (matchedBooth) {
      const bName = matchedBooth.name.toLowerCase();
      if (bName.includes("early") || bName.includes("life")) {
        detectedType = "early-life";
      } else {
        detectedType = "booth";
      }
    }
  }

  // 5. Determine final classification from text content if still not determined
  if (!detectedType) {
    const upper = trimmed.toUpperCase();
    if (
      upper.includes("EARLY_LIFE") ||
      upper.includes("EARLY-LIFE") ||
      upper.includes("EARLY LIFE") ||
      upper.includes("KALBE_EARLY_LIFE") ||
      (upper.includes("EARLY") && !upper.includes("SYMPOSIUM"))
    ) {
      detectedType = "early-life";
    } else if (
      upper.includes("MORINAGA_BOOTH") ||
      upper.includes("MORINAGA") ||
      (upper.includes("BOOTH") && !upper.includes("EARLY") && !upper.includes("SYMPOSIUM"))
    ) {
      detectedType = "booth";
    } else if (
      upper.includes("SYMPOSIUM") ||
      upper.includes("POST_TEST") ||
      upper.includes("POST-TEST") ||
      upper.includes("SYMPO")
    ) {
      detectedType = "symposium";
    } else if (boothId) {
      if (boothId.toLowerCase().includes("early") || boothId.toLowerCase().includes("life")) {
        detectedType = "early-life";
      } else if (boothId.toLowerCase().includes("morinaga") || boothId.toLowerCase().includes("booth")) {
        detectedType = "booth";
      }
    } else if (sympoId) {
      detectedType = "symposium";
    }
  }

  // 6. Validity check
  const isValid = Boolean(detectedType || boothId || sympoId);

  return {
    isValid,
    type: detectedType,
    boothId,
    sympoId,
    matchedBooth,
    rawText: trimmed,
  };
};

interface SampleQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScanType: "symposium" | "booth" | "early-life";
  onManualScan: (scannedData?: string) => void;
}

const SampleQrModal: React.FC<SampleQrModalProps> = ({
  isOpen,
  onClose,
  activeScanType,
  onManualScan,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    (async () => {
      try {
        let url = "";
        let title = "";

        if (activeScanType === "symposium") {
          const list = await getKalbeSymposiumsList().catch(() => []);
          if (list && list.length > 0) {
            const activeSympo = list.find((s) => s.is_active) || list[0];
            title = activeSympo.title;
            if (activeSympo.qr_code) {
              if (isMounted) {
                setQrDataUrl(activeSympo.qr_code);
                setModalTitle(title);
                setTargetUrl(`${window.location.origin}/post-test?symposium_id=${encodeURIComponent(activeSympo.id)}`);
              }
              return;
            }
            url = `${window.location.origin}/post-test?symposium_id=${encodeURIComponent(activeSympo.id)}`;
          } else {
            const master = getSymposiumMasterData();
            title = master.name || "Morinaga Symposium";
            url = `${window.location.origin}/post-test?symposium_id=${encodeURIComponent(master.id || "kalbe-symposium-2026")}`;
          }
        } else {
          const booths = await getKalbeBoothsList().catch(() => []);
          const isEarly = activeScanType === "early-life";
          const target = booths.find((b) =>
            isEarly
              ? b.name.toLowerCase().includes("early") || b.name.toLowerCase().includes("life")
              : b.name.toLowerCase().includes("morinaga") ||
                (!b.name.toLowerCase().includes("early") && b.name.toLowerCase().includes("booth")),
          );

          if (target) {
            title = target.name;
            if (target.qr_code) {
              if (isMounted) {
                setQrDataUrl(target.qr_code);
                setModalTitle(title);
                const typeStr = isEarly ? "early-life" : "morinaga";
                setTargetUrl(`${window.location.origin}/booth-checkin?booth_id=${encodeURIComponent(target.id)}&type=${typeStr}&name=${encodeURIComponent(target.name)}`);
              }
              return;
            }
            const typeStr = isEarly ? "early-life" : "morinaga";
            url = `${window.location.origin}/booth-checkin?booth_id=${encodeURIComponent(target.id)}&type=${typeStr}&name=${encodeURIComponent(target.name)}`;
          } else {
            title = isEarly ? "Kalbe Early Life Solutions" : "Morinaga Booth";
            url = `${window.location.origin}/booth-checkin?booth_id=dummy-${isEarly ? "early-life" : "booth"}&type=${isEarly ? "early-life" : "morinaga"}`;
          }
        }

        if (url) {
          const generatedQr = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: {
              dark: "#1e1e1e",
              light: "#ffffff",
            },
          });

          if (isMounted) {
            setQrDataUrl(generatedQr);
            setModalTitle(title);
            setTargetUrl(url);
          }
        }
      } catch (e) {
        console.warn("Failed to generate QR for user demo modal:", e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeScanType]);

  if (!isRendered) return null;

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-5 ${isClosing ? "pointer-events-none" : ""}`}>
      {/* Dark backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Modal Card */}
      <div
        className={`relative z-10 bg-white rounded-2xl p-5 max-w-[300px] w-full flex flex-col items-center text-center shadow-2xl border border-red-100 ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition"
          title="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-[15px] font-bold text-[#8E000A] mb-1">
          {activeScanType === "early-life"
            ? "QR Code Kalbe Early Life Solutions"
            : activeScanType === "booth"
              ? "QR Code Morinaga Booth"
              : "QR Code Simposium (Post-Test)"}
        </h3>
        {modalTitle ? (
          <p className="text-[12px] font-semibold text-gray-800 mb-1 line-clamp-1 px-2">
            {modalTitle}
          </p>
        ) : null}
        <p className="text-[11px] text-gray-500 mb-4 leading-snug">
          Arahkan kamera smartphone lain ke QR ini, atau gunakan tombol di bawah untuk
          test instant.
        </p>

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-inner mb-4 flex flex-col items-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Activity QR Code"
              className="w-[180px] h-[180px] object-contain"
            />
          ) : (
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
          )}
          {targetUrl && (
            <span className="text-[10px] text-gray-400 mt-1.5 break-all max-w-[200px] truncate">
              {targetUrl.replace(/^https?:\/\/[^/]+/, "")}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            handleClose();
            onManualScan(targetUrl || undefined);
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
  );
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

  const apiBoothsRef = useRef<KalbeBoothResponse[]>(getCachedKalbeBooths());
  const apiSymposRef = useRef<KalbeSymposiumResponse[]>(getCachedKalbeSymposiums());

  useEffect(() => {
    let isMounted = true;
    getKalbeBoothsList()
      .then((data) => {
        if (isMounted && data) {
          apiBoothsRef.current = data;
        }
      })
      .catch((e) => console.warn("Failed to preload booths:", e));

    getKalbeSymposiumsList()
      .then((data) => {
        if (isMounted && data) {
          apiSymposRef.current = data;
        }
      })
      .catch((e) => console.warn("Failed to preload symposiums:", e));

    return () => {
      isMounted = false;
    };
  }, []);

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
  // Web Audio synthesizer tone fallback
  const playSynthesizedTone = useCallback((isSuccess: boolean) => {
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
  }, []);

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
  }, [playSynthesizedTone]);

  const onScanSuccess = useCallback(
    async (decodedText: string): Promise<boolean> => {
      if (isNavigatingRef.current || isProcessingScanRef.current) return false;
      isProcessingScanRef.current = true;

      // Pastikan data master booth & symposium termuat
      let currentBooths = apiBoothsRef.current;
      if (!currentBooths || currentBooths.length === 0) {
        currentBooths = getCachedKalbeBooths();
        if (currentBooths.length === 0) {
          currentBooths = await getKalbeBoothsList().catch(() => []);
        }
        apiBoothsRef.current = currentBooths;
      }

      let currentSympos = apiSymposRef.current;
      if (!currentSympos || currentSympos.length === 0) {
        currentSympos = getCachedKalbeSymposiums();
        if (currentSympos.length === 0) {
          currentSympos = await getKalbeSymposiumsList().catch(() => []);
        }
        apiSymposRef.current = currentSympos;
      }

      // Smart parse QR Code with dynamic booth & symposium resolution
      const qrResult = parseQrData(
        decodedText,
        currentBooths,
        currentSympos,
      );

      // Validasi ketat: QR harus valid dan jenisnya HARUS COCOK dengan scanner saat ini!
      const isCorrectScan = qrResult.isValid && qrResult.type === activeScanType;

      if (!isCorrectScan) {
        // Play failed scan audio feedback
        playScanSound(false);

        const errorMsg =
          activeScanType === "early-life"
            ? "QR Code tidak sesuai! Pastikan Anda memindai QR Code untuk Kalbe Early Life Solutions."
            : activeScanType === "booth"
              ? "QR Code tidak sesuai! Pastikan Anda memindai QR Code untuk Morinaga Booth."
              : "QR Code tidak sesuai! Pastikan Anda memindai QR Code untuk Symposium Morinaga.";

        showToast("error", errorMsg);

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

      // QR Code benar dan cocok dengan aktivitas yang dipilih
      isNavigatingRef.current = true;

      // Play successful scanner beep audio feedback
      playScanSound(true);

      // Trigger shutter flash
      setIsScanned(true);

      // Stop camera hardware immediately
      stopCameraHardware();

      if (activeScanType === "early-life") {
        let detectedBoothId = qrResult.boothId;
        if (!detectedBoothId) {
          const target = currentBooths.find(
            (b) => b.name.toLowerCase().includes("early") || b.name.toLowerCase().includes("life"),
          );
          if (target) detectedBoothId = target.id;
        }

        if (detectedBoothId) {
          try {
            await insertKalbeBoothParticipant(detectedBoothId);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (!msg.toLowerCase().includes("already")) {
              console.warn("Insert booth participant error:", err);
            }
          }
        }

        setEarlyLifeDetailingCompleted(true);
        setTimeout(() => {
          setIsScanned(false);
          navigate("/home", { state: { showEarlyLifeSuccessModal: true } });
        }, 350);
      } else if (activeScanType === "booth") {
        let detectedBoothId = qrResult.boothId;
        if (!detectedBoothId) {
          const target = currentBooths.find(
            (b) =>
              b.name.toLowerCase().includes("morinaga") ||
              (!b.name.toLowerCase().includes("early") && b.name.toLowerCase().includes("booth")),
          );
          if (target) detectedBoothId = target.id;
        }

        if (detectedBoothId) {
          try {
            await insertKalbeBoothParticipant(detectedBoothId);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            if (!msg.toLowerCase().includes("already")) {
              console.warn("Insert booth participant error:", err);
            }
          }
        }

        setBoothDetailingCompleted(true);
        unlockReward("morinaga-booth");
        setTimeout(() => {
          setIsScanned(false);
          navigate("/home", { state: { showBoothSuccessModal: true } });
        }, 350);
      } else {
        // activeScanType === "symposium"
        setSymposiumJoined(true);
        let targetPath = "/post-test";
        if (qrResult.sympoId) {
          targetPath = `/post-test?symposium_id=${encodeURIComponent(qrResult.sympoId)}`;
        }
        setTimeout(() => {
          setIsScanned(false);
          navigate(targetPath, { state: { scannedData: decodedText } });
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
              const handled = await onScanSuccess(barcodes[0].rawValue);
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
            const handled = await onScanSuccess(code.data);
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

  const handleManualScan = (scannedText?: string) => {
    if (scannedText) {
      onScanSuccess(scannedText);
      return;
    }

    if (activeScanType === "early-life") {
      const target = apiBoothsRef.current.find(
        (b) => b.name.toLowerCase().includes("early") || b.name.toLowerCase().includes("life"),
      );
      if (target) {
        onScanSuccess(
          `${window.location.origin}/booth-checkin?booth_id=${encodeURIComponent(target.id)}&type=early-life&name=${encodeURIComponent(target.name)}`,
        );
      } else {
        onScanSuccess(
          JSON.stringify({
            event: "KALBE_EARLY_LIFE",
            action: "DETAILING_SCAN",
            title: "Kalbe Early Life Solutions Detailing",
          }),
        );
      }
    } else if (activeScanType === "booth") {
      const target = apiBoothsRef.current.find(
        (b) =>
          b.name.toLowerCase().includes("morinaga") ||
          (!b.name.toLowerCase().includes("early") && b.name.toLowerCase().includes("booth")),
      );
      if (target) {
        onScanSuccess(
          `${window.location.origin}/booth-checkin?booth_id=${encodeURIComponent(target.id)}&type=morinaga&name=${encodeURIComponent(target.name)}`,
        );
      } else {
        onScanSuccess(
          JSON.stringify({
            event: "MORINAGA_BOOTH_2026",
            action: "DETAILING_BOOTH",
            title: "Morinaga Booth Detailing",
          }),
        );
      }
    } else {
      const activeSympo = apiSymposRef.current.find((s) => s.is_active);
      const master = getSymposiumMasterData();
      const sympoId = activeSympo?.id || master.id || "kalbe-symposium-2026";
      const directUrl = `${window.location.origin}/post-test?symposium_id=${encodeURIComponent(sympoId)}`;
      onScanSuccess(directUrl);
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
      <div className="w-full flex justify-center pt-3.5 pb-1 shrink-0 z-10">
        <div
          className={
            activeScanType === "early-life"
              ? "w-[215px] sm:w-[230px]"
              : activeScanType === "booth"
                ? "w-[210px] sm:w-[225px]"
                : "w-[200px] sm:w-[215px]"
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
            className="w-full h-auto object-contain drop-shadow-md pointer-events-none"
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

      {/* Bottom Floating Scanner Action Button (Bypass scan disabled / commented for now) */}
      <div className="relative w-full flex justify-center items-center pt-0.5 pb-2 shrink-0 z-20">
        {/* <button
          onClick={handleManualScan}
          className="relative group cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105"
          title="Tekan untuk Pindai Manual"
        > */}
        <div className="relative pointer-events-none select-none">
          <img
            src="/assets/scan-image.png"
            alt="Scan QR"
            className="w-[62px] h-[62px] sm:w-[66px] sm:h-[66px] object-contain drop-shadow-md"
          />
        </div>
        {/* </button> */}
      </div>

      {/* Sample QR Modal for Easy Testing */}
      <SampleQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        activeScanType={activeScanType}
        onManualScan={handleManualScan}
      />

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
