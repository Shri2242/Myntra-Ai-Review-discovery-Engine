"use client";

import { useApp, type ViewKey } from "@/store/app";
import { Github } from "lucide-react";

const VIEW_TITLES: Record<ViewKey, { title: string; crumb: string }> = {
  landing: { title: "Home", crumb: "Home" },
  login: { title: "Sign in", crumb: "Auth / Sign in" },
  register: { title: "Sign up", crumb: "Auth / Sign up" },
  overview: { title: "Overview", crumb: "Dashboard / Overview" },
  opportunities: { title: "Opportunity Areas", crumb: "Dashboard / Opportunity Areas" },
  sources: { title: "Sources", crumb: "Dashboard / Sources" },
  segments: { title: "Segments", crumb: "Dashboard / Segments" },
  insights: { title: "Insights", crumb: "Dashboard / Insights" },
  chat: { title: "AI Chat", crumb: "Dashboard / AI Chat" },
  team: { title: "Team", crumb: "Dashboard / Team" },
};

export function Header({ onOpenLanding }: { onOpenLanding?: () => void }) {
  const { view } = useApp();
  const meta = VIEW_TITLES[view] ?? VIEW_TITLES.overview;

  return (
    <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">{meta.crumb}</p>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-foreground">{meta.title}</h2>
            <span className="hidden sm:inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              Growth Team · 30-Day Wishlist Goal
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://github.com/Shri2242/Myntra-Ai-Review-discovery-Engine"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:bg-secondary hover:text-foreground shadow-sm"
          aria-label="GitHub Repository"
          title="View GitHub Repository"
        >
          <Github className="h-4 w-4 text-foreground" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
