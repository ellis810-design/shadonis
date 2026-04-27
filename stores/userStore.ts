import { create } from "zustand";
import { UserProfile } from "../types";

/**
 * Focus-group build: no auth, no Supabase. Everything lives in this in-memory
 * (and optionally localStorage-backed) store. Replace with the real session
 * model once we re-enable accounts.
 */

interface UserState {
  user: UserProfile | null;
  name: string | null;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;

  // Legacy no-ops kept so existing callers compile during the focus-group build.
  session: null;
  setSession: (_: any) => void;
  setLoading: (loading: boolean) => void;

  setName: (name: string) => void;
  setUser: (user: UserProfile | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = "shadonis.focus.profile.v1";

function loadFromStorage(): { user: UserProfile | null; name: string | null } {
  if (typeof window === "undefined") return { user: null, name: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, name: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, name: null };
  }
}

function saveToStorage(user: UserProfile | null, name: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, name }));
  } catch {
    // ignore quota / privacy mode failures
  }
}

const initial = loadFromStorage();

export const useUserStore = create<UserState>((set, get) => ({
  user: initial.user,
  name: initial.name,
  hasCompletedOnboarding: !!initial.user,
  isLoading: false,
  session: null,

  setSession: () => {},
  setLoading: (isLoading) => set({ isLoading }),

  setName: (name) => {
    set({ name });
    saveToStorage(get().user, name);
  },

  setUser: (user) => {
    set({ user, hasCompletedOnboarding: !!user });
    saveToStorage(user, get().name);
  },

  setHasCompletedOnboarding: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),

  reset: () => {
    set({ user: null, name: null, hasCompletedOnboarding: false });
    saveToStorage(null, null);
  },
}));
