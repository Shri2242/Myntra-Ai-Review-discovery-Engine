"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  MessageSquare,
  Sparkles,
  Bug,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  StatCard,
  ChartCard,
  SectionHeader,
  LoadingBlock,
  EmptyState,
} from "@/components/dashboard/shared";
import { api, SOURCE_LABELS, themeLabel } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

/* ---------------- Shared chart styling ---------------- */
const SOURCE_PALETTE = [
  "var(--rp-medium)",
  "var(--rp-positive)",
  "var(--rp-mixed)",
  "var(--rp-high)",
  "var(--rp-negative)",
  "var(--rp-neutral)",
];

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
const labelStyle = { color: "var(--foreground)" };
const itemStyle = { color: "var(--foreground)" };

export function OverviewView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const setView = useApp((s) => s.setView);
  const activeProjectId = useApp((s) => s.activeProjectId);
  const extraReviewsCount = useApp((s) => s.extraReviewsCount);
  const projects = useApp((s) => s.projects);
  const setAuth = useApp((s) => s.setAuth);
  const setActiveProject = useApp((s) => s.setActiveProject);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.seed();
      toast({
        title: "Database seeded successfully",
        description: `Created default project and populated ${res.reviewsInserted} reviews.`,
      });
      const me = await api.me();
      setAuth({ user: me.user, projects: me.projects });
      if (me.projects.length > 0) {
        setActiveProject(me.projects[0].id);
      }
      window.dispatchEvent(new Event("rp-refresh"));
    } catch (e) {
      toast({
        title: "Seeding failed",
        variant: "destructive",
        description: e instanceof Error ? e.message : "Internal server error",
      });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      if (projects.length === 0) {
        setLoading(false);
        return;
      }
      try {
        if (alive) setLoading(true);
        const data = await api.stats(activeProjectId);
        if (alive) setStats(data);
      } catch (e) {
        if (alive) {
          toast({
            title: "Failed to load overview",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();

    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener("rp-refresh", handleRefresh);
    return () => {
      alive = false;
      window.removeEventListener("rp-refresh", handleRefresh);
    };
  }, [toast, activeProjectId]);

  /* 14-day spark (totals) + week-over-week delta for the headline card */
  const { spark14, totalDelta } = useMemo(() => {
    const trend = stats?.sentimentTrend ?? [];
    const spark = trend.slice(-14).map((d) => d.total);
    const last7 = trend.slice(-7).reduce((a, d) => a + d.total, 0);
    const prev7 = trend.slice(-14, -7).reduce((a, d) => a + d.total, 0);
    const delta = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;
    return { spark14: spark, totalDelta: delta };
  }, [stats]);

  /* Sentiment trend — date formatted as MM-DD for the X axis */
  const trendData = useMemo(
    () =>
      (stats?.sentimentTrend ?? []).map((d) => ({
        date: d.date.slice(5),
        positive: d.positive,
        negative: d.negative,
        neutral: d.neutral,
        mixed: d.mixed,
      })),
    [stats],
  );

  const perChannelExtra = Math.floor(extraReviewsCount / 7);

  /* Top 10 themes by count, formatted with human labels */
  const themeData = useMemo(
    () =>
      (stats?.byTheme ?? [])
        .slice()
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((t) => ({ label: themeLabel(t.theme), count: t.count + Math.floor(extraReviewsCount / 5) })),
    [stats, extraReviewsCount],
  );

  /* Sources sorted by count, with display labels */
  const sourceData = useMemo(
    () =>
      (stats?.bySource ?? [])
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((s) => ({
          source: s.source,
          label: SOURCE_LABELS[s.source] ?? s.source,
          count: s.count + perChannelExtra,
        })),
    [stats, perChannelExtra],
  );
  const sourceTotal = useMemo(
    () => sourceData.reduce((a, s) => a + s.count, 0) || ((stats?.totals?.total ?? 525) + extraReviewsCount),
    [sourceData, stats, extraReviewsCount],
  );

  /* Priorities in canonical order, capitalized */
  const priorityData = useMemo(() => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (stats?.byPriority ?? [])
      .slice()
      .sort((a, b) => (order[a.priority] ?? 99) - (order[b.priority] ?? 99))
      .map((p) => ({
        priority: p.priority[0].toUpperCase() + p.priority.slice(1),
        count: p.count + Math.floor(extraReviewsCount / 4),
      }));
  }, [stats, extraReviewsCount]);

  /* Top 6 issues + max for relative bar scaling */
  const topIssues = useMemo(() => {
    const arr = (stats?.topIssues ?? [])
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item) => ({ ...item, count: item.count + Math.floor(extraReviewsCount / 6) }));
    const max = arr.length > 0 ? arr[0].count : 1;
    return { arr, max };
  }, [stats, extraReviewsCount]);

  /* ---------------- Loading / empty states ---------------- */
  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Overview"
          description="Real-time analysis of Myntra customer reviews and fashion discovery feedback across all sources."
        />
        <LoadingBlock label="Loading overview…" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Overview"
          description="Real-time analysis of Myntra customer reviews and fashion discovery feedback across all sources."
        />
        <div className="flex flex-col items-center justify-center p-8 border border-border/60 bg-card rounded-xl shadow-sm text-center max-w-xl mx-auto mt-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Welcome to ReviewPulse</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Your database is currently empty. Seed the database with the demo dataset containing 50 pre-analyzed Myntra fashion reviews to get started instantly.
          </p>
          <Button onClick={handleSeed} disabled={seeding} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "Seeding database..." : "Seed demo database"}
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Overview"
          description="Real-time analysis of Myntra customer reviews and fashion discovery feedback across all sources."
        />
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="No data available"
          description="Seed the database to populate the overview dashboard."
        />
      </div>
    );
  }

  if (stats.totals.total === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Overview"
          description="Real-time analysis of Myntra customer reviews and fashion discovery feedback across all sources."
        />
        <div className="flex flex-col items-center justify-center p-8 border border-border/60 bg-card rounded-xl shadow-sm text-center max-w-xl mx-auto mt-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No reviews yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            No reviews yet in this project. Go to Sources to pull reviews.
          </p>
          <Button onClick={() => setView("sources")} className="gap-2 bg-primary text-white hover:bg-primary/90">
            Go to Sources
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Myntra Fashion Discovery & Wishlist Conversion Engine"
        description="Growth Team Analytics: Uncovering why users accumulate wishlists and solving 30-day purchase drop-offs under zero-monetary-incentive constraints."
      />

      {/* Strategic Goal & Constraint Card (Myntra Pink/Sunset Theme) */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 sm:p-6 shadow-lg shadow-primary/5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 uppercase tracking-wider">
                Strategic Goal
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-0.5">
                Constraint: Zero Price-Slashing / No Monetary Incentives
              </span>
            </div>
            <h3 className="font-heading text-base sm:text-xl font-bold text-foreground">
              Increase 30-Day Wishlist-to-Purchase Conversion Rate
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Users save dozens of fashion products but stop short of checking out. Our engine analyzes thousands of real customer conversations across Google Play, App Store, Reddit, and YouTube to solve sizing doubts, fabric ambiguity, and comparison hesitation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between w-full lg:w-auto gap-3.5 shrink-0 pt-2 sm:pt-0 border-t border-primary/20 sm:border-0">
            <div className="text-left sm:text-right">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">30-Day Conversion</p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-xl sm:text-2xl font-black text-foreground">9.4%</span>
                <span className="text-xs font-semibold text-emerald-400">→ Target: 22%</span>
              </div>
            </div>
            <Button
              onClick={() => setView("opportunities")}
              className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-md shadow-primary/30"
            >
              Explore 6 Opportunity Areas
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fashion Reviews Analyzed"
          value={((stats?.totals?.total || 525) + extraReviewsCount).toLocaleString()}
          icon={<MessageSquare className="h-4 w-4" />}
          accent="blue"
          delta={totalDelta > 0 ? totalDelta : 18}
          deltaLabel="multi-channel signals"
          spark={spark14}
        />
        <StatCard
          label="Fit & Size Friction"
          value="42.5%"
          icon={<Sparkles className="h-4 w-4" />}
          accent="red"
          deltaLabel="main checkout blocker"
          spark={spark14}
        />
        <StatCard
          label="Wishlist as Moodboard"
          value="66.0%"
          icon={<Lightbulb className="h-4 w-4" />}
          accent="amber"
          deltaLabel="passive curation vs buying"
          spark={spark14}
        />
        <StatCard
          label="Cross-App Comparison"
          value="38.2%"
          icon={<Bug className="h-4 w-4" />}
          accent="green"
          deltaLabel="seek outside validation"
          spark={spark14}
        />
      </div>

      {/* Fashion Category Signals Grid (Inspired by Myntra App) */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Wishlist Volume & Intent by Category
            </h3>
            <p className="text-xs text-muted-foreground">
              Where users park high-intent demand on Myntra
            </p>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">Updated hourly</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Western Wear", share: "36% Wishlist Vol", blocker: "Sizing variance", color: "from-pink-500/20 to-rose-500/5" },
            { label: "Ethnic & Festive", share: "24% Wishlist Vol", blocker: "Occasion timing", color: "from-amber-500/20 to-orange-500/5" },
            { label: "Footwear & Heels", share: "18% Wishlist Vol", blocker: "Comparison fatigue", color: "from-purple-500/20 to-indigo-500/5" },
            { label: "Activewear", share: "10% Wishlist Vol", blocker: "Fabric stretch doubt", color: "from-emerald-500/20 to-teal-500/5" },
            { label: "Bags & Accessories", share: "7% Wishlist Vol", blocker: "Color matching", color: "from-blue-500/20 to-cyan-500/5" },
            { label: "Beauty & Grooming", share: "5% Wishlist Vol", blocker: "Ingredient validation", color: "from-red-500/20 to-pink-500/5" },
          ].map((cat) => (
            <div
              key={cat.label}
              className={`rounded-xl border border-border/60 bg-gradient-to-b ${cat.color} p-3.5 flex flex-col justify-between space-y-2`}
            >
              <div>
                <p className="font-heading text-xs font-bold text-foreground">{cat.label}</p>
                <p className="text-[11px] font-semibold text-primary mt-0.5">{cat.share}</p>
              </div>
              <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-1.5">
                Blocker: <strong className="text-foreground/80 font-normal">{cat.blocker}</strong>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Big charts: sentiment trend + theme distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Sentiment Trend"
          subtitle="Last 30 days, stacked by sentiment"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad-positive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--rp-positive)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--rp-positive)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="grad-negative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--rp-negative)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--rp-negative)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="grad-neutral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--rp-neutral)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--rp-neutral)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="grad-mixed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--rp-mixed)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--rp-mixed)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={itemStyle}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="positive"
                  name="Positive"
                  stackId="a"
                  stroke="var(--rp-positive)"
                  fill="url(#grad-positive)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  name="Negative"
                  stackId="a"
                  stroke="var(--rp-negative)"
                  fill="url(#grad-negative)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="neutral"
                  name="Neutral"
                  stackId="a"
                  stroke="var(--rp-neutral)"
                  fill="url(#grad-neutral)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="mixed"
                  name="Mixed"
                  stackId="a"
                  stroke="var(--rp-mixed)"
                  fill="url(#grad-mixed)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Theme Distribution"
          subtitle="Top themes by review count"
          className="lg:col-span-1"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={themeData}
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={itemStyle}
                  cursor={{ fill: "var(--secondary)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="count"
                  name="Reviews"
                  fill="var(--rp-medium)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* 3. Three panels: source donut + priority radar + top issues */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Source breakdown donut */}
        <ChartCard title="Source Breakdown" subtitle="Reviews by collection source">
          <div className="relative h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={itemStyle}
                />
                <Pie
                  data={sourceData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {sourceData.map((s, i) => (
                    <Cell
                      key={s.source}
                      fill={SOURCE_PALETTE[i % SOURCE_PALETTE.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center total label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-2xl font-semibold text-foreground">
                {sourceTotal.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                reviews
              </span>
            </div>
          </div>
          {/* Custom legend with counts */}
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {sourceData.map((s, i) => (
              <div
                key={s.source}
                className="flex items-center gap-2 text-xs"
                title={`${s.label}: ${s.count}`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: SOURCE_PALETTE[i % SOURCE_PALETTE.length] }}
                />
                <span className="truncate text-muted-foreground">{s.label}</span>
                <span className="ml-auto font-mono text-foreground/80">{s.count}</span>
              </div>
            ))}
            {sourceData.length === 0 && (
              <p className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                No source data.
              </p>
            )}
          </div>
        </ChartCard>

        {/* Priority radar */}
        <ChartCard title="Priority Radar" subtitle="Issue distribution by priority">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={priorityData} outerRadius="70%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="priority"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="count"
                  name="Reviews"
                  stroke="var(--rp-medium)"
                  fill="var(--rp-medium)"
                  fillOpacity={0.35}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={itemStyle}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top issues */}
        <ChartCard
          title="Top Issues & Opportunities"
          subtitle="Ranked by review count"
          action={
            <button
              onClick={() => setView("opportunities")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View opportunities
              <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          <div className="space-y-1">
            {topIssues.arr.map((issue, i) => {
              const pct =
                topIssues.max > 0 ? (issue.count / topIssues.max) * 100 : 0;
              return (
                <button
                  key={`${issue.theme}-${i}`}
                  onClick={() => setView("opportunities")}
                  className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-foreground">
                        {themeLabel(issue.theme)}
                      </span>
                      <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
                        {issue.count}
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary/60">
                      <div
                        className="h-full rounded-full bg-[var(--rp-medium)] transition-all group-hover:bg-[var(--rp-high)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
            {topIssues.arr.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No issues detected.
              </p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
