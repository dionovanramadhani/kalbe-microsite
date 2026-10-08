import symposiumData from "./dummySymposium.json";

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

// Flag apakah user sudah join / check-in ke simposium
let hasJoinedSymposium: boolean = false;

export const isSymposiumJoined = (): boolean => {
  return hasJoinedSymposium;
};

export const setSymposiumJoined = (joined = true): void => {
  hasJoinedSymposium = joined;
};
