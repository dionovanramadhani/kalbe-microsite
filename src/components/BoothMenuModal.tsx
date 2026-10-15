import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";

export interface BoothMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDetailing?: () => void;
  onMoritalksPodcast?: () => void;
  onMoritalksAwardPresentation?: () => void;
  onPhotoboothHighAngel?: () => void;
}

export const BoothMenuModal: React.FC<BoothMenuModalProps> = ({
  isOpen,
  onClose,
  onStartDetailing,
  onMoritalksPodcast,
  onMoritalksAwardPresentation,
  onPhotoboothHighAngel,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);

  if (!isRendered) return null;

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "pointer-events-none" : ""}`}>
      {/* Dark backdrop with blur */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Modal Wrapper */}
      <div
        className={`relative z-10 w-full max-w-[345px] sm:max-w-[355px] flex flex-col items-center pt-28 ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Floating Red Circular Close Button (welcoming pop-up style) */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-1 z-20 w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
          title="Tutup Modal"
        >
          <X className="w-5 h-5 stroke-[2.8]" />
        </button>

        {/* Top Header Badge: Futuristic Antenna Radar + MORINAGA BOOTH Plate */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[210px] shrink-0 flex items-center justify-center drop-shadow-lg z-10 pointer-events-none select-none">
          <img
            src="/assets/morinaga-booth-image-2.png"
            alt="Morinaga Booth"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Main Card with the SVG background used on Misi Utama di Homepage */}
        <div className="relative w-full pt-14 pb-6 px-5 flex flex-col items-center select-none font-kalbe drop-shadow-2xl">
          {/* Sliced SVG Futuristic 8-Sided (Octagon) Background with Thicker Accent Corners */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 380 470"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background Fill (#FEF9F7) */}
            <polygon
              points="24,2 356,2 378,24 378,446 356,468 24,468 2,446 2,24"
              fill="#FEF9F7"
            />

            {/* Base Red Outline (#F4233E) - Standard 2px */}
            <polygon
              points="24,2 356,2 378,24 378,446 356,468 24,468 2,446 2,24"
              stroke="#F4233E"
              strokeWidth="2"
              strokeLinejoin="miter"
            />

            {/* Top-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,2 24,2 2,24 2,50"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Top-Right Corner Thick Accent (7.5px) */}
            <polyline
              points="330,2 356,2 378,24 378,50"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Right Corner Thick Accent (7.5px) */}
            <polyline
              points="378,420 378,446 356,468 330,468"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,468 24,468 2,446 2,420"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>

          {/* 1. "Tugas Utama: Lakukan Detailing di Booth" #940B0A 14px extra bold */}
          <h3 className="relative z-10 text-[14px] font-extrabold text-[#940B0A] text-center leading-snug">
            Tugas Utama: Lakukan Detailing di Booth
          </h3>

          {/* 2. "selesaikan sesi" 12px regular #5A5A5A */}
          <p className="relative z-10 text-[12px] font-normal text-[#5A5A5A] text-center leading-relaxed mt-1.5 mb-3 max-w-[270px]">
            Selesaikan sesi detailing bersama tim kami untuk mendapatkan reward.
          </p>

          {/* 3. "Ikuti detailing" #FFFFFF bold 18px */}
          <button
            onClick={onStartDetailing || onClose}
            className="relative z-10 w-[235px] sm:w-[245px] h-[48px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0"
            style={{
              backgroundImage: `url('/assets/red-button.png')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-white font-bold text-[18px] tracking-wide drop-shadow">
              IKUT DETAILING
            </span>
          </button>

          {/* Dashed Horizontal Divider */}
          <div className="relative z-10 w-full border-t border-dashed border-[#B0B0B0] my-4" />

          {/* 4. "Aktivitas lainnya" #940B0A 14px extra bold */}
          <h3 className="relative z-10 text-[14px] font-extrabold text-[#940B0A] text-center leading-snug">
            Aktivitas lainnya
          </h3>

          {/* 5. "Ikuti keseruan..." 12px regular #5A5A5A */}
          <p className="relative z-10 text-[12px] font-normal text-[#5A5A5A] text-center leading-relaxed mt-1 mb-3.5">
            Ikuti keseruan aktivitas seru lainnya di booth kami!
          </p>

          {/* Activity Buttons List */}
          <div className="relative z-10 flex flex-col items-center gap-2.5 w-full">
            <button
              type="button"
              onClick={onMoritalksPodcast}
              className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0"
              style={{
                backgroundImage: `url('/assets/morinaga-booth-activity-button-white.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span
                style={{
                  color: "#FA132D",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Moritalks Podcast
              </span>
            </button>

            <button
              type="button"
              onClick={onMoritalksAwardPresentation}
              className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0"
              style={{
                backgroundImage: `url('/assets/morinaga-booth-activity-button-white.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span
                style={{
                  color: "#FA132D",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Moritalks Award Presentation
              </span>
            </button>

            <button
              type="button"
              onClick={onPhotoboothHighAngel}
              className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0"
              style={{
                backgroundImage: `url('/assets/morinaga-booth-activity-button-white.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span
                style={{
                  color: "#FA132D",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Photobooth High Angel
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
