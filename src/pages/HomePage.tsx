import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { getCurrentUser } from "../data/dummyUser";
import { getUserName } from "../utils/auth";
import { RewardModal } from "../components/RewardModal";
import { BoothDrawer } from "../components/BoothDrawer";
import { BoothMenuModal } from "../components/BoothMenuModal";
import { PodcastScheduleModal } from "../components/PodcastScheduleModal";
import { AwardPresentationModal } from "../components/AwardPresentationModal";
import { PhotoboothModal } from "../components/PhotoboothModal";
import { EarlyLifeDrawer } from "../components/EarlyLifeDrawer";
import { WelcomeModal } from "../components/WelcomeModal";
import { SymposiumPosterModal } from "../components/SymposiumPosterModal";
import { SymposiumUpcomingModal } from "../components/SymposiumUpcomingModal";
import { isSymposiumUpcoming } from "../data/symposiumStore";
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
  getKalbeSymposiumToday,
  getCachedKalbeBooths,
  getCachedKalbeSymposiums,
  getCachedKalbeSymposiumToday,
  getKalbeUserHistory,
  getKalbeBoothPodcastsList,
  formatSymposiumStartTime,
  isSymposiumEnded,
  isSymposiumOngoingNow,
  type KalbeHistoryItemResponse,
  type KalbeBoothPodcastResponse,
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
  isEnded?: boolean;
  boothData?: KalbeBoothResponse;
  symposiumData?: KalbeSymposiumResponse;
}

const DEFAULT_BOOTH_ICON = "/assets/morinaga-booth-icon.webp";
const DEFAULT_SYMPO_ICON = "/assets/morinaga-sympo-icon.webp";
const DEFAULT_EARLY_LIFE_ICON = "/assets/kalbe-60th-icon.webp";

