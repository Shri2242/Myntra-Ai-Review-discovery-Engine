"use client";

import { useApp } from "@/store/app";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OverviewView } from "@/components/dashboard/overview";
import { OpportunitiesView } from "@/components/dashboard/opportunities";
import { SourcesView } from "@/components/dashboard/sources";
import { SegmentsView } from "@/components/dashboard/segments";
import { InsightsView } from "@/components/dashboard/insights";
import { ChatView } from "@/components/dashboard/chat";
import { TeamView } from "@/components/dashboard/team";

export function DashboardShell() {
  const { view, setView } = useApp();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenLanding={() => setView("landing")} />
        <main className="rp-scroll flex-1 overflow-y-auto">
          <div className="rp-fade-in mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
            {view === "overview" && <OverviewView />}
            {view === "opportunities" && <OpportunitiesView />}
            {view === "sources" && <SourcesView />}
            {view === "segments" && <SegmentsView />}
            {view === "insights" && <InsightsView />}
            {view === "chat" && <ChatView />}
            {view === "team" && <TeamView />}
          </div>
        </main>
      </div>
    </div>
  );
}
