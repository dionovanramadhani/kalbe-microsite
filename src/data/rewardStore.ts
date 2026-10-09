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
        return JSON.parse(stored);
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
  return loadRewardsForCurrentUser().filter((r) => r.obtained);
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
 * Jika semua 3 misi utama selesai, otomatis unlock mistery-box dengan timestamp sekarang juga.
 */
export const unlockReward = (id: string): RewardItem | null => {
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
    earlyLife?.obtained
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
