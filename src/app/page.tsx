"use client";

import { useEffect } from "react";
import { useApp } from "@/store/app";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function Home() {
  const { authReady, setAuth } = useApp();

  // On first load: automatically initialize session and jump straight to the app
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.me();
        if (!alive) return;
        setAuth({ user: me.user, projects: me.projects });
      } catch {
        if (alive) {
          // Fallback demo state so the app renders immediately
          setAuth({
            user: { id: "pm_user", email: "pm@reviewpulse.dev", name: "Growth PM" },
            projects: [
              {
                id: "default_project",
                name: "Myntra Fashion Discovery Engine",
                description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
                role: "admin",
              },
            ],
          });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [setAuth]);

  return <DashboardShell />;
}
