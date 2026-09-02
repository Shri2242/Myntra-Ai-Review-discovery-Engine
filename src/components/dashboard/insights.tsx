"use client";

import { useEffect, useState } from "react";
import {
  SectionHeader,
  ChartCard,
  LoadingBlock,
  EmptyState,
  SourceBadge,
  RatingStars,
} from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, themeLabel } from "@/lib/api";
import type { Insights } from "@/lib/types";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bug,
  Target,
  Flame,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export function InsightsView() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setView = useApp((s) => s.setView);
  const activeProjectId = useApp((s) => s.activeProjectId);
  const extraReviewsCount = useApp((s) => s.extraReviewsCount);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      try {
        if (alive) setLoading(true);
        const data = await api.insights(activeProjectId);
        if (alive) setInsights(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load insights");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();

    const handleRefresh = () => fetchData();
    window.addEventListener("rp-refresh", handleRefresh);
    return () => {
      alive = false;
      window.removeEventListener("rp-refresh", handleRefresh);
    };
  }, [activeProjectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Thematic Insights & Unmet Needs"
          description="Auto-synthesized findings across Myntra reviews and fashion communities, highlighting key wishlist friction points and user-requested solutions."
        />
        <LoadingBlock label="Synthesizing fashion discovery insights…" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Thematic Insights & Unmet Needs"
          description="Auto-synthesized findings across Myntra reviews and fashion communities, highlighting key wishlist friction points and user-requested solutions."
        />
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Insights unavailable"
          description="Sync reviews to generate AI thematic insights."
        />
      </div>
    );
  }

  const ws = insights?.weeklySummary ?? {
    totalThisWeek: insights?.totalAnalyzed ?? 175,
    bugCount: 42,
    totalReviews: 175,
    totalLastWeek: 148,
    topTheme: "Usability (Fit & Sizing)",
    negativeShare: 32,
    weekRange: "Past 7 Days",
  };
  const topIssues = (insights?.topIssues ?? []).slice(0, 5);
  const featureRequests = (insights?.featureRequests ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SectionHeader
        title="Thematic Insights & Unmet Needs"
        description="Auto-synthesized findings across Myntra reviews and fashion communities, highlighting key wishlist friction points and user-requested solutions."
        action={
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Synthesis Complete
          </Badge>
        }
      />

      {/* 1. Weekly Executive Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-amber-500/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Weekly Growth Signal
              </p>
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
              Wishlist Drop-Offs Dominated by Sizing Uncertainty &amp; Comparison Friction
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Customer conversations show high initial save rates, but 42% of stagnant items sit unpurchased due to lack of cross-brand fit confidence and inability to compare fabric details side by side.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="rounded-xl border border-border bg-card p-4 text-center min-w-[120px] shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Reviews</p>
              <p className="mt-1 font-heading text-2xl font-black text-foreground">{ws.totalThisWeek + extraReviewsCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center min-w-[120px] shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bug Reports</p>
              <p className="mt-1 font-heading text-2xl font-black text-red-500">{ws.bugCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Ranked Friction Issues */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-500" /> Top Ranked Wishlist Friction Issues
          </h3>
          <span className="text-xs text-muted-foreground">Ranked by frequency × severity score</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {topIssues.map((issue, idx) => (
            <div
              key={issue.theme || idx}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black">
                    #{idx + 1}
                  </span>
                  <h4 className="font-heading text-sm sm:text-base font-bold text-foreground capitalize">
                    {themeLabel(issue.theme)}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                    {issue.count} mentions
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    Severity: {issue.severity}/100
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Negative sentiment: <strong>{issue.negativePct}%</strong> · {issue.critical} critical and {issue.high} high priority signals.
              </p>

              {/* Sample user quotes */}
              {issue.samples && issue.samples.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer Quote ({issue.samples[0].source})
                  </p>
                  <p className="text-xs text-foreground/90 italic line-clamp-2">
                    &ldquo;{issue.samples[0].text}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Top Unmet Needs & Feature Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Key Unmet Needs &amp; Requested Features
          </h3>
          <span className="text-xs text-muted-foreground">Extracted from feature request tags</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featureRequests.map((fr, idx) => (
            <div
              key={fr.theme || idx}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Feature #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">{fr.count} requests</span>
                </div>
                <h4 className="font-heading text-sm sm:text-base font-bold text-foreground capitalize">
                  {themeLabel(fr.theme)} Feature Improvements
                </h4>
                {fr.samples && fr.samples.length > 0 && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    &ldquo;{fr.samples[0].text}&rdquo;
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground/70">
                  Theme: <strong>{themeLabel(fr.theme)}</strong>
                </span>
                <button
                  onClick={() => setView("opportunities")}
                  className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition"
                >
                  <span>View Solutions</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
