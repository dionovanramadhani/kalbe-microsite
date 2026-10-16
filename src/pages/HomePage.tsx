import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../data/dummyUser";
import { getUserName } from "../utils/auth";
import { RewardModal } from "../components/RewardModal";
import { BoothDrawer } from "../components/BoothDrawer";
import { BoothMenuModal } from "../components/BoothMenuModal";
import { PodcastScheduleModal } from "../components/PodcastScheduleModal";
import { AwardPresentationModal } from "../components/AwardPresentationModal";
import { EarlyLifeDrawer } from "../components/EarlyLifeDrawer";
import { WelcomeModal } from "../components/WelcomeModal";
import { SymposiumStartedModal } from "../components/SymposiumStartedModal";
import { SymposiumUpcomingModal } from "../components/SymposiumUpcomingModal";
import {
  isSymposiumStartedOrOngoing,
  isSymposiumUpcoming,
  isSymposiumJoined,
} from "../data/symposiumStore";
import {
  getUnclaimedRewardsCount,
  hasUnclaimedMysteryBox as checkHasUnclaimedMysteryBox,
  hasUserMysteryBox,
  unlockReward,
  isPostTestCompleted,
  setPostTestCompleted,
  isBoothDetailingCompleted,
  setBoothDetailingCompleted,
  isEarlyLifeDetailingCompleted,
  setEarlyLifeDetailingCompleted,
  isAllActivitiesCompleted,
  isMysteryBoxClaimed,
  checkAndUnlockMysteryBox,
} from "../data/rewardStore";
import {
  getKalbeBoothsList,
  getKalbeSymposiumsList,
  getCachedKalbeBooths,
  getCachedKalbeSymposiums,
  getKalbeUserHistory,
  type KalbeHistoryItemResponse,
  type KalbeBoothPodcastSession,
  type KalbeBoothActivityItem,
} from "../utils/kalbeApi";
import type { KalbeBoothResponse, KalbeSymposiumResponse } from "../admin/adminApi";

interface MissionItem {
  id: string;
  type?: "booth-morinaga" | "symposium" | "booth-early-life";
  title: string;
  subtitle: string;
  icon: string;
  disabled?: boolean;
  isCompleted?: boolean;
  boothData?: KalbeBoothResponse;
  symposiumData?: KalbeSymposiumResponse;
}

const DEFAULT_BOOTH_ICON = "/assets/morinaga-booth-icon.png";
const DEFAULT_SYMPO_ICON = "/assets/morinaga-sympo-icon.png";
const DEFAULT_EARLY_LIFE_ICON = "/assets/kalbe-60th-icon.png";

const resolveMissionIcon = (
  rawIcon: string | null | undefined,
  fallbackAsset: string,
): string => {
  if (!rawIcon || typeof rawIcon !== "string") {
    return fallbackAsset;
  }
  const trimmed = rawIcon.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "-"
  ) {
    return fallbackAsset;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    return `${apiBaseUrl}${trimmed}`;
  }
  return trimmed;
};

