"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Target,
  TrendingUp,
  Percent,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3,
  Layers,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  SectionHeader,
  ChartCard,
  StatCard,
} from "@/components/dashboard/shared";
import { useApp } from "@/store/app";

interface OpportunityArea {
  id: string;
  title: string;
  category: "sizing_fit" | "wishlist_conversion" | "comparison" | "fabric_transparency" | "occasion_discovery" | "checkout_reliability";
  status: "high_priority" | "quick_win" | "strategic_bet";
  targetMetric: string;
  metricImpact: string;
  quantifiedSignal: {
    mentionCount: number;
    frictionPercentage: number;
    estimatedRevenueLift: string;
    returnRateReduction?: string;
  };
  effort: "Low" | "Medium" | "High";
  impact: "High" | "Very High" | "Medium";
  summary: string;
  problemStatement: string;
  hypothesizedSolution: string;
  citedReviews: { id: string; author: string; text: string; source: string }[];
  targetSegments: string[];
}

const OPPORTUNITY_AREAS: OpportunityArea[] = [
  {
    id: "opp-1",
    title: "Wishlist Intent-Driven Conversion & Smart Triggers",
    category: "wishlist_conversion",
    status: "high_priority",
    targetMetric: "Wishlist-to-Cart Conversion Rate",
    metricImpact: "+13% to +22% conversion lift",
    quantifiedSignal: {
      mentionCount: 28,
      frictionPercentage: 74,
      estimatedRevenueLift: "₹18.4 Cr / month",
    },
    effort: "Medium",
    impact: "Very High",
    summary: "Users treat wishlists as passive mood boards or postponed shortlists (~9.4% conversion). Organizing wishlists into actionable occasion folders, smart sizing alerts, and 'Complete the Look' outfit pairing drives conversion without any price discounts.",
    problemStatement: "Wishlists currently lack dynamic psychological motivation triggers. Users save dozens of items for months, leading to out-of-stock drop-offs and decision paralysis rather than sales conversions.",
    hypothesizedSolution: "Implement multi-tiered structured wishlist folders ('Occasion Bucket', 'Fit Shortlist', 'Seasonal Wardrobe') paired with real-time low-stock alerts ('Only 2 left in Size M') and interactive 1-tap outfit bundling (Zero discounts required).",
    citedReviews: [
      { id: "rev-1", author: "DealTracker_Priya", source: "Google Play", text: "I add fashion products to my wishlist mainly to keep track of items. Without smart reminders or styling suggestions, I forget why I even saved them." },
      { id: "rev-2", author: "u/aesthetic_curator", source: "Reddit", text: "My wishlist is basically a Pinterest mood board. I save aesthetic outfits and styling ideas, but I only end up purchasing maybe 10% of what's in there." },
      { id: "rev-3", author: "SalaryDayShopper", source: "App Store", text: "I postpone purchases because of uncertainty. If an item in my wishlist gives me a 'Low stock in your size' or outfit pairing alert, I checkout immediately." },
    ],
    targetSegments: ["High-Intent Curators", "Gen-Z Trend Curators", "Occasion Planners"],
  },
  {
    id: "opp-2",
    title: "Universal Fit & Body-Type Sizing Confidence",
    category: "sizing_fit",
    status: "high_priority",
    targetMetric: "Post-Purchase Return Rate & Cart Hesitation",
    metricImpact: "-31% return rate, +14% checkout confidence",
    quantifiedSignal: {
      mentionCount: 34,
      frictionPercentage: 82,
      estimatedRevenueLift: "₹24.1 Cr savings & lift",
      returnRateReduction: "32% → 21%",
    },
    effort: "High",
    impact: "Very High",
    summary: "Inconsistent brand sizing across western and ethnic lines causes high cart postponement and returns. Introducing standardized body measurements (cm) and realistic user-curated fit ratings eliminates purchase doubt.",
    problemStatement: "Sizing varies drastically between brands (Roadster vs Vero Moda). Users cannot gauge fit from edited model photos and abandon items in cart.",
    hypothesizedSolution: "Standardize garment dimensions in centimeters, integrate user height/weight fit benchmarks, and add curated customer photo reviews with body-type filters.",
    citedReviews: [
      { id: "rev-4", author: "Ananya_FitIssues", source: "Google Play", text: "What prevents me from buying wishlisted items is sizing uncertainty. Every brand on Myntra has different size metrics. Wish there was a universal fit score." },
      { id: "rev-5", author: "CurvyStyleGuide", source: "Google Play", text: "Virtual try-on AR is great in theory, but it doesn't accurately represent curvy or petite Indian body types. That uncertainty keeps items sitting in my wishlist." },
      { id: "rev-6", author: "@fashionhaulseeker", source: "YouTube", text: "I search for YouTube try-on haul videos and Instagram reels before buying anything over ₹2000. Seeing the drape on a real person is essential validation." },
    ],
    targetSegments: ["Curvy & Petite Shoppers", "First-time Brand Buyers", "High-AOV Apparel"],
  },
  {
    id: "opp-3",
    title: "Side-by-Side Shortlist & Cross-Garment Comparison",
    category: "comparison",
    status: "quick_win",
    targetMetric: "Decision Velocity & Product Consideration",
    metricImpact: "+35% faster time-to-purchase, +18% basket completion",
    quantifiedSignal: {
      mentionCount: 19,
      frictionPercentage: 61,
      estimatedRevenueLift: "₹9.8 Cr / month",
    },
    effort: "Low",
    impact: "High",
    summary: "Users frequently shortlist 4-6 similar products (e.g. black party heels or wedding kurtas) but struggle to compare fabric, neckline, and reviews on mobile without switching tabs.",
    problemStatement: "No native comparison utility exists for wishlisted items, forcing users to tab-switch or abandon research to check third-party apps (Ajio/Nykaa).",
    hypothesizedSolution: "Launch a 'Compare Shortlist' tool in the Wishlist interface that creates a split-screen matrix of fabric composition, fit rating, customer images, and price-per-wear value.",
    citedReviews: [
      { id: "rev-7", author: "ComparisonQueen", source: "App Store", text: "I often compare 4-5 shortlisted black heels side by side. It's so frustrating that Myntra doesn't have a split-screen or side-by-side spec comparison table." },
      { id: "rev-8", author: "WeddingGuestSneha", source: "App Store", text: "Wishlisted 6 dresses for a wedding next month. I use the wishlist as a shortlisting mechanism to compare colors and necklines before making a final choice." },
    ],
    targetSegments: ["Occasion Shoppers", "Footwear & Accessories", "Multi-brand Researchers"],
  },
  {
    id: "opp-4",
    title: "Fabric Transparency, Opacity & Wash-Care Durability Index",
    category: "fabric_transparency",
    status: "quick_win",
    targetMetric: "Product Page Conversion & Quality Trust",
    metricImpact: "+11% product page conversion, -24% quality-related returns",
    quantifiedSignal: {
      mentionCount: 16,
      frictionPercentage: 53,
      estimatedRevenueLift: "₹7.2 Cr / month",
    },
    effort: "Low",
    impact: "Medium",
    summary: "Generic descriptions like 'Polyester blend' fail to convey fabric sheer/opacity, stretch factor, and longevity after wash, triggering hesitation on mid-to-high ticket apparel.",
    problemStatement: "Shoppers cannot touch fabric online; edited studio photography masks transparency and texture, leading to distrust and postponed checkout.",
    hypothesizedSolution: "Introduce standardized fabric badges: Sheerness Gauge (Opaque/Semi-sheer), Stretch Index (Non-stretch to High-stretch), and Fabric Weight (GSM rating).",
    citedReviews: [
      { id: "rev-9", author: "FabricConscious", source: "App Store", text: "I liked a blazer and wishlisted it, but the fabric details were so vague ('polyester blend') that I hesitated. I need to know fabric thickness and lining quality." },
      { id: "rev-10", author: "DurabilityCheck", source: "Google Play", text: "Big uncertainty: how does this fabric look after 2 washes? The product page doesn't show wash-care durability or transparency level." },
    ],
    targetSegments: ["Premium Apparel Buyers", "Summer & Ethnic Wear", "Working Professionals"],
  },
  {
    id: "opp-5",
    title: "Occasion & Event-Driven Discovery Engine",
    category: "occasion_discovery",
    status: "strategic_bet",
    targetMetric: "Discovery Depth & Cross-Category Basket Size",
    metricImpact: "+26% multi-category basket adoption, +18% AOV",
    quantifiedSignal: {
      mentionCount: 22,
      frictionPercentage: 58,
      estimatedRevenueLift: "₹14.5 Cr / month",
    },
    effort: "Medium",
    impact: "High",
    summary: "Users shop for specific real-life occasions (Haldi ceremonies, Goa vacations, boardroom meetings) rather than isolated garment categories (shirts, pants).",
    problemStatement: "Search is heavily keyword-literal. Searching 'wedding guest' or 'brunch outfit' surfaces disconnected items without coordinated aesthetic guidance.",
    hypothesizedSolution: "Build an AI-powered 'Occasion Studio' that pairs wishlisted garments with complementary accessories, footwear, and jewelry to complete full event looks.",
    citedReviews: [
      { id: "rev-11", author: "u/occasion_filter_fan", source: "Reddit", text: "Consistently unmet need: We need a 'Filter by Occasion' (e.g. Haldi ceremony, Sunday brunch, Formal boardroom) and exact garment measurements." },
      { id: "rev-12", author: "StylingEnthusiast", source: "App Store", text: "The 'Complete the Look' and matching outfit suggestions are phenomenal! It helped me pick the right trousers to style with my shirt in one go." },
    ],
    targetSegments: ["Wedding & Festive Shoppers", "Vacation Planners", "Complete Look Buyers"],
  },
  {
    id: "opp-6",
    title: "Flash Sale & EORS Peak Checkout Infrastructure Resilience",
    category: "checkout_reliability",
    status: "high_priority",
    targetMetric: "Sale Event Checkout Completion Rate",
    metricImpact: "-65% checkout drop-off, +₹32 Cr GMV capture during sales",
    quantifiedSignal: {
      mentionCount: 25,
      frictionPercentage: 79,
      estimatedRevenueLift: "₹32.0 Cr per EORS",
    },
    effort: "High",
    impact: "Very High",
    summary: "Flash sales and End of Reason Sale surges cause payment gateway timeouts and cart emptying, directly destroying the highest-intent transactions of the quarter.",
    problemStatement: "Users lose wishlisted items during high-traffic sales due to UPI gateway crashes, leading to severe frustration and switching to competitors like Ajio.",
    hypothesizedSolution: "Implement 15-minute cart reservation locks on wishlisted sale items and seamless asynchronous retry queues for failed UPI transactions.",
    citedReviews: [
      { id: "rev-13", author: "SaleCrashVictim", source: "Google Play", text: "App crashes and payment gateway timeouts during EORS flash sales cause me to lose wishlisted items that sell out in minutes. Fix the payment stability!" },
      { id: "rev-14", author: "AngryShopper", source: "App Store", text: "Payment gateway keeps failing on UPI. Myntra please fix this immediately!" },
    ],
    targetSegments: ["Sale Rush Shoppers", "UPI Users", "High-Velocity Cart Checkouts"],
  },
];

