import initialRewardsData from "./dummyRewards.json";
import { getCurrentUser } from "./dummyUser";
import {
  sqliteUpdateUserActivity,
  sqliteUpdateUserReward,
} from "./sqliteDb";

export interface RewardItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  icon: string;
  obtained: boolean;
  claimed: boolean;
  rewardName: string;
  rewardImage: string;
}

const STORAGE_KEY_USER_TEST_REWARDS = "kalbe_rewards_user_test";
const STORAGE_KEY_USER_TEST_ACTIVITIES = "kalbe_activities_user_test";
const STORAGE_KEY_REWARDS_PREFIX = "kalbe_rewards_user_";
const STORAGE_KEY_ACTIVITIES_PREFIX = "kalbe_activities_user_";

const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  return user?.id || "user-1";
};

const getUserStorageKey = (type: "rewards" | "activities"): string => {
  const user = getCurrentUser();
  if (user && user.email?.trim().toLowerCase() === "user@test.com") {
    return type === "rewards" ? STORAGE_KEY_USER_TEST_REWARDS : STORAGE_KEY_USER_TEST_ACTIVITIES;
  }
  return type === "rewards" 
    ? `${STORAGE_KEY_REWARDS_PREFIX}${user?.id || "guest"}` 
    : `${STORAGE_KEY_ACTIVITIES_PREFIX}${user?.id || "guest"}`;
};

const loadRewardsForCurrentUser = (): RewardItem[] => {
  if (typeof window !== "undefined") {
    try {
      const key = getUserStorageKey("rewards");
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: RewardItem[] = JSON.parse(stored);
        return parsed
          .map((item) =>
            item.title === "Mistery Box" ? { ...item, title: "Mystery Box" } : item,
          )
          .map((item) =>
            item.id === "early-life" ? { ...item, obtained: false, claimed: false } : item,
          )
          .map((item) => ({
            ...item,
            icon: item.icon ? item.icon.replace(/\.png$/i, ".webp") : item.icon,
            rewardImage: item.rewardImage
              ? item.rewardImage.replace(/\.png$/i, ".webp")
              : item.rewardImage,
          }));
      }
    } catch (e) {
      console.warn("Failed to load rewards from localStorage:", e);
    }
  }
  return JSON.parse(JSON.stringify(initialRewardsData));
};

const loadActivitiesForCurrentUser = () => {
  if (typeof window !== "undefined") {
    try {
      const key = getUserStorageKey("activities");
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load activities from localStorage:", e);
    }
  }
  return {
    postTest: false,
    booth: false,
    earlyLife: false,
  };
};

export const isPostTestCompleted = (): boolean => {
  return loadActivitiesForCurrentUser().postTest;
};

export const setPostTestCompleted = (completed = true): void => {
  const current = loadActivitiesForCurrentUser();
  current.postTest = completed;
  saveActivitiesForCurrentUser(current);
};

export const isBoothDetailingCompleted = (): boolean => {
  return loadActivitiesForCurrentUser().booth;
};

export const setBoothDetailingCompleted = (completed = true): void => {
  const current = loadActivitiesForCurrentUser();
  current.booth = completed;
  saveActivitiesForCurrentUser(current);
};

export const isEarlyLifeDetailingCompleted = (): boolean => {
  return loadActivitiesForCurrentUser().earlyLife;
};

export const setEarlyLifeDetailingCompleted = (completed = true): void => {
  const current = loadActivitiesForCurrentUser();
  current.earlyLife = completed;
  saveActivitiesForCurrentUser(current);
};

const saveActivitiesForCurrentUser = (activities: {
  postTest: boolean;
  booth: boolean;
  earlyLife: boolean;
}) => {
  if (typeof window === "undefined") return;
  const key = getUserStorageKey("activities");
  try {
    localStorage.setItem(key, JSON.stringify(activities));
  } catch (e) {
    console.warn("Failed to save activities:", e);
  }

  const userId = getCurrentUserId();
  if (userId) {
    sqliteUpdateUserActivity(userId, {
      hasCompletedPostTest: activities.postTest,
      hasCompletedBooth: activities.booth,
      hasCompletedEarlyLife: activities.earlyLife,
    }).catch((e) => console.warn("Failed to sync activity to SQLite:", e));
  }
};

const saveRewardsForCurrentUser = (rewards: RewardItem[]) => {
  if (typeof window === "undefined") return;
  const key = getUserStorageKey("rewards");
  try {
    localStorage.setItem(key, JSON.stringify(rewards));
  } catch (e) {
    console.warn("Failed to save rewards:", e);
  }
};

/**
 * Mendapatkan seluruh daftar reward terbaru untuk pengguna aktif.
 */
export const getAllRewards = (): RewardItem[] => {
  return loadRewardsForCurrentUser();
};

/**
 * Mendapatkan daftar reward yang telah didapatkan (obtained).
 */
export const getObtainedRewards = (): RewardItem[] => {
  return loadRewardsForCurrentUser().filter(
    (r) => r.obtained && r.id !== "early-life",
  );
};

/**
 * Mendapatkan reward berdasarkan ID.
 */
export const getRewardById = (id: string): RewardItem | undefined => {
  return loadRewardsForCurrentUser().find((r) => r.id === id);
};

/**
 * Format tanggal sekarang sesuai format: "08 Okt 2026 • 15:15"
 */
