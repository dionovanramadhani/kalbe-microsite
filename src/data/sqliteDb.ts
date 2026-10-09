import initSqlJs, { type Database } from "sql.js";
import initialDummyUsers from "./dummyUsers.json";
import initialRewardsData from "./dummyRewards.json";
import type { User } from "./dummyUser";

const STORAGE_KEY_SQLITE_BINARY = "kalbe_sqlite_db_binary";

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

/**
 * Inisialisasi Database SQLite di browser menggunakan sql.js & IndexedDB / localStorage persistence.
 */
export async function getSqliteDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    });

    // Coba restore binary dari localStorage jika ada
    let savedData: Uint8Array | null = null;
    if (typeof window !== "undefined") {
      try {
        const base64 = localStorage.getItem(STORAGE_KEY_SQLITE_BINARY);
        if (base64) {
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          savedData = bytes;
        }
      } catch (e) {
        console.warn("Failed to load SQLite DB from storage:", e);
      }
    }

    const db = savedData ? new SQL.Database(savedData) : new SQL.Database();

    // Pastikan schema dan tabel ada
    createTablesIfNotExist(db);

    // Seed data default jika tabel users masih kosong
    seedDefaultDataIfEmpty(db);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/**
 * Menyimpan seluruh binary state database SQLite ke LocalStorage.
 * Dengan cara ini, data TIDAK AKAN RESET saat refresh browser!
 */
export function persistSqliteDatabase(): void {
  if (!dbInstance || typeof window === "undefined") return;
  try {
    const binary = dbInstance.export();
    // Konversi Uint8Array ke base64 string
    let binaryString = "";
    const chunk = 8192;
    for (let i = 0; i < binary.length; i += chunk) {
      binaryString += String.fromCharCode(...binary.subarray(i, i + chunk));
    }
    const base64 = btoa(binaryString);
    localStorage.setItem(STORAGE_KEY_SQLITE_BINARY, base64);
  } catch (err) {
    console.error("Failed to persist SQLite database to storage:", err);
  }
}

function createTablesIfNotExist(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      speciality TEXT,
      practice_place TEXT,
      practice_address TEXT,
      avatar TEXT DEFAULT '/assets/docter-avatar.png',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_activity_status (
      user_id TEXT PRIMARY KEY,
      has_joined_symposium INTEGER DEFAULT 0,
      has_completed_post_test INTEGER DEFAULT 0,
      has_completed_booth INTEGER DEFAULT 0,
      has_completed_early_life INTEGER DEFAULT 0,
      completed_post_test_at DATETIME,
      completed_booth_at DATETIME,
      completed_early_life_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
      user_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      obtained INTEGER DEFAULT 0,
      claimed INTEGER DEFAULT 0,
      obtained_date TEXT,
      PRIMARY KEY (user_id, reward_id)
    );
  `);
}

function seedDefaultDataIfEmpty(db: Database) {
  const result = db.exec("SELECT COUNT(*) as count FROM users;");
  const count = result[0]?.values[0]?.[0] || 0;

  if (count === 0) {
    // Seed initial users
    for (const u of initialDummyUsers) {
      db.run(
        `INSERT OR REPLACE INTO users (id, full_name, phone, email, speciality, practice_place, avatar) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [u.id, u.fullName, u.phone, u.email, u.speciality || "", u.practicePlace || "", u.avatar || "/assets/docter-avatar.png"]
      );

      // Seed default activity
      db.run(
        `INSERT OR REPLACE INTO user_activity_status (user_id, has_joined_symposium, has_completed_post_test, has_completed_booth, has_completed_early_life)
         VALUES (?, 0, 0, 0, 0);`,
        [u.id]
      );

      // Seed default rewards
      for (const r of initialRewardsData) {
        db.run(
          `INSERT OR REPLACE INTO user_rewards (user_id, reward_id, obtained, claimed, obtained_date)
           VALUES (?, 0, 0, ?);`,
          [u.id, r.id, r.date]
        );
      }
    }
    persistSqliteDatabase();
  }
}

// -----------------------------------------------------------------------
// Helper Database Operasional untuk Users, Aktivitas & Reward
// -----------------------------------------------------------------------

