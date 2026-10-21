import React, { useState, useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import {
  formatTimeRangeWIB,
  type KalbeBoothPodcastResponse,
  type KalbeBoothPodcastSession,
} from "../utils/kalbeApi";

export interface PodcastScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcasts?: KalbeBoothPodcastResponse[];
  podcastTitle?: string;
  topic?: string;
  image?: string | null;
  sessions?: KalbeBoothPodcastSession[];
}

interface PodcastSlide {
  id: string;
  title: string;
  topic: string;
  image?: string | null;
  sessions: KalbeBoothPodcastSession[];
}

// Clean person name by removing any "(Pembicara)", "(Speaker)", "(Host)", "(Finalist)", or "(Juri)" suffix/prefix
function cleanPersonName(name?: string | null): string {
  if (!name) return "";
  return name
    .replace(/\s*\((?:pembicara|speaker|host|juri|finalist)\)\s*$/i, "")
    .replace(/\s*\((?:pembicara|speaker|host|juri|finalist)\)\s*/gi, " ")
    .trim();
}

function cleanSpeakerName(speaker?: string | null): string {
  if (!speaker) return "-";
  const clean = speaker.replace(/^sesi\s*\d+[\s\-:]*/i, "").trim();
  return cleanPersonName(clean) || "-";
}

