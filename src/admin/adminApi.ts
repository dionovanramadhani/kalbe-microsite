// Kalbe Admin API Service Layer
// Aligned with Nestle Tree Journey Admin API architecture

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// ─── Auth Storage Helpers ───────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('kalbe_admin_token') || localStorage.getItem('admin_token');
}

export function setToken(token: string): void {
  localStorage.setItem('kalbe_admin_token', token);
  localStorage.setItem('admin_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('kalbe_admin_token');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('kalbe_admin_user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function setAdminUser(user: AuthResponseData): void {
  localStorage.setItem('admin_user', JSON.stringify(user));
  localStorage.setItem('kalbe_admin_user', JSON.stringify(user));
}

export function getAdminUser(): AuthResponseData | null {
  try {
    const userStr = localStorage.getItem('kalbe_admin_user') || localStorage.getItem('admin_user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (err) {
    console.error('Failed to parse admin user from localStorage:', err);
  }
  return null;
}

export function isBrandUser(): boolean {
  const user = getAdminUser();
  if (user && user.roles && user.roles.toLowerCase() === 'brand') {
    return true;
  }
  const token = getToken();
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const roleStr = String(payload.roles || payload.role || '').toLowerCase();
        if (roleStr === 'brand') {
          return true;
        }
      }
    } catch {
      // Ignore parse error
    }
  }
  return false;
}

export function isUsherUser(): boolean {
  const user = getAdminUser();
  if (user && user.roles && user.roles.toLowerCase() === 'usher') {
    return true;
  }
  const token = getToken();
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const roleStr = String(payload.roles || payload.role || '').toLowerCase();
        if (roleStr === 'usher') {
          return true;
        }
      }
    } catch {
      // Ignore parse error
    }
  }
  return false;
}