export async function sqliteInsertUser(user: User): Promise<void> {
  const db = await getSqliteDatabase();
  db.run(
    `INSERT OR REPLACE INTO users (id, full_name, phone, email, speciality, practice_place, practice_address, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      user.id,
      user.fullName,
      user.phone,
      user.email,
      user.speciality || "",
      user.practicePlace || "",
      user.practiceAddress || "",
      user.avatar || "/assets/docter-avatar.png",
    ]
  );

  // Inisialisasi activity record untuk user baru
  db.run(
    `INSERT OR IGNORE INTO user_activity_status (user_id, has_joined_symposium, has_completed_post_test, has_completed_booth, has_completed_early_life)
     VALUES (?, 0, 0, 0, 0);`,
    [user.id]
  );

  // Inisialisasi default reward records untuk user baru
  for (const r of initialRewardsData) {
    db.run(
      `INSERT OR IGNORE INTO user_rewards (user_id, reward_id, obtained, claimed, obtained_date)
       VALUES (?, 0, 0, ?);`,
      [user.id, r.id, r.date]
    );
  }

  persistSqliteDatabase();
}

export async function sqliteGetAllUsers(): Promise<User[]> {
  const db = await getSqliteDatabase();
  const res = db.exec("SELECT id, full_name, phone, email, speciality, practice_place, practice_address, avatar FROM users;");
  if (!res || !res[0]) return [];

  return res[0].values.map((row) => ({
    id: String(row[0]),
    fullName: String(row[1]),
    phone: String(row[2]),
    email: String(row[3]),
    speciality: row[4] ? String(row[4]) : undefined,
    practicePlace: row[5] ? String(row[5]) : undefined,
    practiceAddress: row[6] ? String(row[6]) : undefined,
    avatar: row[7] ? String(row[7]) : undefined,
  }));
}

export async function sqliteUpdateUserActivity(
  userId: string,
  activity: {
    hasJoinedSymposium?: boolean;
    hasCompletedPostTest?: boolean;
    hasCompletedBooth?: boolean;
    hasCompletedEarlyLife?: boolean;
  }
): Promise<void> {
  const db = await getSqliteDatabase();
  const current = await sqliteGetUserActivity(userId);

  const joined = activity.hasJoinedSymposium !== undefined ? (activity.hasJoinedSymposium ? 1 : 0) : current.hasJoinedSymposium ? 1 : 0;
  const postTest = activity.hasCompletedPostTest !== undefined ? (activity.hasCompletedPostTest ? 1 : 0) : current.hasCompletedPostTest ? 1 : 0;
  const booth = activity.hasCompletedBooth !== undefined ? (activity.hasCompletedBooth ? 1 : 0) : current.hasCompletedBooth ? 1 : 0;
  const earlyLife = activity.hasCompletedEarlyLife !== undefined ? (activity.hasCompletedEarlyLife ? 1 : 0) : current.hasCompletedEarlyLife ? 1 : 0;

  db.run(
    `INSERT INTO user_activity_status (user_id, has_joined_symposium, has_completed_post_test, has_completed_booth, has_completed_early_life)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       has_joined_symposium = excluded.has_joined_symposium,
       has_completed_post_test = excluded.has_completed_post_test,
       has_completed_booth = excluded.has_completed_booth,
       has_completed_early_life = excluded.has_completed_early_life;`,
    [userId, joined, postTest, booth, earlyLife]
  );

  persistSqliteDatabase();
}

export async function sqliteGetUserActivity(userId: string): Promise<{
  hasJoinedSymposium: boolean;
  hasCompletedPostTest: boolean;
  hasCompletedBooth: boolean;
  hasCompletedEarlyLife: boolean;
}> {
  const db = await getSqliteDatabase();
  const res = db.exec(
    "SELECT has_joined_symposium, has_completed_post_test, has_completed_booth, has_completed_early_life FROM user_activity_status WHERE user_id = ?;",
    [userId]
  );

  if (!res || !res[0] || !res[0].values[0]) {
    return {
      hasJoinedSymposium: false,
      hasCompletedPostTest: false,
      hasCompletedBooth: false,
      hasCompletedEarlyLife: false,
    };
  }

  const row = res[0].values[0];
  return {
    hasJoinedSymposium: Boolean(row[0]),
    hasCompletedPostTest: Boolean(row[1]),
    hasCompletedBooth: Boolean(row[2]),
    hasCompletedEarlyLife: Boolean(row[3]),
  };
}

export async function sqliteUpdateUserReward(
  userId: string,
  rewardId: string,
  data: { obtained?: boolean; claimed?: boolean; obtainedDate?: string }
): Promise<void> {
  const db = await getSqliteDatabase();
  const res = db.exec("SELECT obtained, claimed, obtained_date FROM user_rewards WHERE user_id = ? AND reward_id = ?;", [userId, rewardId]);

  let currentObtained = 0;
  let currentClaimed = 0;
  let currentDate = "";

  if (res && res[0] && res[0].values[0]) {
    currentObtained = Number(res[0].values[0][0]) || 0;
    currentClaimed = Number(res[0].values[0][1]) || 0;
    currentDate = String(res[0].values[0][2] || "");
  }

  const newObtained = data.obtained !== undefined ? (data.obtained ? 1 : 0) : currentObtained;
  const newClaimed = data.claimed !== undefined ? (data.claimed ? 1 : 0) : currentClaimed;
  const newDate = data.obtainedDate !== undefined ? data.obtainedDate : currentDate;

  db.run(
    `INSERT INTO user_rewards (user_id, reward_id, obtained, claimed, obtained_date)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, reward_id) DO UPDATE SET
       obtained = excluded.obtained,
       claimed = excluded.claimed,
       obtained_date = excluded.obtained_date;`,
    [userId, rewardId, newObtained, newClaimed, newDate]
  );

  persistSqliteDatabase();
}

export async function sqliteGetUserRewards(userId: string): Promise<Record<string, { obtained: boolean; claimed: boolean; date: string }>> {
  const db = await getSqliteDatabase();
  const res = db.exec("SELECT reward_id, obtained, claimed, obtained_date FROM user_rewards WHERE user_id = ?;", [userId]);
  const map: Record<string, { obtained: boolean; claimed: boolean; date: string }> = {};

  if (res && res[0]) {
    for (const row of res[0].values) {
      map[String(row[0])] = {
        obtained: Boolean(row[1]),
        claimed: Boolean(row[2]),
        date: String(row[3] || ""),
      };
    }
  }

  return map;
}
