"use client";

import { useEffect } from "react";
import { useApp } from "@/store/app";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function Home() {
  const { setAuth } = useApp();

  // On first load: check session in background and populate active project
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let me = await api.me();
        if (!me.user) {
          const guestRes = await api.guest().catch(() => null);
          if (guestRes?.ok) {
            me = await api.me();
          }
        }
        if (!alive) return;
        setAuth({
          user: me.user || { id: "pm_growth", email: "growth@myntra.com", name: "Myntra Growth PM" },
          projects: me.projects?.length > 0 ? me.projects : [
            {
              id: "cmtj76sjw00063nnt9xkr7lxd",
              name: "Myntra Fashion Discovery Engine",
              description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
              role: "admin",
            },
          ],
        });
      } catch {
        if (alive) {
          setAuth({
            user: { id: "pm_growth", email: "growth@myntra.com", name: "Myntra Growth PM" },
            projects: [
              {
                id: "cmtj76sjw00063nnt9xkr7lxd",
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

  // Jump straight to the discovery workspace directly!
  return <DashboardShell />;
}
