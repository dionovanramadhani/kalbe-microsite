import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";

import { useModalAnimation } from "../utils/useModalAnimation";
import {
  getKalbeBoothPodcastByRefID,
  getKalbeBoothActivityByRefID,
  isSessionToday,
  type KalbeBoothResponse,
  type KalbeBoothPodcastResponse,
  type KalbeBoothPodcastSession,
  type KalbeBoothActivityResponse,
  type KalbeBoothActivityItem,
} from "../utils/kalbeApi";

export interface BoothMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  boothId?: string;
  boothData?: KalbeBoothResponse | null;
  logo?: string | null;
  onStartDetailing?: () => void;
  onMoritalksPodcast?: (
    podcast: KalbeBoothPodcastResponse,
    todaySessions: KalbeBoothPodcastSession[],
  ) => void;
  onSelectActivity?: (
    activityItem: KalbeBoothActivityItem,
    allItems?: KalbeBoothActivityItem[],
  ) => void;
  onMoritalksAwardPresentation?: (allItems?: KalbeBoothActivityItem[]) => void;
  onPhotoboothHighAngel?: () => void;
}

export const BoothMenuModal: React.FC<BoothMenuModalProps> = ({
  isOpen,
  onClose,
  boothId,
  boothData,
  logo,
  onStartDetailing,
  onMoritalksPodcast,
  onSelectActivity,
  onMoritalksAwardPresentation,
  onPhotoboothHighAngel,
}) => {
  const { isRendered, isClosing, handleClose } = useModalAnimation(isOpen, onClose);

  const [podcast, setPodcast] = useState<KalbeBoothPodcastResponse | null>(null);
  const [activity, setActivity] = useState<KalbeBoothActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !boothId) return;

    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      getKalbeBoothPodcastByRefID(boothId),
      getKalbeBoothActivityByRefID(boothId),
    ])
      .then(async ([podcastRes, activityRes]) => {
        // 2 detik delay setelah berhasil di get
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!isMounted) return;
        if (podcastRes.status === "fulfilled") {
          setPodcast(podcastRes.value);
        }
        if (activityRes.status === "fulfilled") {
          setActivity(activityRes.value);
        }
        setIsLoading(false);
      })
      .catch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, boothId]);

  const defaultPodcast: KalbeBoothPodcastResponse = useMemo(
    () => ({
      id: "",
      name: "MoriTalks Podcast",
      topic: "Alergi & Gastro",
      ref_id: boothId || "",
      created_at: "",
      updated_at: "",
      sessions: [],
    }),
    [boothId],
  );

  const activePodcast = podcast || boothData?.podcast || defaultPodcast;

  // Filter sesi podcast hari ini (tidak peduli sudah selesai atau belum mulai, semua sesi hari ini diambil)
  const todaySessions = useMemo(() => {
    return (activePodcast?.sessions || []).filter((s) =>
      isSessionToday(s.start_at, s.end_at),
    );
  }, [activePodcast]);

  // Sesi yang akan ditampilkan: hanya sesi hari ini (tidak peduli sudah selesai atau belum mulai, tapi tetap podcast yang ditampilkan adalah podcast hari ini)
  const sessionsToDisplay = useMemo(() => {
    return todaySessions;
  }, [todaySessions]);

  const { awardItems, photoboothItems, otherItems } = useMemo(() => {
    const rawItems = activity?.activity_items || [];
    const award: KalbeBoothActivityItem[] = [];
    const photobooth: KalbeBoothActivityItem[] = [];
    const others: KalbeBoothActivityItem[] = [];

    rawItems.forEach((it) => {
      const lower = it.name.toLowerCase();
      if (lower.includes("podcast")) return;
      if (lower.includes("photobooth")) {
        photobooth.push(it);
      } else if (
        lower.includes("award") ||
        lower.includes("presentation") ||
        lower.includes("sesi") ||
        (it.speakers && it.speakers.length > 0) ||
        it.speaker ||
        it.host ||
        it.start_at ||
        (activity?.name &&
          (activity.name.toLowerCase().includes("award") ||
            activity.name.toLowerCase().includes("presentation")))
      ) {
        award.push(it);
      } else {
        others.push(it);
      }
    });

    return {
      awardItems: award.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      photoboothItems: photobooth.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      otherItems: others.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    };
  }, [activity]);

  if (!isRendered) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "pointer-events-none" : ""}`}
    >
      {/* Dark backdrop with blur */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
      />

      {/* Modal Wrapper */}
      <div
        className={`relative z-10 w-full max-w-[345px] sm:max-w-[355px] flex flex-col items-center pt-20 ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Floating Red Circular Close Button (welcoming pop-up style) */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-1 z-20 w-9 h-9 rounded-full bg-white text-[#E50014] border-4 border-[#E50014] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer hover:bg-red-50"
          title="Tutup Modal"
        >
          <X className="w-5 h-5 stroke-[2.8]" />
        </button>

        {/* Top Header Badge: Dynamic Logo with Fallback */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[210px] shrink-0 flex items-center justify-center drop-shadow-lg z-10 pointer-events-none select-none">
          <img
            src={boothData?.image_title || logo || "/assets/morinaga-booth-image-2.webp"}
            alt={boothData?.name || "Morinaga Booth"}
            onError={(e) => {
              if (
                e.currentTarget.src !==
                  window.location.origin + "/assets/morinaga-booth-image-2.webp" &&
                !e.currentTarget.src.endsWith("/assets/morinaga-booth-image-2.webp")
              ) {
                e.currentTarget.src = "/assets/morinaga-booth-image-2.webp";
              }
            }}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Main Card with the SVG background used on Misi Utama di Homepage */}
        <div className="relative w-full pt-14 pb-6 px-5 flex flex-col items-center select-none font-kalbe drop-shadow-2xl">
          {/* Sliced SVG Futuristic 8-Sided (Octagon) Background with Thicker Accent Corners */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 380 470"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background Fill (#FEF9F7) */}
            <polygon
              points="24,2 356,2 378,24 378,446 356,468 24,468 2,446 2,24"
              fill="#FEF9F7"
            />

            {/* Base Red Outline (#F4233E) - Standard 2px */}
            <polygon
              points="24,2 356,2 378,24 378,446 356,468 24,468 2,446 2,24"
              stroke="#F4233E"
              strokeWidth="2"
              strokeLinejoin="miter"
            />

            {/* Top-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,2 24,2 2,24 2,50"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Top-Right Corner Thick Accent (7.5px) */}
            <polyline
              points="330,2 356,2 378,24 378,50"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Right Corner Thick Accent (7.5px) */}
            <polyline
              points="378,420 378,446 356,468 330,468"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,468 24,468 2,446 2,420"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>

          {/* 1. "Tugas Utama: Lakukan Detailing di Booth" #940B0A 14px extra bold */}
          <h3 className="relative z-10 text-[14px] font-extrabold text-[#940B0A] text-center leading-snug">
            Tugas Utama: Lakukan Detailing di Booth
          </h3>

          {/* 2. "selesaikan sesi" 12px regular #5A5A5A */}
          <p className="relative z-10 text-[12px] font-normal text-[#5A5A5A] text-center leading-relaxed mt-1.5 mb-3 max-w-[270px]">
            Selesaikan sesi detailing bersama tim kami untuk mendapatkan reward.
          </p>

          {/* 3. "Ikuti detailing" #FFFFFF bold 18px */}
          <button
            onClick={onStartDetailing || onClose}
            className="relative z-10 w-[235px] sm:w-[245px] h-[48px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0"
            style={{
              backgroundImage: `url('/assets/red-button.webp')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-white font-bold text-[18px] tracking-wide drop-shadow">
              IKUT DETAILING
            </span>
          </button>

          {/* Dashed Horizontal Divider */}
          <div className="relative z-10 w-full border-t border-dashed border-[#B0B0B0] my-4" />

          {/* 4. "Aktivitas lainnya" #940B0A 14px extra bold */}
          <h3 className="relative z-10 text-[14px] font-extrabold text-[#940B0A] text-center leading-snug">
            Aktivitas lainnya
          </h3>

          {/* 5. "Ikuti keseruan..." 12px regular #5A5A5A */}
          <p className="relative z-10 text-[12px] font-normal text-[#5A5A5A] text-center leading-relaxed mt-1 mb-3.5">
            Ikuti keseruan aktivitas seru lainnya di booth kami!
          </p>

          {/* Activity Buttons List */}
          <div className="relative z-10 flex flex-col items-center gap-2.5 w-full max-h-[220px] overflow-y-auto no-scrollbar">
            {isLoading && !podcast && !activity ? (
              <div className="w-full flex flex-col items-center gap-2.5 py-1">
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="w-[235px] sm:w-[245px] h-[46px] rounded-xl bg-gray-200/90 animate-pulse flex items-center justify-between px-4 shrink-0 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-md bg-gray-300/80" />
                    <div className="w-28 h-3.5 rounded bg-gray-300/80" />
                    <div className="w-4 h-4 rounded-full bg-gray-300/80" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* 1. Podcast Button: Tetap selalu ditampilkan meskipun hari ini sudah selesai atau belum mulai */}
                <button
                  type="button"
                  onClick={() => {
                    if (onMoritalksPodcast) {
                      onMoritalksPodcast(activePodcast, sessionsToDisplay);
                    }
                  }}
                  className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 px-3"
                  style={{
                    backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <span
                    style={{
                      color: "#FA132D",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    className="truncate text-center w-full"
                  >
                    {activePodcast.name
                      ? activePodcast.name.replace(/Moritalks/g, "MoriTalks")
                      : "MoriTalks Podcast"}
                  </span>
                </button>

                {/* 2. MoriTalks Award Presentation Activity */}
                {awardItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectActivity) {
                        onSelectActivity(awardItems[0], awardItems);
                      } else if (onMoritalksAwardPresentation) {
                        onMoritalksAwardPresentation(awardItems);
                      }
                    }}
                    className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 px-3"
                    style={{
                      backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <span
                      style={{
                        color: "#FA132D",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      className="truncate text-center w-full"
                    >
                      {activity?.name &&
                      (activity.name.toLowerCase().includes("award") ||
                        activity.name.toLowerCase().includes("presentation"))
                        ? activity.name.replace(/Moritalks/g, "MoriTalks")
                        : "MoriTalks Award"}
                    </span>
                  </button>
                )}

                {/* 3. Photobooth High Angel Activity */}
                {photoboothItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectActivity) {
                        onSelectActivity(photoboothItems[0]);
                      } else if (onPhotoboothHighAngel) {
                        onPhotoboothHighAngel();
                      }
                    }}
                    className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 px-3"
                    style={{
                      backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <span
                      style={{
                        color: "#FA132D",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      className="truncate text-center w-full"
                    >
                      {photoboothItems[0].name || "Photobooth High Angel"}
                    </span>
                  </button>
                )}

                {/* 4. Other Dynamic Activities if any */}
                {otherItems.map((item) => (
                  <button
                    key={item.id || item.name}
                    type="button"
                    onClick={() => {
                      if (onSelectActivity) {
                        onSelectActivity(item);
                      }
                    }}
                    className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 px-3"
                    style={{
                      backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <span
                      style={{
                        color: "#FA132D",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      className="truncate text-center w-full"
                    >
                      {item.name}
                    </span>
                  </button>
                ))}

                {/* 5. Fallback buttons when no activities returned */}
                {!isLoading &&
                  awardItems.length === 0 &&
                  photoboothItems.length === 0 &&
                  otherItems.length === 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (onMoritalksAwardPresentation) {
                            onMoritalksAwardPresentation();
                          }
                        }}
                        className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 px-3"
                        style={{
                          backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
                          backgroundSize: "100% 100%",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <span
                          style={{
                            color: "#FA132D",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          className="truncate text-center w-full"
                        >
                          MoriTalks Award
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onPhotoboothHighAngel) {
                            onPhotoboothHighAngel();
                          }
                        }}
                        className="w-[235px] sm:w-[245px] h-[46px] flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-105 shrink-0 px-3"
                        style={{
                          backgroundImage: `url('/assets/morinaga-booth-activity-button-white.webp')`,
                          backgroundSize: "100% 100%",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <span
                          style={{
                            color: "#FA132D",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          className="truncate text-center w-full"
                        >
                          Photobooth High Angel
                        </span>
                      </button>
                    </>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
