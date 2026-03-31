import { create } from "zustand";
import { OnboardingData, UserProfile } from "../types";

interface UserState {
  user: UserProfile | null;
  session: { accessToken: string; userId: string } | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  onboarding: OnboardingData;

  setUser: (user: UserProfile | null) => void;
  setSession: (session: { accessToken: string; userId: string } | null) => void;
  setLoading: (loading: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;

  updateOnboarding: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
}

const DEFAULT_ONBOARDING: OnboardingData = {
  birthDate: null,
  birthTime: null,
  birthTimeUnknown: false,
  birthCity: "",
  birthCountryCode: "",
  birthLat: null,
  birthLng: null,
  birthTimezone: "",
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  hasCompletedOnboarding: false,

  onboarding: { ...DEFAULT_ONBOARDING },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasCompletedOnboarding: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),

  updateOnboarding: (data) =>
    set((state) => ({
      onboarding: { ...state.onboarding, ...data },
    })),
  resetOnboarding: () => set({ onboarding: { ...DEFAULT_ONBOARDING } }),
}));
