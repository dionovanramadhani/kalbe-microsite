import React, { useEffect, useState } from "react";

// Daftar asset gambar penting dan background yang perlu di-preload agar tidak telat render
const PRELOAD_ASSET_IMAGES = [
  // Backgrounds utama
  "/assets/tower-background.webp",
  "/assets/red-and-white-curve-bg.webp",
  "/assets/red-and-white-curve-bg-long.webp",
  "/assets/modal-background.webp",
  // Logos & Badges
  "/assets/kalbe-universe-logo.webp",
  "/assets/kalbe-logo.webp",
  "/assets/kalbe-logo.svg",
  "/assets/kalbe-60th-icon.webp",
  "/assets/docter-avatar.webp",
  "/assets/docter-bg.webp",
  "/assets/reward-claim-bg.webp",
  "/assets/reward-claim-bg-new.webp",
  "/assets/reward-icon-red.webp",
  // Mission Icons & Buttons
  "/assets/morinaga-sympo-icon.webp",
  "/assets/morinaga-booth-icon.webp",
  "/assets/check-in-red.webp",
  "/assets/check-in-green.webp",
  "/assets/red-button.webp",
  "/assets/detailing-red.webp",
  "/assets/detailing-orange.webp",
  // Modal Graphics
  "/assets/clock-red.webp",
  "/assets/morinaga-sympo-image.webp",
  "/assets/morinaga-sympo-banner-rocket.webp",
  "/assets/morinaga-sympo-rocket.webp",
  "/assets/morinaga-booth-image.webp",
  "/assets/morinaga-booth-image-2.webp",
  "/assets/morinaga-booth-title.webp",
  "/assets/kalbe-early-life-booth-image.webp",
  "/assets/kalbe-early-life-solution-title-image.webp",
  "/assets/kalbe-early-life-solution-logo-scaner.webp",
  // Rewards & Box
  "/assets/reward-box.webp",
  "/assets/reward-dummy-symposium.webp",
  "/assets/morinaga-booth-reward.webp",
  "/assets/mistery-box.webp",
  "/assets/mystery-box-reward.webp",
  "/assets/post-test-arrow.webp",
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
