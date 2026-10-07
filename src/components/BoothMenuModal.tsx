import React from "react";
import { X } from "lucide-react";

export interface BoothMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOOTH_ACTIVITIES = [
  "Podcast On Air",
  "Moritalks Presentation",
  "Photobooth High Angel",
];

export const BoothMenuModal: React.FC<BoothMenuModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-backdrop-in"
      />

      {/* Modal Wrapper with Top-Right Close Button and Central Card */}
      <div className="relative z-10 w-full max-w-[315px] sm:max-w-[325px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 gap-7">
        {/* Floating Red Circular Close Button (top-right, outside/above the card) */}
        <div className="w-full flex justify-end mb-2 pr-1">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Card Container with Red Border */}
        <div className="relative w-full bg-white rounded-[28px] border-2 border-[#E50014] px-6 pt-9 pb-8 flex flex-col items-center shadow-2xl">
          {/* Top Header Badge: Futuristic MORINAGA BOOTH Plate (overlapping the top border) */}
          <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 w-[235px] sm:w-[245px] shrink-0 flex items-center justify-center drop-shadow-md">
            <img
              src="/assets/morinaga-booth-title.png"
              alt="Morinaga Booth"
              className="w-full h-auto object-contain pointer-events-none select-none"
            />
          </div>

          {/* Title: MoriTalks */}
          <h2 className="text-[21px] sm:text-[23px] font-bold text-[#E50014] tracking-tight mb-5 mt-1 text-center">
            MoriTalks
          </h2>

          {/* Activity List: 1. Podcast On Air, 2. Moritalks Presentation, 3. Photobooth High Angel */}
          <div className="w-full flex flex-col space-y-3.5 pl-2 text-left">
            {BOOTH_ACTIVITIES.map((activity, index) => (
              <div
                key={index}
                className="flex items-center text-[14.5px] sm:text-[15px] font-medium text-[#222222] leading-snug"
              >
                <span className="inline-block w-5 shrink-0 text-[#222222]">
                  {index + 1}.
                </span>
                <span>{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