const resolveMissionIcon = (
  rawIcon: string | null | undefined,
  fallbackAsset: string,
): string => {
  if (!rawIcon || typeof rawIcon !== "string") {
    return fallbackAsset;
  }
  const trimmed = rawIcon.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "-") {
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

const normalizePosterUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "-") {
    return null;
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

const getInitialMorinagaPoster = (): string | null => {
  const cachedToday = getCachedKalbeSymposiumToday();
  if (cachedToday?.poster && cachedToday.poster.trim() !== "") {
    return cachedToday.poster;
  }
  const cachedList = getCachedKalbeSymposiums();
  if (cachedList && cachedList.length > 0) {
    const sym =
      cachedList.find(
        (s) =>
          s.title.toLowerCase().includes("morinaga") ||
          s.title.toLowerCase().includes("sympo"),
      ) || cachedList[0];
    if (sym?.poster && sym.poster.trim() !== "") {
      return sym.poster;
    }
  }
  return null;
};

// Urutan misi sesuai instruksi:
// 1. Morinaga Booth
// 2. Morinaga Sympo
// 3. Kalbe Early Life Solution
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasPostTestSuccess = Boolean(location.state?.showPostTestSuccessModal);
  const hasBoothSuccess = Boolean(location.state?.showBoothSuccessModal);
  const hasEarlyLifeSuccess = Boolean(location.state?.showEarlyLifeSuccessModal);

  const currentUser = getCurrentUser();
  const [postTestDone, setPostTestDone] = useState<boolean>(() => {
    if (hasPostTestSuccess) return true;
    const cachedToday = getCachedKalbeSymposiumToday();
    if (cachedToday && typeof cachedToday.is_completed === "boolean") {
      return cachedToday.is_completed;
    }
    const cachedSympos = getCachedKalbeSymposiums();
    if (cachedSympos && cachedSympos.length > 0) {
      const sym =
        cachedSympos.find(
          (s) =>
            s.title.toLowerCase().includes("sympo") ||
            s.title.toLowerCase().includes("morinaga"),
        ) || cachedSympos[0];
      if (sym && typeof sym.is_completed === "boolean") {
        return sym.is_completed;
      }
    }
    return isPostTestCompleted();
  });
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

  const [apiBooths, setApiBooths] = useState<KalbeBoothResponse[]>(() =>
    getCachedKalbeBooths(),
  );
  const [apiSymposiums, setApiSymposiums] = useState<KalbeSymposiumResponse[]>(() =>
    getCachedKalbeSymposiums(),
  );
  const [todaySymposium, setTodaySymposium] = useState<KalbeSymposiumResponse | null>(
    () => getCachedKalbeSymposiumToday(),
  );
  const todaySymposiumRef = useRef<KalbeSymposiumResponse | null>(
    getCachedKalbeSymposiumToday(),
  );
  const morinagaSympoRef = useRef<KalbeSymposiumResponse | null>(null);
  const hasDismissedSymposiumModalRef = useRef<boolean>(false);
  const [selectedSymposiumForUpcoming, setSelectedSymposiumForUpcoming] =
    useState<KalbeSymposiumResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const morinagaSympo = useMemo(() => {
    return (
      todaySymposium ||
      apiSymposiums.find(
        (s) =>
          s.title.toLowerCase().includes("sympo") ||
          s.title.toLowerCase().includes("morinaga"),
      ) ||
      apiSymposiums[0]
    );
  }, [todaySymposium, apiSymposiums]);

  const isWelcomePending = sessionStorage.getItem("kalbe_welcome_pending") === "true";
  const isPosterPending = sessionStorage.getItem("kalbe_poster_pending") === "true";

  const [showPosterModal, setShowPosterModal] = useState<boolean>(() => {
    // Sama persis seperti WelcomeModal: hanya tampil jika kalbe_poster_pending bernilai true
    if (!isPosterPending) return false;
    // Jika welcome modal sedang pending, tunggu sampai welcome modal selesai/ditutup
    if (isWelcomePending) return false;
    if (hasPostTestSuccess || hasBoothSuccess || hasEarlyLifeSuccess) return false;
    return true;
  });

  // Handle direct access via symposium link or QR code parameter (hanya jika ada param external scan di URL)
  useEffect(() => {
    const sympoIdFromUrl =
      searchParams.get("symposium_id") || searchParams.get("sympo_id");
    const isSympoSource =
      searchParams.get("source") === "symposium" ||
      searchParams.get("type") === "symposium" ||
      searchParams.get("from") === "symposium" ||
      searchParams.get("symposium") === "true";

    if (sympoIdFromUrl || isSympoSource) {
      sessionStorage.setItem("kalbe_scanned_from_external_qr", "true");
      if (sympoIdFromUrl) {
        sessionStorage.setItem("kalbe_external_sympo_id", sympoIdFromUrl);
      }
    }
  }, [searchParams]);

  // Re-sync state whenever user navigates to HomePage or switches user session
  useEffect(() => {
    let isMounted = true;

    // Bersihkan legacy storage bypass lama jika ada di browser user
    try {
      if (currentUser?.id) {
        localStorage.removeItem(`kalbe_sympo_scanned_${currentUser.id}`);
        localStorage.removeItem(`kalbe_symposium_joined_${currentUser.id}`);
      }
      localStorage.removeItem("kalbe_symposium_joined");
      localStorage.removeItem("kalbe_scanned_symposium_id");
      sessionStorage.removeItem("kalbe_scanned_from_device");
      sessionStorage.removeItem("kalbe_sympo_scanned");
    } catch {
      // ignore
    }

    // Initial local read for instant render
    setPostTestDone(isPostTestCompleted() || hasPostTestSuccess);
    setBoothDone(isBoothDetailingCompleted() || hasBoothSuccess);
    setEarlyLifeDone(isEarlyLifeDetailingCompleted() || hasEarlyLifeSuccess);
    setUnclaimedRewardsCount(getUnclaimedRewardsCount());
    setHasUnclaimedMysteryBoxState(checkHasUnclaimedMysteryBox());
    setHasMysteryBox(hasUserMysteryBox());
    setMysteryBoxClaimed(isMysteryBoxClaimed());
    setIsLoadingData(true);

    // Fetch live state from backend APIs
    Promise.all([
      getKalbeBoothsList().catch(() => [] as KalbeBoothResponse[]),
      getKalbeSymposiumsList().catch(() => [] as KalbeSymposiumResponse[]),
      getKalbeUserHistory().catch(() => [] as KalbeHistoryItemResponse[]),
      getKalbeSymposiumToday().catch(() => null as KalbeSymposiumResponse | null),
    ])
      .then(async ([booths, sympos, historyList, sympoToday]) => {
        if (!isMounted) return;
        if (booths && booths.length > 0) setApiBooths(booths);
        if (sympos && sympos.length > 0) setApiSymposiums(sympos);
        setTodaySymposium(sympoToday);
        todaySymposiumRef.current = sympoToday;

        // Track completed activities from API:
        const morinagaBooth = booths.find(
          (b) =>
            b.name.toLowerCase().includes("morinaga") ||
            (b.name.toLowerCase().includes("booth") &&
              !b.name.toLowerCase().includes("early")),
        );
        const earlyLifeBooth = booths.find(
          (b) =>
            b.name.toLowerCase().includes("early") ||
            b.name.toLowerCase().includes("life"),
        );
        const currentMorinagaSympo =
          sympoToday ||
          sympos.find(
            (s) =>
              s.title.toLowerCase().includes("morinaga") ||
              s.title.toLowerCase().includes("sympo"),
          ) ||
          sympos[0];
        morinagaSympoRef.current = currentMorinagaSympo;

        const hasMorinagaHistory = historyList.some(
          (h) =>
            h.reward_type === "booth" &&
            (h.booth?.name?.toLowerCase().includes("morinaga") ||
              h.label?.toLowerCase().includes("morinaga") ||
              (!h.label?.toLowerCase().includes("early") &&
                !h.booth?.name?.toLowerCase().includes("early"))),
        );
        const hasEarlyLifeHistory = historyList.some(
          (h) =>
            h.reward_type === "booth" &&
            (h.booth?.name?.toLowerCase().includes("early") ||
              h.label?.toLowerCase().includes("early")),
        );

        // Status selesai simposium ditentukan oleh is_completed dari backend API (atau post-test baru saja diisi)
        // Check-in participant saja BUKAN berarti post-test sudah selesai.
        const isSympoApiCompleted =
          typeof currentMorinagaSympo?.is_completed === "boolean"
            ? currentMorinagaSympo.is_completed
            : typeof sympoToday?.is_completed === "boolean"
              ? sympoToday.is_completed
              : null;

        const isPostTestFinished = Boolean(
          hasPostTestSuccess ||
          (isSympoApiCompleted !== null ? isSympoApiCompleted : isPostTestCompleted()),
        );
        const isMorinagaFinished = Boolean(
          morinagaBooth?.is_completed ||
          hasMorinagaHistory ||
          isBoothDetailingCompleted() ||
          hasBoothSuccess,
        );
        const isEarlyLifeFinished = Boolean(
          earlyLifeBooth?.is_completed ||
          hasEarlyLifeHistory ||
          isEarlyLifeDetailingCompleted() ||
          hasEarlyLifeSuccess,
        );

        setPostTestDone(isPostTestFinished);
        setBoothDone(isMorinagaFinished);
        setEarlyLifeDone(isEarlyLifeFinished);

        setPostTestCompleted(isPostTestFinished);
        setBoothDetailingCompleted(isMorinagaFinished);
        setEarlyLifeDetailingCompleted(isEarlyLifeFinished);

        // Alur urutan modal di HomePage:
        // 1. WelcomeModal (jika isWelcomePending)
        // 2. Poster Modal: LANGSUNG tampilkan tanpa delay saat data poster tersedia!
        // 3. SymposiumStartedModal (jika tidak ada poster / setelah poster ditutup dan symposium sedang berlangsung)
        const hasPoster = Boolean(
          currentMorinagaSympo?.poster && currentMorinagaSympo.poster.trim() !== "",
        );

        if (
          !isWelcomePending &&
          !hasPostTestSuccess &&
          !hasBoothSuccess &&
          !hasEarlyLifeSuccess
        ) {
          const isPosterPendingNow =
            sessionStorage.getItem("kalbe_poster_pending") === "true";
          if (isPosterPendingNow && hasPoster) {
            setShowPosterModal(true);
          }
        }

        // Track Mystery Box from API:
        const mysteryBoxHistory = historyList.find(
          (h) => h.reward_type === "mystery_box" || h.reward_type?.includes("mystery"),
        );
        const allActivitiesDone =
          isPostTestFinished && isMorinagaFinished && isEarlyLifeFinished;
        const userHasMysteryBox = Boolean(mysteryBoxHistory || allActivitiesDone);
        const isMbClaimed = Boolean(mysteryBoxHistory?.is_claimed);

        const isMbClaimable = mysteryBoxHistory
          ? mysteryBoxHistory.is_claimable !== false
          : true;
        setHasMysteryBox(userHasMysteryBox);
        setMysteryBoxClaimed(isMbClaimed);
        setHasUnclaimedMysteryBoxState(
          userHasMysteryBox && !isMbClaimed && isMbClaimable,
        );

        // Unclaimed non-mystery rewards count:
        const unclaimedCount = historyList.filter(
          (h) =>
            !h.is_claimed &&
            h.is_claimable !== false &&
            h.reward_type !== "mystery_box" &&
            !h.reward_type?.includes("mystery"),
        ).length;
        setUnclaimedRewardsCount(unclaimedCount);

        // Delay 2 detik khusus untuk transisi skeleton card/misi di background
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!isMounted) return;
        setIsLoadingData(false);
      })
      .catch(async (err) => {
        console.warn("Failed to fetch user state in HomePage:", err);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (isMounted) {
          setIsLoadingData(false);
        }
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
    currentUser?.id,
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

  const handleCloseWelcomeModal = () => {
    sessionStorage.removeItem("kalbe_welcome_pending");
    sessionStorage.setItem("kalbe_welcome_shown", "true");
    setShowWelcomeModal(false);

    if (isAllActivitiesCompleted()) {
      checkAndUnlockMysteryBox();
    }

    // Urutan 2: Poster Modal (sama persis dengan alur welcome pop up, aktif saat kalbe_poster_pending true)
    if (sessionStorage.getItem("kalbe_poster_pending") === "true") {
      setShowPosterModal(true);
      return;
    }

    // Urutan 3: symposium started modal (jika tidak ada poster, dan ada symposium di hari itu yang SEDANG BERLANGSUNG)
    const currentTodaySympo = todaySymposiumRef.current;
    const isDone =
      isPostTestCompleted() ||
      hasPostTestSuccess ||
      Boolean(currentTodaySympo?.is_completed);
    if (
      !hasPostTestSuccess &&
      !hasBoothSuccess &&
      !hasEarlyLifeSuccess &&
      !isDone &&
      !hasDismissedSymposiumModalRef.current &&
      currentTodaySympo &&
      isSymposiumOngoingNow(currentTodaySympo)
    ) {
      // setShowSymposiumStartedModal(true);
    }
  };

  const handleClosePosterModal = () => {
    sessionStorage.removeItem("kalbe_poster_pending");
    sessionStorage.setItem("kalbe_poster_shown", "true");
    setShowPosterModal(false);

    // Urutan 3: symposium started modal (setelah poster modal ditutup, jika symposium sedang berlangsung)
    const currentTodaySympo = todaySymposiumRef.current;
    const isDone =
      isPostTestCompleted() ||
      hasPostTestSuccess ||
      Boolean(currentTodaySympo?.is_completed);
    if (
      !hasPostTestSuccess &&
      !hasBoothSuccess &&
      !hasEarlyLifeSuccess &&
      !isDone &&
      !hasDismissedSymposiumModalRef.current &&
      currentTodaySympo &&
      isSymposiumOngoingNow(currentTodaySympo)
    ) {
      // setShowSymposiumStartedModal(true);
    }
  };

  const handleClosePostTestModal = () => {
    setShowPostTestModal(false);
    if (
      isAllActivitiesCompleted() &&
      !isMysteryBoxClaimed() &&
      !isMysteryBoxPopupShown()
    ) {
      checkAndUnlockMysteryBox();
      setHasMysteryBox(true);
      setHasUnclaimedMysteryBoxState(true);
      markMysteryBoxPopupShown();
      setShowMysteryBoxModal(true);
    }
  };

  const handleCloseBoothCompletionModal = () => {
    setShowBoothCompletionModal(false);
    if (
      isAllActivitiesCompleted() &&
      !isMysteryBoxClaimed() &&
      !isMysteryBoxPopupShown()
    ) {
      checkAndUnlockMysteryBox();
      setHasMysteryBox(true);
      setHasUnclaimedMysteryBoxState(true);
      markMysteryBoxPopupShown();
      setShowMysteryBoxModal(true);
    }
  };

  const handleCloseEarlyLifeCompletionModal = () => {
    setShowEarlyLifeCompletionModal(false);
    if (
      isAllActivitiesCompleted() &&
      !isMysteryBoxClaimed() &&
      !isMysteryBoxPopupShown()
    ) {
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
    const currentTodaySympo = todaySymposiumRef.current;
    const isDone =
      isPostTestCompleted() ||
      hasPostTestSuccess ||
      Boolean(currentTodaySympo?.is_completed);
    if (
      !hasPostTestSuccess &&
      !hasBoothSuccess &&
      !hasEarlyLifeSuccess &&
      !isDone &&
      !hasDismissedSymposiumModalRef.current &&
      currentTodaySympo &&
      isSymposiumOngoingNow(currentTodaySympo)
    ) {
      // setShowSymposiumStartedModal(true);
    }
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
  const [showPhotoboothModal, setShowPhotoboothModal] = useState(false);
  const [allBoothPodcasts, setAllBoothPodcasts] = useState<KalbeBoothPodcastResponse[]>([]);
  const [podcastSessions, setPodcastSessions] = useState<KalbeBoothPodcastSession[]>([]);
  const [podcastTitle, setPodcastTitle] = useState<string>("MoriTalks Podcast");
  const [podcastTopic, setPodcastTopic] = useState<string>("Alergi & Gastro");
  const [podcastImage, setPodcastImage] = useState<string | null>(null);
  const [selectedActivityItem, setSelectedActivityItem] =
    useState<KalbeBoothActivityItem | null>(null);
  const [selectedActivityItems, setSelectedActivityItems] = useState<
    KalbeBoothActivityItem[]
  >([]);

  const morinagaBooth = useMemo(() => {
    return apiBooths.find(
      (b) =>
        b.name.toLowerCase().includes("morinaga") ||
        (b.name.toLowerCase().includes("booth") &&
          !b.name.toLowerCase().includes("early")),
    );
  }, [apiBooths]);

  const earlyLifeBooth = useMemo(() => {
    return apiBooths.find(
      (b) =>
        b.name.toLowerCase().includes("early") ||
        b.name.toLowerCase().includes("kalbe") ||
        b.name.toLowerCase().includes("life"),
    );
  }, [apiBooths]);

  // Urutan misi sesuai instruksi:
  // 1. Morinaga Booth
  // 2. Morinaga Sympo
  // 3. Kalbe Early Life Solution
  const missions: MissionItem[] = useMemo(() => {
    const morinagaSympo =
      todaySymposium ||
      apiSymposiums.find(
        (s) =>
          s.title.toLowerCase().includes("sympo") ||
          s.title.toLowerCase().includes("morinaga"),
      ) ||
      apiSymposiums[0];

    const isSympoEnded = isSymposiumEnded(morinagaSympo);

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
        subtitle:
          isSympoEnded && !morinagaSympo?.is_completed && !postTestDone
            ? "Sudah Selesai"
            : "Ikuti Symposium",
        icon: resolveMissionIcon(morinagaSympo?.icon, DEFAULT_SYMPO_ICON),
        disabled: Boolean(morinagaSympo?.is_completed || postTestDone || isSympoEnded),
        isCompleted: Boolean(morinagaSympo?.is_completed || postTestDone),
        isEnded: isSympoEnded,
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
      if (
        lower.includes("booth") ||
        (lower.includes("morinaga") && !lower.includes("sympo"))
      )
        return 1;
      if (lower.includes("sympo") || lower.includes("simposium")) return 2;
      if (lower.includes("early") || lower.includes("kalbe")) return 3;
      return 99;
    };

    return list.sort((a, b) => getOrder(a.title) - getOrder(b.title));
  }, [
    todaySymposium,
    apiSymposiums,
    boothDone,
    postTestDone,
    earlyLifeDone,
    morinagaBooth,
    earlyLifeBooth,
  ]);

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
      // Jika simposium belum dimulai / belum di jadwalnya, tampilkan modal peringatan waktu mulai
      const sympo =
        todaySymposium ||
        mission.symposiumData ||
        apiSymposiums.find(
          (s) =>
            s.title.toLowerCase().includes("sympo") ||
            s.title.toLowerCase().includes("morinaga"),
        ) ||
        apiSymposiums[0];

      if (isSymposiumEnded(sympo)) {
        return;
      }

      if (sympo?.started_at) {
        const now = new Date();
        const start = new Date(sympo.started_at);
        if (!isNaN(start.getTime()) && now < start) {
          setSelectedSymposiumForUpcoming(sympo);
          setShowSymposiumUpcomingModal(true);
          return;
        }
      } else if (isSymposiumUpcoming()) {
        setSelectedSymposiumForUpcoming(sympo || null);
        setShowSymposiumUpcomingModal(true);
        return;
      }

      // Bypass scan ke post-test HANYA jika user melakukan scan QR di luar microsite (external QR scan)
      const hasScannedExternal =
        sessionStorage.getItem("kalbe_scanned_from_external_qr") === "true";

      if (hasScannedExternal) {
        const targetSympoId =
          sessionStorage.getItem("kalbe_external_sympo_id") || sympo?.id;
        navigate(
          `/post-test${targetSympoId ? `?symposium_id=${encodeURIComponent(targetSympoId)}` : ""}`,
        );
        return;
      }

      // Flow normal jika user tidak scan di luar microsite: klik symposium -> scan -> post test
      navigate("/symposium", { state: { todaySymposium: sympo } });
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
        backgroundImage: `url('/assets/tower-background.webp')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Top Section with Morinaga Tower & Kalbe Universe Logo (Shifted higher up) */}
      <div className="relative h-[185px] w-full shrink-0">
        <div className="absolute top-[42px] right-[16px] w-[172px]">
          <img
            src="/assets/kalbe-universe-logo.webp"
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
            backgroundImage: `url('/assets/docter-bg.webp')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            width: hasMysteryBox ? "172px" : "202px",
          }}
        >
          <img
            src="/assets/doctor-avatar-svg.svg"
            alt={currentUser?.fullName || "Doctor"}
            onError={(e) => {
              e.currentTarget.src = "/assets/doctor-avatar-svg.svg";
            }}
            className="w-[58px] h-[58px] -ml-2 shrink-0 object-contain drop-shadow"
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
          {isLoadingData ? (
            <>
              {/* Skeleton Klaim Hadiah Button */}
              <div className="relative w-[73px] h-[68px] shrink-0 rounded-2xl bg-white/80 border border-red-100 flex flex-col items-center justify-center gap-1.5 p-1.5 shadow-sm animate-pulse">
                <div className="w-[32px] h-[32px] rounded-full bg-red-100/80" />
                <div className="w-[46px] h-[8px] rounded bg-red-100/70" />
              </div>
              {/* Skeleton Mystery Box Button */}
              <div className="relative w-[73px] h-[68px] shrink-0 rounded-2xl bg-white/80 border border-red-100 flex flex-col items-center justify-center gap-1.5 p-1.5 shadow-sm animate-pulse">
                <div className="w-[32px] h-[32px] rounded-full bg-red-100/80" />
                <div className="w-[46px] h-[8px] rounded bg-red-100/70" />
              </div>
            </>
          ) : (
            <>
              {/* 1. Klaim Hadiah Button */}
              <button
                onClick={handleClaimReward}
                className="relative w-[73px] h-[68px] shrink-0 flex flex-col items-center justify-between pb-1.5 cursor-pointer transition-transform active:scale-95 hover:brightness-105 select-none"
                style={{
                  backgroundImage: `url('/assets/reward-claim-bg-new.webp')`,
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
                    src="/assets/reward-icon-red.webp"
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
                    backgroundImage: `url('/assets/reward-claim-bg-new.webp')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {hasUnclaimedMysteryBoxState && !mysteryBoxClaimed && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 bg-[#FF1D1D] text-white text-[10.5px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 leading-none">
                      !
                    </span>
                  )}
                  <div className="w-full flex-1 flex items-center justify-center translate-y-[6px]">
                    <img
                      src="/assets/mystery-box.webp"
                      alt="Mystery Box"
                      className={`w-[42px] h-[42px] object-contain drop-shadow-sm ${
                        !mysteryBoxClaimed ? "animate-bell-shake-delayed" : ""
                      }`}
                    />
                  </div>
                  <div className="w-full h-[18px] flex items-center justify-center mt-3">
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
            </>
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
            {isLoadingData ? (
              <>
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 py-0.5 px-1.5 rounded-xl animate-pulse"
                  >
                    {/* Left: Hexagonal Futuristic Icon Placeholder */}
                    <div className="shrink-0 flex items-center justify-center pt-0.5">
                      <div className="w-[56px] h-[56px] rounded-2xl bg-gray-200/90 shadow-sm" />
                    </div>

                    {/* Right: Title on top, Subtitle Pill & MASUK Button aligned horizontally below */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="h-4 bg-gray-200/90 rounded-md w-36 mb-1.5" />
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-[28px] rounded-full bg-gray-200/80" />
                        <div className="w-[76px] h-[28px] rounded-full bg-gray-200/90 shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              missions.map((mission) => {
                const isClickable = !mission.isCompleted && !mission.disabled;
                return (
                  <div
                    key={mission.id}
                    onClick={() => {
                      if (isClickable) {
                        handleEnterMission(mission);
                      }
                    }}
                    className={`flex items-start gap-2 py-0.5 px-1.5 rounded-xl transition-all ${
                      isClickable
                        ? "cursor-pointer"
                        : mission.disabled && !mission.isCompleted
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-default"
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
                            mission.id === "morinaga-booth" ||
                            mission.type === "booth-morinaga"
                              ? DEFAULT_BOOTH_ICON
                              : mission.id === "morinaga-sympo" ||
                                  mission.type === "symposium"
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
                          <div
                            className={`flex-1 min-w-0 flex items-center rounded-full px-3.5 h-[28px] text-[11px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                              mission.disabled
                                ? "border border-gray-300 bg-gray-100 text-[#888888]"
                                : "border border-[#F87171] bg-white text-[#444444]"
                            }`}
                          >
                            <span className="truncate">{mission.subtitle}</span>
                          </div>
                        )}

                        {/* Button MASUK / SELESAI sejajar dengan Detailing */}
                        {mission.isCompleted ? (
                          <div
                            className="relative w-[76px] h-[28px] shrink-0 flex items-center justify-center select-none"
                            style={{
                              backgroundImage: `url('/assets/check-in-green.webp')`,
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
                            disabled={mission.disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!mission.disabled) {
                                handleEnterMission(mission);
                              }
                            }}
                            className={`relative w-[76px] h-[28px] shrink-0 flex items-center justify-center transition-all ${
                              mission.disabled
                                ? "cursor-not-allowed opacity-50 grayscale pointer-events-none"
                                : "cursor-pointer active:scale-95 hover:brightness-110"
                            }`}
                            style={{
                              backgroundImage: `url('/assets/check-in-red.webp')`,
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
              })
            )}
          </div>
        </div>
      </div>

      {/* 1. Post-Test Completion Congratulations Modal */}
      <RewardModal
        isOpen={showPostTestModal}
        onClose={handleClosePostTestModal}
        imageSrc="/assets/morinagasympo-gimmick.png"
        imageAlt="Morinaga Symposium Reward"
        imageClassName="w-[185px] sm:w-[200px] max-h-[170px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terima kasih telah menyelesaikan post-test Simposium Morinaga. hadiah eksklusif telah menanti!"
        // description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center">
            Silahkan redeem Hadiah di Booth Morinaga.
          </p>
        }
      />

      {/* 2. Morinaga Booth Detailing Congratulations Modal */}
      <RewardModal
        isOpen={showBoothCompletionModal}
        onClose={handleCloseBoothCompletionModal}
        imageSrc="/assets/morinagabooth-gimmick.png"
        imageAlt="Morinaga Booth Reward"
        imageClassName="w-[185px] sm:w-[200px] max-h-[170px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle="Terima kasih telah mengikuti aktivitas pada booth Morinaga, hadiah eksklusif telah menanti!"
        // description="Anda telah menyelesaikan aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center">
            Silakan reedem Hadiah di Booth Morinaga.
          </p>
        }
      />

      {/* 2b. Kalbe Early Life Solutions Detailing Congratulations Modal */}
      <RewardModal
        isOpen={showEarlyLifeCompletionModal}
        onClose={handleCloseEarlyLifeCompletionModal}
        containerClassName="max-w-[361px] h-[515px] max-h-[94%] aspect-[361/515] flex flex-col items-center justify-center px-5 pt-5 pb-11"
        imageSrc="/assets/spin-wheel-reward.webp"
        imageAlt="Spin Wheel Reward"
        imageClassName="w-[150px] sm:w-[160px] h-auto object-contain drop-shadow-md pointer-events-none"
        imageContainerClassName="w-full flex justify-center shrink-0 mb-4"
        title="Congratulations!"
        titleClassName="text-[28px] font-semibold text-[#C70412] tracking-tight mb-3.5 leading-tight"
        subtitle={
          <>
            {/* Terimakasih telah mengikuti
            <br />
            <span className="whitespace-nowrap">
              Detailing Kalbe Early Life Solutions.
            </span> */}
            Terima kasih telah mengikuti aktivitas pada booth Kalbe Early Life Solution,
            hadiah eksklusif telah menanti!
          </>
        }
        subtitleClassName="text-[14.5px] sm:text-[15.5px] max-w-[325px] mb-3"
        // description="Anda telah menyelesaikan aktivitas dan mendapatkan spin wheel sebagai bentuk apresiasi atas partisipasi Anda."
        descriptionClassName="text-[12px] font-normal text-[#4B5563] leading-relaxed max-w-[295px]"
        bodyClassName="mb-6"
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center max-w-[280px] leading-snug">
            Silahkan redeem Hadiah di Booth Kalbe Early Life Solution.
          </p>
        }
      />

      {/* 2c. Mystery Box Unlocked Congratulations Modal */}
      <RewardModal
        isOpen={showMysteryBoxModal}
        onClose={handleCloseMysteryBoxModal}
        containerClassName="max-w-[361px] h-[480px] max-h-[96%] aspect-[361/520] flex flex-col items-center justify-center px-5 pt-5 pb-9"
        imageSrc="/assets/mystery-box.webp"
        imageAlt="Mystery Box Morinaga"
        imageClassName="w-[185px] sm:w-[195px] h-auto object-contain drop-shadow-md pointer-events-none"
        title="Congratulations!"
        subtitle={
          <span>
            Terima kasih telah mengikuti seluruh rangkaian aktivitas Morinaga. Selamat
            anda mendapatkan Exclusive Mystery Box!
          </span>
        }
        // description="Anda telah menyelesaikan seluruh aktivitas dan mendapatkan reward sebagai bentuk apresiasi atas partisipasi Anda."
        footerContent={
          <p className="text-[12px] font-bold text-[#D41025] text-center leading-snug">
            Silahkan redeem Hadiah di
            <br />
            Booth Morinaga.
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
            ? "/assets/mystery-box-reward.webp"
            : targetRewardId === "morinaga-booth" || targetRewardId === "early-life"
              ? "/assets/morinaga-booth-reward.webp"
              : "/assets/reward-dummy-symposium.webp"
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
        boothData={morinagaBooth}
        onStartDetailing={() => {
          setShowBoothMenuModal(false);
          navigate("/booth-scan");
        }}
        onMoritalksPodcast={(_podcast, sessions, allPodcasts) => {
          if (allPodcasts && allPodcasts.length > 0) {
            setAllBoothPodcasts(allPodcasts);
          } else if (_podcast) {
            setAllBoothPodcasts([_podcast]);
          }
          setPodcastSessions(sessions);
          setPodcastTitle(
            (_podcast.name || "MoriTalks Podcast").replace(/Moritalks/g, "MoriTalks"),
          );
          setPodcastTopic(_podcast.topic || "");
          setPodcastImage(_podcast.image || null);
          setShowBoothMenuModal(false);
          setShowPodcastScheduleModal(true);
        }}
        onSelectActivity={(item, allItems) => {
          setSelectedActivityItem(item);
          setSelectedActivityItems(allItems || (item ? [item] : []));
          setShowBoothMenuModal(false);
          if (item.name.toLowerCase().includes("photobooth")) {
            setShowPhotoboothModal(true);
          } else {
            setShowAwardPresentationModal(true);
          }
        }}
        onMoritalksAwardPresentation={(allItems) => {
          setSelectedActivityItem(allItems && allItems.length > 0 ? allItems[0] : null);
          setSelectedActivityItems(allItems || []);
          setShowBoothMenuModal(false);
          setShowAwardPresentationModal(true);
        }}
        onPhotoboothHighAngel={() => {
          setSelectedActivityItem(null);
          setSelectedActivityItems([]);
          setShowBoothMenuModal(false);
          setShowPhotoboothModal(true);
        }}
      />

      {/* 6. Morinaga Booth Detailing Bottom Drawer */}
      <BoothDrawer
        isOpen={showBoothDrawer}
        boothData={morinagaBooth}
        onClose={() => setShowBoothDrawer(false)}
        onPodcastScheduleClick={async () => {
          if (morinagaBooth?.id) {
            try {
              const pods = await getKalbeBoothPodcastsList(morinagaBooth.id);
              if (pods && pods.length > 0) {
                setAllBoothPodcasts(pods);
                const pod = pods[0];
                setPodcastTitle(
                  (pod.name || "MoriTalks Podcast").replace(/Moritalks/g, "MoriTalks"),
                );
                setPodcastTopic(pod.topic || "");
                setPodcastImage(pod.image || null);
                setPodcastSessions(pod.sessions || []);
              } else if (morinagaBooth.podcast) {
                setAllBoothPodcasts([morinagaBooth.podcast]);
                setPodcastTitle(
                  (morinagaBooth.podcast.name || "MoriTalks Podcast").replace(
                    /Moritalks/g,
                    "MoriTalks",
                  ),
                );
                setPodcastTopic(morinagaBooth.podcast.topic || "");
                setPodcastImage(morinagaBooth.podcast.image || null);
                setPodcastSessions(morinagaBooth.podcast.sessions || []);
              }
            } catch {
              if (morinagaBooth.podcast) {
                setAllBoothPodcasts([morinagaBooth.podcast]);
              }
            }
          }
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
        podcasts={allBoothPodcasts}
        podcastTitle={podcastTitle}
        topic={podcastTopic}
        image={podcastImage}
        sessions={podcastSessions}
        onClose={() => {
          setShowPodcastScheduleModal(false);
          setShowBoothMenuModal(true);
        }}
      />

      {/* 8b. MoriTalks Award Modal */}
      <AwardPresentationModal
        isOpen={showAwardPresentationModal}
        activityItem={selectedActivityItem}
        activityItems={selectedActivityItems}
        onClose={() => {
          setShowAwardPresentationModal(false);
          setShowBoothMenuModal(true);
        }}
      />

      {/* 8c. Photobooth High Angel Modal */}
      <PhotoboothModal
        isOpen={showPhotoboothModal}
        activityItem={selectedActivityItem}
        onClose={() => {
          setShowPhotoboothModal(false);
          setShowBoothMenuModal(true);
        }}
      />

      {/* 0. Welcoming Pop Up PIT IKA 2026 */}
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />

      {/* 1. Morinaga Symposium Poster Modal */}
      <SymposiumPosterModal
        isOpen={showPosterModal}
        onClose={handleClosePosterModal}
        posterUrl={normalizePosterUrl(
          morinagaSympo?.poster || getInitialMorinagaPoster(),
        )}
      />

      {/* 10. Morinaga Symposium Upcoming / Belum Dimulai Modal */}
      <SymposiumUpcomingModal
        isOpen={showSymposiumUpcomingModal}
        onClose={() => {
          setShowSymposiumUpcomingModal(false);
          setSelectedSymposiumForUpcoming(null);
        }}
        startTimeText={formatSymposiumStartTime(
          selectedSymposiumForUpcoming?.started_at ||
            todaySymposium?.started_at ||
            apiSymposiums.find(
              (s) =>
                s.title.toLowerCase().includes("sympo") ||
                s.title.toLowerCase().includes("morinaga"),
            )?.started_at ||
            apiSymposiums[0]?.started_at,
        )}
      />
    </div>
  );
};
