import React, { useMemo } from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import type { KalbeBoothResponse } from "../admin/adminApi";

export interface BoothDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPodcastScheduleClick?: () => void;
  onContinueClick?: () => void;
  boothData?: KalbeBoothResponse | null;
  imageTitle?: string | null;
}

function parseBoothDescription(desc?: string | null): { mainText: string; specialText: string | null } {
  if (!desc || desc.trim() === "") {
    return { mainText: "", specialText: null };
  }

  const trimmed = desc.trim();
  // Deteksi kalimat "Journey of Purpose, Growth and Hope" di akhir paragraf
  const regex = /(?:,\s*|\.\s*|\s+)(Journey\s+of\s+Purpose,?\s+Growth\s+and\s+Hope[.!]?)\s*$/i;
  const match = trimmed.match(regex);

  if (match) {
    let mainText = trimmed.substring(0, match.index).trim();
    if (!mainText.endsWith(".") && !mainText.endsWith("!") && !mainText.endsWith("?")) {
      mainText += ".";
    }
    const specialText = "Journey of Purpose, Growth and Hope.";
    return { mainText, specialText };
  }

  return { mainText: trimmed, specialText: null };
}

export const BoothDrawer: React.FC<BoothDrawerProps> = ({
  isOpen,
  onClose,
  onPodcastScheduleClick,
  onContinueClick,
  boothData,
  imageTitle,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, { duration: 280 });

  const fallbackTitle = "/assets/morinaga-booth-title.webp";
  const fallbackBanner = "/assets/morinaga-booth-image.webp";

  const headerImage = boothData?.image_title?.trim() || imageTitle?.trim() || fallbackTitle;
  const bannerImage = boothData?.detailing_banner?.trim() || fallbackBanner;
  const title = boothData?.detailing_title || boothData?.name || "MoriTalks Morinaga – Meet The Expert";
  const rawDescription =
    boothData?.detailing_description ||
    "Sesi edukatif bersama HCP (Health Care Professional) yang membahas berbagai topik seputar nutrisi, tumbuh kembang, dan kesehatan anak, dikemas dalam obrolan yang ringan, informatif, dan mudah dipahami";

  const { mainText, specialText } = useMemo(
    () => parseBoothDescription(rawDescription),
    [rawDescription]
  );

  if (!isRendered) return null;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col justify-end overflow-hidden ${isClosing ? "pointer-events-none" : ""}`}>
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
          {/* Top Header Badge: Futuristic MORINAGA BOOTH Plate */}
          <div className="mb-4 w-[240px] sm:w-[255px] shrink-0 flex items-center justify-center drop-shadow-sm">
            <img
              src={headerImage}
              alt={boothData?.name || "Morinaga Booth"}
              onError={(e) => {
                if (
                  e.currentTarget.src !== window.location.origin + fallbackTitle &&
                  !e.currentTarget.src.endsWith(fallbackTitle)
                ) {
                  e.currentTarget.src = fallbackTitle;
                }
              }}
              className="w-full h-auto object-contain pointer-events-none select-none"
            />
          </div>

          {/* Booth 3D Visual Artwork (slightly narrower width) */}
          <div className="w-[270px] sm:w-[280px] rounded-2xl overflow-hidden bg-black/5 shadow-sm mb-4 border border-gray-100 flex justify-center">
            <img
              src={bannerImage}
              alt={title}
              onError={(e) => {
                if (
                  e.currentTarget.src !== window.location.origin + fallbackBanner &&
                  !e.currentTarget.src.endsWith(fallbackBanner)
                ) {
                  e.currentTarget.src = fallbackBanner;
                }
              }}
              className="w-full h-auto object-cover pointer-events-none select-none"
            />
          </div>

          {/* Content Heading & Description */}
          <div className="w-full mb-5 flex flex-col items-center">
            <h3 className="text-[16px] font-extrabold text-[#111111] leading-tight mb-2 tracking-tight text-center">
              {title}
            </h3>
            <p
              style={{
                textAlign: "justify",
                textAlignLast: "center",
              }}
              className="text-[14px] font-normal text-[#222222B2] leading-relaxed"
            >
              {mainText}
            </p>
            {specialText && (
              <p
                style={{
                  textAlign: "center",
                  textAlignLast: "center",
                }}
                className="text-[14px] font-semibold text-[#111111] leading-relaxed mt-2.5"
              >
                {specialText}
              </p>
            )}
          </div>

          {/* Action Buttons Row: Jadwal Podcast & LANJUT */}
          <div className="w-full flex items-center justify-between gap-3 shrink-0">
            {/* Left Button: Jadwal Podcast (Orange Futuristic) */}
            <button
              onClick={onPodcastScheduleClick}
              className="flex-1 h-[42px] relative flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:brightness-105"
              style={{
                backgroundImage: `url('/assets/detailing-orange.webp')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="text-white font-bold text-[13px] tracking-wide drop-shadow-sm">
                Jadwal Podcast
              </span>
            </button>

            {/* Right Button: LANJUT (Red Futuristic) */}
            <button
              onClick={onContinueClick}
              className="flex-1 h-[42px] relative flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:brightness-105"
              style={{
                backgroundImage: `url('/assets/detailing-red.webp')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span className="text-white font-bold text-[13px] tracking-wider uppercase drop-shadow-sm">
                LANJUT
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
