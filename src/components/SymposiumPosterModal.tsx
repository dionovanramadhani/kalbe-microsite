import React from "react";
import { X } from "lucide-react";
import { useModalAnimation } from "../utils/useModalAnimation";

export interface SymposiumPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl?: string | null;
}

export const SymposiumPosterModal: React.FC<SymposiumPosterModalProps> = ({
  isOpen,
  onClose,
  posterUrl,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);

  if (!isRendered || !posterUrl) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? "pointer-events-none" : ""
      }`}
    >
      {/* Dark backdrop with blur confined strictly to mobile viewport */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Floating Modal Content Wrapper */}
      <div
        className={`relative z-10 w-full max-w-[340px] flex flex-col items-center ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Floating Red Circular Close Button (top-right above card) */}
        <div className="w-full flex justify-end mb-2 pr-0.5 pointer-events-none">
          <button
            type="button"
            onClick={handleClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Poster Image Container with Rounded Corners */}
        <div className="relative w-full overflow-hidden rounded-[24px] shadow-2xl bg-white max-h-[76vh] flex items-center justify-center border border-white/20">
          <img
            src={posterUrl}
            alt="Poster Symposium"
            className="w-full h-auto max-h-[76vh] object-contain rounded-[24px] select-none pointer-events-none"
            onError={() => {
              handleClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
