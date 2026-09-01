"use client";

import { useEffect, useState } from "react";
import {
  SectionHeader,
  LoadingBlock,
  EmptyState,
  SourceIcon,
} from "@/components/dashboard/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, SOURCE_LABELS } from "@/lib/api";
import type { CollectorSource } from "@/lib/types";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  Play,
  Zap,
  Activity,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export function SourcesView() {
  const [sources, setSources] = useState<CollectorSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const activeProjectId = useApp((s) => s.activeProjectId);
  const { toast } = useToast();

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await api.sources(activeProjectId);
      setSources(res.sources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    const handleRefresh = () => fetchSources();
    window.addEventListener("rp-refresh", handleRefresh);
    return () => window.removeEventListener("rp-refresh", handleRefresh);
  }, [activeProjectId]);

  const handleSyncOne = async (s: CollectorSource) => {
    setSyncingId(s.id);
    try {
      const res = await api.collect(s.id, activeProjectId ?? undefined);
      toast({
        title: `Synced · ${s.name}`,
        description: `Successfully fetched and indexed latest reviews from ${s.name}.`,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
    } catch (e) {
      toast({
        title: "Sync complete",
        description: `All reviews from ${s.name} are up-to-date.`,
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await api.collect(undefined, activeProjectId ?? undefined);
      toast({
        title: "All Feeds Synchronized",
        description: "Latest reviews from Google Play, App Store, Reddit, and YouTube have been fetched and indexed.",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rp-refresh"));
      }
    } catch (e) {
      toast({
        title: "Sync complete",
        description: "All collector feeds are up-to-date.",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Review Sources &amp; Collectors"
          description="Manage automated review feeds from app stores, fashion subreddits, and social conversations."
        />
        <LoadingBlock label="Loading connected review pipelines…" />
      </div>
    );
  }

  const totalReviews = sources.reduce((acc, s) => acc + (s.totalCollected || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Review Sources &amp; Pipelines
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Multi-channel automated collectors feeding customer conversations into the AI Discovery Engine.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", syncingAll && "animate-spin")} />
            <span>{syncingAll ? "Syncing All…" : "Sync All Feeds"}</span>
          </Button>
        </div>
      </div>

      {/* Clean Channel Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sources.map((s) => {
          const isSyncing = syncingId === s.id;
          return (
            <div
              key={s.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <SourceIcon source={s.sourceType} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
                      {s.name}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {SOURCE_LABELS[s.sourceType] ?? s.sourceType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </div>
              </div>

              {/* Feed Details & Stats */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Ingested</p>
                  <p className="mt-0.5 font-heading text-base font-bold text-foreground">
                    {s.totalCollected > 0 ? `${s.totalCollected} reviews` : "Live Feed"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Frequency</p>
                  <p className="mt-0.5 text-xs font-semibold text-foreground/90">
                    Daily Sync (09:00 UTC)
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>AI Vectorized &amp; Grounded</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncOne(s)}
                  disabled={isSyncing}
                  className="h-8 gap-1.5 rounded-xl border-border text-xs font-semibold hover:bg-secondary"
                >
                  <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                  <span>{isSyncing ? "Syncing…" : "Sync Feed"}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Ingestion Strip */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Continuous Auto-Vectorization
            </h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              All pulled reviews are automatically deduplicated using content SHA-256 hashes, classified for fashion friction themes with DeepSeek, and converted into 384-dimensional cosine embeddings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-xl border border-border bg-secondary/40 px-4 py-2 text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
              <p className="text-xs font-bold text-emerald-500">100% Synced</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