export function OpportunitiesView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeOpportunity, setActiveOpportunity] = useState<OpportunityArea>(OPPORTUNITY_AREAS[0]);
  const [reviewTotal, setReviewTotal] = useState<number>(40);
  const activeProjectId = useApp((s) => s.activeProjectId);
  const setView = useApp((s) => s.setView);

  useEffect(() => {
    let alive = true;
    const fetchLiveStats = async () => {
      try {
        const { api } = await import("@/lib/api");
        const s = await api.stats(activeProjectId);
        if (alive && s.totals.total > 0) {
          setReviewTotal(s.totals.total);
        }
      } catch {}
    };
    fetchLiveStats();

    const onRefresh = () => fetchLiveStats();
    window.addEventListener("rp-refresh", onRefresh);
    return () => {
      alive = false;
      window.removeEventListener("rp-refresh", onRefresh);
    };
  }, [activeProjectId]);

  const filteredOpportunities = useMemo(() => {
    if (selectedCategory === "all") return OPPORTUNITY_AREAS;
    return OPPORTUNITY_AREAS.filter((o) => o.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Opportunity Areas"
        description="Quantified, comparative product opportunities designed to directly influence Myntra's core business metrics (Conversion, Returns, Wishlist-to-Cart Velocity)."
      />

      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Identified Opportunities"
          value="6 Priority Areas"
          deltaLabel={`Across ${reviewTotal}+ live review patterns`}
          accent="blue"
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Est. Total Revenue Lift"
          value="₹105.9 Cr"
          deltaLabel="Annualized impact across areas"
          accent="green"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Primary Target Metric"
          value="Wishlist Conversion"
          deltaLabel="Baseline: 9% → Target: 22%"
          accent="amber"
          icon={<Percent className="h-4 w-4" />}
        />
        <StatCard
          label="Return Rate Opportunity"
          value="-11% Reduction"
          deltaLabel="Fit & Fabric Confidence"
          accent="red"
          icon={<Zap className="h-4 w-4" />}
        />
      </div>

      {/* Main comparative workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: List of Opportunity Areas with metrics */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Prioritized Opportunity Pipeline
            </h3>
            <span className="text-xs text-muted-foreground">{filteredOpportunities.length} opportunities</span>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "wishlist_conversion" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedCategory("wishlist_conversion")}
            >
              Wishlist Intent
            </Button>
            <Button
              variant={selectedCategory === "sizing_fit" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedCategory("sizing_fit")}
            >
              Fit & Sizing
            </Button>
            <Button
              variant={selectedCategory === "comparison" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedCategory("comparison")}
            >
              Comparison
            </Button>
          </div>

          <div className="space-y-2.5">
            {filteredOpportunities.map((opp) => {
              const isSelected = activeOpportunity.id === opp.id;
              return (
                <Card
                  key={opp.id}
                  onClick={() => setActiveOpportunity(opp)}
                  className={`cursor-pointer transition-all duration-200 border p-4 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                      : "border-border/60 bg-card hover:border-border hover:bg-secondary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {opp.status === "high_priority" && (
                          <Badge variant="destructive" className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">
                            High Priority
                          </Badge>
                        )}
                        {opp.status === "quick_win" && (
                          <Badge variant="default" className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-4 bg-emerald-600">
                            Quick Win
                          </Badge>
                        )}
                        {opp.status === "strategic_bet" && (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">
                            Strategic Bet
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Impact: {opp.impact}
                        </span>
                      </div>
                      <h4 className="font-heading text-sm font-semibold text-foreground pt-0.5">
                        {opp.title}
                      </h4>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground"}`} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                    <span className="text-primary font-medium">{opp.metricImpact}</span>
                    <span className="font-mono text-[11px]">{opp.quantifiedSignal.estimatedRevenueLift}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right column: Detailed breakdown of active opportunity */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="border-border/60 bg-card p-6 shadow-sm">
            {/* Header info */}
            <div className="space-y-2 border-b border-border/60 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary">
                  Influenced Metric: {activeOpportunity.targetMetric}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Effort: <strong>{activeOpportunity.effort}</strong></span>
                  <span>•</span>
                  <span>Impact: <strong>{activeOpportunity.impact}</strong></span>
                </div>
              </div>

              <h2 className="font-heading text-xl font-bold text-foreground">
                {activeOpportunity.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeOpportunity.summary}
              </p>
            </div>

            {/* Quantified Business Metric Influence */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-xl border border-border/60 bg-secondary/20 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Target Metric Lift</p>
                <p className="mt-1 font-heading text-base font-bold text-emerald-500">
                  {activeOpportunity.metricImpact}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Revenue Uplift</p>
                <p className="mt-1 font-heading text-base font-bold text-primary">
                  {activeOpportunity.quantifiedSignal.estimatedRevenueLift}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">User Friction Score</p>
                <p className="mt-1 font-heading text-base font-bold text-amber-500">
                  {activeOpportunity.quantifiedSignal.frictionPercentage}% of review cohort
                </p>
              </div>
            </div>

            {/* Problem & Hypothesis */}
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" /> Friction & Root Cause
                </h4>
                <p className="text-xs text-foreground/90 leading-relaxed rounded-lg border border-border/60 bg-secondary/30 p-3">
                  {activeOpportunity.problemStatement}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Product Opportunity & Hypothesis
                </h4>
                <p className="text-xs text-foreground/90 leading-relaxed rounded-lg border border-border/60 bg-primary/5 p-3 text-primary/95">
                  {activeOpportunity.hypothesizedSolution}
                </p>
              </div>
            </div>

            {/* Evidence & Grounded Review Excerpts */}
            <div className="mt-6 space-y-2.5">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Customer Evidence & Reviews ({activeOpportunity.citedReviews.length})</span>
                <span className="text-[10px] text-muted-foreground lowercase">Grounded Citations</span>
              </h4>
              <div className="space-y-2">
                {activeOpportunity.citedReviews.map((rev, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span className="font-semibold text-foreground">{rev.author}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {rev.source}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Segments */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Target Segments:</span>
                {activeOpportunity.targetSegments.map((seg, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {seg}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setView("chat")}
              >
                <Sparkles className="h-3.5 w-3.5" /> Analyze with AI Chat
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
