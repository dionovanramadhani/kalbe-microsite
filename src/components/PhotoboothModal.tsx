import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import type { KalbeBoothActivityItem } from "../utils/kalbeApi";

export interface PhotoboothModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityItem?: KalbeBoothActivityItem | null;
}

export const PhotoboothModal: React.FC<PhotoboothModalProps> = ({
  isOpen,
  onClose,
  activityItem,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, {
    duration: 280,
  });

  if (!isRendered) return null;

  const fallbackImage = "/assets/morinaga-booth-image-2.webp";
  const title = activityItem?.name?.trim() || "Photobooth High Angel";
  const image = activityItem?.activity_image?.trim() || fallbackImage;
  const description =
    activityItem?.description &&
    activityItem.description.trim() !== "" &&
    activityItem.description.trim() !== "-"
      ? activityItem.description.trim()
      : "Nikmati pengalaman berfoto yang seru di Photobooth High Angel Morinaga. Abadikan momen kebersamaan dari sudut yang unik dan bawa pulang keychain gratis.";

  return (
    <div
      className={`absolute inset-0 z-[60] flex flex-col justify-end overflow-hidden ${isClosing ? "pointer-events-none" : ""}`}
    >
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
        <div className="w-full bg-white rounded-t-[32px] px-5 pt-5 pb-8 flex flex-col items-center shadow-[0_-8px_30px_rgba(0,0,0,0.3)] select-none">
          {/* Top Banner / Image (Rounded Corners) */}
          <div className="w-full rounded-[20px] overflow-hidden mb-4 flex items-center justify-center">
            <img
              src={image}
              alt={title}
              onError={(e) => {
                if (
                  e.currentTarget.src !== window.location.origin + fallbackImage &&
                  !e.currentTarget.src.endsWith(fallbackImage)
                ) {
                  e.currentTarget.src = fallbackImage;
                }
              }}
              className="w-full h-auto object-cover pointer-events-none select-none"
            />
          </div>

          {/* Title: Photobooth High Angel -> #D41025 bold 20px */}
          <h2
            style={{
              color: "#D41025",
              fontSize: "20px",
              fontWeight: "bold",
            }}
            className="tracking-tight text-center leading-tight mb-3"
          >
            {title}
          </h2>

          {/* Description (Text Justify) */}
          <p
            style={{
              color: "#333333",
              fontSize: "14px",
              textAlign: "justify",
            }}
            className="leading-relaxed px-1 font-normal"
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