// ─── Fetch Wrapper ──────────────────────────────────────────────────────────

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (BASE_URL.includes('ngrok') || (typeof window !== 'undefined' && window.location.hostname.includes('ngrok'))) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (typeof errorData?.error === 'string' ? errorData.error : errorData?.error?.message) ||
      errorData?.message ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: {
    total?: number;
    current_page?: number;
    last_page?: number;
    next_page?: boolean;
    request_id?: string;
    timestamp?: string;
    version?: string;
  };
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponseData {
  id: string;
  fullname: string;
  email: string;
  phone_number: string;
  roles: string;
  access_token: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipantAggregateResponse {
  total_user_login: number;
  total_booth_visitor: number;
  total_symposium_participant: number;
}

// Booth Types
export interface KalbeBoothResponse {
  id: string;
  name: string;
  icon?: string | null;
  logo?: string | null;
  detailing_title: string;
  image_title?: string | null;
  detailing_description: string;
  detailing_banner?: string | null;
  qr_code?: string | null;
  qr_code_content?: string | null;
  is_active: boolean;
  is_completed?: boolean;
  is_record_history?: boolean;
  created_at: string;
  updated_at: string;
  podcast?: KalbeBoothPodcastResponse;
  activity?: KalbeBoothActivityResponse;
}

export interface KalbeBoothFormValues {
  name: string;
  detailing_title: string;
  detailing_description: string;
  is_active: boolean;
  is_record_history?: boolean;
  iconFile?: File | null;
  imageTitleFile?: File | null;
  detailingBannerFile?: File | null;
  logoFile?: File | null;
  qrCodeFile?: File | null;
  qr_code_content?: string | null;
  iconUrl?: string;
  imageTitleUrl?: string;
  detailingBannerUrl?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export async function login(data: AdminLoginRequest): Promise<ApiResponse<AuthResponseData>> {
  return apiFetch<ApiResponse<AuthResponseData>>('/api/kalbe/admin/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Participant / Aggregate Stats API ─────────────────────────────────────

export interface KalbeParticipantUser {
  id: string;
  fullname: string;
  email: string;
  phone_number: string;
  speciality?: string;
}

export interface KalbeParticipantSymposium {
  id: string;
  title: string;
}

export interface KalbeParticipantBooth {
  id: string;
  name: string;
}

export interface KalbeParticipantItem {
  id: string;
  user_id: string;
  type: 'booths' | 'symposiums' | string;
  symposium_id?: string | null;
  booth_id?: string | null;
  created_at: string;
  updated_at: string;
  user?: KalbeParticipantUser;
  symposium?: KalbeParticipantSymposium | null;
  booth?: KalbeParticipantBooth | null;
}

export interface GetParticipantsParams {
  page?: number;
  limit?: number;
  type?: string;
  symposium_id?: string;
  booth_id?: string;
  search?: string;
}

export async function getKalbeParticipants(
  params?: GetParticipantsParams
): Promise<ApiResponse<KalbeParticipantItem[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.type && params.type !== 'all') query.append('type', params.type);
  if (params?.symposium_id) query.append('symposium_id', params.symposium_id);
  if (params?.booth_id) query.append('booth_id', params.booth_id);
  if (params?.search) query.append('search', params.search);

  const qs = query.toString();
  return apiFetch<ApiResponse<KalbeParticipantItem[]>>(
    `/api/v1/kalbe/participants${qs ? `?${qs}` : ''}`
  );
}

export async function getParticipantCounts(): Promise<ApiResponse<ParticipantAggregateResponse>> {
  return apiFetch<ApiResponse<ParticipantAggregateResponse>>('/api/v1/kalbe/participants/count');
}

// ─── Booths CRUD API ───────────────────────────────────────────────────────

export async function getKalbeBooths(params?: {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}): Promise<ApiResponse<KalbeBoothResponse[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbeBoothResponse[]>>(`/api/v1/kalbe/booths${qs}`);
}

export async function getKalbeBoothByID(id: string): Promise<ApiResponse<KalbeBoothResponse>> {
  return apiFetch<ApiResponse<KalbeBoothResponse>>(`/api/v1/kalbe/booth/${id}`);
}

export async function createKalbeBooth(values: KalbeBoothFormValues): Promise<ApiResponse<KalbeBoothResponse>> {
  const formData = new FormData();
  formData.append('name', values.name.trim());
  formData.append('detailing_title', values.detailing_title.trim());
  formData.append('detailing_description', values.detailing_description.trim());
  formData.append('is_active', values.is_active ? 'true' : 'false');
  if (values.is_record_history !== undefined) {
    formData.append('is_record_history', values.is_record_history ? 'true' : 'false');
  }

  if (values.iconFile) {
    formData.append('icon', values.iconFile);
  } else if (values.iconUrl) {
    formData.append('icon', values.iconUrl);
  }

  if (values.imageTitleFile) {
    formData.append('image_title', values.imageTitleFile);
  } else if (values.imageTitleUrl) {
    formData.append('image_title', values.imageTitleUrl);
  }

  if (values.detailingBannerFile) {
    formData.append('detailing_banner', values.detailingBannerFile);
  } else if (values.detailingBannerUrl) {
    formData.append('detailing_banner', values.detailingBannerUrl);
  }

  if (values.logoFile) {
    formData.append('logo', values.logoFile);
  } else if (values.logoUrl) {
    formData.append('logo', values.logoUrl);
  }

  if (values.qrCodeFile) {
    formData.append('qr_code', values.qrCodeFile);
  } else if (values.qrCodeUrl !== undefined) {
    formData.append('qr_code', values.qrCodeUrl || '');
  }

  if (values.qr_code_content !== undefined && values.qr_code_content !== null) {
    formData.append('qr_code_content', values.qr_code_content);
  }

  return apiFetch<ApiResponse<KalbeBoothResponse>>('/api/v1/kalbe/booth', {
    method: 'POST',
    body: formData,
  });
}

export async function updateKalbeBooth(id: string, values: KalbeBoothFormValues): Promise<ApiResponse<KalbeBoothResponse>> {
  const formData = new FormData();
  formData.append('name', values.name.trim());
  formData.append('detailing_title', values.detailing_title.trim());
  formData.append('detailing_description', values.detailing_description.trim());
  formData.append('is_active', values.is_active ? 'true' : 'false');
  if (values.is_record_history !== undefined) {
    formData.append('is_record_history', values.is_record_history ? 'true' : 'false');
  }

  if (values.iconFile) {
    formData.append('icon', values.iconFile);
  } else if (values.iconUrl) {
    formData.append('icon', values.iconUrl);
  }

  if (values.imageTitleFile) {
    formData.append('image_title', values.imageTitleFile);
  } else if (values.imageTitleUrl) {
    formData.append('image_title', values.imageTitleUrl);
  }

  if (values.detailingBannerFile) {
    formData.append('detailing_banner', values.detailingBannerFile);
  } else if (values.detailingBannerUrl) {
    formData.append('detailing_banner', values.detailingBannerUrl);
  }

  if (values.logoFile) {
    formData.append('logo', values.logoFile);
  } else if (values.logoUrl) {
    formData.append('logo', values.logoUrl);
  }

  if (values.qrCodeFile) {
    formData.append('qr_code', values.qrCodeFile);
  } else if (values.qrCodeUrl !== undefined) {
    formData.append('qr_code', values.qrCodeUrl || '');
  }

  if (values.qr_code_content !== undefined && values.qr_code_content !== null) {
    formData.append('qr_code_content', values.qr_code_content);
  }

  return apiFetch<ApiResponse<KalbeBoothResponse>>(`/api/v1/kalbe/booth/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteKalbeBooth(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch<ApiResponse<{ message: string }>>(`/api/v1/kalbe/booth/${id}`, {
    method: 'DELETE',
  });
}

// ─── Booth Activity Types & API ─────────────────────────────────────────────

export interface KalbeBoothActivityItem {
  id?: string;
  name: string;
  order: number;
  description?: string | null;
  activity_image?: string | null;
  speaker?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  activity_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KalbeBoothActivityResponse {
  id: string;
  name: string;
  ref_id: string; // Booth ID
  created_at: string;
  updated_at: string;
  booth?: KalbeBoothResponse;
  activity_items?: KalbeBoothActivityItem[];
}

export interface KalbeBoothActivityRequest {
  name: string;
  ref_id: string; // Booth ID
  activity_items?: Array<{
    name: string;
    order: number;
    description?: string | null;
    activity_image?: string | null;
    speaker?: string | null;
    start_at?: string | null;
    end_at?: string | null;
  }>;
}

export async function getKalbeBoothActivities(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<KalbeBoothActivityResponse[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbeBoothActivityResponse[]>>(`/api/v1/kalbe/booth-activities${qs}`);
}

export async function getKalbeBoothActivityByID(id: string): Promise<ApiResponse<KalbeBoothActivityResponse>> {
  return apiFetch<ApiResponse<KalbeBoothActivityResponse>>(`/api/v1/kalbe/booth-activity/${id}`);
}

export async function getKalbeBoothActivityByRefID(refId: string): Promise<ApiResponse<KalbeBoothActivityResponse>> {
  return apiFetch<ApiResponse<KalbeBoothActivityResponse>>(`/api/v1/kalbe/booth-activity/ref/${refId}`);
}

export async function createKalbeBoothActivity(data: KalbeBoothActivityRequest): Promise<ApiResponse<KalbeBoothActivityResponse>> {
  return apiFetch<ApiResponse<KalbeBoothActivityResponse>>('/api/v1/kalbe/booth-activity', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKalbeBoothActivity(id: string, data: KalbeBoothActivityRequest): Promise<ApiResponse<KalbeBoothActivityResponse>> {
  return apiFetch<ApiResponse<KalbeBoothActivityResponse>>(`/api/v1/kalbe/booth-activity/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKalbeBoothActivity(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch<ApiResponse<{ message: string }>>(`/api/v1/kalbe/booth-activity/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadKalbeMedia(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<ApiResponse<{ url: string }>>('/api/v1/kalbe/upload', {
    method: 'POST',
    body: formData,
  });
}

// ─── Booth Podcast Types & API ──────────────────────────────────────────────

export interface KalbeBoothPodcastSession {
  id?: string;
  speaker: string;
  podcast_id?: string;
  start_at: string;
  end_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface KalbeBoothPodcastResponse {
  id: string;
  name: string;
  topic?: string;
  ref_id: string; // Booth ID
  created_at: string;
  updated_at: string;
  booth?: KalbeBoothResponse;
  sessions?: KalbeBoothPodcastSession[];
}

export interface KalbeBoothPodcastRequest {
  name: string;
  topic: string;
  ref_id: string; // Booth ID
  sessions?: Array<{
    speaker: string;
    start_at: string;
    end_at: string;
  }>;
}

export async function getKalbeBoothPodcasts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<KalbeBoothPodcastResponse[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbeBoothPodcastResponse[]>>(`/api/v1/kalbe/booth-podcasts${qs}`);
}

export async function getKalbeBoothPodcastByID(id: string): Promise<ApiResponse<KalbeBoothPodcastResponse>> {
  return apiFetch<ApiResponse<KalbeBoothPodcastResponse>>(`/api/v1/kalbe/booth-podcast/${id}`);
}

export async function getKalbeBoothPodcastByRefID(refId: string): Promise<ApiResponse<KalbeBoothPodcastResponse>> {
  return apiFetch<ApiResponse<KalbeBoothPodcastResponse>>(`/api/v1/kalbe/booth-podcast/ref/${refId}`);
}

export async function createKalbeBoothPodcast(data: KalbeBoothPodcastRequest): Promise<ApiResponse<KalbeBoothPodcastResponse>> {
  return apiFetch<ApiResponse<KalbeBoothPodcastResponse>>('/api/v1/kalbe/booth-podcast', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKalbeBoothPodcast(id: string, data: KalbeBoothPodcastRequest): Promise<ApiResponse<KalbeBoothPodcastResponse>> {
  return apiFetch<ApiResponse<KalbeBoothPodcastResponse>>(`/api/v1/kalbe/booth-podcast/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKalbeBoothPodcast(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch<ApiResponse<{ message: string }>>(`/api/v1/kalbe/booth-podcast/${id}`, {
    method: 'DELETE',
  });
}

// ─── Symposium Types & API ──────────────────────────────────────────────────

export interface KalbeSymposiumResponse {
  id: string;
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  is_active: boolean;
  icon?: string | null;
  logo?: string | null;
  qr_code?: string | null;
  qr_code_content?: string | null;
  category?: string | null;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface KalbeSymposiumRequest {
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  is_active?: boolean;
  icon?: string | null;
  logo?: string | null;
  qr_code?: string | null;
  qr_code_content?: string | null;
}

export interface KalbeSymposiumFormValues {
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  is_active: boolean;
  iconFile?: File | null;
  logoFile?: File | null;
  qrCodeFile?: File | null;
  qr_code_content?: string | null;
  iconUrl?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
}

export async function getKalbeSymposiums(params?: {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  user_id?: string;
}): Promise<ApiResponse<KalbeSymposiumResponse[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());
  if (params?.user_id) query.append('user_id', params.user_id);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbeSymposiumResponse[]>>(`/api/v1/kalbe/symposiums${qs}`);
}

export async function getKalbeSymposiumByID(id: string, userId?: string): Promise<ApiResponse<KalbeSymposiumResponse>> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  return apiFetch<ApiResponse<KalbeSymposiumResponse>>(`/api/v1/kalbe/symposium/${id}${qs}`);
}

export async function createKalbeSymposium(data: KalbeSymposiumFormValues | KalbeSymposiumRequest): Promise<ApiResponse<KalbeSymposiumResponse>> {
  if (
    'iconFile' in data ||
    'logoFile' in data ||
    'qrCodeFile' in data ||
    'iconUrl' in data ||
    'logoUrl' in data ||
    'qrCodeUrl' in data
  ) {
    const formData = new FormData();
    formData.append('title', data.title.trim());
    formData.append('description', data.description.trim());
    formData.append('started_at', data.started_at);
    formData.append('ended_at', data.ended_at);
    formData.append('is_active', data.is_active ? 'true' : 'false');

    if (data.iconFile) {
      formData.append('icon', data.iconFile);
    } else if (data.iconUrl) {
      formData.append('icon', data.iconUrl);
    }

    if (data.logoFile) {
      formData.append('logo', data.logoFile);
    } else if (data.logoUrl) {
      formData.append('logo', data.logoUrl);
    }

    if (data.qrCodeFile) {
      formData.append('qr_code', data.qrCodeFile);
    } else if (data.qrCodeUrl !== undefined) {
      formData.append('qr_code', data.qrCodeUrl || '');
    }

    if (data.qr_code_content !== undefined && data.qr_code_content !== null) {
      formData.append('qr_code_content', data.qr_code_content);
    }

    return apiFetch<ApiResponse<KalbeSymposiumResponse>>('/api/v1/kalbe/symposium', {
      method: 'POST',
      body: formData,
    });
  }

  return apiFetch<ApiResponse<KalbeSymposiumResponse>>('/api/v1/kalbe/symposium', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKalbeSymposium(id: string, data: KalbeSymposiumFormValues | KalbeSymposiumRequest): Promise<ApiResponse<KalbeSymposiumResponse>> {
  if (
    'iconFile' in data ||
    'logoFile' in data ||
    'qrCodeFile' in data ||
    'iconUrl' in data ||
    'logoUrl' in data ||
    'qrCodeUrl' in data
  ) {
    const formData = new FormData();
    formData.append('title', data.title.trim());
    formData.append('description', data.description.trim());
    formData.append('started_at', data.started_at);
    formData.append('ended_at', data.ended_at);
    formData.append('is_active', data.is_active ? 'true' : 'false');

    if (data.iconFile) {
      formData.append('icon', data.iconFile);
    } else if (data.iconUrl) {
      formData.append('icon', data.iconUrl);
    }

    if (data.logoFile) {
      formData.append('logo', data.logoFile);
    } else if (data.logoUrl) {
      formData.append('logo', data.logoUrl);
    }

    if (data.qrCodeFile) {
      formData.append('qr_code', data.qrCodeFile);
    } else if (data.qrCodeUrl !== undefined) {
      formData.append('qr_code', data.qrCodeUrl || '');
    }

    if (data.qr_code_content !== undefined && data.qr_code_content !== null) {
      formData.append('qr_code_content', data.qr_code_content);
    }

    return apiFetch<ApiResponse<KalbeSymposiumResponse>>(`/api/v1/kalbe/symposium/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  return apiFetch<ApiResponse<KalbeSymposiumResponse>>(`/api/v1/kalbe/symposium/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKalbeSymposium(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch<ApiResponse<{ message: string }>>(`/api/v1/kalbe/symposium/${id}`, {
    method: 'DELETE',
  });
}

// ─── Post-Test Types & API ──────────────────────────────────────────────────

export interface KalbePostTestQuestionOptionRequest {
  option_text: string;
  is_correct?: boolean;
  order_number?: number;
}

export interface KalbePostTestQuestionOptionResponse {
  id: string;
  option_text: string;
  is_correct?: boolean;
  order_number: number;
}

export interface KalbePostTestQuestionRequest {
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text';
  is_required: boolean;
  order_number: number;
  options?: KalbePostTestQuestionOptionRequest[];
}

export interface KalbePostTestQuestionResponse {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order_number: number;
  options?: KalbePostTestQuestionOptionResponse[];
}

export interface KalbePostTestRequest {
  title: string;
  description?: string;
  ref_id: string; // Symposium ID
  status: boolean;
  questions?: KalbePostTestQuestionRequest[];
}

export interface KalbePostTestResponse {
  id: string;
  title: string;
  description: string;
  ref_id: string; // Symposium ID
  status: boolean;
  created_at: string;
  updated_at: string;
  questions?: KalbePostTestQuestionResponse[];
}

export async function getKalbePostTests(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<KalbePostTestResponse[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbePostTestResponse[]>>(`/api/v1/kalbe/post-tests${qs}`);
}

export async function getKalbePostTestByID(id: string): Promise<ApiResponse<KalbePostTestResponse>> {
  return apiFetch<ApiResponse<KalbePostTestResponse>>(`/api/v1/kalbe/post-test/${id}`);
}

export async function getKalbePostTestByRefID(refId: string): Promise<ApiResponse<KalbePostTestResponse>> {
  return apiFetch<ApiResponse<KalbePostTestResponse>>(`/api/v1/kalbe/post-test/ref/${refId}`);
}

export async function createKalbePostTest(data: KalbePostTestRequest): Promise<ApiResponse<KalbePostTestResponse>> {
  return apiFetch<ApiResponse<KalbePostTestResponse>>('/api/v1/kalbe/post-test', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKalbePostTest(id: string, data: KalbePostTestRequest): Promise<ApiResponse<KalbePostTestResponse>> {
  return apiFetch<ApiResponse<KalbePostTestResponse>>(`/api/v1/kalbe/post-test/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKalbePostTest(id: string): Promise<ApiResponse<KalbePostTestResponse>> {
  return apiFetch<ApiResponse<KalbePostTestResponse>>(`/api/v1/kalbe/post-test/${id}`, {
    method: 'DELETE',
  });
}

export interface KalbePostTestQuestionAnswerItem {
  question_id: string;
  pertanyaan: string;
  question_type?: string;
  answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface KalbePostTestRespondentItem {
  response_id: string;
  user_id: string;
  nama: string;
  email: string;
  handphone: string;
  nik?: string;
  profesi?: string;
  institusi?: string;
  alamat_institusi?: string;
  tanggal_submit: string;
  total_questions: number;
  total_correct: number;
  total_incorrect: number;
  score: number;
  answers: KalbePostTestQuestionAnswerItem[];
}

export interface KalbePostTestRespondentGroup {
  post_test_id: string;
  nama_post_test: string;
  symposium_id?: string;
  nama_symposium: string;
  tanggal_event: string;
  total_respondents: number;
  respondents: KalbePostTestRespondentItem[];
}

export interface KalbePostTestRespondentsMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export async function getKalbePostTestRespondents(params?: {
  page?: number;
  limit?: number;
  post_test_id?: string;
  symposium_id?: string;
  search?: string;
}): Promise<ApiResponse<KalbePostTestRespondentGroup[]> & { meta?: KalbePostTestRespondentsMeta }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.post_test_id) query.append('post_test_id', params.post_test_id);
  if (params?.symposium_id) query.append('symposium_id', params.symposium_id);
  if (params?.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbePostTestRespondentGroup[]> & { meta?: KalbePostTestRespondentsMeta }>(
    `/api/v1/kalbe/post-tests/respondents${qs}`
  );
}


// ─── Reward Types & API ─────────────────────────────────────────────────────

export type KalbeRewardType = 'booth' | 'symposium' | 'mystery_box';

export interface KalbeRewardResponse {
  id: string;
  name: string;
  reward_type: KalbeRewardType | string;
  symposium_id?: string | null;
  booth_id?: string | null;
  stock: number;
  picture?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  symposium?: KalbeSymposiumResponse | null;
  booth?: KalbeBoothResponse | null;
}

export interface KalbeRewardFormValues {
  name: string;
  reward_type: KalbeRewardType | string;
  symposium_id?: string | null;
  booth_id?: string | null;
  stock: number;
  pictureFile?: File | null;
  pictureUrl?: string;
}

export async function getKalbeRewards(params?: {
  page?: number;
  limit?: number;
  reward_type?: string;
  search?: string;
  is_deleted?: boolean;
}): Promise<ApiResponse<KalbeRewardResponse[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.reward_type) query.append('reward_type', params.reward_type);
  if (params?.search) query.append('search', params.search);
  if (params?.is_deleted !== undefined) query.append('is_deleted', params.is_deleted.toString());

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ApiResponse<KalbeRewardResponse[]>>(`/api/v1/kalbe/rewards${qs}`);
}

export async function getKalbeRewardByID(id: string): Promise<ApiResponse<KalbeRewardResponse>> {
  return apiFetch<ApiResponse<KalbeRewardResponse>>(`/api/v1/kalbe/reward/${id}`);
}

export async function createKalbeReward(data: KalbeRewardFormValues): Promise<ApiResponse<KalbeRewardResponse>> {
  const formData = new FormData();
  formData.append('name', data.name.trim());
  formData.append('reward_type', data.reward_type.trim());
  formData.append('stock', data.stock.toString());

  if (data.reward_type === 'symposium' && data.symposium_id) {
    formData.append('symposium_id', data.symposium_id);
  }

  if (data.reward_type === 'booth' && data.booth_id) {
    formData.append('booth_id', data.booth_id);
  }

  if (data.pictureFile) {
    formData.append('picture', data.pictureFile);
  } else if (data.pictureUrl) {
    formData.append('picture', data.pictureUrl);
  }

  return apiFetch<ApiResponse<KalbeRewardResponse>>('/api/v1/kalbe/reward', {
    method: 'POST',
    body: formData,
  });
}

export async function updateKalbeReward(id: string, data: KalbeRewardFormValues): Promise<ApiResponse<KalbeRewardResponse>> {
  const formData = new FormData();
  formData.append('name', data.name.trim());
  formData.append('reward_type', data.reward_type.trim());
  formData.append('stock', data.stock.toString());

  if (data.reward_type === 'symposium') {
    if (data.symposium_id) {
      formData.append('symposium_id', data.symposium_id);
    }
  }

  if (data.reward_type === 'booth') {
    if (data.booth_id) {
      formData.append('booth_id', data.booth_id);
    }
  }

  if (data.pictureFile) {
    formData.append('picture', data.pictureFile);
  } else if (data.pictureUrl) {
    formData.append('picture', data.pictureUrl);
  }

  return apiFetch<ApiResponse<KalbeRewardResponse>>(`/api/v1/kalbe/reward/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

export async function deleteKalbeReward(id: string): Promise<ApiResponse<KalbeRewardResponse>> {
  return apiFetch<ApiResponse<KalbeRewardResponse>>(`/api/v1/kalbe/reward/${id}`, {
    method: 'DELETE',
  });
}

export async function createKalbeMysteryBoxReward(data: {
  name: string;
  stock: number;
  pictureFile?: File | null;
  pictureUrl?: string;
}): Promise<ApiResponse<KalbeRewardResponse>> {
  const formData = new FormData();
  formData.append('name', data.name.trim());
  formData.append('stock', data.stock.toString());

  if (data.pictureFile) {
    formData.append('picture', data.pictureFile);
  } else if (data.pictureUrl) {
    formData.append('picture', data.pictureUrl);
  }

  return apiFetch<ApiResponse<KalbeRewardResponse>>('/api/v1/kalbe/reward/mystery-box', {
    method: 'POST',
    body: formData,
  });
}

// ─── Users List API ─────────────────────────────────────────────────────────

export interface UserItemResponse {
  id: string;
  fullname: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface UsersResponse {
  success: boolean;
  data: UserItemResponse[];
  error?: { code?: string; message?: string } | null;
  meta?: {
    request_id?: string;
    timestamp?: string;
    version?: string;
    total: number;
    currentPage: number;
    lastPage: number;
    nextPage?: number | null;
    prevPage?: number | null;
  };
}

export async function getUsers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<UsersResponse> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.limit) queryParams.set('limit', String(params.limit));

  const queryStr = queryParams.toString();
  const endpoint = `/api/v1/kalbe/users${queryStr ? `?${queryStr}` : ''}`;
  return apiFetch<UsersResponse>(endpoint);
}

export interface RegisterKalbeUserPayload {
  fullname: string;
  practice_place: string;
  practice_place_address: string;
  email: string;
  phone_number: string;
  speciality: string;
  master_doctor_id?: string;
}

export async function registerKalbeUser(data: RegisterKalbeUserPayload): Promise<ApiResponse<Record<string, unknown>>> {
  return apiFetch<ApiResponse<Record<string, unknown>>>('/api/kalbe/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface LoginKalbeUserPayload {
  fullname: string;
  email: string;
  phone_number: string;
}

export async function loginKalbeUser(data: LoginKalbeUserPayload): Promise<ApiResponse<Record<string, unknown>>> {
  return apiFetch<ApiResponse<Record<string, unknown>>>('/api/kalbe/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Symposium Participant Check-In API ─────────────────────────────────────

export interface CheckInParticipantSymposiumPayload {
  symposium_id: string;
  user_id: string;
}

export interface KalbeParticipantCheckInResponse {
  id: string;
  user_id: string;
  symposium_id: string;
  created_at: string;
}

export async function checkInParticipantSymposium(
  data: CheckInParticipantSymposiumPayload
): Promise<ApiResponse<KalbeParticipantCheckInResponse>> {
  return apiFetch<ApiResponse<KalbeParticipantCheckInResponse>>(
    '/api/v1/admin/kalbe/participant/symposium',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// ─── Booth Participant Check-In API ─────────────────────────────────────────

export interface CheckInParticipantBoothPayload {
  booth_id: string;
  user_id: string;
}

export interface KalbeBoothParticipantCheckInResponse {
  id: string;
  user_id: string;
  booth_id: string;
  created_at: string;
}

export async function checkInParticipantBooth(
  data: CheckInParticipantBoothPayload
): Promise<ApiResponse<KalbeBoothParticipantCheckInResponse>> {
  return apiFetch<ApiResponse<KalbeBoothParticipantCheckInResponse>>(
    '/api/v1/admin/kalbe/participant/booth',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// ─── Kalbe History / Reward Claim Admin API ─────────────────────────────────

export interface KalbeAdminHistoryUser {
  id: string;
  fullname: string;
  email: string;
  phone_number: string;
  practice_place?: string;
  speciality?: string;
}

export interface KalbeAdminHistoryItem {
  id: string;
  user_id: string;
  reward_type: string;
  symposium_id?: string;
  booth_id?: string;
  label?: string;
  description?: string;
  pin: string;
  is_claimed: boolean;
  is_claimable: boolean;
  claimed_at?: string;
  created_at: string;
  symposium?: {
    id: string;
    title: string;
    description: string;
  };
  booth?: {
    id: string;
    name: string;
  };
  reward?: KalbeRewardResponse;
  user?: KalbeAdminHistoryUser;
}

export interface GetAdminHistoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  reward_type?: string;
  is_claimed?: boolean;
  symposium_id?: string;
  booth_id?: string;
}

export async function getKalbeAdminHistories(
  params?: GetAdminHistoriesParams
): Promise<ApiResponse<KalbeAdminHistoryItem[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);
  if (params?.reward_type) query.append('reward_type', params.reward_type);
  if (params?.is_claimed !== undefined) query.append('is_claimed', String(params.is_claimed));
  if (params?.symposium_id) query.append('symposium_id', params.symposium_id);
  if (params?.booth_id) query.append('booth_id', params.booth_id);

  const qs = query.toString();
  return apiFetch<ApiResponse<KalbeAdminHistoryItem[]>>(
    `/api/v1/kalbe/histories${qs ? `?${qs}` : ''}`
  );
}


