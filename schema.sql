-- =======================================================================
-- Kalbe Universe Microsite - SQLite Database Schema & Seed Data
-- Database Engine: SQLite 3
-- =======================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------
-- 1. Table: users
-- Menyimpan profil pengguna / dokter yang terdaftar atau login.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    speciality TEXT,                     -- PPDS, GP, DSA, Other
    practice_place TEXT,
    practice_address TEXT,
    avatar TEXT DEFAULT '/assets/docter-avatar.png',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------
-- 2. Table: symposium_master
-- Master data event simposium ilmiah.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS symposium_master (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    topic TEXT,
    venue TEXT,
    start_date_time TEXT NOT NULL,       -- Format ISO-8601 e.g. 2026-10-08T15:00:00+07:00
    end_date_time TEXT NOT NULL,         -- Format ISO-8601 e.g. 2026-10-08T20:00:00+07:00
    formatted_date TEXT,
    formatted_start_time TEXT,
    formatted_end_time TEXT,
    speaker TEXT,
    moderator TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------
-- 3. Table: post_test_questions
-- Daftar pertanyaan post-test ilmiah untuk verifikasi pemahaman simposium.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_test_questions (
    id INTEGER PRIMARY KEY,
    question TEXT NOT NULL,
    options_json TEXT NOT NULL,          -- JSON Array string, contoh: ["Opt A", "Opt B", "Opt C", "Opt D"]
    correct_answer INTEGER NOT NULL      -- 0-indexed index opsi benar
);

-- -----------------------------------------------------------------------
-- 4. Table: user_activity_status
-- Status keikutsertaan / check-in / penyelesaian aktivitas per user.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    has_joined_symposium INTEGER DEFAULT 0,          -- 1 jika sudah scan checkin symposium
    has_completed_post_test INTEGER DEFAULT 0,       -- 1 jika submit post test
    has_completed_booth INTEGER DEFAULT 0,           -- 1 jika scan detailing Morinaga Booth
    has_completed_early_life INTEGER DEFAULT 0,      -- 1 jika scan detailing Early Life Solutions
    completed_post_test_at DATETIME,
    completed_booth_at DATETIME,
    completed_early_life_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- -----------------------------------------------------------------------
-- 5. Table: rewards
-- Master item hadiah yang tersedia di microsite.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    icon TEXT NOT NULL,
    reward_name TEXT NOT NULL,
    reward_image TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------
-- 6. Table: user_rewards
-- Pencatatan reward yang diperoleh (unlocked) dan diklaim (claimed) oleh user.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    reward_id TEXT NOT NULL,
    obtained INTEGER DEFAULT 0,                      -- 1 jika unlocked
    claimed INTEGER DEFAULT 0,                       -- 1 jika sudah diverifikasi PIN crew
    obtained_date TEXT,                              -- Format string tanggal perolehan: "08 Okt 2026 • 15:13"
    claimed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    UNIQUE(user_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);

-- -----------------------------------------------------------------------
-- 7. Table: post_test_submissions
-- Jawaban post-test yang dikirimkan oleh pengguna.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_test_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    answers_json TEXT NOT NULL,                      -- JSON Object, misal: {"1": 1, "2": 2, "3": 1}
    score INTEGER DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =======================================================================
-- INITIAL SEED DATA
-- =======================================================================

-- 1. Users Seed
INSERT OR REPLACE INTO users (id, full_name, phone, email, speciality, practice_place, avatar) VALUES
('user-1', 'User Test', '00000000', 'user@test.com', 'DSA', 'RSIA Bunda Jakarta', '/assets/docter-avatar.png'),
('user-2', 'dr. Sarah Amanda, Sp.A', '081298765432', 'sarah@kalbe.co.id', 'PPDS', 'RS Cipto Mangunkusumo', '/assets/docter-avatar.png'),
('user-3', 'dr. Budi Pratama', '081122334455', 'budi@kalbe.co.id', 'GP', 'Klinik Medika Sehat', '/assets/docter-avatar.png');

-- 2. Master Symposium Seed
INSERT OR REPLACE INTO symposium_master (
    id, name, subtitle, topic, venue, start_date_time, end_date_time, 
    formatted_date, formatted_start_time, formatted_end_time, speaker, moderator, description
) VALUES (
    'morinaga-sympo-master',
    'Morinaga Symposium 2026',
    'Ikuti Symposium',
    'Optimal Nutrition and Microbiota for Early Childhood Development',
    'Hall A - Jakarta Convention Center',
    '2026-10-08T15:00:00+07:00',
    '2026-10-08T20:00:00+07:00',
    '8 Oktober 2026',
    '15.00 WIB',
    '20.00 WIB',
    'Prof. Dr. dr. Budi Setiawan, Sp.A(K)',
    'dr. Amanda Sarah, Sp.A',
    'Simposium ilmiah bersama pakar kesehatan anak membahas perkembangan nutrisi esensial dan mikrobioma untuk generasi masa depan.'
);

-- 3. Rewards Master Seed
INSERT OR REPLACE INTO rewards (id, title, subtitle, icon, reward_name, reward_image) VALUES
('morinaga-sympo', 'Morinaga Sympo', 'Mengikuti symposium', '/assets/morinaga-sympo-icon.png', 'Sport Gym Bag Morinaga', '/assets/reward-dummy-symposium.png'),
('morinaga-booth', 'Morinaga Booth', 'Mengikuti Morinaga Booth', '/assets/morinaga-booth-icon.png', 'DOCTOR’S ACTIVE KIT Morinaga', '/assets/morinaga-booth-reward.png'),
('early-life', 'Kalbe Early Life Solutions', 'Mengikuti Kalbe Early Life Solutions', '/assets/kalbe-60th-icon.png', 'DOCTOR’S ACTIVE KIT Morinaga', '/assets/morinaga-booth-reward.png'),
('mistery-box', 'Mistery Box', 'Mengikuti Semua Misi', '/assets/mistery-box.png', 'MYSTERY BOX Morinaga', '/assets/mystery-box-reward.png');

-- 4. Post-Test Questions Seed
INSERT OR REPLACE INTO post_test_questions (id, question, options_json, correct_answer) VALUES
(1, 'Yang dimaksud dengan bifidogenic factor adalah...', '["Bakteri hidup yang bila dikonsumsi dalam jumlah cukup memberi manfaat kesehatan bagi inang", "Substansi yang secara selektif merangsang pertumbuhan dan/atau aktivitas Bifidobacterium di saluran cerna", "Enzim pencernaan yang membantu hidrolisis laktosa di usus halus", "Antibodi dalam ASI yang menetralkan bakteri pathogen"]', 1),
(2, 'Komponen dalam ASI yang berperan sebagai bifidogenic factor alami utama dan merupakan komponen padat terbanyak adalah…', '["Kasein", "Laktoferin", "Human Milk Oligosaccharides (HMO)", "Imunoglobulin A sekretori (sIgA)"]', 2),
(3, 'Pada bayi yang mendapat ASI, mikrobiota usus cenderung didominasi oleh…', '["Clostridium", "Bifidobacterium", "Escherichia", "Bacteroides"]', 1),
(4, 'Protein dalam ASI yang mampu mengikat zat besi dan diketahui memiliki efek bifidogenik adalah...', '["Kasein", "Lisozim", "Laktoferin", "Alfa-laktalbumin"]', 2),
(5, 'Berikut ini yang BUKAN termasuk bifidogenic factor adalah...', '["Laktoferin", "HMO (Human Milk Oligosaccharides)", "Fruktooligosakarida (FOS)", "Glukosa murni"]', 3);

-- 5. Seed Activity & Rewards Status untuk user@test.com
INSERT OR REPLACE INTO user_activity_status (user_id, has_joined_symposium, has_completed_post_test, has_completed_booth, has_completed_early_life)
VALUES ('user-1', 0, 0, 0, 0);

INSERT OR REPLACE INTO user_rewards (user_id, reward_id, obtained, claimed, obtained_date) VALUES
('user-1', 'morinaga-sympo', 0, 0, '12 Okt 2026 • 10:30'),
('user-1', 'morinaga-booth', 0, 0, '12 Okt 2026 • 10:30'),
('user-1', 'early-life', 0, 0, '12 Okt 2026 • 10:30'),
('user-1', 'mistery-box', 0, 0, '12 Okt 2026 • 10:30');
