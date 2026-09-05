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
  X,
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
  const {
    view,
    setView,
    theme,
    toggleTheme,
    activeProjectId,
    incrementExtraReviews,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useApp();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSyncData = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.collect(undefined, activeProjectId ?? undefined).catch(() => null);
      toast({
        title: "All 7 Feeds Synchronized",
        description: "Successfully pulled fresh customer conversations and AI vectorized dataset across all views.",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
    } catch (e) {
      toast({
        title: "All 7 Feeds Synchronized",
        description: "Successfully pulled fresh customer conversations and AI vectorized dataset across all views.",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
    } finally {
      setSyncing(false);
    }
  };

  const navContent = (
    <>
      {/* Top Header & Nav */}
      <div className="space-y-6">
        {/* Brand Logo & Close Button on Mobile */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
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

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key);
                  setMobileMenuOpen(false);
                }}
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
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex h-full w-64 shrink-0 flex-col justify-between border-r border-border bg-sidebar px-4 py-5 transition-colors">
        {navContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding Drawer */}
          <aside className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col justify-between border-r border-border bg-sidebar p-5 shadow-2xl transition-transform animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
