"use client";

import { useApp } from "@/store/app";
import { Button } from "@/components/ui/button";
import { MyntraLogo } from "@/components/ui/myntra-logo";
import {
  ArrowRight,
  Bot,
  Database,
  Target,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Database,
    title: "Multi-Channel Review Feeds",
    desc: "Auto-ingest user conversations from Google Play, App Store, Reddit (r/IndianFashionAddicts), YouTube comments, and Trustpilot.",
    accent: "rp-bg-medium",
  },
  {
    icon: Sparkles,
    title: "AI Intent & Sizing Classification",
    desc: "Every review is tagged with fashion sentiment, fit uncertainty, fabric ambiguity, and wishlist motivation.",
    accent: "rp-bg-positive",
  },
  {
    icon: Bot,
    title: "Grounded RAG Discovery Analyst",
    desc: "Ask 10 strategic PM growth questions and receive concise 4-5 line analyses with exact cited review numbers.",
    accent: "rp-bg-mixed",
  },
  {
    icon: Target,
    title: "Quantified Opportunity Areas",
    desc: "6 prioritized business interventions addressing the 30-day wishlist conversion gap under strict zero-discount constraints.",
    accent: "rp-bg-high",
  },
  {
    icon: Users,
    title: "Fashion Cohort Segmentation",
    desc: "Slice feedback across Deal Hunters, Curators, Occasion Planners, and Body-Type clusters to understand hesitation drivers.",
    accent: "rp-bg-negative",
  },
  {
    icon: Lightbulb,
    title: "Non-Monetary Growth Levers",
    desc: "Psychological framing, occasion bundling, standardized fit metrics, and comparison matrixes that convert without margin erosion.",
    accent: "rp-bg-medium",
  },
];

const STEPS = [
  {
    n: "01",
    icon: Database,
    title: "Ingest Feedback",
    desc: "Aggregate reviews and fashion community threads across app stores, Reddit, and social media into normalized vector embeddings.",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "Diagnose Friction",
    desc: "DeepSeek LLM extracts genuine purchase intent vs bookmarking behavior, identifying sizing, fabric, and decision paralysis bottlenecks.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Convert Wishlists",
    desc: "Execute on 6 quantified product opportunities to increase 30-day wishlist purchase conversions without monetary incentives.",
  },
];

const STATS = [
  { value: "40+", label: "Indexed Reviews" },
  { value: "6", label: "Opportunity Areas" },
  { value: "22%", label: "Target Conv. Rate" },
  { value: "₹0", label: "Discount Cost" },
];

export function Landing() {
  const setView = useApp((s) => s.setView);
  const goDashboard = () => setView("overview");
  const goOpportunities = () => setView("opportunities");
  const goChat = () => setView("chat");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <MyntraLogo className="h-7 w-7" />
            <div className="flex flex-col leading-none">
              <span className="font-heading text-base font-black tracking-tight text-foreground lowercase">myntra</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Growth Engine</span>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Capabilities</a>
            <a href="#opportunity" className="hover:text-foreground">Opportunity Areas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 bg-primary text-white hover:bg-primary/90" onClick={goDashboard}>
              Launch Discovery Engine <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="rp-hero-grid absolute inset-0" />
        <div className="rp-grid-lines absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Myntra Growth Labs · Wishlist-to-Purchase Initiative
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl text-foreground">
              Turn Wishlisted Items into <span className="myntra-gradient-text">30-Day Purchases</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Millions of fashion shoppers save products but hesitate before checkout. Our AI Discovery Engine analyzes thousands of customer conversations to diagnose sizing doubts, fabric ambiguity, and comparison fatigue—unlocking conversion without monetary incentives.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25" onClick={goOpportunities}>
                <Target className="h-4 w-4" /> Explore 6 Opportunity Areas
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-border/60" onClick={goChat}>
                <Bot className="h-4 w-4 text-primary" /> Ask AI Discovery Analyst
              </Button>
            </div>

            {/* Stats strip */}
            <div className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
                  <p className="font-heading text-2xl font-black text-foreground">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/40 bg-card/20">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Discovery Framework</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">
              From Customer Feedback to Growth Interventions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Diagnosing the psychological hurdles behind wishlist stagnation under a zero-discount constraint.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.n} className="rp-card-hover relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6">
                  <div className="absolute -right-4 -top-4 font-heading text-7xl font-bold text-foreground/5">{step.n}</div>
                  <div className="rp-bg-medium mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Capabilities</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">
              Engineered for Fashion Growth Product Managers
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="rp-card-hover rounded-2xl border border-border/60 bg-card p-6">
                  <div className="rp-bg-medium mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{feat.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-border/40 bg-card/40 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <MyntraLogo className="h-6 w-6" />
            <span className="text-xs text-muted-foreground">
              Myntra Fashion Discovery &amp; Wishlist Growth Engine
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={goDashboard} className="gap-2 bg-primary text-white hover:bg-primary/90">
              Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
