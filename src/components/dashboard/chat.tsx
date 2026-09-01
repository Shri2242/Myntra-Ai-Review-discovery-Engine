"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceBadge, RatingStars } from "@/components/dashboard/shared";
import { api } from "@/lib/api";
import type { ChatSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/store/app";
import {
  Zap,
  Globe,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

/* ---------------- Types ---------------- */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  loading?: boolean;
  error?: boolean;
}

const PRIMARY_QUESTIONS = [
  "Why do users add fashion products to their wishlist?",
  "What prevents wishlisted products from eventually being purchased?",
  "What uncertainties remain after users have identified a product they like?",
  "What causes users to postpone a purchase?",
];

const MORE_QUESTIONS = [
  "How do users compare multiple shortlisted products?",
  "What information do users seek outside Myntra/AJIO before purchasing?",
  "What role do fit, size, styling, price, reviews, occasion and social validation play?",
  "When do users use the wishlist as genuine purchase intent versus simply as a bookmarking mechanism?",
  "How do these behaviors differ across user segments?",
  "What unmet needs emerge consistently across user conversations?",
];

/* ---------------- Citation Chip ---------------- */

function CitationChip({ n, onClick }: { n: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Jump to source ${n}`}
      className="mx-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 px-1 align-middle text-[11px] font-extrabold transition"
    >
      {n}
    </button>
  );
}

function FormattedAnswer({
  content,
  sources,
  onCitationClick,
}: {
  content: string;
  sources?: ChatSource[];
  onCitationClick: (idx: number) => void;
}) {
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground">
      {paragraphs.map((para, pIdx) => {
        const paraParts: (string | number)[] = [];
        let pLast = 0;
        let pMatch: RegExpExecArray | null;
        const pRegex = /\[(?:Review\s*#?|Source\s*#?)?(\d+)\]/gi;

        while ((pMatch = pRegex.exec(para)) !== null) {
          if (pMatch.index > pLast) {
            paraParts.push(para.slice(pLast, pMatch.index));
          }
          const num = parseInt(pMatch[1], 10);
          if (!Number.isNaN(num)) {
            paraParts.push(num);
          } else {
            paraParts.push(pMatch[0]);
          }
          pLast = pRegex.lastIndex;
        }
        if (pLast < para.length) {
          paraParts.push(para.slice(pLast));
        }

        return (
          <p key={pIdx}>
            {paraParts.map((item, iIdx) =>
              typeof item === "number" ? (
                <CitationChip
                  key={iIdx}
                  n={item}
                  onClick={() => onCitationClick(item - 1)}
                />
              ) : (
                <span key={iIdx}>{item}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const activeProjectId = useApp((s) => s.activeProjectId);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || sending) return;

      const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: "user", content: q };
      const aiId = `a_${Date.now()}`;
      const aiMsg: ChatMessage = { id: aiId, role: "assistant", content: "", loading: true };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setInput("");
      setSending(true);

      try {
        const res = await api.chat(q, activeProjectId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, content: res.answer, sources: res.sources, loading: false }
              : m,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, content: `Unable to process request: ${msg}`, loading: false, error: true }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [sending, activeProjectId, toast],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="relative flex min-h-[calc(100vh-60px)] flex-col justify-between py-6 px-4 sm:px-8">
      {/* Session Active Header */}
      {messages.length > 0 && (
        <div className="mx-auto w-full max-w-3xl mb-6 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
              Research Assistant · Active Topic
            </p>
          </div>
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>New Research Topic</span>
          </button>
        </div>
      )}

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col justify-center">
        {messages.length === 0 ? (
          /* Landing State (Matches Screenshot Layout) */
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center my-auto py-6">
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
              What are users saying about fashion wishlist &amp; discovery?
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
              Ask anything or select a key thematic question below to get grounded AI answers.
            </p>

            {/* Questions Pill List */}
            <div className="mt-8 flex w-full flex-col gap-3">
              {PRIMARY_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={sending}
                  className="group flex w-full items-center justify-start gap-3.5 rounded-full border border-border bg-card px-6 py-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all hover:border-amber-500/50 hover:bg-amber-500/[0.03] hover:shadow-md disabled:opacity-50"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <Zap className="h-3.5 w-3.5 fill-amber-500" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-foreground/90 group-hover:text-foreground">
                    {q}
                  </span>
                </button>
              ))}

              {/* Expanded Questions */}
              {showMore &&
                MORE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    disabled={sending}
                    className="group flex w-full items-center justify-start gap-3.5 rounded-full border border-border bg-card px-6 py-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all hover:border-amber-500/50 hover:bg-amber-500/[0.03] hover:shadow-md disabled:opacity-50 animate-in fade-in duration-200"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                      <Zap className="h-3.5 w-3.5 fill-amber-500" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-foreground/90 group-hover:text-foreground">
                      {q}
                    </span>
                  </button>
                ))}

              {/* View More Questions Button */}
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border/80 bg-card/40 py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:border-foreground/40 hover:text-foreground transition"
              >
                <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{showMore ? "Show Fewer Questions" : "View More Questions"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Chat Stream */
          <div className="mx-auto w-full max-w-3xl space-y-6 pb-28">
            {messages.map((m) => (
              <div key={m.id} className="space-y-3">
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 px-5 py-3.5 text-sm sm:text-base font-semibold text-foreground max-w-xl shadow-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-heading text-xs font-bold uppercase tracking-wider text-primary">
                        AI Research Findings
                      </span>
                    </div>

                    {m.loading ? (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        <span>Synthesizing grounding reviews…</span>
                      </div>
                    ) : (
                      <>
                        <FormattedAnswer
                          content={m.content}
                          sources={m.sources}
                          onCitationClick={(idx) => {}}
                        />

                        {/* Grounding Source Quotes */}
                        {m.sources && m.sources.length > 0 && (
                          <div className="mt-5 border-t border-border pt-4 space-y-2.5">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                              Grounding Review Excerpts ({m.sources.length})
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {m.sources.slice(0, 4).map((s, idx) => (
                                <div
                                  key={s.reviewId || idx}
                                  className="rounded-xl border border-border bg-secondary/40 p-3 text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                                        {idx + 1}
                                      </span>
                                      <span className="font-bold text-foreground truncate max-w-[100px]">
                                        {s.author || "Customer"}
                                      </span>
                                    </div>
                                    <SourceBadge source={s.source} />
                                  </div>
                                  <p className="text-muted-foreground line-clamp-2 italic text-[11px]">
                                    &ldquo;{s.text}&rdquo;
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Floating Search Capsule Bar */}
      <div className="sticky bottom-2 mx-auto w-full max-w-3xl pt-2 pb-1">
        <div className="relative flex items-center rounded-full border-2 border-border/90 bg-card p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all focus-within:border-foreground/70">
          <input
            ref={textareaRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Ask a custom question (e.g. why users hesitate on sizing or fabric)..."
            className="flex-1 bg-transparent px-5 text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="flex items-center gap-1.5 rounded-full bg-[#f5a623] hover:bg-[#e0961a] text-black font-black px-6 py-2.5 text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <span>{sending ? "Searching…" : "Ask AI"}</span>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          AI-generated responses may contain inaccuracies.
        </p>
      </div>
    </div>
  );
}
