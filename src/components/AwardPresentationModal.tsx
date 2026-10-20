import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import { formatTimeRangeWIB, type KalbeBoothActivityItem } from "../utils/kalbeApi";

export interface AwardPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityItem?: KalbeBoothActivityItem | null;
}

export const AwardPresentationModal: React.FC<AwardPresentationModalProps> = ({
  isOpen,
  onClose,
  activityItem,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, {
    duration: 280,
  });

  if (!isRendered) return null;

  const title = activityItem?.name || "Moritalks Award Presentation";
  const speaker = activityItem ? activityItem.speaker : "Prof Hegar & Prof Wawan";
  const formattedTime = activityItem
    ? formatTimeRangeWIB(activityItem.start_at, activityItem.end_at)
    : "13.30 – 13.45 WIB";
  const image = activityItem
    ? activityItem.activity_image ||
      (activityItem.name.toLowerCase().includes("award") ||
      activityItem.name.toLowerCase().includes("presentation")
        ? "/assets/grand-final-title.webp"
        : null)
    : "/assets/grand-final-title.webp";
  const description =
    activityItem?.description &&
    activityItem.description.trim() !== "" &&
    activityItem.description.trim() !== "-"
      ? activityItem.description.trim()
      : null;

  const isPhotobooth =
    title.toLowerCase().includes("photobooth") ||
    (!activityItem?.speaker && !activityItem?.start_at && description);

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
        {isPhotobooth ? (
          <div className="w-full bg-white rounded-t-[32px] px-5 pt-5 pb-8 flex flex-col items-center shadow-[0_-8px_30px_rgba(0,0,0,0.3)] select-none">
            {/* Top Banner / Image (Rounded Corners) */}
            {image && (
              <div className="w-full rounded-[20px] overflow-hidden bg-black/5 mb-4 shadow-sm flex items-center justify-center border border-gray-100">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-auto max-h-[260px] object-cover pointer-events-none select-none"
                />
              </div>
            )}

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
            {description && (
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
            )}
          </div>
        ) : (
          <div className="w-full bg-white rounded-t-[32px] px-5 pt-6 pb-9 flex flex-col items-center shadow-[0_-8px_30px_rgba(0,0,0,0.3)] select-none">
            {/* 3D Red Clock Graphic */}
            {activityItem?.start_at && (
              <div className="w-full flex justify-center shrink-0 mb-3.5">
                <img
                  src="/assets/clock-red.webp"
                  alt="Jadwal Aktivitas"
                  className="w-[150px] sm:w-[160px] h-auto object-contain drop-shadow-sm pointer-events-none select-none"
                />
              </div>
            )}

            {/* Title: moritalks award -> #D41025 20px bold */}
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

            {/* Graphic Badge */}
            {image && (
              <div className="w-full flex justify-center shrink-0 mb-5">
                <img
                  src={image}
                  alt={title}
                  className="w-[240px] sm:w-[255px] max-h-[140px] object-contain pointer-events-none select-none"
                />
              </div>
            )}

            {/* Presenter / Speaker & Time */}
            {(speaker || formattedTime) && (
              <div className="w-full flex flex-col items-center">
                {speaker && (
                  <span
                    style={{
                      color: "#777777",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                    className="mb-2 text-center leading-tight"
                  >
                    {speaker}
                  </span>
                )}

                {/* Time box: Octagon Chamfered SVG with background #FDECED, border #F52037, text 20px bold #D41025 */}
                {formattedTime && (
                  <div className="relative w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center shrink-0 select-none shadow-xs px-3">
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 245 46"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <polygon
                        points="13,1.5 232,1.5 243.5,13 243.5,33 232,44.5 13,44.5 1.5,33 1.5,13"
                        fill="#FDECED"
                      />
                      <polygon
                        points="13,1.5 232,1.5 243.5,13 243.5,33 232,44.5 13,44.5 1.5,33 1.5,13"
                        stroke="#F52037"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      style={{
                        color: "#D41025",
                        fontSize: "20px",
                        fontWeight: "bold",
                      }}
                      className="relative z-10 tracking-wide leading-none"
                    >
                      {formattedTime}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Optional Description (Text Justify) */}
            {description && (
              <p
                style={{
                  color: "#333333",
                  fontSize: "14px",
                  textAlign: "justify",
                }}
                className="mt-3 leading-relaxed px-4"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
