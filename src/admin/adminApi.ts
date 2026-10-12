// Kalbe Admin API Service Layer
// Aligned with Nestle Tree Journey Admin API architecture

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string> || {}),
  };

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
  is_active: boolean;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface KalbeBoothFormValues {
  name: string;
  detailing_title: string;
  detailing_description: string;
  is_active: boolean;
  iconFile?: File | null;
  imageTitleFile?: File | null;
  detailingBannerFile?: File | null;
  logoFile?: File | null;
  iconUrl?: string;
  imageTitleUrl?: string;
  detailingBannerUrl?: string;
  logoUrl?: string;
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export async function login(data: AdminLoginRequest): Promise<ApiResponse<AuthResponseData>> {
  return apiFetch<ApiResponse<AuthResponseData>>('/api/kalbe/admin/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Participant / Aggregate Stats API ─────────────────────────────────────

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
  ref_id: string; // Booth ID
  created_at: string;
  updated_at: string;
  booth?: KalbeBoothResponse;
  sessions?: KalbeBoothPodcastSession[];
}

export interface KalbeBoothPodcastRequest {
  name: string;
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
}

export interface KalbeSymposiumFormValues {
  title: string;
  description: string;
  started_at: string;
  ended_at: string;
  is_active: boolean;
  iconFile?: File | null;
  logoFile?: File | null;
  iconUrl?: string;
  logoUrl?: string;
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
  if ('iconFile' in data || 'logoFile' in data || 'iconUrl' in data || 'logoUrl' in data) {
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
  if ('iconFile' in data || 'logoFile' in data || 'iconUrl' in data || 'logoUrl' in data) {
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
