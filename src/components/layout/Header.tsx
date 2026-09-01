"use client";

import { useApp, type ViewKey } from "@/store/app";
import { Github, ExternalLink } from "lucide-react";

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

export function Header({ onOpenLanding }: { onOpenLanding: () => void }) {
  const { view, setView } = useApp();
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
        <button
          onClick={() => setView("landing")}
          className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground sm:flex"
          aria-label="Landing"
          title="Go to homepage"
        >
          <ExternalLink className="h-4 w-4" />
        </button>

        <a
          href="https://github.com/Shri2242/Myntra-Ai-Review-discovery-Engine"
          target="_blank"
          rel="noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          aria-label="GitHub"
          title="View GitHub Repository"
        >
          <Github className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
