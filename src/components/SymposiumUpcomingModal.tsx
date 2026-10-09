import React from "react";
import { X } from "lucide-react";
import { getSymposiumMasterData } from "../data/symposiumStore";

export interface SymposiumUpcomingModalProps {
  isOpen: boolean;
  onClose: () => void;
  startTimeText?: string;
}

export const SymposiumUpcomingModal: React.FC<SymposiumUpcomingModalProps> = ({
  isOpen,
  onClose,
  startTimeText,
}) => {
  if (!isOpen) return null;

  const symposiumMaster = getSymposiumMasterData();
  const displayTime =
    startTimeText || symposiumMaster.formattedStartTime || "Pukul 10.00 WIB";

  return (
    <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal Card with futuristic frame background */}
      <div
        className="relative w-full max-w-[390px] h-[480px] max-h-[92%] aspect-[361/456] flex flex-col items-center justify-center px-5 pt-6 pb-7 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundImage: `url('/assets/modal-background.png')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Top Close Button (X in Deep Red) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-8 p-1 rounded-full text-[#D70313] hover:bg-red-50/50 transition-all cursor-pointer active:scale-90"
          title="Tutup Modal"
        >
          <X className="w-8 h-8 stroke-[2.8]" />
        </button>

        {/* Content Block */}
        <div className="w-full h-full flex flex-col items-center justify-between text-center pt-2 pb-5 px-1 min-h-0">
          {/* 3D Red Clock Graphic (Enlarged) */}
          <div className="w-full flex justify-center shrink-0 mb-0.5 -mt-3">
            <img
              src="/assets/clock-red.png"
              alt="Clock"
              className="w-[150px] h-auto object-contain drop-shadow-md pointer-events-none select-none"
            />
          </div>

          <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5">
            {/* Heading */}
            <div className="shrink-0 mb-0.5">
              <h2 className="text-[24px] font-bold text-[#D41025] tracking-tight leading-tight">
                Morinaga Symposium
              </h2>
              <p className="text-[20px] font-bold text-[#222222] tracking-tight mt-0.5">
                Akan segera dimulai
              </p>
            </div>

            {/* Time Badge (Elongated Octagon / Segi 8 Memanjang with Red Border) */}
            <div className="relative w-full max-w-[290px] h-[46px] sm:h-[52px] flex items-center justify-center shrink-0 my-0.5">
              {/* SVG Background for crisp elongated octagon border with chamfered corners */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 290 52"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* White semi-transparent fill */}
                <polygon
                  points="16,2 274,2 288,16 288,36 274,50 16,50 2,36 2,16"
                  fill="#FFFFFF"
                  fillOpacity="0.85"
                />
                {/* Red border */}
                <polygon
                  points="16,2 274,2 288,16 288,36 274,50 16,50 2,36 2,16"
                  stroke="#E50014"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="relative z-10 text-[32px] font-bold text-[#D41025] tracking-tight whitespace-nowrap leading-none">
                Pukul {displayTime.replace(/^Pukul\s+/i, "")}
              </span>
            </div>

            {/* Description formatted into 3 balanced lines */}
            <p className="text-[16px] font-bold text-[#374151] leading-snug max-w-[320px] shrink-0 my-0.5">
              Pastikan Anda sudah siap dan bergabung tepat waktu untuk mengikuti sesi
              Morinaga Symposium.
            </p>

            {/* OK Button */}
            <button
              onClick={onClose}
              className="relative w-[180px] h-[50px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 mb-1 mt-2"
              style={{
                backgroundImage: `url('/assets/red-button.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="text-white font-extrabold text-[20px] xs:text-[22px] sm:text-[24px] tracking-wider uppercase drop-shadow">
                OK
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
