import { getToken, getUserData } from './auth';
import type {
  KalbeBoothResponse,
  KalbeSymposiumResponse,
  KalbeBoothPodcastResponse,
  KalbeBoothPodcastSession,
  KalbeBoothActivityResponse,
  KalbeBoothActivityItem,
} from '../admin/adminApi';

export type {
  KalbeBoothResponse,
  KalbeSymposiumResponse,
  KalbeBoothPodcastResponse,
  KalbeBoothPodcastSession,
  KalbeBoothActivityResponse,
  KalbeBoothActivityItem,
};

const getBaseUrl = (): string => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

let _cachedBooths: KalbeBoothResponse[] | null = null;
let _cachedSymposiums: KalbeSymposiumResponse[] | null = null;
let _cachedSymposiumToday: KalbeSymposiumResponse | null = null;

export const getCachedKalbeBooths = (): KalbeBoothResponse[] => _cachedBooths || [];
export const getCachedKalbeSymposiums = (): KalbeSymposiumResponse[] => _cachedSymposiums || [];
export const getCachedKalbeSymposiumToday = (): KalbeSymposiumResponse | null => _cachedSymposiumToday;

/**
 * Fetch all active Kalbe Booths from the backend API
 */
export async function getKalbeBoothsList(): Promise<KalbeBoothResponse[]> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const user = getUserData();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const query = new URLSearchParams();
  query.append('page', '1');
  query.append('limit', '50');
  query.append('is_active', 'true');
  if (user?.id) {
    query.append('user_id', String(user.id));
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/booths?${query.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch booths: status ${res.status}`);
  }

  const json = await res.json();
  const booths = json.data || [];
  _cachedBooths = booths;
  return booths;
}

/**
 * Fetch all active Kalbe Symposiums from the backend API
 */
export async function getKalbeSymposiumsList(): Promise<KalbeSymposiumResponse[]> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const user = getUserData();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const query = new URLSearchParams();
  query.append('page', '1');
  query.append('limit', '50');
  query.append('is_active', 'true');
  if (user?.id) {
    query.append('user_id', String(user.id));
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/symposiums?${query.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch symposiums: status ${res.status}`);
  }

  const json = await res.json();
  const sympos = json.data || [];
  _cachedSymposiums = sympos;
  return sympos;
}

/**
 * Fetch Kalbe Symposium scheduled for today from the backend API.
 * Returns KalbeSymposiumResponse if there is a symposium today, or null if none.
 */
export async function getKalbeSymposiumToday(): Promise<KalbeSymposiumResponse | null> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const user = getUserData();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const query = new URLSearchParams();
  if (user?.id) {
    query.append('user_id', String(user.id));
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${baseUrl}/api/v1/kalbe/symposium/today${queryString}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch today's symposium: status ${res.status}`);
  }

  const json = await res.json();
  const symposiumToday = json.data || null;
  _cachedSymposiumToday = symposiumToday;
  return symposiumToday;
}

// ─── Post-Test Types & API ──────────────────────────────────────────────────

export interface KalbePostTestOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
  order_number: number;
}

export interface KalbePostTestQuestion {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order_number: number;
  options: KalbePostTestOption[];
}

export interface KalbePostTestDetail {
  id: string;
  title: string;
  description: string;
  ref_id: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  questions: KalbePostTestQuestion[];
}

export interface SubmitKalbePostTestPayload {
  post_test_id: string;
  answers: {
    question_id: string;
    option_ids: string[];
    answer_text?: string;
  }[];
}

export interface SubmitKalbePostTestResponse {
  response_id: string;
  post_test_id: string;
  created_at: string;
  mystery_box?: unknown;
}

/**
 * Fetch Post Test details by symposium ref_id
 */
export async function getKalbePostTestByRefID(refId: string): Promise<KalbePostTestDetail | null> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/post-test/ref/${encodeURIComponent(refId)}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch post test: status ${res.status}`);
  }

  const json = await res.json();
  return json.data || null;
}

/**
 * Fetch Post Test details by its post_test_id
 */
export async function getKalbePostTestByID(id: string): Promise<KalbePostTestDetail | null> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/post-test/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch post test by id: status ${res.status}`);
  }

  const json = await res.json();
  return json.data || null;
}

/**
 * Submit post test answers
 */
export async function submitKalbePostTest(payload: SubmitKalbePostTestPayload): Promise<SubmitKalbePostTestResponse> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/post-test/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to submit post test: status ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

// ─── History / Reward Claim Types & API ─────────────────────────────────────

export interface KalbeRewardDetail {
  id: string;
  name: string;
  reward_type: string;
  symposium_id?: string | null;
  stock?: number;
  picture?: string | null;
}

export interface KalbeHistoryItemResponse {
  id: string;
  reward_type: string;
  label?: string | null;
  description?: string | null;
  pin: string;
  is_claimed: boolean;
  is_claimable: boolean;
  claimed_at?: string | null;
  created_at: string;
  symposium?: KalbeSymposiumResponse | null;
  booth?: KalbeBoothResponse | null;
  reward?: KalbeRewardDetail | null;
}

export interface KalbeClaimHistoryPayload {
  pin: string;
  reward_id?: string;
}

export interface KalbeClaimHistoryResponseData {
  history_id: string;
  claimed_at: string;
  reward?: KalbeRewardDetail | null;
}

/**
 * Fetch all history records for the authenticated user (both claimed and unclaimed)
 */
