import React, { useEffect, useState } from "react";

// Daftar asset gambar penting dan background yang perlu di-preload agar tidak telat render
const PRELOAD_ASSET_IMAGES = [
  // Backgrounds utama
  "/assets/tower-background.png",
  "/assets/red-and-white-curve-bg.png",
  "/assets/red-and-white-curve-bg-long.png",
  "/assets/modal-background.png",
  // Logos & Badges
  "/assets/kalbe-universe-logo.png",
  "/assets/kalbe-logo.webp",
  "/assets/kalbe-logo.svg",
  "/assets/kalbe-60th-icon.png",
  "/assets/docter-avatar.png",
  "/assets/docter-bg.png",
  "/assets/reward-claim-bg.png",
  "/assets/reward-icon-red.png",
  // Mission Icons & Buttons
  "/assets/morinaga-sympo-icon.png",
  "/assets/morinaga-booth-icon.png",
  "/assets/check-in-red.png",
  "/assets/check-in-green.png",
  "/assets/red-button.png",
  "/assets/detailing-red.png",
  "/assets/detailing-orange.png",
  // Modal Graphics
  "/assets/clock-red.png",
  "/assets/morinaga-sympo-image.png",
  "/assets/morinaga-sympo-banner-rocket.png",
  "/assets/morinaga-sympo-rocket.png",
  "/assets/morinaga-booth-image.png",
  "/assets/morinaga-booth-image-2.png",
  "/assets/morinaga-booth-title.png",
  "/assets/kalbe-early-life-booth-image.png",
  "/assets/kalbe-early-life-solution-title-image.png",
  "/assets/kalbe-early-life-solution-logo-scaner.png",
  // Rewards & Box
  "/assets/reward-box.png",
  "/assets/reward-dummy-symposium.png",
  "/assets/morinaga-booth-reward.png",
  "/assets/mistery-box.png",
  "/assets/mystery-box-reward.png",
  "/assets/post-test-arrow.png",
];

interface AssetPreloaderProps {
  children: React.ReactNode;
}

export const AssetPreloader: React.FC<AssetPreloaderProps> = ({ children }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const totalAssets = PRELOAD_ASSET_IMAGES.length;

  useEffect(() => {
    let active = true;
    let count = 0;

    const startTransition = () => {
      if (!active) return;
      // Beri delay sebelum mulai transisi fade out
      setTimeout(() => {
        if (!active) return;
        setIsFadingOut(true);
        // Tunggu durasi fade out (600ms) selesai baru unmount overlay
        setTimeout(() => {
          if (active) setIsReady(true);
        }, 600);
      }, 1000);
    };

    const handleOneLoaded = () => {
      if (!active) return;
      count += 1;
      if (count >= totalAssets) {
        startTransition();
      }
    };

    PRELOAD_ASSET_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      if (img.complete) {
        handleOneLoaded();
      } else {
        img.onload = handleOneLoaded;
        img.onerror = handleOneLoaded; // Jika 1 asset gagal, jangan buat aplikasi stuck
      }
    });

    // Timeout safety fallback: Jangan biarkan user stuck lebih dari 4.5 detik
    const fallbackTimer = setTimeout(() => {
      if (active) startTransition();
    }, 4500);

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
    };
  }, [totalAssets]);

  return (
    <div className="relative w-full h-full">
      {/* Konten aplikasi sudah ter-render di background sehingga transisi mulus */}
      {children}

      {/* Overlay Loader dengan animasi breathing dan transisi Fade Out */}
      {!isReady && (
        <div
          className={`absolute inset-0 z-50 flex items-center justify-center bg-white select-none transition-opacity duration-600 ease-out pointer-events-auto ${
            isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <style>
            {`
              @keyframes logoBreathing {
                0%, 100% {
                  transform: scale(0.92);
                  opacity: 0.75;
                }
                50% {
                  transform: scale(1.06);
                  opacity: 1;
                }
              }
              .animate-breathing {
                animation: logoBreathing 2s ease-in-out infinite;
              }
            `}
          </style>
          <img
            src="/assets/kalbe-logo.svg"
            alt="Kalbe"
            className="w-[120px] sm:w-[140px] h-auto object-contain animate-breathing pointer-events-none"
          />
        </div>
      )}
    </div>
  );
};
