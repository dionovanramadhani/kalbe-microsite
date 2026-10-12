import React from "react";
import { X } from "lucide-react";

export interface BoothMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDetailing?: () => void;
}

export const BoothMenuModal: React.FC<BoothMenuModalProps> = ({
  isOpen,
  onClose,
  onStartDetailing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-backdrop-in"
      />

      {/* Modal Wrapper */}
      <div className="relative z-10 w-full max-w-[345px] sm:max-w-[355px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 pt-28">
        {/* Floating Red Circular Close Button (welcoming pop-up style) */}
        <button
          onClick={onClose}
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
            viewBox="0 0 380 430"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background Fill (#FEF9F7) */}
            <polygon
              points="24,2 356,2 378,24 378,406 356,428 24,428 2,406 2,24"
              fill="#FEF9F7"
            />

            {/* Base Red Outline (#F4233E) - Standard 2px */}
            <polygon
              points="24,2 356,2 378,24 378,406 356,428 24,428 2,406 2,24"
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
              points="378,380 378,406 356,428 330,428"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,428 24,428 2,406 2,380"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>

          {/* 1. "Tugas Utama" #940B0A 14px extra bold */}
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

          {/* 4. "Aktifitas utama..." sama seperti title "Tugas utama" (#940B0A 14px extra bold) */}
          <h3 className="relative z-10 text-[14px] font-extrabold text-[#940B0A] text-center leading-snug">
            Aktivitas lainnya
          </h3>

          {/* 5. "Ikuti keseruan..." sama seperti "selesaikan sesi..." (12px regular #5A5A5A) */}
          <p className="relative z-10 text-[12px] font-normal text-[#5A5A5A] text-center leading-relaxed mt-1 mb-3.5">
            Ikuti keseruan aktivitas seru lainnya di booth kami!
          </p>

          {/* MoriTalks Box Container */}
          <div className="relative z-10 w-full rounded-[18px] border border-[#CCCCCC] bg-white/70 p-4 flex flex-col text-left">
            {/* 6. "Moritalks #D41025 14px bold */}
            <h4 className="text-[14px] font-bold text-[#D41025] mb-2 leading-none">
              MoriTalks
            </h4>

            {/* 7. Point moritals #5F5F5F reguler 12px */}
            <div className="flex flex-col space-y-1.5">
              <div className="text-[12px] font-normal text-[#5F5F5F] leading-snug">
                1. Podcast On Air
              </div>
              <div className="text-[12px] font-normal text-[#5F5F5F] leading-snug">
                2. Moritalks Presentation
              </div>
              <div className="text-[12px] font-normal text-[#5F5F5F] leading-snug">
                3. Photobooth High Angel
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
