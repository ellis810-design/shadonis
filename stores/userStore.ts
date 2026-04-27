import { create } from "zustand";
import { UserProfile } from "../types";
import type { NatalPosition } from "../services/astrology";

/**
 * Focus-group build: no auth, no Supabase. Everything lives in this in-memory
 * (and optionally localStorage-backed) store. Replace with the real session
 * model once we re-enable accounts.
 */

interface UserState {
  user: UserProfile | null;
  name: string | null;
  natalPositions: NatalPosition[] | null;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;

  // Legacy no-ops kept so existing callers compile during the focus-group build.
  session: null;
  setSession: (_: any) => void;
  setLoading: (loading: boolean) => void;

  setName: (name: string) => void;
  setUser: (user: UserProfile | null) => void;
  setNatalPositions: (positions: NatalPosition[] | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = "shadonis.focus.profile.v1";

interface PersistedState {
  user: UserProfile | null;
  name: string | null;
  natalPositions: NatalPosition[] | null;
}

function loadFromStorage(): PersistedState {
  if (typeof window === "undefined") return { user: null, name: null, natalPositions: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, name: null, natalPositions: null };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      name: parsed.name ?? null,
      natalPositions: parsed.natalPositions ?? null,
    };
  } catch {
    return { user: null, name: null, natalPositions: null };
  }
}

function saveToStorage(s: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    if (!s.user) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / privacy mode failures
  }
}

const initial = loadFromStorage();

export const useUserStore = create<UserState>((set, get) => ({
  user: initial.user,
  name: initial.name,
  natalPositions: initial.natalPositions,
  hasCompletedOnboarding: !!initial.user,
  isLoading: false,
  session: null,

  setSession: () => {},
  setLoading: (isLoading) => set({ isLoading }),

  setName: (name) => {
    set({ name });
    const s = get();
    saveToStorage({ user: s.user, name, natalPositions: s.natalPositions });
  },

  setUser: (user) => {
    set({ user, hasCompletedOnboarding: !!user });
    const s = get();
    saveToStorage({ user, name: s.name, natalPositions: s.natalPositions });
  },

  setNatalPositions: (natalPositions) => {
    set({ natalPositions });
    const s = get();
    saveToStorage({ user: s.user, name: s.name, natalPositions });
  },

  setHasCompletedOnboarding: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),

  reset: () => {
    set({ user: null, name: null, natalPositions: null, hasCompletedOnboarding: false });
    saveToStorage({ user: null, name: null, natalPositions: null });
  },
}));
