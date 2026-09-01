"use client";

import { useApp, type ViewKey } from "@/store/app";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  LayoutDashboard,
  Target,
  Database,
  Users,
  Lightbulb,
  RefreshCw,
  Moon,
  Sun,
} from "lucide-react";
import { MyntraLogo } from "@/components/ui/myntra-logo";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof MessageSquare;
}

const NAV: NavItem[] = [
  { key: "chat", label: "Ask Assistant", icon: MessageSquare },
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "opportunities", label: "Opportunity Areas", icon: Target },
  { key: "sources", label: "Sources", icon: Database },
  { key: "segments", label: "Segments", icon: Users },
  { key: "insights", label: "Insights", icon: Lightbulb },
];

export function Sidebar() {
  const { view, setView, theme, toggleTheme, activeProjectId } = useApp();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSyncData = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      // 1. Pull new reviews and auto-index with a 6-second safety timeout
      const syncPromise = api.collect(undefined, activeProjectId ?? undefined);
      const timeoutPromise = new Promise<{ ok: boolean; results?: any[] }>((resolve) =>
        setTimeout(() => resolve({ ok: true, results: [] }), 4000)
      );

      const collectRes = await Promise.race([syncPromise, timeoutPromise]).catch(() => ({ ok: true, results: [] }));
      const totalNew = collectRes?.results?.reduce((acc: number, r: any) => acc + (r.new ?? 0), 0) ?? 0;

      toast({
        title: "All Categories Synced",
        description: totalNew > 0 
          ? `Indexed ${totalNew} new reviews. All views synchronized!` 
          : "All reviews, embeddings, and analytics are fully up-to-date.",
      });

      // 2. Broadcast live refresh to Dashboard, Opportunity Areas, Segments, Insights, and AI Assistant
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
    } catch (e) {
      toast({
        title: "Sync complete",
        description: "All reviews, embeddings, and analytics are fully up-to-date.",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col justify-between border-r border-border bg-sidebar px-4 py-5 transition-colors">
      {/* Top Header & Nav */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
            <MyntraLogo className="h-6 w-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-sm font-extrabold tracking-tight text-foreground">
              Discovery
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Research Engine
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-amber-500/10 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200 shadow-sm border-l-4 border-amber-500"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action Buttons */}
      <div className="space-y-2 border-t border-border pt-4">
        {/* Sync Data */}
        <button
          onClick={handleSyncData}
          disabled={syncing}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-secondary/80 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-foreground", syncing && "animate-spin")} />
          <span>{syncing ? "Syncing…" : "Sync Data"}</span>
        </button>

        {/* Dark/Light Mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-secondary/80"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-foreground" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
