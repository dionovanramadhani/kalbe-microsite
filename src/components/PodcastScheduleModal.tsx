import React from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import { formatTimeRangeWIB, type KalbeBoothPodcastSession } from "../utils/kalbeApi";

export interface PodcastScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcastTitle?: string;
  topic?: string;
  sessions?: KalbeBoothPodcastSession[];
}

interface PodcastSessionItem {
  speaker: string;
  time: string;
}

const DEFAULT_PODCAST_SESSIONS: PodcastSessionItem[] = [
  {
    speaker: "Sesi 1 - Prof Budi",
    time: "10.00 – 10.10 WIB",
  },
  {
    speaker: "Sesi 2 - Dr. Ariani",
    time: "14.00 – 14.10 WIB",
  },
];

export const PodcastScheduleModal: React.FC<PodcastScheduleModalProps> = ({
  isOpen,
  onClose,
  podcastTitle,
  topic,
  sessions,
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
              src="/assets/clock-red.webp"
              alt="Jadwal Podcast"
              className="w-[150px] sm:w-[160px] h-auto object-contain drop-shadow-sm pointer-events-none select-none"
            />
          </div>

          {/* Title: moritalks podcast -> #D41025 bold 20px */}
          <h2
            style={{
              color: "#D41025",
              fontSize: "20px",
              fontWeight: "bold",
            }}
            className="tracking-tight text-center leading-tight mb-2"
          >
            {podcastTitle || "Moritalks Podcast"}
          </h2>

          {/* Subtitle: topik -> #222222 bold 16px */}
          <p
            style={{
              color: "#222222",
              fontSize: "16px",
              fontWeight: "bold",
            }}
            className="tracking-tight text-center leading-tight mb-5"
          >
            Topik: {topic || "Alergi & Gastro"}
          </p>

          {/* Sessions List */}
          <div className="w-full flex flex-col items-center space-y-4 max-h-[260px] overflow-y-auto no-scrollbar">
            {sessions && sessions.length > 0
              ? sessions.map((session, index) => {
                  const speakerLabel = session.speaker.toLowerCase().startsWith("sesi")
                    ? session.speaker
                    : `Sesi ${index + 1} - ${session.speaker}`;
                  const formattedTime =
                    formatTimeRangeWIB(session.start_at, session.end_at) || "10.00 – 10.10 WIB";

                  return (
                    <div key={session.id || index} className="w-full flex flex-col items-center">
                      {/* sesi 1.... -> #777777 medium 14px */}
                      <span
                        style={{
                          color: "#777777",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                        className="mb-2 text-center leading-tight"
                      >
                        {speakerLabel}
                      </span>

                      {/* jam -> #D41025 bold 20px */}
                      <div
                        className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center shrink-0 select-none shadow-xs px-3"
                        style={{
                          backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
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
                          {formattedTime}
                        </span>
                      </div>
                    </div>
                  );
                })
              : DEFAULT_PODCAST_SESSIONS.map((session, index) => (
                  <div key={index} className="w-full flex flex-col items-center">
                    {/* sesi 1.... -> #777777 medium 14px */}
                    <span
                      style={{
                        color: "#777777",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                      className="mb-2 text-center leading-tight"
                    >
                      {session.speaker}
                    </span>

                    {/* jam -> #D41025 bold 20px */}
                    <div
                      className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center shrink-0 select-none shadow-xs px-3"
                      style={{
                        backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
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
                        {session.time}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};