// Format date in Indonesian (WIB, Asia/Jakarta) -> e.g. "21 Oktober 2026"
function formatDateIndonesianWIB(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export const PodcastScheduleModal: React.FC<PodcastScheduleModalProps> = ({
  isOpen,
  onClose,
  podcasts,
  podcastTitle,
  topic,
  image,
  sessions,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, {
    duration: 280,
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  // Build slides: 1 podcast = 1 slide (menampilkan semua sesi dari podcast tersebut)
  const slides = useMemo<PodcastSlide[]>(() => {
    // 1. If an array of podcasts is provided
    if (podcasts && podcasts.length > 0) {
      // Sort podcasts by created_at chronologically (created_at ASC)
      const sortedPodcasts = [...podcasts].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || "").localeCompare(b.id || "");
      });

      return sortedPodcasts.map((pod, idx) => {
        const sortedSessions = (pod.sessions || []).slice().sort((a, b) => {
          if (a.start_at && b.start_at) {
            const diff = new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
            if (diff !== 0) return diff;
          }
          return 0;
        });

        return {
          id: pod.id || `pod-${idx}`,
          title: (pod.name || podcastTitle || "MoriTalks Podcast").replace(
            /Moritalks/g,
            "MoriTalks",
          ),
          topic: pod.topic || topic || "Alergi & Gastro",
          image: pod.image || image || null,
          sessions: sortedSessions,
        };
      });
    }

    // 2. If single podcast data is passed via props
    if ((sessions && sessions.length > 0) || topic || image) {
      const sortedSessions = (sessions || []).slice().sort((a, b) => {
        if (a.start_at && b.start_at) {
          const diff = new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
          if (diff !== 0) return diff;
        }
        return 0;
      });

      return [
        {
          id: "single-podcast",
          title: (podcastTitle || "MoriTalks Podcast").replace(/Moritalks/g, "MoriTalks"),
          topic: topic || "Alergi & Gastro",
          image: image || null,
          sessions: sortedSessions,
        },
      ];
    }

    // 3. Fallback mock data matching backend seeder and staging (ALERGI & GASTRO and TKPS)
    return [
      {
        id: "mock-pod-alergi-gastro",
        title: "MoriTalks Podcast",
        topic: "ALERGI & GASTRO",
        image:
          "https://sgp1.digitaloceanspaces.com/smart-robot/be6634e3-99fa-4bfd-a213-a2d1566e9b27.png",
        sessions: [
          {
            id: "mock-sess-1",
            speaker: "Prof Budi",
            host: "dr Mehendra",
            podcast_id: "mock-pod-alergi-gastro",
            start_at: "2026-10-21T10:00:00+07:00",
            end_at: "2026-10-21T10:10:00+07:00",
          },
          {
            id: "mock-sess-2",
            speaker: "dr. Budi Purnomo, Sp.A, Subsp. G.H. (K)",
            host: "dr. Dyahris Koentartiwi, Sp.A(K)",
            podcast_id: "mock-pod-alergi-gastro",
            start_at: "2026-10-21T10:10:00+07:00",
            end_at: "2026-10-21T10:20:00+07:00",
          },
        ],
      },
      {
        id: "mock-pod-tkps",
        title: "MoriTalks Podcast",
        topic: "TKPS",
        image:
          "https://sgp1.digitaloceanspaces.com/smart-robot/be6634e3-99fa-4bfd-a213-a2d1566e9b27.png",
        sessions: [
          {
            id: "mock-sess-3",
            speaker: "Prof Rini",
            host: "dr Mehendra",
            podcast_id: "mock-pod-tkps",
            start_at: "2026-10-22T10:00:00+07:00",
            end_at: "2026-10-22T10:10:00+07:00",
          },
          {
            id: "mock-sess-4",
            speaker: "Prof Wawan",
            host: "dr Mehendra",
            podcast_id: "mock-pod-tkps",
            start_at: "2026-10-22T10:10:00+07:00",
            end_at: "2026-10-22T10:20:00+07:00",
          },
        ],
      },
    ];
  }, [podcasts, podcastTitle, topic, image, sessions]);

  // Reset slide index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  // Keep currentSlide within bounds
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  // Touch & Mouse swipe gesture handlers
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);

  const mouseStartXRef = useRef<number | null>(null);
  const mouseEndXRef = useRef<number | null>(null);
  const mouseStartYRef = useRef<number | null>(null);
  const mouseEndYRef = useRef<number | null>(null);
  const isMouseDownRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchEndYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
    touchEndYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current !== null &&
      touchEndXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchEndYRef.current !== null
    ) {
      const diffX = touchStartXRef.current - touchEndXRef.current;
      const diffY = touchStartYRef.current - touchEndYRef.current;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX > 0 && currentSlide < slides.length - 1) {
          setCurrentSlide((prev) => prev + 1);
        } else if (diffX < 0 && currentSlide > 0) {
          setCurrentSlide((prev) => prev - 1);
        }
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    touchStartYRef.current = null;
    touchEndYRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
    mouseEndXRef.current = e.clientX;
    mouseStartYRef.current = e.clientY;
    mouseEndYRef.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    mouseEndXRef.current = e.clientX;
    mouseEndYRef.current = e.clientY;
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    if (
      mouseStartXRef.current !== null &&
      mouseEndXRef.current !== null &&
      mouseStartYRef.current !== null &&
      mouseEndYRef.current !== null
    ) {
      const diffX = mouseStartXRef.current - mouseEndXRef.current;
      const diffY = mouseStartYRef.current - mouseEndYRef.current;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX > 0 && currentSlide < slides.length - 1) {
          setCurrentSlide((prev) => prev + 1);
        } else if (diffX < 0 && currentSlide > 0) {
          setCurrentSlide((prev) => prev - 1);
        }
      }
    }
    mouseStartXRef.current = null;
    mouseEndXRef.current = null;
    mouseStartYRef.current = null;
    mouseEndYRef.current = null;
  };

  if (!isRendered) return null;

  const activeSlide = slides[currentSlide] || slides[0];
  const headerImage =
    activeSlide?.image && activeSlide.image.trim() !== ""
      ? activeSlide.image.trim()
      : image && image.trim() !== ""
        ? image.trim()
        : "/assets/moritalks-podcast-logo.webp";

  return (
    <div
      className={`absolute inset-0 z-[60] flex flex-col justify-end overflow-hidden ${
        isClosing ? "pointer-events-none" : ""
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Sliding Content Container */}
      <div
        className={`relative z-10 w-full flex flex-col items-center ${
          isClosing ? "animate-drawer-down" : "animate-drawer-up"
        }`}
      >
        {/* Floating Circular Close Button right above the drawer top - matches other modals */}
        <div className="w-full flex justify-end px-4 mb-2 pointer-events-none">
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
        <div className="w-full bg-white rounded-t-[32px] pt-6 pb-6 px-3 sm:px-4 flex flex-col items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.3)] max-h-[85vh] overflow-hidden">
          {/* Top Header Graphic from response (fallback to MoriTalks Podcast logo) */}
          <div className="w-full flex justify-center shrink-0 mb-3">
            <img
              src={headerImage}
              alt={activeSlide?.title || podcastTitle || "MoriTalks Podcast"}
              onError={(e) => {
                if (
                  e.currentTarget.src !==
                    window.location.origin + "/assets/moritalks-podcast-logo.webp" &&
                  !e.currentTarget.src.endsWith("/assets/moritalks-podcast-logo.webp")
                ) {
                  e.currentTarget.src = "/assets/moritalks-podcast-logo.webp";
                }
              }}
              className="w-[230px] sm:w-[250px] max-h-[85px] object-contain pointer-events-none select-none drop-shadow-sm scale-125"
            />
          </div>

          {/* Slide Carousel Track - Swipeable & Draggable (1 podcast = 1 slide) */}
          <div
            className="w-full overflow-hidden flex-1 min-h-0 flex flex-col cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="flex transition-transform duration-300 ease-out h-full"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {slides.map((slide, sIdx) => {
                const cleanTopic = slide.topic?.trim()
                  ? slide.topic.trim().replace(/^topik:\s*/i, "")
                  : "ALERGI & GASTRO";

                return (
                  <div
                    key={slide.id || sIdx}
                    className="w-full shrink-0 h-full max-h-[50vh] sm:max-h-[54vh] overflow-y-auto overscroll-contain no-scrollbar flex flex-col items-center px-1 pb-2"
                  >
                    {/* Subtitle Topik: ALERGI & GASTRO / TKPS */}
                    <h3
                      style={{
                        color: "#222222",
                        fontSize: "17px",
                      }}
                      className="tracking-tight text-center leading-tight mb-3 shrink-0 font-bold"
                    >
                      TOPIK: {cleanTopic}
                    </h3>

                    {/* All sessions for this podcast */}
                    {slide.sessions.length === 0 ? (
                      <div className="text-gray-400 text-sm italic py-8 text-center">
                        Belum ada sesi untuk topik ini
                      </div>
                    ) : (
                      slide.sessions.map((sess, sessIdx) => {
                        const formattedTime =
                          formatTimeRangeWIB(sess.start_at, sess.end_at) ||
                          "10.00 – 10.10 WIB";

                        const rawDate = formatDateIndonesianWIB(sess.start_at);
                        const dateLabel = rawDate ? `${rawDate.toUpperCase()}` : ``;

                        return (
                          <div
                            key={sess.id || sessIdx}
                            className="w-full flex flex-col items-center"
                          >
                            {sessIdx > 0 && (
                              <div className="w-full border-t border-dashed border-gray-300 my-4 shrink-0" />
                            )}

                            {/* SESI 1 / SESI 2 -> Bold 15px #222222 (Uppercase requirement) */}
                            <div
                              style={{
                                color: "#222222",
                                fontSize: "15px",
                                fontWeight: 700,
                              }}
                              className="mb-2 text-center leading-tight tracking-wide"
                            >
                              SESI {sessIdx + 1}
                            </div>

                            {/* SPEAKER Red Badge - slightly larger, semibold */}
                            <div className="inline-flex items-center justify-center px-8 py-1.5 rounded-full bg-[#EA001E] text-white text-[15px] sm:text-[15.5px] font-semibold uppercase tracking-wide mb-1.5 shadow-sm">
                              SPEAKER
                            </div>

                            {/* Speaker Name Pill Container */}
                            <div className="w-full min-h-[36px] px-2 sm:px-2.5 py-1 rounded-full border-2 border-[#EA001E] bg-white flex items-center justify-center text-center shadow-xs mb-3">
                              <span className="text-[#222222] font-semibold text-[10.5px] sm:text-[11.5px] leading-tight tracking-tight whitespace-nowrap">
                                {cleanSpeakerName(sess.speaker)}
                              </span>
                            </div>

                            {/* HOST Red Badge (if exists) - slightly larger, semibold */}
                            {sess.host && sess.host.trim() !== "" && (
                              <>
                                <div className="inline-flex items-center justify-center px-9 py-1.5 rounded-full bg-[#EA001E] text-white text-[15px] sm:text-[15.5px] font-semibold uppercase tracking-wide mb-1.5 shadow-sm">
                                  HOST
                                </div>

                                {/* Host Name Pill Container */}
                                <div className="w-full min-h-[36px] px-2 sm:px-2.5 py-1 rounded-full border-2 border-[#EA001E] bg-white flex items-center justify-center text-center shadow-xs mb-3.5">
                                  <span className="text-[#222222] font-semibold text-[10.5px] sm:text-[11.5px] leading-tight tracking-tight whitespace-nowrap">
                                    {cleanPersonName(sess.host)}
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Day & Date Header: DAY 1 (21 OKTOBER 2026) - matches Morinaga Award */}
                            {dateLabel && (
                              <div
                                style={{
                                  color: "#D41025",
                                  fontSize: "13.5px",
                                  fontWeight: "bold",
                                }}
                                className="text-center tracking-wide uppercase mb-2"
                              >
                                {dateLabel}
                              </div>
                            )}

                            {/* Time Box: Octagon Chamfered SVG with background #FDECED, border #F52037 */}
                            <div className="relative w-[215px] sm:w-[230px] h-[44px] flex items-center justify-center shrink-0 select-none shadow-xs px-3 mb-1">
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
                                  fontSize: "18px",
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Dots Indicator for Podcasts */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3.5 mb-0.5 shrink-0">
              {slides.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentSlide(dotIdx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    dotIdx === currentSlide
                      ? "w-8 h-2.5 bg-[#EA001E]"
                      : "w-2.5 h-2.5 bg-[#E2E8F0] hover:bg-gray-300"
                  }`}
                  aria-label={`Slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
