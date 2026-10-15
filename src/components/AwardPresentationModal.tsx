import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";

export interface AwardPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwardPresentationModal: React.FC<AwardPresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, { duration: 280 });

  if (!isRendered) return null;

  return (
    <div className={`absolute inset-0 z-[60] flex flex-col justify-end overflow-hidden ${isClosing ? "pointer-events-none" : ""}`}>
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
        <div className="w-full bg-white rounded-t-[32px] px-5 pt-6 pb-9 flex flex-col items-center shadow-[0_-8px_30px_rgba(0,0,0,0.3)] select-none">
          {/* 3D Red Clock Graphic */}
          <div className="w-full flex justify-center shrink-0 mb-3.5">
            <img
              src="/assets/clock-red.png"
              alt="Jadwal Award Presentation"
              className="w-[150px] sm:w-[160px] h-auto object-contain drop-shadow-sm pointer-events-none select-none"
            />
          </div>

          {/* Title: moritalks award -> #D41025 20px bold */}
          <h2
            style={{
              color: "#D41025",
              fontSize: "20px",
              fontWeight: "bold",
            }}
            className="tracking-tight text-center leading-tight mb-3"
          >
            Moritalks Award Presentation
          </h2>

          {/* GRAND FINAL Graphic Badge */}
          <div className="w-full flex justify-center shrink-0 mb-5">
            <img
              src="/assets/grand-final-title.png"
              alt="Grand Final"
              className="w-[240px] sm:w-[255px] h-auto object-contain pointer-events-none select-none"
            />
          </div>

          {/* Presenter / Speaker: prof... -> #777777 14px medium */}
          <div className="w-full flex flex-col items-center">
            <span
              style={{
                color: "#777777",
                fontSize: "14px",
                fontWeight: 500,
              }}
              className="mb-2 text-center leading-tight"
            >
              Prof Hegar & Prof Wawan
            </span>

            {/* Time: jam -> #D41025 20px bold */}
            <div
              className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center shrink-0 select-none shadow-xs"
              style={{
                backgroundImage: `url('/assets/morinaga-booth-activity-button-white.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span
                style={{
                  color: "#D41025",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
                className="tracking-wide leading-none"
              >
                13.30 – 13.45 WIB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
