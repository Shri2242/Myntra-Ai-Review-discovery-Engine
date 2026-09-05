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
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  extraReviewsCount: number;
  incrementExtraReviews: (amount?: number) => number;
  resetExtraReviews: () => void;
}

export const useApp = create<AppState>((set) => {
  // Clear any old legacy local storage drift so all devices match the server identically
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("rp_extra_reviews");
    } catch {}
  }

  return {
    view: "chat",
    setView: (view) => set({ view, mobileMenuOpen: false }),

    theme: (typeof window !== "undefined" && (localStorage.getItem("rp_theme") as "light" | "dark")) || "dark",
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
      set((s) => {
        const next = s.theme === "dark" ? "light" : "dark";
        if (typeof window !== "undefined") {
          localStorage.setItem("rp_theme", next);
          if (next === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
        return { theme: next };
      });
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

    mobileMenuOpen: false,
    setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),

    searchQuery: "",
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    extraReviewsCount: 0,
    incrementExtraReviews: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
      return 0;
    },
    resetExtraReviews: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("rp_extra_reviews");
        window.dispatchEvent(new Event("rp-refresh"));
      }
    },
  };
});
