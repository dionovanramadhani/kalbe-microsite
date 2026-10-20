import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";

export interface SymposiumStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePostTest: () => void;
}

export const SymposiumStartedModal: React.FC<SymposiumStartedModalProps> = ({
  isOpen,
  onClose,
  onTakePostTest,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);

  if (!isRendered) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "pointer-events-none" : ""}`}
    >
      {/* Dark backdrop with blur confined strictly to mobile viewport */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Floating Content Wrapper */}
      <div
        className={`relative z-10 w-full max-w-[361px] flex flex-col items-center ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Floating Red Circular Close Button (top-right) */}
        <div className="w-full flex justify-end mb-1 pr-1 pointer-events-none">
          <button
            onClick={handleClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Modal Card / Content */}
        <div className="relative w-full flex flex-col items-center text-center px-4 pt-1 pb-4 gap-4">
          {/* Futuristic Rocket Graphic + MORINAGA SYMPO Badge */}
          <div className="w-full max-w-[310px] flex justify-center shrink-0 drop-shadow-lg -mb-2">
            <img
              src="/assets/morinaga-sympo-image-new.webp"
              alt="Morinaga Sympo"
              className="w-full h-auto object-contain pointer-events-none select-none"
            />
          </div>

          {/* Description text: semibold & 16px */}
          <p className="text-[16px] font-semibold text-white leading-snug max-w-[350px] drop-shadow-md  px-1">
            Morinaga symposium sudah dimulai, ikut post test dan klaim hadiah.
          </p>

          {/* Action Button: IKUT POST TEST (18px bold) */}
          <button
            onClick={onTakePostTest}
            className="relative w-full max-w-[280px] h-[52px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-110 shadow-xl"
            style={{
              backgroundImage: `url('/assets/red-button.webp')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-white font-bold text-[18px] tracking-wide uppercase drop-shadow-md">
              IKUT POST TEST
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
