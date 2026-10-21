import React, { useState, useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import { formatTimeRangeWIB, type KalbeBoothActivityItem } from "../utils/kalbeApi";

export interface AwardPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityItem?: KalbeBoothActivityItem | null;
  activityItems?: KalbeBoothActivityItem[];
}

interface SlideSession {
  item: KalbeBoothActivityItem;
  title: string;
  judges: string[];
  host: string | null;
  formattedTime: string;
  activity_image?: string | null;
  description?: string | null;
}

interface SlideGroup {
  dayNumber: number;
  dayDateLabel: string;
  sessions: SlideSession[];
}

// Format date in Indonesian (WIB, Asia/Jakarta) -> e.g. "25 Oktober 2026"
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

// Grouping key in WIB (Asia/Jakarta) -> "YYYY-MM-DD"
function getDateKeyWIB(iso?: string | null): string {
  if (!iso) return "nodate";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "nodate";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${day}`;
  } catch {
    return d.toISOString().split("T")[0];
  }
}

// Clean speaker name by removing any "(Juri)" or "(juri)" suffix
function getJudgesList(item: KalbeBoothActivityItem): string[] {
  let list: string[] = [];
  if (item.speakers && Array.isArray(item.speakers) && item.speakers.length > 0) {
    list = item.speakers.filter((s) => s && s.trim() !== "");
  } else if (item.speaker && item.speaker.trim() !== "") {
    list = item.speaker
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return list.map((name) => {
    return name
      .replace(/\s*\(juri\)\s*$/i, "")
      .replace(/\s*\(juri\)\s*/gi, " ")
      .trim();
  });
}

// Format host to "<Name> (Host)"
function getHostText(item: KalbeBoothActivityItem): string | null {
  if (!item.host || item.host.trim() === "") return null;
  const trimmed = item.host.trim();
  return trimmed.toLowerCase().includes("(host)") ? trimmed : `${trimmed} (Host)`;
}

// Determine session title (e.g. "Sesi 1")
function getSessionTitle(item: KalbeBoothActivityItem, indexWithinDay: number): string {
  if (item.name) {
    const trimmed = item.name.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower === "moritalks award" ||
      lower === "award presentation" ||
      lower === "moritalks award"
    ) {
      return `Sesi ${indexWithinDay + 1}`;
    }
    return trimmed;
  }
  return `Sesi ${indexWithinDay + 1}`;
}

export const AwardPresentationModal: React.FC<AwardPresentationModalProps> = ({
  isOpen,
  onClose,
  activityItem,
  activityItems,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose, {
    duration: 280,
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset slide index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  // Check if passed item is photobooth fallback
  const isPhotobooth =
    activityItem &&
    (activityItem.name.toLowerCase().includes("photobooth") ||
      (!activityItem.speaker && !activityItem.start_at && activityItem.description));

  // Build candidate items for Award Presentation
  const candidateItems = useMemo(() => {
    let items = (activityItems || []).filter(
      (it) =>
        !it.name.toLowerCase().includes("photobooth") &&
        !it.name.toLowerCase().includes("podcast"),
    );

    if (
      items.length === 0 &&
      activityItem &&
      !activityItem.name.toLowerCase().includes("photobooth")
    ) {
      items = [activityItem];
    }

    // Default mock data matching mockup if nothing provided
    if (items.length === 0) {
      items = [
        {
          id: "mock-1",
          name: "Sesi 1",
          order: 1,
          start_at: "2026-10-25T13:20:00+07:00",
          end_at: "2026-10-25T13:35:00+07:00",
          speakers: [
            "Prof. dr. Badriul Hegar, Sp.A, Subsp. G.H. (K), PhD",
            "Prof. Dr. dr. Ahmad Suryawan, Sp.A, Subsp. T.K.P.S. (K)",
          ],
          host: "dr.Ronald Rompies, Sp.A, Subsp.NPM(K)",
        },
        {
          id: "mock-2",
          name: "Sesi 2",
          order: 2,
          start_at: "2026-10-25T13:35:00+07:00",
          end_at: "2026-10-25T13:50:00+07:00",
          speakers: [
            "Prof. dr. Badriul Hegar, Sp.A, Subsp. G.H. (K), PhD",
            "Prof. Dr. dr. Ahmad Suryawan, Sp.A, Subsp. T.K.P.S. (K)",
          ],
          host: "dr.Riza Noviandi, Sp.A, Subsp. Neuro (K)",
        },
        {
          id: "mock-3",
          name: "Sesi 3",
          order: 3,
          start_at: "2026-10-25T14:00:00+07:00",
          end_at: "2026-10-25T14:15:00+07:00",
          speakers: [
            "Prof. dr. Badriul Hegar, Sp.A, Subsp. G.H. (K), PhD",
            "Prof. Dr. dr. Ahmad Suryawan, Sp.A, Subsp. T.K.P.S. (K)",
          ],
          host: "dr.Ronald Rompies, Sp.A, Subsp.NPM(K)",
        },
        {
          id: "mock-4",
          name: "Sesi 1",
          order: 4,
          start_at: "2026-10-26T13:20:00+07:00",
          end_at: "2026-10-26T13:35:00+07:00",
          speakers: [
            "Prof. dr. Badriul Hegar, Sp.A, Subsp. G.H. (K), PhD",
            "Prof. Dr. dr. Ahmad Suryawan, Sp.A, Subsp. T.K.P.S. (K)",
          ],
          host: "dr.Ronald Rompies, Sp.A, Subsp.NPM(K)",
        },
        {
          id: "mock-5",
          name: "Sesi 2",
          order: 5,
          start_at: "2026-10-26T13:35:00+07:00",
          end_at: "2026-10-26T13:50:00+07:00",
          speakers: [
            "Prof. dr. Badriul Hegar, Sp.A, Subsp. G.H. (K), PhD",
            "Prof. Dr. dr. Ahmad Suryawan, Sp.A, Subsp. T.K.P.S. (K)",
          ],
          host: "dr.Riza Noviandi, Sp.A, Subsp. Neuro (K)",
        },
      ];
    }

    return items;
  }, [activityItems, activityItem]);

  // Group candidate items by date in WIB, and slice into max 2 sessions per slide
  const slides = useMemo(() => {
    const groupsMap = new Map<string, KalbeBoothActivityItem[]>();

    candidateItems.forEach((item) => {
      const key = getDateKeyWIB(item.start_at);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(item);
    });

    const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => {
      if (a === "nodate") return 1;
      if (b === "nodate") return -1;
      return a.localeCompare(b);
    });

    const resultSlides: SlideGroup[] = [];

    sortedKeys.forEach((key, dayIdx) => {
      const dayNumber = dayIdx + 1;
      const dayItems = groupsMap.get(key) || [];

      // Sort items within day by start_at then order
      dayItems.sort((a, b) => {
        if (a.start_at && b.start_at) {
          const diff = new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
          if (diff !== 0) return diff;
        }
        return (a.order ?? 0) - (b.order ?? 0);
      });

      const firstWithDate = dayItems.find((it) => it.start_at);
      const formattedDate = firstWithDate
        ? formatDateIndonesianWIB(firstWithDate.start_at)
        : "";
      const dayDateLabel = formattedDate
        ? `DAY ${dayNumber} (${formattedDate})`
        : `DAY ${dayNumber}`;

      // Chunk max 2 sessions per slide
      for (let i = 0; i < dayItems.length; i += 2) {
        const chunk = dayItems.slice(i, i + 2);
        const sessions: SlideSession[] = chunk.map((item, localIdx) => {
          const indexWithinDay = i + localIdx;
          return {
            item,
            title: getSessionTitle(item, indexWithinDay),
            judges: getJudgesList(item),
            host: getHostText(item),
            formattedTime:
              formatTimeRangeWIB(item.start_at, item.end_at) || "13.30 – 13.45 WIB",
            activity_image: item.activity_image,
            description:
              item.description &&
              item.description.trim() !== "" &&
              item.description.trim() !== "-"
                ? item.description.trim()
                : null,
          };
        });

        resultSlides.push({
          dayNumber,
          dayDateLabel,
          sessions,
        });
      }
    });

    return resultSlides;
  }, [candidateItems]);

  // Keep currentSlide within bounds
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  // Touch and Mouse swipe gesture handlers
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
      // Only horizontal movement triggers slide switch
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

  // Header image from response (or fallback to MoriTalks grand final title)
  const currentSlideData = slides[currentSlide];
  const headerImage =
    currentSlideData?.sessions[0]?.activity_image ||
    activityItem?.activity_image ||
    "/assets/grand-final-title.webp";

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

      {/* Drawer Container */}
      <div
        className={`relative z-10 w-full flex flex-col items-center ${
          isClosing ? "animate-drawer-down" : "animate-drawer-up"
        }`}
      >
        {/* Floating Red Circular Close Button right above the drawer top */}
        <div className="w-full max-w-[450px] sm:max-w-[470px] flex justify-end px-4 sm:px-5 mb-2 pointer-events-none">
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
        {isPhotobooth ? (
          <div className="w-full max-w-[450px] sm:max-w-[470px] bg-white rounded-t-[32px] px-5 pt-5 pb-8 flex flex-col items-center shadow-[0_-8px_30px_rgba(0,0,0,0.3)] select-none">
            {activityItem?.activity_image && (
              <div className="w-full rounded-[20px] overflow-hidden bg-black/5 mb-4 shadow-sm flex items-center justify-center border border-gray-100">
                <img
                  src={activityItem.activity_image}
                  alt={activityItem.name}
                  className="w-full h-auto max-h-[260px] object-cover pointer-events-none select-none"
                />
              </div>
            )}
            <h2
              style={{
                color: "#D41025",
                fontSize: "20px",
                fontWeight: "bold",
              }}
              className="tracking-tight text-center leading-tight mb-3"
            >
              {activityItem?.name || "Photobooth"}
            </h2>
            {activityItem?.description && (
              <p
                style={{
                  color: "#333333",
                  fontSize: "14px",
                  textAlign: "justify",
                }}
                className="leading-relaxed px-1 font-normal"
              >
                {activityItem.description}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[450px] sm:max-w-[470px] bg-white rounded-t-[32px] pt-6 pb-5 px-3 sm:px-5 flex flex-col items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.3)] max-h-[85vh] overflow-hidden">
            {/* Top Header Graphic from response (fallback to MoriTalks Awards logo) */}
            {headerImage && (
              <div className="w-full flex justify-center shrink-0 mb-3.5">
                <img
                  src={headerImage}
                  alt="MoriTalks Awards Presentation"
                  onError={(e) => {
                    if (
                      e.currentTarget.src !==
                        window.location.origin + "/assets/grand-final-title.webp" &&
                      !e.currentTarget.src.endsWith("/assets/grand-final-title.webp")
                    ) {
                      e.currentTarget.src = "/assets/grand-final-title.webp";
                    }
                  }}
                  className="w-[200px] sm:w-[220px] max-h-[95px] object-contain pointer-events-none select-none drop-shadow-sm scale-125"
                />
              </div>
            )}

            {/* Slide Carousel Track - Sessions info area is scrollable */}
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
                  const slideJudges = Array.from(
                    new Set(slide.sessions.flatMap((s) => s.judges).filter(Boolean)),
                  );

                  return (
                    <div
                      key={sIdx}
                      className="w-full shrink-0 h-full max-h-[50vh] sm:max-h-[54vh] overflow-y-auto overscroll-contain no-scrollbar flex flex-col items-center px-1 pb-2"
                    >
                      {/* Top Juri Section formatted like session title */}
                      {slideJudges.length > 0 && (
                        <div className="flex flex-col items-center mb-5 w-full shrink-0">
                          <h3
                            style={{
                              color: "#222222",
                              fontSize: "17px",
                              fontWeight: "bold",
                            }}
                            className="text-center tracking-tight leading-snug mb-1.5"
                          >
                            JURI
                          </h3>
                          <div className="flex flex-col items-center text-center gap-1 w-full px-1">
                            {slideJudges.map((judge, jIdx) => (
                              <span
                                key={jIdx}
                                style={{
                                  color: "#555555",
                                  fontSize: "13px",
                                  fontWeight: 400,
                                }}
                                className="leading-snug font-normal w-full text-center"
                              >
                                {judge}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {slide.sessions.map((sess, sessIdx) => (
                        <div key={sessIdx} className="w-full flex flex-col items-center">
                          {sessIdx > 0 && (
                            <div className="w-full border-t border-dashed border-gray-300 my-4 shrink-0" />
                          )}

                          {/* Session Title: "Sesi 1" / "Sesi 2" */}
                          <h3
                            style={{
                              color: "#222222",
                              fontSize: "17px",
                              fontWeight: "bold",
                            }}
                            className="uppercase text-center tracking-tight leading-snug mb-1.5"
                          >
                            {sess.title}
                          </h3>

                          {/* Host ONLY */}
                          {sess.host && (
                            <div className="flex flex-col items-center text-center mb-3 w-full px-1">
                              <span
                                style={{
                                  color: "#555555",
                                  fontSize: "13px",
                                  fontWeight: 400,
                                }}
                                className="leading-snug font-normal w-full text-center"
                              >
                                {sess.host}
                              </span>
                            </div>
                          )}

                          {/* Day & Date Header: DAY 1 (25 OKTOBER 2026) */}
                          <div
                            style={{
                              color: "#D41025",
                              fontSize: "13.5px",
                              fontWeight: "bold",
                            }}
                            className="text-center tracking-wide uppercase mb-2"
                          >
                            {slide.dayDateLabel}
                          </div>

                          {/* Time Badge: Chamfered Octagon SVG */}
                          {sess.formattedTime && (
                            <div className="relative w-[235px] sm:w-[245px] h-[44px] flex items-center justify-center shrink-0 select-none shadow-xs px-3">
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
                                {sess.formattedTime}
                              </span>
                            </div>
                          )}

                          {/* Optional Description */}
                          {sess.description && (
                            <p
                              style={{
                                color: "#444444",
                                fontSize: "13px",
                                textAlign: "justify",
                              }}
                              className="mt-3 leading-relaxed px-3"
                            >
                              {sess.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Dots Indicator */}
            {slides.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3.5 mb-0.5 shrink-0">
                {slides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentSlide(dotIdx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      dotIdx === currentSlide
                        ? "w-8 h-2.5 bg-[#E50014]"
                        : "w-2.5 h-2.5 bg-[#E2E8F0] hover:bg-gray-300"
                    }`}
                    aria-label={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
