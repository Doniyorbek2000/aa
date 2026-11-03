import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from './api';

// Keychain (iOS) / Keystore (Android), never AsyncStorage: the token signs the user in
const TOKEN_KEY = 'a12.session';

export type Profile = { id: string; role: 'user' | 'admin'; phone: string | null; email: string | null; name: string | null };
export type LiveAllowance = { dailySeconds: number; secondsLeft: number };

/** Calls the A12 API as the mobile app, signed in when a token is given. */
export function apiFetch(path: string, token: string | null, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('X-A12-Client', 'app');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

async function postJson(path: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await apiFetch(path, null, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

export async function requestOtp(phone: string): Promise<{ ok: boolean; error?: string; devCode?: string }> {
  const { ok, data } = await postJson('/api/auth/otp/request', { phone });
  const sent = ok || typeof data.retryAfterMs === 'number';
  return {
    ok: sent,
    ...(typeof data.error === 'string' && !sent ? { error: data.error } : {}),
    ...(typeof data.devCode === 'string' ? { devCode: data.devCode } : {}),
  };
}

export async function verifyOtp(phone: string, code: string): Promise<{ token: string } | { reason: string }> {
  const { ok, data } = await postJson('/api/auth/otp/verify', { phone, code });
  return ok && typeof data.token === 'string' ? { token: data.token } : { reason: typeof data.reason === 'string' ? data.reason : 'error' };
}

type AccountValue = {
  token: string | null;
  profile: Profile | null;
  live: LiveAllowance | null;
  isReady: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateName: (name: string) => Promise<boolean>;
  deleteAccount: () => Promise<'ok' | 'store-owner' | 'error'>;
};

const AccountContext = createContext<AccountValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [live, setLive] = useState<LiveAllowance | null>(null);
  const [isReady, setIsReady] = useState(false);

  const forget = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null);
    setProfile(null);
    setLive(null);
  }, []);

  const load = useCallback(
    async (current: string | null) => {
      if (!current) return;
      try {
        const res = await apiFetch('/api/auth/me', current);
        if (res.status === 401) return void (await forget());
        if (!res.ok) return;
        const data = (await res.json()) as { user: Profile; live: LiveAllowance };
        setProfile(data.user);
        setLive(data.live);
      } catch {
        // Offline: keep the saved session and try again next time
      }
    },
    [forget]
  );

  useEffect(() => {
    void (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      setToken(saved);
      await load(saved);
      setIsReady(true);
    })();
  }, [load]);

  const value = useMemo<AccountValue>(
    () => ({
      token,
      profile,
      live,
      isReady,
      signIn: async (next) => {
        await SecureStore.setItemAsync(TOKEN_KEY, next);
        setToken(next);
        await load(next);
      },
      signOut: async () => {
        if (token) await apiFetch('/api/auth/logout', token, { method: 'POST' }).catch(() => {});
        await forget();
      },
      refresh: () => load(token),
      updateName: async (name) => {
        const res = await apiFetch('/api/auth/me', token, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }).catch(() => null);
        if (res?.ok) await load(token);
        return !!res?.ok;
      },
      deleteAccount: async () => {
        const res = await apiFetch('/api/auth/me', token, { method: 'DELETE' }).catch(() => null);
        if (res?.status === 409) return 'store-owner';
        if (!res?.ok) return 'error';
        await forget();
        return 'ok';
      },
    }),
    [token, profile, live, isReady, load, forget]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider');
  return value;
}
