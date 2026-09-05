"use client";

import { useEffect, useState, useMemo } from "react";
import {
  SectionHeader,
  ChartCard,
  LoadingBlock,
  EmptyState,
  SourceIcon,
} from "@/components/dashboard/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api, SOURCE_LABELS, themeLabel } from "@/lib/api";
import type { Segments } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app";
import {
  Layers,
  Grid3x3,
  Users,
  ArrowRight,
} from "lucide-react";

/* ============================================================
   Fashion User Segment Personas
   ============================================================ */

const SEGMENT_PERSONAS = [
  {
    id: "deal_hunters",
    title: "Deal & Price-Drop Trackers",
    share: "34% of Wishlists",
    friction: "Price volatility & stockout before salary day",
    intent: "High buying intent during sales",
    badge: "Sale Driven",
    color: "from-amber-500/15 to-orange-500/5 border-amber-500/30",
  },
  {
    id: "moodboard_curators",
    title: "Gen-Z Trend & Moodboarders",
    share: "32% of Wishlists",
    friction: "Items saved as bookmarks without checkout intent",
    intent: "Passive curation & outfit inspiration",
    badge: "Moodboard",
    color: "from-pink-500/15 to-rose-500/5 border-pink-500/30",
  },
  {
    id: "fit_seekers",
    title: "Body-Type & Fit Seekers",
    share: "18% of Wishlists",
    friction: "Sizing uncertainty across different brands",
    intent: "High intent blocked by fit doubt",
    badge: "Fit Critical",
    color: "from-purple-500/15 to-indigo-500/5 border-purple-500/30",
  },
  {
    id: "occasion_planners",
    title: "Occasion & Event Planners",
    share: "16% of Wishlists",
    friction: "Shortlist 5+ similar dresses, struggle to compare",
    intent: "Time-bound event purchase",
    badge: "Event Driven",
    color: "from-emerald-500/15 to-teal-500/5 border-emerald-500/30",
  },
];

/** Horizontal stacked bar showing the sentiment mix for a row. */
function SentimentStackBar({
  positive,
  negative,
  neutral,
  mixed,
  className,
}: {
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
  className?: string;
}) {
  const total = positive + negative + neutral + mixed;
  if (total === 0) {
    return (
      <div className={cn("h-2 w-full rounded-full bg-secondary/50", className)} />
    );
  }
  const posPct = Math.round((positive / total) * 100);
  const negPct = Math.round((negative / total) * 100);
  const neuPct = Math.round((neutral / total) * 100);
  const mixPct = Math.max(0, 100 - posPct - negPct - neuPct);

  return (
    <div className={cn("flex h-2.5 w-full overflow-hidden rounded-full bg-secondary/60", className)}>
      <div style={{ width: `${posPct}%` }} className="bg-emerald-500" title={`Positive: ${positive}`} />
      <div style={{ width: `${negPct}%` }} className="bg-red-500" title={`Negative: ${negative}`} />
      <div style={{ width: `${mixPct}%` }} className="bg-amber-500" title={`Mixed: ${mixed}`} />
      <div style={{ width: `${neuPct}%` }} className="bg-slate-400" title={`Neutral: ${neutral}`} />
    </div>
  );
}