const formatRewardTimestamp = (dateObj: Date = new Date()): string => {
  const day = String(dateObj.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} • ${hours}:${minutes}`;
};

/**
 * Menandai reward sebagai diperoleh (misal setelah menyelesaikan post-test atau scan booth).
 * Tanggal reward akan di-update ke waktu user menyelesaikan aktivitas tersebut.
 * Jika semua 3 misi utama selesai, otomatis unlock mystery-box dengan timestamp sekarang juga.
 */
export const unlockReward = (id: string): RewardItem | null => {
  if (id === "early-life") return null;

  const currentRewards = loadRewardsForCurrentUser();
  const item = currentRewards.find((r) => r.id === id);
  if (item) {
    if (!item.obtained) {
      item.obtained = true;
      item.date = formatRewardTimestamp();
    }
  }

  // Cek apakah 3 misi utama telah diperoleh/diselesaikan
  const morinagaSympo = currentRewards.find((r) => r.id === "morinaga-sympo");
  const morinagaBooth = currentRewards.find((r) => r.id === "morinaga-booth");
  const earlyLife = currentRewards.find((r) => r.id === "early-life");

  if (
    morinagaSympo?.obtained &&
    morinagaBooth?.obtained &&
    (earlyLife?.obtained || isEarlyLifeDetailingCompleted())
  ) {
    const misteryBox = currentRewards.find((r) => r.id === "mistery-box");
    if (misteryBox && !misteryBox.obtained) {
      misteryBox.obtained = true;
      misteryBox.date = formatRewardTimestamp();
    }
  }

  saveRewardsForCurrentUser(currentRewards);

  // Sync reward perolehan ke SQLite
  const userId = getCurrentUserId();
  if (userId) {
    if (item && item.obtained) {
      sqliteUpdateUserReward(userId, item.id, {
        obtained: true,
        obtainedDate: item.date,
      }).catch((e) => console.warn("Failed to sync reward to SQLite:", e));
    }
    const misteryBox = currentRewards.find((r) => r.id === "mistery-box");
    if (misteryBox && misteryBox.obtained) {
      sqliteUpdateUserReward(userId, "mistery-box", {
        obtained: true,
        obtainedDate: misteryBox.date,
      }).catch((e) => console.warn("Failed to sync mistery-box to SQLite:", e));
    }
  }

  return item ? { ...item } : null;
};

/**
 * Mengklaim reward (user memasukkan PIN crew dengan benar).
 */
export const claimReward = (id: string): boolean => {
  const currentRewards = loadRewardsForCurrentUser();
  const item = currentRewards.find((r) => r.id === id);
  if (item && item.obtained && !item.claimed) {
    item.claimed = true;
    saveRewardsForCurrentUser(currentRewards);

    const userId = getCurrentUserId();
    if (userId) {
      sqliteUpdateUserReward(userId, id, {
        claimed: true,
      }).catch((e) => console.warn("Failed to sync claimed reward to SQLite:", e));
    }
    return true;
  }
  return false;
};

/**
 * Menghitung jumlah reward yang telah diperoleh tapi belum diclaim.
 */
export const getUnclaimedCount = (): number => {
  return loadRewardsForCurrentUser().filter((r) => r.obtained && !r.claimed).length;
};

/**
 * Menghitung jumlah reward non-mystery-box yang diperoleh tapi belum diclaim (maksimal 2: morinaga-sympo & morinaga-booth).
 */
export const getUnclaimedRewardsCount = (): number => {
  const count = loadRewardsForCurrentUser().filter(
    (r) =>
      r.obtained &&
      !r.claimed &&
      r.id !== "mistery-box" &&
      r.id !== "mystery-box" &&
      r.id !== "early-life",
  ).length;
  return Math.min(2, Math.max(0, count));
};

/**
 * Cek apakah user memiliki Mystery Box yang belum di-claim.
 */
export const hasUnclaimedMysteryBox = (): boolean => {
  if (isMysteryBoxClaimed()) return false;
  if (isAllActivitiesCompleted()) return true;
  const mb = getRewardById("mistery-box");
  return Boolean(mb && mb.obtained && !mb.claimed);
};

/**
 * Cek apakah user telah memiliki/membuka Mystery Box (sudah menyelesaikan 3 aktivitas atau item mystery-box obtained).
 */
export const hasUserMysteryBox = (): boolean => {
  if (isAllActivitiesCompleted()) return true;
  const mb = getRewardById("mistery-box");
  return Boolean(mb && mb.obtained);
};

/**
 * Cek apakah 3 aktivitas utama (Post-test, Booth Detailing, Early Life Detailing) telah selesai.
 */
export const isAllActivitiesCompleted = (): boolean => {
  return (
    isPostTestCompleted() &&
    isBoothDetailingCompleted() &&
    isEarlyLifeDetailingCompleted()
  );
};

/**
 * Cek apakah Mystery Box telah di-claim oleh pengguna.
 */
export const isMysteryBoxClaimed = (): boolean => {
  const mb = getRewardById("mistery-box");
  return Boolean(mb?.claimed);
};

/**
 * Memeriksa dan otomatis membuka mystery box jika semua 3 aktivitas telah selesai.
 */
export const checkAndUnlockMysteryBox = (): boolean => {
  if (isAllActivitiesCompleted()) {
    const currentRewards = loadRewardsForCurrentUser();
    const misteryBox = currentRewards.find((r) => r.id === "mistery-box");
    if (misteryBox && !misteryBox.obtained) {
      misteryBox.obtained = true;
      misteryBox.date = formatRewardTimestamp();
      saveRewardsForCurrentUser(currentRewards);
      const userId = getCurrentUserId();
      if (userId) {
        sqliteUpdateUserReward(userId, "mistery-box", {
          obtained: true,
          obtainedDate: misteryBox.date,
        }).catch((e) => console.warn("Failed to sync mystery box to SQLite:", e));
      }
      return true;
    }
    return Boolean(misteryBox?.obtained);
  }
  return false;
};

