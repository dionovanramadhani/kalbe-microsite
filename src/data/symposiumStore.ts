import symposiumData from "./dummySymposium.json";
import { sqliteUpdateUserActivity } from "./sqliteDb";

export interface SymposiumMasterData {
  id: string;
  name: string;
  subtitle: string;
  topic?: string;
  venue?: string;
  startDateTime: string; // ISO 8601 string
  endDateTime: string;   // ISO 8601 string
  formattedDate: string;
  formattedStartTime: string;
  formattedEndTime: string;
  speaker?: string;
  moderator?: string;
  description?: string;
}

export const getSymposiumMasterData = (): SymposiumMasterData => {
  const data = symposiumData as SymposiumMasterData;
  // Jika startDateTime diubah, pastikan waktu yang ditampilkan sinkron otomatis dengan jam di startDateTime
  try {
    const startDate = new Date(data.startDateTime);
    if (!isNaN(startDate.getTime())) {
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      const dynamicStartTime = `${hours}.${minutes} WIB`;
      return {
        ...data,
        formattedStartTime: data.formattedStartTime || dynamicStartTime,
      };
    }
  } catch (e) {
    console.warn("Failed to parse startDateTime:", e);
  }
  return data;
};

export const getFormattedStartTime = (): string => {
  const data = symposiumData as SymposiumMasterData;
  try {
    const startDate = new Date(data.startDateTime);
    if (!isNaN(startDate.getTime())) {
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      return `Pukul ${hours}.${minutes} WIB`;
    }
  } catch (e) {
    console.warn("Failed to format start time:", e);
  }
  return data.formattedStartTime ? `Pukul ${data.formattedStartTime}` : "Pukul 15.00 WIB";
};

export const isSymposiumOngoing = (): boolean => {
  const now = new Date();
  const start = new Date(symposiumData.startDateTime);
  const end = new Date(symposiumData.endDateTime);
  return now >= start && now <= end;
};

/**
 * Memeriksa apakah simposium sudah dimulai atau sedang berjalan (now >= start && now <= end)
 */
export const isSymposiumStartedOrOngoing = (): boolean => {
  const now = new Date();
  const start = new Date(symposiumData.startDateTime);
  const end = new Date(symposiumData.endDateTime);
  return now >= start && now <= end;
};

export const isSymposiumUpcoming = (): boolean => {
  const now = new Date();
  const start = new Date(symposiumData.startDateTime);
  return now < start;
};

export const isSymposiumEnded = (): boolean => {
  const now = new Date();
  const end = new Date(symposiumData.endDateTime);
  return now > end;
};

const STORAGE_KEY_USER_TEST_SYMPO_JOINED = "kalbe_sympo_joined_user_test";
const STORAGE_KEY_SYMPO_PREFIX = "kalbe_sympo_joined_";

const getCurrentUserFromStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("kalbe_auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getSympoStorageKey = (): string => {
  const user = getCurrentUserFromStorage();
  if (user && user.email?.trim().toLowerCase() === "user@test.com") {
    return STORAGE_KEY_USER_TEST_SYMPO_JOINED;
  }
  return `${STORAGE_KEY_SYMPO_PREFIX}${user?.id || "guest"}`;
};

const getInitialJoinedStatus = (): boolean => {
  if (typeof window !== "undefined") {
    try {
      const key = getSympoStorageKey();
      const stored = localStorage.getItem(key);
      if (stored === "true") return true;
    } catch {}
  }
  return false;
};

// Flag apakah user sudah join / check-in ke simposium
let hasJoinedSymposium: boolean = getInitialJoinedStatus();

export const isSymposiumJoined = (): boolean => {
  if (typeof window !== "undefined") {
    try {
      const key = getSympoStorageKey();
      return localStorage.getItem(key) === "true" || hasJoinedSymposium;
    } catch {}
  }
  return hasJoinedSymposium;
};

export const setSymposiumJoined = (joined = true): void => {
  hasJoinedSymposium = joined;
  if (typeof window !== "undefined") {
    try {
      const key = getSympoStorageKey();
      localStorage.setItem(key, String(joined));

      // Sync ke SQLite
      const user = getCurrentUserFromStorage();
      if (user?.id) {
        sqliteUpdateUserActivity(user.id, {
          hasJoinedSymposium: joined,
        }).catch((e) => console.warn("Failed to sync symposium check-in to SQLite:", e));
      }
    } catch {}
  }
};