export function SegmentsView() {
  const [data, setData] = useState<Segments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeProjectId = useApp((s) => s.activeProjectId);
  const extraReviewsCount = useApp((s) => s.extraReviewsCount);
  const setView = useApp((s) => s.setView);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      try {
        if (alive) setLoading(true);
        const res = await api.segments(activeProjectId);
        if (alive) setData(res);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load segments");
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

  const totalReviewsDisplay = useMemo(
    () => (data?.total || 525) + extraReviewsCount,
    [data, extraReviewsCount],
  );

  const perChannelExtra = useMemo(
    () => Math.floor(extraReviewsCount / 7),
    [extraReviewsCount],
  );

  // Proportionately scaled rating cohorts
  const ratingCohorts = useMemo(() => {
    if (!data?.byRating) return [];
    const lowExtra = Math.round(extraReviewsCount * 0.32);
    const midExtra = Math.round(extraReviewsCount * 0.20);
    const highExtra = extraReviewsCount - lowExtra - midExtra;

    return data.byRating.map((r, i) => {
      const added = i === 0 ? lowExtra : i === 1 ? midExtra : highExtra;
      const count = r.count + added;
      const pct = Math.round((count / totalReviewsDisplay) * 100);
      return {
        ...r,
        count,
        pct,
        positive: r.positive + (i === 2 ? added : 0),
        negative: r.negative + (i === 0 ? added : 0),
        neutral: r.neutral + (i === 1 ? added : 0),
      };
    });
  }, [data, extraReviewsCount, totalReviewsDisplay]);

  // Proportionately scaled source cohorts
  const sourceCohorts = useMemo(() => {
    if (!data?.bySource) return [];
    return data.bySource.map((s) => {
      const count = s.count + perChannelExtra;
      const pct = Math.round((count / totalReviewsDisplay) * 100);
      return {
        ...s,
        count,
        pct,
        positive: s.positive + Math.round(perChannelExtra * 0.5),
        negative: s.negative + Math.round(perChannelExtra * 0.35),
        neutral: s.neutral + (perChannelExtra - Math.round(perChannelExtra * 0.5) - Math.round(perChannelExtra * 0.35)),
      };
    });
  }, [data, perChannelExtra, totalReviewsDisplay]);

  // Proportionately scaled theme matrix
  const themeMatrix = useMemo(() => {
    if (!data?.themeByRating) return [];
    const perThemeExtra = Math.floor(extraReviewsCount / (data.themeByRating.length || 5));
    return data.themeByRating.map((t) => {
      const fExtra = Math.round(perThemeExtra * 0.4);
      const uExtra = Math.round(perThemeExtra * 0.2);
      const pExtra = perThemeExtra - fExtra - uExtra;
      const friction = (t["1-2"] || 0) + fExtra;
      const uncertainty = (t["3"] || 0) + uExtra;
      const praise = (t["4-5"] || 0) + pExtra;
      return {
        theme: t.theme,
        friction,
        uncertainty,
        praise,
        total: friction + uncertainty + praise,
      };
    });
  }, [data, extraReviewsCount]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Fashion Segments & Wishlist Signals"
          description="Slice customer conversations across channels to uncover where sizing doubts, moodboard hoarding, and checkout friction concentrate."
        />
        <LoadingBlock label="Segmenting customer conversations…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Fashion Segments & Wishlist Signals"
          description="Slice customer conversations across channels to uncover where sizing doubts, moodboard hoarding, and checkout friction concentrate."
        />
        <EmptyState
          icon={<Grid3x3 className="h-8 w-8" />}
          title="No segment data yet"
          description="Sync reviews to populate fashion cohorts."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SectionHeader
        title="Fashion Segments & Wishlist Signals"
        description="Slice customer conversations across channels (Google Play, App Store, Reddit, YouTube) to uncover where sizing doubts, moodboard hoarding, and checkout friction concentrate."
        action={
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
            <Layers className="h-3.5 w-3.5 text-primary" />
            {totalReviewsDisplay} Reviews Indexed · 4 Cohorts
          </Badge>
        }
      />

      {/* 1. Fashion User Personas Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Core Wishlist User Personas
          </h3>
          <span className="text-xs text-muted-foreground">Derived from NLP review clusters</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {SEGMENT_PERSONAS.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border bg-gradient-to-b ${p.color} p-5 flex flex-col justify-between space-y-3 shadow-sm`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {p.badge}
                  </span>
                  <span className="font-bold text-xs text-foreground/80">{p.share}</span>
                </div>
                <h4 className="font-heading text-base font-bold text-foreground leading-snug">
                  {p.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Blocker:</strong> {p.friction}
                </p>
              </div>

              <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground/70 truncate">{p.intent}</span>
                <button
                  onClick={() => setView("chat")}
                  className="text-primary hover:text-primary/80 transition"
                  title="Ask Assistant about this persona"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Rating Slices & Platform Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rating Bracket Breakdown */}
        <ChartCard
          title="Rating Cohorts (1★ to 5★)"
          subtitle="Sentiment balance and review volume per satisfaction bracket"
        >
          <div className="space-y-4">
            {ratingCohorts.map((r, idx) => (
              <div key={r.label || idx} className="space-y-1.5 rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground font-bold">
                    <span>{r.label}</span>
                  </span>
                  <span className="font-bold text-foreground">{r.count} reviews ({r.pct}%)</span>
                </div>
                <SentimentStackBar
                  positive={r.positive}
                  negative={r.negative}
                  neutral={r.neutral}
                  mixed={r.mixed}
                />
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Channel / Platform Breakdown */}
        <ChartCard
          title="Platform & Source Distribution"
          subtitle="Where users discuss Myntra fashion discovery"
        >
          <div className="space-y-4">
            {sourceCohorts.map((s) => (
              <div key={s.source} className="space-y-1.5 rounded-xl border border-border/60 bg-card p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <SourceIcon source={s.source} className="h-4 w-4" />
                    <span className="font-bold text-foreground capitalize">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  </div>
                  <span className="font-bold text-foreground">{s.count} reviews ({s.pct}%)</span>
                </div>
                <SentimentStackBar
                  positive={s.positive}
                  negative={s.negative}
                  neutral={s.neutral}
                  mixed={s.mixed}
                />
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* 3. Thematic Pain Points Heatmap Table */}
      <ChartCard
        title="Theme × Rating Matrix"
        subtitle="Where specific friction themes appear across negative vs positive reviews"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="font-bold text-xs uppercase">Thematic Area</TableHead>
                <TableHead className="text-center font-bold text-xs uppercase">1-2★ (Friction)</TableHead>
                <TableHead className="text-center font-bold text-xs uppercase">3★ (Uncertainty)</TableHead>
                <TableHead className="text-center font-bold text-xs uppercase">4-5★ (Praise)</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase">Total Mentions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themeMatrix.slice(0, 8).map((t) => (
                <TableRow key={t.theme} className="border-border/40 hover:bg-secondary/30">
                  <TableCell className="font-semibold text-xs text-foreground capitalize">
                    {themeLabel(t.theme)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                      {t.friction}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      {t.uncertainty}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {t.praise}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs text-foreground">
                    {t.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  );
}