// Urutan misi sesuai instruksi:
// 1. Morinaga Booth
// 2. Morinaga Sympo
// 3. Kalbe Early Life Solution
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasPostTestSuccess = Boolean(location.state?.showPostTestSuccessModal);
  const hasBoothSuccess = Boolean(location.state?.showBoothSuccessModal);
  const hasEarlyLifeSuccess = Boolean(location.state?.showEarlyLifeSuccessModal);

  const currentUser = getCurrentUser();
  const [postTestDone, setPostTestDone] = useState<boolean>(
    () => isPostTestCompleted() || hasPostTestSuccess,
  );
  const [boothDone, setBoothDone] = useState<boolean>(
    () => isBoothDetailingCompleted() || hasBoothSuccess,
  );
  const [earlyLifeDone, setEarlyLifeDone] = useState<boolean>(
    () => isEarlyLifeDetailingCompleted() || hasEarlyLifeSuccess,
  );
  const [unclaimedRewardsCount, setUnclaimedRewardsCount] = useState<number>(() => {
    if (hasPostTestSuccess) {
      unlockReward("morinaga-sympo");
    }
    if (hasBoothSuccess) {
      unlockReward("morinaga-booth");
    }
    return getUnclaimedRewardsCount();
  });
  const [hasUnclaimedMysteryBoxState, setHasUnclaimedMysteryBoxState] = useState<boolean>(
    () => {
      return checkHasUnclaimedMysteryBox();
    },
  );
  const [hasMysteryBox, setHasMysteryBox] = useState<boolean>(() => {
    return hasUserMysteryBox();
  });
  const [mysteryBoxClaimed, setMysteryBoxClaimed] = useState<boolean>(() => {
    return isMysteryBoxClaimed();
  });

  const [apiBooths, setApiBooths] = useState<KalbeBoothResponse[]>(() => getCachedKalbeBooths());
  const [apiSymposiums, setApiSymposiums] = useState<KalbeSymposiumResponse[]>(() => getCachedKalbeSymposiums());

  const isWelcomePending = sessionStorage.getItem("kalbe_welcome_pending") === "true";

  // Re-sync state whenever user navigates to HomePage or switches user session
  useEffect(() => {
    let isMounted = true;

    // Initial local read for instant render
    setPostTestDone(isPostTestCompleted() || hasPostTestSuccess);
    setBoothDone(isBoothDetailingCompleted() || hasBoothSuccess);
    setEarlyLifeDone(isEarlyLifeDetailingCompleted() || hasEarlyLifeSuccess);
    setUnclaimedRewardsCount(getUnclaimedRewardsCount());
    setHasUnclaimedMysteryBoxState(checkHasUnclaimedMysteryBox());
    setHasMysteryBox(hasUserMysteryBox());
    setMysteryBoxClaimed(isMysteryBoxClaimed());

    // Fetch live state from backend APIs
    Promise.all([
      getKalbeBoothsList().catch(() => [] as KalbeBoothResponse[]),
      getKalbeSymposiumsList().catch(() => [] as KalbeSymposiumResponse[]),
      getKalbeUserHistory().catch(() => [] as KalbeHistoryItemResponse[]),
    ]).then(([booths, sympos, historyList]) => {
      if (!isMounted) return;
      if (booths && booths.length > 0) setApiBooths(booths);
      if (sympos && sympos.length > 0) setApiSymposiums(sympos);

      // Track completed activities from API:
      const morinagaBooth = booths.find(
        (b) =>
          b.name.toLowerCase().includes("morinaga") ||
          (b.name.toLowerCase().includes("booth") && !b.name.toLowerCase().includes("early")),
      );
      const earlyLifeBooth = booths.find(
        (b) => b.name.toLowerCase().includes("early") || b.name.toLowerCase().includes("life"),
      );
      const morinagaSympo =
        sympos.find(
          (s) =>
            s.title.toLowerCase().includes("morinaga") ||
            s.title.toLowerCase().includes("sympo"),
        ) || sympos[0];

      const hasSympoHistory = historyList.some((h) => h.reward_type === "symposium");
      const hasMorinagaHistory = historyList.some(
        (h) =>
          h.reward_type === "booth" &&
          (h.booth?.name?.toLowerCase().includes("morinaga") ||
            h.label?.toLowerCase().includes("morinaga") ||
            (!h.label?.toLowerCase().includes("early") && !h.booth?.name?.toLowerCase().includes("early"))),
      );
      const hasEarlyLifeHistory = historyList.some(
        (h) =>
          h.reward_type === "booth" &&
          (h.booth?.name?.toLowerCase().includes("early") ||
            h.label?.toLowerCase().includes("early")),
      );

      const isPostTestFinished = Boolean(
        morinagaSympo?.is_completed || hasSympoHistory || isPostTestCompleted() || hasPostTestSuccess,
      );
      const isMorinagaFinished = Boolean(
        morinagaBooth?.is_completed || hasMorinagaHistory || isBoothDetailingCompleted() || hasBoothSuccess,
      );
      const isEarlyLifeFinished = Boolean(
        earlyLifeBooth?.is_completed || hasEarlyLifeHistory || isEarlyLifeDetailingCompleted() || hasEarlyLifeSuccess,
      );

      setPostTestDone(isPostTestFinished);
      setBoothDone(isMorinagaFinished);
      setEarlyLifeDone(isEarlyLifeFinished);

      if (isPostTestFinished) setPostTestCompleted(true);
      if (isMorinagaFinished) setBoothDetailingCompleted(true);
      if (isEarlyLifeFinished) setEarlyLifeDetailingCompleted(true);

      // Track Mystery Box from API:
      const mysteryBoxHistory = historyList.find(
        (h) => h.reward_type === "mystery_box" || h.reward_type?.includes("mystery"),
      );
      const allActivitiesDone = isPostTestFinished && isMorinagaFinished && isEarlyLifeFinished;
      const userHasMysteryBox = Boolean(mysteryBoxHistory || allActivitiesDone);
      const isMbClaimed = Boolean(mysteryBoxHistory?.is_claimed);

      const isMbClaimable = mysteryBoxHistory ? mysteryBoxHistory.is_claimable !== false : true;
      setHasMysteryBox(userHasMysteryBox);
      setMysteryBoxClaimed(isMbClaimed);
      setHasUnclaimedMysteryBoxState(userHasMysteryBox && !isMbClaimed && isMbClaimable);

      // Unclaimed non-mystery rewards count:
      const unclaimedCount = historyList.filter(
        (h) => !h.is_claimed && (h.is_claimable !== false) && h.reward_type !== "mystery_box" && !h.reward_type?.includes("mystery"),
      ).length;
      setUnclaimedRewardsCount(unclaimedCount);
    }).catch((err) => {
      console.warn("Failed to fetch user state in HomePage:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [
    location.pathname,
    hasPostTestSuccess,
    hasBoothSuccess,
    hasEarlyLifeSuccess,
    isWelcomePending,
  ]);

  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(
    () => isWelcomePending,
  );

  const [showPostTestModal, setShowPostTestModal] = useState<boolean>(hasPostTestSuccess);
  const [showBoothCompletionModal, setShowBoothCompletionModal] =
    useState<boolean>(hasBoothSuccess);
  const [showEarlyLifeCompletionModal, setShowEarlyLifeCompletionModal] =
    useState<boolean>(hasEarlyLifeSuccess);

  const getMysteryBoxPopupShownKey = () => {
    const user = getCurrentUser();
    const userId =
      user?.id || (user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, "_") : "guest");
    return `kalbe_mystery_box_popup_shown_${userId}`;
  };

  const isMysteryBoxPopupShown = () => {
    try {
      const key = getMysteryBoxPopupShownKey();
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  };

  const markMysteryBoxPopupShown = () => {
    try {
      const key = getMysteryBoxPopupShownKey();
      localStorage.setItem(key, "true");
    } catch (e) {
      console.warn("Failed to set mystery box shown storage:", e);
    }
  };

  // Pop-up mystery box hanya muncul sekali ketika user baru saja mendapatkannya
  const [showMysteryBoxModal, setShowMysteryBoxModal] = useState<boolean>(false);

  const getMysteryBoxAnimatedKey = () => {
    const user = getCurrentUser();
    const userId =
      user?.id || (user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, "_") : "guest");
    return `kalbe_mystery_box_popup_animated_${userId}`;
  };

  const [shouldAnimateMysteryBox, setShouldAnimateMysteryBox] = useState<boolean>(() => {
    try {
      const key = getMysteryBoxAnimatedKey();
      return localStorage.getItem(key) !== "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (showMysteryBoxModal) {
      try {
        const key = getMysteryBoxAnimatedKey();
        const alreadyAnimated = localStorage.getItem(key) === "true";
        if (!alreadyAnimated) {
          setShouldAnimateMysteryBox(true);
          localStorage.setItem(key, "true");
        } else {
          setShouldAnimateMysteryBox(false);
        }
      } catch (e) {
        console.warn("Failed to check/set mystery box animation storage:", e);
      }
    }
  }, [showMysteryBoxModal]);

  const [showSymposiumStartedModal, setShowSymposiumStartedModal] = useState<boolean>(
    () => {
      // Jika welcoming pop up atau mystery box pop up sedang aktif/pending, jangan tampilkan symposium modal terlebih dahulu
      if (isWelcomePending) return false;
      if (hasPostTestSuccess || hasBoothSuccess || hasEarlyLifeSuccess) return false;
      if (isAllActivitiesCompleted() && !isMysteryBoxClaimed()) return false;
      const isDone = isPostTestCompleted() || hasPostTestSuccess;
      if (isDone || isSymposiumJoined()) return false;
      return isSymposiumStartedOrOngoing();
    },
  );

  const handleCloseWelcomeModal = () => {
    sessionStorage.removeItem("kalbe_welcome_pending");
    sessionStorage.setItem("kalbe_welcome_shown", "true");
    setShowWelcomeModal(false);

    if (isAllActivitiesCompleted()) {
      checkAndUnlockMysteryBox();
    }

    // Reminder symposium jika belum diikuti dan sedang aktif
    const isDone = isPostTestCompleted() || hasPostTestSuccess;
    if (
      !hasPostTestSuccess &&
      !hasBoothSuccess &&
      !hasEarlyLifeSuccess &&
      !isDone &&
      !isSymposiumJoined() &&
      isSymposiumStartedOrOngoing()
    ) {
      setShowSymposiumStartedModal(true);
    }
  };

  const handleClosePostTestModal = () => {
    setShowPostTestModal(false);
    if (isAllActivitiesCompleted() && !isMysteryBoxClaimed() && !isMysteryBoxPopupShown()) {
      checkAndUnlockMysteryBox();
      setHasMysteryBox(true);
      setHasUnclaimedMysteryBoxState(true);
      markMysteryBoxPopupShown();
      setShowMysteryBoxModal(true);
    }
  };

  const handleCloseBoothCompletionModal = () => {
    setShowBoothCompletionModal(false);
    if (isAllActivitiesCompleted() && !isMysteryBoxClaimed() && !isMysteryBoxPopupShown()) {
      checkAndUnlockMysteryBox();
      setHasMysteryBox(true);
      setHasUnclaimedMysteryBoxState(true);
      markMysteryBoxPopupShown();
      setShowMysteryBoxModal(true);
    }
  };

  const handleCloseEarlyLifeCompletionModal = () => {
    setShowEarlyLifeCompletionModal(false);
    if (isAllActivitiesCompleted() && !isMysteryBoxClaimed() && !isMysteryBoxPopupShown()) {
      checkAndUnlockMysteryBox();
      setHasMysteryBox(true);
      setHasUnclaimedMysteryBoxState(true);
      markMysteryBoxPopupShown();
      setShowMysteryBoxModal(true);
    }
  };

  const handleCloseMysteryBoxModal = () => {
    markMysteryBoxPopupShown();
    setShowMysteryBoxModal(false);
    setShouldAnimateMysteryBox(false);
    const isDone = isPostTestCompleted() || hasPostTestSuccess;
    if (
      !hasPostTestSuccess &&
      !hasBoothSuccess &&
      !hasEarlyLifeSuccess &&
      !isDone &&
      !isSymposiumJoined() &&
      isSymposiumStartedOrOngoing()
    ) {
      setShowSymposiumStartedModal(true);
    }
  };

  const handleTakeMysteryBox = () => {
    setShowMysteryBoxModal(false);
    setShouldAnimateMysteryBox(false);
    navigate("/mystery-box");
  };

  const [showSymposiumUpcomingModal, setShowSymposiumUpcomingModal] = useState(false);
  const [targetRewardId] = useState<string>(
    hasEarlyLifeSuccess
      ? "early-life"
      : hasBoothSuccess
        ? "morinaga-booth"
        : "morinaga-sympo",
  );
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false);
  const [showBoothMenuModal, setShowBoothMenuModal] = useState(false);
  const [showBoothDrawer, setShowBoothDrawer] = useState(false);
  const [showEarlyLifeDrawer, setShowEarlyLifeDrawer] = useState(false);
  const [showPodcastScheduleModal, setShowPodcastScheduleModal] = useState(false);
  const [showAwardPresentationModal, setShowAwardPresentationModal] = useState(false);
  const [podcastSessions, setPodcastSessions] = useState<KalbeBoothPodcastSession[]>([]);
  const [podcastTitle, setPodcastTitle] = useState<string>("Moritalks Podcast");
  const [selectedActivityItem, setSelectedActivityItem] = useState<KalbeBoothActivityItem | null>(null);

  const morinagaBooth = useMemo(() => {
    return apiBooths.find(
      (b) =>
        b.name.toLowerCase().includes("morinaga") ||
        (b.name.toLowerCase().includes("booth") && !b.name.toLowerCase().includes("early"))
    );
  }, [apiBooths]);

  const earlyLifeBooth = useMemo(() => {
    return apiBooths.find(
      (b) =>
        b.name.toLowerCase().includes("early") ||
        b.name.toLowerCase().includes("kalbe") ||
        b.name.toLowerCase().includes("life")
    );
  }, [apiBooths]);

  // Urutan misi sesuai instruksi:
  // 1. Morinaga Booth
  // 2. Morinaga Sympo
  // 3. Kalbe Early Life Solution
  const missions: MissionItem[] = useMemo(() => {
    const morinagaSympo =
      apiSymposiums.find(
        (s) =>
          s.title.toLowerCase().includes("sympo") ||
          s.title.toLowerCase().includes("morinaga")
      ) || apiSymposiums[0];

    const list: MissionItem[] = [
      {
        id: "morinaga-booth",
        type: "booth-morinaga",
        title: morinagaBooth?.name || "Morinaga Booth",
        subtitle: "Detailing",
        icon: resolveMissionIcon(morinagaBooth?.icon, DEFAULT_BOOTH_ICON),
        disabled: Boolean(morinagaBooth?.is_completed || boothDone),
        isCompleted: Boolean(morinagaBooth?.is_completed || boothDone),
        boothData: morinagaBooth,
      },
      {
        id: "morinaga-sympo",
        type: "symposium",
        title: morinagaSympo?.title || "Morinaga Sympo",
        subtitle: "Ikuti Symposium",
        icon: resolveMissionIcon(morinagaSympo?.icon, DEFAULT_SYMPO_ICON),
        disabled: Boolean(morinagaSympo?.is_completed || postTestDone),
        isCompleted: Boolean(morinagaSympo?.is_completed || postTestDone),
        symposiumData: morinagaSympo,
      },
      {
        id: "early-life",
        type: "booth-early-life",
        title: earlyLifeBooth?.name || "Kalbe Early Life Solutions",
        subtitle: "Detailing",
        icon: resolveMissionIcon(earlyLifeBooth?.icon, DEFAULT_EARLY_LIFE_ICON),
        disabled: Boolean(earlyLifeBooth?.is_completed || earlyLifeDone),
        isCompleted: Boolean(earlyLifeBooth?.is_completed || earlyLifeDone),
        boothData: earlyLifeBooth,
      },
    ];

    const getOrder = (title: string): number => {
      const lower = title.toLowerCase();
      if (lower.includes("booth") || (lower.includes("morinaga") && !lower.includes("sympo"))) return 1;
      if (lower.includes("sympo") || lower.includes("simposium")) return 2;
      if (lower.includes("early") || lower.includes("kalbe")) return 3;
      return 99;
    };

    return list.sort((a, b) => getOrder(a.title) - getOrder(b.title));
  }, [apiSymposiums, boothDone, postTestDone, earlyLifeDone, morinagaBooth, earlyLifeBooth]);

  useEffect(() => {
    if (
      location.state?.showPostTestSuccessModal ||
      location.state?.showBoothSuccessModal ||
      location.state?.showEarlyLifeSuccessModal
    ) {
      // Clear history state to avoid modal popping up again on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleClaimReward = () => {
    navigate("/claim-reward");
  };

  const handleEnterMission = (mission: MissionItem) => {
    if (mission.disabled) return;
    if (mission.id === "morinaga-sympo" || mission.type === "symposium") {
      // Jika simposium belum dimulai, tampilkan modal peringatan waktu mulai
      const sympo = mission.symposiumData;
      if (sympo?.started_at) {
        const now = new Date();
        const start = new Date(sympo.started_at);
        if (!isNaN(start.getTime()) && now < start) {
          setShowSymposiumUpcomingModal(true);
          return;
        }
      } else if (isSymposiumUpcoming()) {
        setShowSymposiumUpcomingModal(true);
        return;
      }
      navigate("/symposium");
      return;
    }
    if (mission.id === "morinaga-booth" || mission.type === "booth-morinaga") {
      setShowBoothMenuModal(true);
      return;
    }
    if (mission.id === "early-life" || mission.type === "booth-early-life") {
      setShowEarlyLifeDrawer(true);
      return;
    }
    alert(`Membuka aktivitas: ${mission.title} (${mission.subtitle})`);
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between bg-cover bg-top select-none overflow-hidden pb-3"
      style={{
        backgroundImage: `url('/assets/tower-background.png')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Top Section with Morinaga Tower & Kalbe Universe Logo (Shifted higher up) */}
      <div className="relative h-[185px] w-full shrink-0">
        <div className="absolute top-[42px] right-[16px] w-[172px]">
          <img
            src="/assets/kalbe-universe-logo.png"
            alt="Kalbe Universe - Your Choice, Their Future."
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Floating Badges Row: Doctor Info & Claim Reward Buttons */}
      <div className="relative px-3 flex items-center justify-between gap-1.5 mb-3.5 z-10">
        {/* Doctor Info Badge */}
        <div
          className="relative flex items-center h-[52px] pr-3 pl-1 shrink-0 transition-all duration-200"
          style={{
            backgroundImage: `url('/assets/docter-bg.png')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            width: hasMysteryBox ? "172px" : "202px",
          }}
        >
          <img
            src={currentUser?.avatar || "/assets/docter-avatar.png"}
            alt={currentUser?.fullName || "Doctor"}
            className="w-[48px] h-[48px] -ml-2 shrink-0 object-contain drop-shadow"
          />
          <div className="ml-1.5 flex flex-col justify-center overflow-hidden">
            <span className="text-[12px] font-bold text-[#1E1E1E] leading-tight">
              Hello,
            </span>
            <span className="text-[10.5px] text-[#444444] truncate leading-tight mt-0.5">
              {currentUser?.fullName || getUserName() || "Dokter"}
            </span>
          </div>
        </div>

        {/* Right Buttons: Klaim Hadiah & Mystery Box */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. Klaim Hadiah Button */}
          <button
            onClick={handleClaimReward}
            className="relative w-[73px] h-[68px] shrink-0 flex flex-col items-center justify-between pb-1.5 cursor-pointer transition-transform active:scale-95 hover:brightness-105 select-none"
            style={{
              backgroundImage: `url('/assets/reward-claim-bg-new.png')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            {unclaimedRewardsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 bg-[#FF1D1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 leading-none">
                {unclaimedRewardsCount}
              </span>
            )}
            <div className="w-full flex-1 flex items-center justify-center translate-y-[10px]">
              <img
                src="/assets/reward-icon-red.png"
                alt="Klaim Hadiah"
                className={`w-[38px] h-[38px] object-contain drop-shadow-sm ${
                  unclaimedRewardsCount > 0 ? "animate-bell-shake" : ""
                }`}
              />
            </div>
            <div className="w-full h-[18px] flex items-center justify-center mt-4">
              <span className="text-[8px] font-bold text-[#FF1D1D] tracking-tight whitespace-nowrap leading-none">
                Klaim Hadiah
              </span>
            </div>
          </button>

          {/* 2. Mystery Box Button (Hanya tampil jika user telah memiliki mystery box) */}
          {hasMysteryBox && (
            <button
              onClick={() => {
                if (!mysteryBoxClaimed) {
                  navigate("/mystery-box");
                }
              }}
              disabled={mysteryBoxClaimed}
              className={`relative w-[73px] h-[68px] shrink-0 flex flex-col items-center justify-between pb-1.5 select-none transition-all ${
                mysteryBoxClaimed
                  ? "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                  : "cursor-pointer transition-transform active:scale-95 hover:brightness-105"
              }`}
              style={{
                backgroundImage: `url('/assets/reward-claim-bg-new.png')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              {hasUnclaimedMysteryBoxState && !mysteryBoxClaimed && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 bg-[#FF1D1D] text-white text-[10.5px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 leading-none">
                  !
                </span>
              )}
              <div className="w-full flex-1 flex items-center justify-center translate-y-[4px]">
                <img
                  src="/assets/mistery-box.png"
                  alt="Mystery Box"
                  className={`w-[58px] h-[58px] object-contain drop-shadow-sm ${
                    !mysteryBoxClaimed ? "animate-bell-shake-delayed" : ""
                  }`}
                />
              </div>
              <div className="w-full h-[18px] flex items-center justify-center -mt-[2.5px]">
                <span
                  className={`text-[8px] font-bold tracking-tight whitespace-nowrap leading-none ${
                    mysteryBoxClaimed ? "text-gray-400" : "text-[#FF1D1D]"
                  }`}
                >
                  Mystery Box
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Main Mission Card ("Misi Utama") */}
      <div className="relative px-3 flex-1 flex flex-col z-10 min-h-0 mb-1">
        <div className="relative w-full h-fit px-4 pt-4 pb-4 drop-shadow-sm flex flex-col justify-between">
          {/* Sliced SVG Futuristic 8-Sided (Octagon) Background with Thicker Accent Corners */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 380 430"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background Fill (#FEF9F7) */}
            <polygon
              points="24,2 356,2 378,24 378,406 356,428 24,428 2,406 2,24"
              fill="#FEF9F7"
            />

            {/* Base Red Outline (#F4233E) - Standard 2px */}
            <polygon
              points="24,2 356,2 378,24 378,406 356,428 24,428 2,406 2,24"
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
              points="378,380 378,406 356,428 330,428"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Bottom-Left Corner Thick Accent (7.5px) */}
            <polyline
              points="50,428 24,428 2,406 2,380"
              stroke="#F4233E"
              strokeWidth="7.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>

          {/* Card Header */}
          <div className="relative z-10 text-center mb-2 shrink-0">
            <h2 className="text-[20px] font-bold text-[#940B0A] tracking-tight leading-tight">
              Misi Utama
            </h2>
            <p className="text-[12px] text-[#5A5A5A] mt-1 font-normal">
              Ikuti aktivitas berikut untuk mendapatkan reward.
            </p>
          </div>

          {/* Mission Items List */}
          <div className="relative z-10 flex-1 flex flex-col gap-7 py-0.5 min-h-0 mt-1">
            {missions.map((mission) => {
              const isClickable = !mission.isCompleted;
              return (
                <div
                  key={mission.id}
                  onClick={() => {
                    if (isClickable) {
                      handleEnterMission(mission);
                    }
                  }}
                  className={`flex items-start gap-2 py-0.5 px-1.5 rounded-xl ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  {/* Left: Hexagonal Futuristic Icon */}
                  <div className="shrink-0 flex items-center justify-center pt-0.5">
                    <img
                      src={mission.icon}
                      alt={mission.title}
                      className="w-[56px] h-[56px] object-contain drop-shadow-sm pointer-events-none"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback =
                          mission.id === "morinaga-booth" || mission.type === "booth-morinaga"
                            ? DEFAULT_BOOTH_ICON
                            : mission.id === "morinaga-sympo" || mission.type === "symposium"
                              ? DEFAULT_SYMPO_ICON
                              : DEFAULT_EARLY_LIFE_ICON;
                        if (target.src !== fallback && !target.src.endsWith(fallback)) {
                          target.src = fallback;
                        }
                      }}
                    />
                  </div>

                  {/* Right: Title on top, Subtitle Pill & MASUK Button aligned horizontally below */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#535252] mb-1 truncate">
                      {mission.title}
                    </div>

                    {/* Detailing pill aligned side-by-side with MASUK / SELESAI button */}
                    <div className="flex items-center gap-1.5">
                      {mission.isCompleted ? (
                        <div
                          className="flex-1 min-w-0 flex items-center rounded-full px-3.5 h-[28px] text-[11px] font-medium text-white shadow-sm"
                          style={{ backgroundColor: "#24B500" }}
                        >
                          <span className="truncate">Selesai</span>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 flex items-center border border-[#F87171] rounded-full px-3.5 h-[28px] text-[11px] text-[#444444] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                          <span className="truncate">{mission.subtitle}</span>
                        </div>
                      )}

                      {/* Button MASUK / SELESAI sejajar dengan Detailing */}
                      {mission.isCompleted ? (
                        <div
                          className="relative w-[76px] h-[28px] shrink-0 flex items-center justify-center select-none"
                          style={{
                            backgroundImage: `url('/assets/check-in-green.png')`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        >
                          <span className="text-white font-bold text-[11px] tracking-wider uppercase drop-shadow-sm">
                            SELESAI
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterMission(mission);
                          }}
                          className="relative w-[76px] h-[28px] shrink-0 flex items-center justify-center transition-all cursor-pointer active:scale-95 hover:brightness-110"
                          style={{
                            backgroundImage: `url('/assets/check-in-red.png')`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        >
                          <span className="text-white font-bold text-[11px] tracking-wider uppercase drop-shadow-sm">
                            MASUK
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. Post-Test Completion Congratulations Modal */}
      <RewardModal
        isOpen={showPostTestModal}
        onClose={handleClosePostTestModal}
        imageSrc="/assets/reward-box.png"
        imageAlt="Morinaga Reward Gift"
        imageClassName="w-[185px] sm:w-[200px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terimakasih telah mengikuti post test Morinaga Symposium."
        description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center">
            Silahkan Ambil Hadiah di Booth Morinaga
          </p>
        }
      />

      {/* 2. Morinaga Booth Detailing Congratulations Modal */}
      <RewardModal
        isOpen={showBoothCompletionModal}
        onClose={handleCloseBoothCompletionModal}
        imageSrc="/assets/reward-box.png"
        imageAlt="Morinaga Reward Gift"
        imageClassName="w-[185px] sm:w-[200px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terimakasih telah mengikuti Detailing Morinaga Booth."
        description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center">
            Silahkan Ambil Hadiah di Booth Morinaga
          </p>
        }
      />

      {/* 2b. Kalbe Early Life Solutions Detailing Congratulations Modal */}
      <RewardModal
        isOpen={showEarlyLifeCompletionModal}
        onClose={handleCloseEarlyLifeCompletionModal}
        containerClassName="max-w-[361px] h-[515px] max-h-[94%] aspect-[361/515] flex flex-col items-center justify-center px-5 pt-5 pb-11"
        imageSrc="/assets/spin-wheel-reward.png"
        imageAlt="Spin Wheel Reward"
        imageClassName="w-[150px] sm:w-[160px] h-auto object-contain drop-shadow-md pointer-events-none"
        imageContainerClassName="w-full flex justify-center shrink-0 mb-4"
        title="Congratulations!"
        titleClassName="text-[28px] font-semibold text-[#C70412] tracking-tight mb-3.5 leading-tight"
        subtitle={
          <>
            Terimakasih telah mengikuti
            <br />
            <span className="whitespace-nowrap">Detailing Kalbe Early Life Solutions.</span>
          </>
        }
        subtitleClassName="text-[14.5px] sm:text-[15.5px] max-w-[325px] mb-3"
        description="Anda telah menyelesaikan aktivitas dan mendapatkan spin wheel sebagai bentuk apresiasi atas partisipasi Anda."
        descriptionClassName="text-[12px] font-normal text-[#4B5563] leading-relaxed max-w-[295px]"
        bodyClassName="mb-6"
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center max-w-[280px] leading-snug">
            Anda dapat memainkan Spin Wheel di booth Kalbe Early Life Solutions!
          </p>
        }
      />

      {/* 2c. Mystery Box Unlocked Congratulations Modal */}
      <RewardModal
        isOpen={showMysteryBoxModal}
        onClose={handleCloseMysteryBoxModal}
        containerClassName="max-w-[361px] h-[500px] max-h-[94%] aspect-[361/500] flex flex-col items-center justify-center px-5 pt-5 pb-8"
        imageSrc="/assets/mistery-box.png"
        imageAlt="Mystery Box Morinaga"
        imageClassName="w-[185px] sm:w-[195px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle={
          <span>
            Anda mendapatkan <br />
            <span className="font-bold">MYSTERY BOX Morinaga</span>
          </span>
        }
        description="Anda telah menyelesaikan seluruh aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        buttonText="Ambil"
        onButtonClick={handleTakeMysteryBox}
        footerNote={
          <p className="text-[12px] font-bold text-[#D41025] text-center leading-snug">
            Silahkan Ambil Hadiah di
            <br />
            Booth Morinaga
          </p>
        }
        cardClassName={shouldAnimateMysteryBox ? "animate-popup-scale-up" : ""}
      />

      {/* 4. Reward Claimed Success Modal */}
      <RewardModal
        isOpen={showRewardSuccessModal}
        onClose={() => setShowRewardSuccessModal(false)}
        imageSrc={
          targetRewardId === "mistery-box"
            ? "/assets/mystery-box-reward.png"
            : targetRewardId === "morinaga-booth" || targetRewardId === "early-life"
              ? "/assets/morinaga-booth-reward.png"
              : "/assets/reward-dummy-symposium.png"
        }
        imageAlt={
          targetRewardId === "mistery-box"
            ? "MYSTERY BOX Morinaga"
            : targetRewardId === "morinaga-booth" || targetRewardId === "early-life"
              ? "DOCTOR’S ACTIVE KIT Morinaga"
              : "Sport Gym Bag Morinaga"
        }
        imageClassName="w-[170px] sm:w-[185px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle={
          targetRewardId === "mistery-box" ? (
            <span>
              Anda mendapatkan <br />
              <span className="font-bold">MYSTERY BOX Morinaga</span>
            </span>
          ) : targetRewardId === "morinaga-booth" || targetRewardId === "early-life" ? (
            <span>Anda mendapatkan DOCTOR’S ACTIVE KIT Morinaga</span>
          ) : (
            <span>
              Anda mendapatkan <br />
              Sport Gym Bag Morinaga
            </span>
          )
        }
        buttonText="OKE"
        onButtonClick={() => setShowRewardSuccessModal(false)}
      />

      {/* 5. Morinaga Booth Activities Menu Modal */}
      <BoothMenuModal
        isOpen={showBoothMenuModal}
        onClose={() => setShowBoothMenuModal(false)}
        boothId={morinagaBooth?.id}
        onStartDetailing={() => {
          setShowBoothMenuModal(false);
          navigate("/booth-scan");
        }}
        onMoritalksPodcast={(_podcast, sessions) => {
          setPodcastSessions(sessions);
          setPodcastTitle(_podcast.name || "Moritalks Podcast");
          setShowBoothMenuModal(false);
          setShowPodcastScheduleModal(true);
        }}
        onSelectActivity={(item) => {
          setSelectedActivityItem(item);
          setShowBoothMenuModal(false);
          setShowAwardPresentationModal(true);
        }}
        onMoritalksAwardPresentation={() => {
          setSelectedActivityItem(null);
          setShowBoothMenuModal(false);
          setShowAwardPresentationModal(true);
        }}
      />

      {/* 6. Morinaga Booth Detailing Bottom Drawer */}
      <BoothDrawer
        isOpen={showBoothDrawer}
        onClose={() => setShowBoothDrawer(false)}
        onPodcastScheduleClick={() => {
          setShowPodcastScheduleModal(true);
        }}
        onContinueClick={() => {
          setShowBoothDrawer(false);
          navigate("/booth-scan");
        }}
      />

      {/* 7. Kalbe Early Life Solutions Detailing Bottom Drawer */}
      <EarlyLifeDrawer
        isOpen={showEarlyLifeDrawer}
        boothData={earlyLifeBooth}
        onClose={() => setShowEarlyLifeDrawer(false)}
        onContinueClick={() => {
          setShowEarlyLifeDrawer(false);
          navigate("/early-life-scan");
        }}
      />

      {/* 8. MoriTalks Morinaga Podcast Schedule Modal */}
      <PodcastScheduleModal
        isOpen={showPodcastScheduleModal}
        podcastTitle={podcastTitle}
        sessions={podcastSessions}
        onClose={() => {
          setShowPodcastScheduleModal(false);
          setShowBoothMenuModal(true);
        }}
      />

      {/* 8b. MoriTalks Award Presentation Modal */}
      <AwardPresentationModal
        isOpen={showAwardPresentationModal}
        activityItem={selectedActivityItem}
        onClose={() => {
          setShowAwardPresentationModal(false);
          setShowBoothMenuModal(true);
        }}
      />

      {/* 0. Welcoming Pop Up PIT IKA 2026 */}
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />

      {/* 9. Morinaga Symposium Started / Ongoing Modal */}
      <SymposiumStartedModal
        isOpen={showSymposiumStartedModal}
        onClose={() => setShowSymposiumStartedModal(false)}
        onTakePostTest={() => {
          setShowSymposiumStartedModal(false);
          navigate("/symposium");
        }}
      />

      {/* 10. Morinaga Symposium Upcoming / Belum Dimulai Modal */}
      <SymposiumUpcomingModal
        isOpen={showSymposiumUpcomingModal}
        onClose={() => setShowSymposiumUpcomingModal(false)}
        startTimeText={
          (() => {
            const sympo =
              apiSymposiums.find(
                (s) =>
                  s.title.toLowerCase().includes("sympo") ||
                  s.title.toLowerCase().includes("morinaga")
              ) || apiSymposiums[0];
            if (sympo?.started_at) {
              const d = new Date(sympo.started_at);
              if (!isNaN(d.getTime())) {
                const hh = String(d.getHours()).padStart(2, "0");
                const mm = String(d.getMinutes()).padStart(2, "0");
                return `Pukul ${hh}.${mm} WIB`;
              }
            }
            return undefined;
          })()
        }
      />
    </div>
  );
};
