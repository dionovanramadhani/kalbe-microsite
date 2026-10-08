import React from "react";
import { X } from "lucide-react";

export interface EarlyLifeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueClick?: () => void;
}

export const EarlyLifeDrawer: React.FC<EarlyLifeDrawerProps> = ({
  isOpen,
  onClose,
  onContinueClick,
}) => {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end overflow-hidden">
      {/* Backdrop with smooth blur & fade */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Sliding Content Container (Close Button + White Drawer Sheet) */}
      <div
        className={`relative z-10 w-full flex flex-col items-center ${
          isClosing ? "animate-drawer-down" : "animate-drawer-up"
        }`}
      >
        {/* Floating Red Circular Close Button right above the drawer top */}
        <div className="w-full flex justify-end px-5 mb-2 pointer-events-none">
          <button
            onClick={handleClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
            title="Tutup"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Drawer Body Container */}
        <div className="w-full bg-white rounded-t-[32px] px-5 pt-6 pb-6 flex flex-col items-center shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
          {/* Top Header Badge: Futuristic KALBE EARLY LIFE SOLUTIONS Plate */}
          <div className="mb-4 w-[240px] sm:w-[255px] shrink-0 flex items-center justify-center drop-shadow-sm">
            <img
              src="/assets/kalbe-early-life-solution-title-image.png"
              alt="Kalbe Early Life Solutions"
              className="w-full h-auto object-contain pointer-events-none select-none"
            />
          </div>

          {/* Booth 3D Visual Artwork */}
          <div className="w-[270px] sm:w-[280px] rounded-2xl overflow-hidden bg-black/5 shadow-sm mb-4 border border-gray-100 flex justify-center">
            <img
              src="/assets/kalbe-early-life-booth-image.png"
              alt="Kalbe Early Life Solutions Booth"
              className="w-full h-auto object-cover pointer-events-none select-none"
            />
          </div>

          {/* Content Heading & Description */}
          <div className="w-full text-left mb-5">
            <h3 className="text-[16px] font-extrabold text-[#111111] leading-tight mb-2 tracking-tight">
              Kalbe Early Life Solutions
            </h3>
            <p className="text-[14px] font-normal text-[#222222B2] leading-relaxed">
              Sesi edukatif bersama HCP (Health Care Professional) yang membahas berbagai
              topik seputar nutrisi, tumbuh kembang, dan kesehatan anak, dikemas dalam
              obrolan yang ringan, informatif, dan mudah dipahami
            </p>
          </div>

          {/* Action Button: LANJUT (Full width single button without podcast schedule) */}
          <div className="w-full flex items-center justify-center shrink-0">
            <button
              onClick={onContinueClick}
              className="w-52 h-[44px] relative flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:brightness-105"
              style={{
                backgroundImage: `url('/assets/red-button.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="text-white font-extrabold text-[14px] tracking-wider uppercase drop-shadow-sm">
                LANJUT
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
