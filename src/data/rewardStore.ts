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

export const isPostTestCompleted = (): boolean => {
  return hasCompletedPostTest;
};

export const setPostTestCompleted = (completed = true): void => {
  hasCompletedPostTest = completed;
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
 * Menandai reward sebagai diperoleh (misal setelah menyelesaikan post-test).
 */
export const unlockReward = (id: string): RewardItem | null => {
  const item = inMemoryRewards.find((r) => r.id === id);
  if (item) {
    item.obtained = true;
    return { ...item };
  }
  return null;
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
};
