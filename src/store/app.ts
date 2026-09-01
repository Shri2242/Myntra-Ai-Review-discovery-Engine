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
}

export const useApp = create<AppState>((set, get) => ({
  view: "chat", // Default to Ask Assistant (chat) directly for high visibility!
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
}));