export async function getKalbeUserHistory(
  rewardType?: string,
  page: number = 1,
  limit: number = 100
): Promise<KalbeHistoryItemResponse[]> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const user = getUserData();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const query = new URLSearchParams();
  query.append('page', String(page));
  query.append('limit', String(limit));
  if (rewardType) {
    query.append('reward_type', rewardType);
  }
  // Note: we do NOT pass is_claimed to fetch both claimed and unclaimed records

  const url = user?.id
    ? `${baseUrl}/api/v1/kalbe/history/${encodeURIComponent(String(user.id))}?${query.toString()}`
    : `${baseUrl}/api/v1/kalbe/history?${query.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch history: status ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Claim reward by history ID using PIN
 */
export async function claimKalbeHistoryReward(
  historyId: string,
  pin: string,
  rewardId?: string
): Promise<KalbeClaimHistoryResponseData> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const body: KalbeClaimHistoryPayload = { pin };
  if (rewardId) {
    body.reward_id = rewardId;
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/history/${encodeURIComponent(historyId)}/claim`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to claim reward: status ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Insert authenticated participant into Kalbe booth
 */
export async function insertKalbeBoothParticipant(boothId: string): Promise<unknown> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/participant/booth`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ booth_id: boothId }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to check in booth participant: status ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Insert authenticated participant into Kalbe symposium
 */
export async function insertKalbeSymposiumParticipant(symposiumId: string): Promise<unknown> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/participant/symposium`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ symposium_id: symposiumId }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to check in symposium participant: status ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Get Mystery Box history item for authenticated user
 */
export async function getKalbeMysteryBox(): Promise<KalbeHistoryItemResponse | null> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/mystery-box`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  return json.data || null;
}

/**
 * Claim Mystery Box using PIN
 */
export async function claimKalbeMysteryBox(
  pin: string,
  rewardId?: string
): Promise<KalbeClaimHistoryResponseData> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const body: KalbeClaimHistoryPayload = { pin };
  if (rewardId) {
    body.reward_id = rewardId;
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/mystery-box/claim`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Failed to claim mystery box: status ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

// ─── Booth Podcast & Activity Public API Helpers ───────────────────────────

/**
 * Fetch Booth Podcast details by booth ref_id
 */
export async function getKalbeBoothPodcastByRefID(refId: string): Promise<KalbeBoothPodcastResponse | null> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/booth-podcast/ref/${encodeURIComponent(refId)}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch booth podcast: status ${res.status}`);
  }

  const json = await res.json();
  return json.data || null;
}

/**
 * Fetch Booth Activity details by booth ref_id
 */
export async function getKalbeBoothActivityByRefID(refId: string): Promise<KalbeBoothActivityResponse | null> {
  const baseUrl = getBaseUrl();
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (baseUrl.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const res = await fetch(`${baseUrl}/api/v1/kalbe/booth-activity/ref/${encodeURIComponent(refId)}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch booth activity: status ${res.status}`);
  }

  const json = await res.json();
  return json.data || null;
}

/**
 * Format ISO datetime strings to Indonesian time format "HH.mm – HH.mm WIB"
 */
export function formatTimeRangeWIB(startAt?: string | null, endAt?: string | null): string {
  if (!startAt && !endAt) return '';

  const formatSingle = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .format(d)
        .replace(':', '.');
    } catch {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}.${m}`;
    }
  };

  const start = formatSingle(startAt);
  const end = formatSingle(endAt);

  if (start && end) return `${start} – ${end} WIB`;
  if (start) return `${start} WIB`;
  return '';
}

/**
 * Format start time to WIB string (e.g. "Pukul 14.00 WIB")
 */
export function formatSymposiumStartTime(startAt?: string | null): string {
  if (!startAt) return 'Pukul 10.00 WIB';
  const d = new Date(startAt);
  if (isNaN(d.getTime())) return 'Pukul 10.00 WIB';
  try {
    const formatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(d)
      .replace(':', '.');
    return `Pukul ${formatted} WIB`;
  } catch {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `Pukul ${h}.${m} WIB`;
  }
}

/**
 * Check if symposium has already started based on started_at
 */
export function isSymposiumStarted(sympo?: KalbeSymposiumResponse | null): boolean {
  if (!sympo?.started_at) return false;
  const start = new Date(sympo.started_at);
  if (isNaN(start.getTime())) return false;
  return new Date() >= start;
}

/**
 * Check if symposium has already ended based on ended_at / end_date
 */
export function isSymposiumEnded(sympo?: (KalbeSymposiumResponse & { end_date?: string }) | null): boolean {
  if (!sympo) return false;
  const endIso = sympo.ended_at || sympo.end_date;
  if (endIso) {
    const end = new Date(endIso);
    if (!isNaN(end.getTime())) {
      return new Date() > end;
    }
  }
  return false;
}

/**
 * Check if symposium is currently active and ongoing (started_at <= now <= ended_at)
 */
export function isSymposiumOngoingNow(sympo?: (KalbeSymposiumResponse & { end_date?: string }) | null): boolean {
  if (!sympo?.started_at) return false;
  const now = new Date();
  const start = new Date(sympo.started_at);
  if (isNaN(start.getTime())) return false;
  if (now < start) return false;

  const endIso = sympo.ended_at || sympo.end_date;
  if (endIso) {
    const end = new Date(endIso);
    if (!isNaN(end.getTime()) && now > end) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a session starts or ends today in Asia/Jakarta timezone
 */
export function isSessionToday(startAt?: string | null, endAt?: string | null): boolean {
  const getDayStr = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    try {
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    } catch {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  };

  const todayStr = (() => {
    const now = new Date();
    try {
      return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    } catch {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
  })();

  const startDay = getDayStr(startAt);
  const endDay = getDayStr(endAt);

  return startDay === todayStr || endDay === todayStr;
}
