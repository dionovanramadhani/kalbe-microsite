import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);

  if (!isRendered) return null;

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "pointer-events-none" : ""}`}>
      {/* Dark backdrop with blur confined strictly to mobile viewport */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Floating Modal Content Wrapper (max-width: 297px) */}
      <div
        className={`relative z-10 w-full max-w-[297px] flex flex-col items-center ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Floating Red Circular Close Button (aligned right with spacing above card) */}
        <div className="w-full flex justify-end mb-3 pointer-events-none">
          <button
            onClick={handleClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Modal Card */}
        <div
          className="w-full bg-white rounded-[24px] overflow-hidden shadow-2xl relative pt-7 pb-8 px-6 flex flex-col items-center text-center select-none font-kalbe"
          style={{
            backgroundImage: "url('/assets/red-and-white-curve-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "top",
          }}
        >
          {/* Kalbe Universe Logo */}
          <div className="w-[160px] mx-auto mb-5 shrink-0">
            <img
              src="/assets/kalbe-universe-logo.png"
              alt="Kalbe Universe"
              className="w-full h-auto object-contain pointer-events-none select-none drop-shadow-sm"
            />
          </div>

          {/* Heading (20px bold #940B0A) */}
          <h2 className="text-[20px] font-bold text-[#940B0A] leading-tight mb-3">
            Selamat Datang di
            <br />
            PIT IKA 2026
          </h2>

          {/* Description (12px regular #4E4E4E) */}
          <p className="text-[12px] font-normal text-[#4E4E4E] leading-relaxed">
            Yuk, ikuti seluruh rangkaian acara Morinaga dan dapatkan pengalaman
            dan hadiah menarik bersama kami.
          </p>
        </div>
      </div>
    </div>
  );
};
