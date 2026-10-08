import initialRewardsData from "./dummyRewards.json";

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

// In-memory state: initialized fresh from JSON every time page loads/refreshes
let inMemoryRewards: RewardItem[] = JSON.parse(
  JSON.stringify(initialRewardsData),
);

// Flag apakah user telah menyelesaikan post-test
let hasCompletedPostTest: boolean = false;
// Flag apakah user telah menyelesaikan detailing booth
let hasCompletedBoothDetailing: boolean = false;
// Flag apakah user telah menyelesaikan detailing Kalbe Early Life Solutions
let hasCompletedEarlyLifeDetailing: boolean = false;

export const isPostTestCompleted = (): boolean => {
  return hasCompletedPostTest;
};

export const setPostTestCompleted = (completed = true): void => {
  hasCompletedPostTest = completed;
};

export const isBoothDetailingCompleted = (): boolean => {
  return hasCompletedBoothDetailing;
};

export const setBoothDetailingCompleted = (completed = true): void => {
  hasCompletedBoothDetailing = completed;
};

export const isEarlyLifeDetailingCompleted = (): boolean => {
  return hasCompletedEarlyLifeDetailing;
};

export const setEarlyLifeDetailingCompleted = (completed = true): void => {
  hasCompletedEarlyLifeDetailing = completed;
};

/**
 * Mendapatkan seluruh daftar reward terbaru.
 */
export const getAllRewards = (): RewardItem[] => {
  return [...inMemoryRewards];
};

/**
 * Mendapatkan daftar reward yang telah didapatkan (obtained).
 */
export const getObtainedRewards = (): RewardItem[] => {
  return inMemoryRewards.filter((r) => r.obtained);
};

/**
 * Mendapatkan reward berdasarkan ID.
 */
export const getRewardById = (id: string): RewardItem | undefined => {
  return inMemoryRewards.find((r) => r.id === id);
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
  const item = inMemoryRewards.find((r) => r.id === id);
  if (item) {
    if (!item.obtained) {
      item.obtained = true;
      item.date = formatRewardTimestamp();
    }
  }

  // Cek apakah 3 misi utama telah diperoleh/diselesaikan
  const morinagaSympo = inMemoryRewards.find((r) => r.id === "morinaga-sympo");
  const morinagaBooth = inMemoryRewards.find((r) => r.id === "morinaga-booth");
  const earlyLife = inMemoryRewards.find((r) => r.id === "early-life");

  if (
    morinagaSympo?.obtained &&
    morinagaBooth?.obtained &&
    earlyLife?.obtained
  ) {
    const misteryBox = inMemoryRewards.find((r) => r.id === "mistery-box");
    if (misteryBox && !misteryBox.obtained) {
      misteryBox.obtained = true;
      misteryBox.date = formatRewardTimestamp();
    }
  }

  return item ? { ...item } : null;
};

/**
 * Mengklaim reward (user memasukkan PIN crew dengan benar).
 */
export const claimReward = (id: string): boolean => {
  const item = inMemoryRewards.find((r) => r.id === id);
  if (item && item.obtained && !item.claimed) {
    item.claimed = true;
    return true;
  }
  return false;
};

/**
 * Menghitung jumlah reward yang telah diperoleh tapi belum diclaim.
 */
export const getUnclaimedCount = (): number => {
  return inMemoryRewards.filter((r) => r.obtained && !r.claimed).length;
};

/**
 * Reset data store ke kondisi awal dummy JSON.
 */
export const resetRewardStore = (): void => {
  inMemoryRewards = JSON.parse(JSON.stringify(initialRewardsData));
  hasCompletedPostTest = false;
  hasCompletedBoothDetailing = false;
  hasCompletedEarlyLifeDetailing = false;
};
