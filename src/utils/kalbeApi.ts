import { getToken, getUserData } from './auth';
import type { KalbeBoothResponse, KalbeSymposiumResponse } from '../admin/adminApi';

const getBaseUrl = (): string => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

let _cachedBooths: KalbeBoothResponse[] | null = null;
let _cachedSymposiums: KalbeSymposiumResponse[] | null = null;

export const getCachedKalbeBooths = (): KalbeBoothResponse[] => _cachedBooths || [];
export const getCachedKalbeSymposiums = (): KalbeSymposiumResponse[] => _cachedSymposiums || [];

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



