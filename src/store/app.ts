"use client";

import { create } from "zustand";
import type { AuthUser, AuthProject } from "@/lib/api";

export type ViewKey =
  | "landing"
  | "login"
  | "register"
  | "overview"
  | "opportunities"
  | "sources"
  | "segments"
  | "insights"
  | "chat"
  | "team";

interface AppState {
  view: ViewKey;
  setView: (v: ViewKey) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;

  // Auth state
  user: AuthUser | null;
  projects: AuthProject[];
  activeProjectId: string | null;
  authReady: boolean;
  setAuth: (data: { user: AuthUser | null; projects: AuthProject[] }) => void;
  setActiveProject: (id: string | null) => void;
  clearAuth: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Real-time review increment across manual pulls
  extraReviewsCount: number;
  incrementExtraReviews: (amount?: number) => number;
  resetExtraReviews: () => void;
}

export const useApp = create<AppState>((set, get) => {
  const initialExtra = typeof window !== "undefined" ? Number(localStorage.getItem("rp_extra_reviews") || "0") : 0;

  return {
    view: "chat",
    setView: (view) => set({ view }),

    theme: "light",
    setTheme: (theme) => {
      set({ theme });
      if (typeof window !== "undefined") {
        localStorage.setItem("rp_theme", theme);
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    toggleTheme: () => {
      const next = get().theme === "dark" ? "light" : "dark";
      get().setTheme(next);
    },

    user: null,
    projects: [],
    activeProjectId: null,
    authReady: false,
    setAuth: ({ user, projects }) =>
      set({
        user,
        projects,
        activeProjectId: projects[0]?.id ?? null,
        authReady: true,
      }),
    setActiveProject: (activeProjectId) => {
      set({ activeProjectId, searchQuery: "" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
    },
    clearAuth: () => set({ user: null, projects: [], activeProjectId: null, view: "chat" }),

    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    searchQuery: "",
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    extraReviewsCount: initialExtra,
    incrementExtraReviews: (amount = 14) => {
      const next = get().extraReviewsCount + amount;
      set({ extraReviewsCount: next });
      if (typeof window !== "undefined") {
        localStorage.setItem("rp_extra_reviews", next.toString());
        window.dispatchEvent(new Event("rp-refresh"));
      }
      return next;
    },
    resetExtraReviews: () => {
      set({ extraReviewsCount: 0 });
      if (typeof window !== "undefined") {
        localStorage.removeItem("rp_extra_reviews");
        window.dispatchEvent(new Event("rp-refresh"));
      }
    },
  };
});
