import type { ApiErrorShape, BotInfo, DashboardSession, DiscordServer } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as T | ApiErrorShape)
    : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorShape | null;
    throw new Error(errorPayload?.error || errorPayload?.detail || `Request failed with status ${response.status}.`);
  }

  return payload as T;
}

export const api = {
  getBot: () => request<BotInfo>('/api/bot'),
  getSession: () => request<DashboardSession>('/api/session'),
  getServers: () => request<DiscordServer[]>('/api/servers'),
  logout: () => request<{ success: true }>('/auth/logout', { method: 'POST' }),
};
