import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import { formatTimeRangeWIB, type KalbeBoothPodcastSession } from "../utils/kalbeApi";

export interface PodcastScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcastTitle?: string;
  topic?: string;
  image?: string | null;
  sessions?: KalbeBoothPodcastSession[];
}

export const PodcastScheduleModal: React.FC<PodcastScheduleModalProps> = ({
  isOpen,
  onClose,
  podcastTitle,
  topic,
  image,
  sessions,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, {
    duration: 280,
  });

  if (!isRendered) return null;

  const formatSpeaker = (speaker: string) => {
    let clean = speaker.replace(/^sesi\s*\d+[\s\-:]*/i, "").trim();
    if (!clean) clean = "Pembicara";
    if (/\(pembicara\)/i.test(clean)) return clean;
    return `${clean} (Pembicara)`;
  };

  const formatHost = (host?: string | null) => {
    if (!host) return "";
    const clean = host.replace(/^host[\s\-:]*/i, "").trim();
    if (!clean) return "";
    if (/\(host\)/i.test(clean)) return clean;
    return `${clean} (Host)`;
  };

  const headerImage =
    image && image.trim() !== "" ? image.trim() : "/assets/moritalks-podcast-logo.webp";

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
        <div className="w-full max-w-[420px] flex justify-end px-5 mb-2 pointer-events-none">
          <button
            type="button"
            onClick={handleClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
            title="Tutup"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>
        </div>

        {/* Drawer Body Container */}
        <div className="w-full max-w-[420px] bg-white rounded-t-[32px] pt-6 pb-6 px-5 flex flex-col items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.3)] max-h-[85vh] overflow-hidden">
          {/* Top Header Graphic from response (fallback to MoriTalks Podcast logo) */}
          <div className="w-full flex justify-center shrink-0 mb-3.5">
            <img
              src={headerImage}
              alt={podcastTitle || "Moritalks Podcast"}
              onError={(e) => {
                if (
                  e.currentTarget.src !==
                    window.location.origin + "/assets/moritalks-podcast-logo.webp" &&
                  !e.currentTarget.src.endsWith("/assets/moritalks-podcast-logo.webp")
                ) {
                  e.currentTarget.src = "/assets/moritalks-podcast-logo.webp";
                }
              }}
              className="scale-110 w-[320px] sm:w-[320px] max-h-[95px] object-contain pointer-events-none select-none drop-shadow-sm"
            />
          </div>

          {/* Subtitle: Topik -> #222222 bold 16px */}
          <h3
            style={{
              color: "#222222",
              fontSize: "16px",
              fontWeight: "bold",
            }}
            className="tracking-tight text-center leading-tight mb-4 shrink-0"
          >
            Topik:{" "}
            {topic?.trim() ? topic.trim().replace(/^topik:\s*/i, "") : "Alergi & Gastro"}
          </h3>

          {/* Sessions List (Scrollable Area) */}
          <div className="w-full flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col items-center space-y-6 pb-2">
            {sessions && sessions.length > 0 ? (
              sessions.map((session, index) => {
                const formattedTime =
                  formatTimeRangeWIB(session.start_at, session.end_at) ||
                  "10.00 – 10.10 WIB";

                return (
                  <div
                    key={session.id || index}
                    className="w-full flex flex-col items-center"
                  >
                    {/* Sesi 1 / Sesi 2 -> Bold 15px #222222 */}
                    <span
                      style={{
                        color: "#222222",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="mb-1 text-center leading-tight"
                    >
                      Sesi {index + 1}
                    </span>

                    {/* Pembicara -> Normal 14px #555555 */}
                    <span
                      style={{
                        color: "#555555",
                        fontSize: "14px",
                        fontWeight: 400,
                      }}
                      className="mb-0.5 text-center leading-tight max-w-[320px]"
                    >
                      {formatSpeaker(session.speaker)}
                    </span>

                    {/* Host jika ada -> Normal 14px #555555 */}
                    {session.host && session.host.trim() !== "" ? (
                      <span
                        style={{
                          color: "#555555",
                          fontSize: "14px",
                          fontWeight: 400,
                        }}
                        className="mb-3 text-center leading-tight max-w-[320px]"
                      >
                        {formatHost(session.host)}
                      </span>
                    ) : (
                      <div className="mb-2.5" />
                    )}

                    {/* Time box: Octagon Chamfered SVG with background #FDECED, border #F52037, text 20px bold #D41025 */}
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
                  </div>
                );
              })
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  Belum ada jadwal podcast untuk hari ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
