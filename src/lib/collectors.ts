/**
 * ReviewPulse — Collector sources.
 *
 * Real collection is attempted where the public API is reachable from the
 * sandbox:
 *   - reddit:   public JSON API (https://www.reddit.com/r/.../search.json) — NO KEY
 *   - google_play / app_store / twitter: external scrapers may be blocked or
 *     require keys, so we fall back to a realistic sample batch with unique
 *     sourceReviewIds (so the dedup path still exercises the "duplicate"
 *     branch on subsequent runs).
 *
 * Every collector returns FetchedReview[] with a contentHash so /api/collect
 * can dedup against existing rows.
 */
import { createHash } from "crypto";

export interface FetchedReview {
  text: string;
  title: string | null;
  rating: number;
  source: "google_play" | "app_store" | "reddit" | "twitter" | "youtube" | "web_reviews";
  author: string;
  sourceReviewId: string;
  contentHash: string;
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/* ----------------------------- Real Reddit collector ----------------------------- */

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  createdUtc: number;
  score: number;
}

/** Fetch real posts from a subreddit via Reddit's public JSON API (no auth). */
export async function fetchRedditPosts(
  subreddit: string,
  query?: string,
  limit = 25,
): Promise<RedditPost[]> {
  const base = query
    ? `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?restrict_sr=1&q=${encodeURIComponent(query)}&sort=new&limit=${limit}`
    : `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=${limit}`;
  const res = await fetch(base, {
    headers: { "User-Agent": "ReviewPulse/1.0 (review-discovery-engine)" },
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`Reddit API returned ${res.status}`);
  }
  const json = (await res.json()) as {
    data?: { children?: { data: RedditPost }[] };
  };
  const children = json?.data?.children ?? [];
  return children
    .map((c) => c.data)
    .filter((p): p is RedditPost => !!p && !!p.id && (!!p.title || !!p.selftext));
}

/** Convert a Reddit post into a FetchedReview (rating inferred from sentiment words). */
function redditPostToFetched(post: RedditPost): FetchedReview {
  const text = post.selftext?.trim()
    ? `${post.title}. ${post.selftext.trim()}`
    : post.title.trim();
  const lower = text.toLowerCase();
  // Crude rating inference from sentiment words — these are real user posts
  // that don't carry a 1-5 rating, so we estimate for the analysis pipeline.
  const neg = /(hate|broken|bug|crash|terrible|awful|worst|frustrat|annoying|useless|can't|broken)/.test(lower);
  const pos = /(love|great|amazing|perfect|awesome|best|fantastic|excellent)/.test(lower);
  const rating = neg ? (pos ? 2 : 1) : pos ? 5 : 3;
  return {
    text: text.slice(0, 2000),
    title: post.title.slice(0, 500),
    rating,
    source: "reddit",
    author: post.author ? `u/${post.author}` : "u/unknown",
    sourceReviewId: `reddit:${post.subreddit}:${post.id}`,
    contentHash: hash(text),
  };
}

/* ----------------------------- Simulated samples (fallback) ----------------------------- */

const GOOGLE_PLAY_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: "Size AI is completely off", text: "The AI size recommendation suggested XL for me when I'm a medium everywhere else. Please fix the algorithm or at least let me set my own measurements manually.", rating: 2, author: "meenakshi_shops" },
  { title: "Best fashion app in India", text: "Myntra has the best collection and fast delivery. The app is smooth, returns are easy, and the style quiz feature personalises my feed perfectly.", rating: 5, author: "fashionlover_2023" },
  { title: "App crashes during checkout", text: "The app keeps crashing on the payment screen during sale events. Lost my cart 3 times during the EORS. Very frustrating experience.", rating: 1, author: "frustrated_shopper_raj" },
];

const APP_STORE_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: "Loved the virtual try-on", text: "The virtual try-on is such a game changer — helped me pick the right fit without returning. The lighting simulation is realistic and accurate.", rating: 5, author: "tryonlover99" },
  { title: "Wish search was smarter", text: "Searching for 'floral midi dress' shows completely random results. The search algorithm doesn't understand intent at all. Need semantic or visual search.", rating: 2, author: "fashionsearchfail" },
  { title: "Wishlist price drop alerts are 🔥", text: "Got a notification that a kurta in my wishlist dropped in price. Bought it immediately. This feature alone is worth 5 stars.", rating: 5, author: "pricealertfan" },
];

const REDDIT_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: null, text: "Can we talk about how Myntra's size guide is completely useless? I measured myself exactly as they said and the kurta still doesn't fit.", rating: 2, author: "u/fashionsizerant" },
  { title: null, text: "Myntra's End of Reason Sale was actually worth it this year — no kidding. Got a premium kurta set for ₹600.", rating: 4, author: "u/sale_believer" },
  { title: null, text: "The wishlist is genuinely just a mood board for me — I rarely actually buy from it. It's more like Pinterest.", rating: 3, author: "u/wishlist_curator" },
];

const TWITTER_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: null, text: "myntra sizing is such a joke — ordered M got XS vibes. the AI size recommendation is completely off", rating: 2, author: "@fashionrant_in" },
  { title: null, text: "genuinely love how myntra's wishlist sends me price drop alerts. just bought 3 things I'd been eyeing for months!", rating: 5, author: "@saledaydreams" },
];

/* ----------------------------- Fashion & Shopping sample data ----------------------------- */

const YOUTUBE_FASHION_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: null, text: "Ordered from Myntra for the first time after watching this haul — sizing is SO off. The medium fits like an XS, really wish they showed actual measurements instead of just S/M/L.", rating: 2, author: "@fashionfindsofficial" },
  { title: null, text: "Ajio's End of Reason sale is actually legit this time. Got 3 kurtas under ₹800 and quality feels premium. Fabric is breathable and the stitching is clean.", rating: 5, author: "@stylewithananya" },
  { title: null, text: "Myntra returns are such a pain — the pickup guy never shows up on the slot they give you. Ordered twice and returned twice, both times wasted half a day waiting.", rating: 1, author: "@thriftymegha" },
  { title: null, text: "Meesho streetwear haul: some hits, lots of misses. The printed t-shirts looked way brighter in the photos. Color accuracy is a big problem on this app.", rating: 2, author: "@delhifashiondude" },
  { title: null, text: "Nykaa Fashion surprised me — received the order in 2 days and the packaging was so premium. The saree fabric is exactly as described. Would definitely order again.", rating: 5, author: "@ethnicvibeswithpriya" },
  { title: null, text: "The try-on feature on Myntra is actually helpful but the AR fitting is still not accurate for curvy body types. My shape never matches the model's proportions.", rating: 3, author: "@curvyandstylish" },
  { title: null, text: "Urbanic haul — trendy stuff but you're paying premium for marketing, not quality. The co-ord set literally fell apart after one wash.", rating: 1, author: "@honestfashionreviews" },
  { title: null, text: "ASOS delivery to India takes 12-15 days but the quality is consistent and sizing is way more accurate than Indian fast fashion apps.", rating: 4, author: "@globaltrendsindian" },
];

const WEB_REVIEWS_FASHION_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: "Sizing is inconsistent across brands", text: "I've been shopping on Myntra for 2 years. The biggest issue is sizing — a medium from one brand is completely different from another. They need a standardized size chart or real measurements in cm.", rating: 2, author: "Priyanka S." },
  { title: "Fast delivery but quality let down", text: "Meesho's delivery speed has improved dramatically. Orders arrive within 2-3 days in tier-2 cities now. But the product quality at the lower price points is hit or miss — the images can be misleading.", rating: 3, author: "Rohan M." },
  { title: "Excellent curation on Nykaa Fashion", text: "Nykaa Fashion has the best ethnic wear curation I've found online. The filters are intuitive, fabric details are accurate, and customer photos help a lot with the decision.", rating: 5, author: "Deepika R." },
  { title: "Returns process is a nightmare", text: "Ajio's return pickup service is unreliable. The delivery partner cancelled 3 times without any notification and I had to eventually drop off at the hub myself.", rating: 1, author: "Vishal K." },
  { title: "Great discounts but shipping takes ages", text: "The End of Reason Sale deals on Ajio are genuinely good — up to 80% on brands I love. But standard shipping takes 7-10 days which kills the excitement.", rating: 3, author: "Sneha T." },
  { title: "Myntra's fashion AI is impressive", text: "The 'Complete the Look' feature on Myntra actually suggests stylish combinations I wouldn't have thought of. Discovered a lot of new brands through it. Wish it worked for plus sizes too.", rating: 4, author: "Kavya N." },
];

const REDDIT_FASHION_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: null, text: "Can we talk about how Myntra's size guide is completely useless? I measured myself exactly as they said and the dress still doesn't fit. Is it just me?", rating: 2, author: "u/fashionsizerant" },
  { title: null, text: "Just got my Meesho order after seeing it go viral on here — honestly the price-to-quality ratio is unbeatable for basics. Ordered 5 plain tees for ₹400 total.", rating: 4, author: "u/frugalfashionista" },
  { title: null, text: "Nykaa Fashion has some genuinely beautiful pieces but their search and filter is terrible. Can't filter by sleeve length or neckline type which is baffling.", rating: 3, author: "u/IndianFashionAddict_" },
];

const GOOGLE_PLAY_FASHION_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: "Size recommendations are off", text: "The AI size recommendation suggested XL for me when I'm a medium everywhere else. Please fix the algorithm or at least let me set my own measurements.", rating: 2, author: "meenakshi_shops" },
  { title: "Best fashion app in India", text: "Myntra has the best collection and the fastest delivery. The app is smooth, returns are easy and I love the style quiz feature that personalises my feed.", rating: 5, author: "fashionlover_2023" },
  { title: "App crashes during checkout", text: "The app keeps crashing on the payment screen during sale events. Lost my cart 3 times during the EORS. Very frustrating experience.", rating: 1, author: "frustrated_shopper_raj" },
  { title: "Great discounts, terrible sizing", text: "Deals on Ajio are fantastic but every brand seems to have different sizing. I wish they'd standardize or at least show actual measurements next to size labels.", rating: 3, author: "ajio_regular" },
  { title: "Wish list sync is broken", text: "Items in my wishlist disappear after app updates. Also the notifications for price drops stopped working. Please fix these basic features.", rating: 2, author: "wishlist_broken_help" },
];

const APP_STORE_FASHION_SAMPLES: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[] = [
  { title: "Loved the try-on feature", text: "The virtual try-on is such a game changer — helped me pick the right fit without returning. The lighting simulation is realistic and face tracking is accurate.", rating: 5, author: "tryonlover99" },
  { title: "Search needs improvement", text: "Searching for 'floral midi dress' shows completely random results. The search algorithm doesn't understand intent at all. Need semantic/visual search.", rating: 2, author: "fashionsearchfail" },
  { title: "Customer support is great", text: "Had an issue with a damaged product and Myntra resolved it within 24 hours with a full refund. Customer support chat was instant and helpful.", rating: 5, author: "satisfied_customer_v" },
];

/**
 * Collect a batch of reviews for a source.
 * - reddit: REAL fetch from Reddit's public JSON API (no key needed)
 * - google_play: REAL fetch via google-play-scraper npm package
 * - app_store: REAL fetch via app-store-scraper npm package
 * - twitter: requires Apify API key (falls back to samples if not configured)
 *
 * All real fetches have graceful fallback to sample data if the external API
 * is unreachable (e.g. network restrictions in the sandbox).
 */
export async function collectReviews(
  sourceType: string,
  sourceName: string,
  config: Record<string, unknown> = {},
): Promise<{ reviews: FetchedReview[]; real: boolean }> {
  if (sourceType === "reddit") {
    const subreddit = (config.subreddit as string) || "IndianFashionAddicts";
    const query = (config.query as string) || "myntra fashion review";
    try {
      const posts = await fetchRedditPosts(subreddit, query, 50);
      if (posts.length > 0) {
        return { reviews: posts.map(redditPostToFetched), real: true };
      }
    } catch (err) {
      console.warn(`[collectors] Reddit fetch failed for r/${subreddit}, using fallback:`, err);
    }
    return { reviews: stampSamples(REDDIT_SAMPLES, "reddit", sourceName), real: false };
  }

  if (sourceType === "google_play") {
    try {
      const gplay = (await import("google-play-scraper")).default;
      const appId = (config.appId as string) || "com.grofers.customerapp";
      const lang = (config.lang as string) || "en";
      const reviews = await gplay.reviews({ appId, lang, sort: (gplay.sort as any).NEWEST, num: 50 });
      const fetched: FetchedReview[] = (reviews.data || []).map((r: { text?: string; score?: number; title?: string; date?: string; userName?: string; id?: string }) => ({
        text: r.text || r.title || "",
        title: r.title || null,
        rating: r.score || 3,
        source: "google_play" as const,
        author: r.userName || "Anonymous",
        sourceReviewId: r.id ? `google_play:${r.id}` : `google_play:${hash(r.text || "")}`,
        contentHash: hash(r.text || ""),
      })).filter((r: FetchedReview) => r.text.length > 0);
      if (fetched.length > 0) return { reviews: fetched, real: true };
    } catch (err) {
      console.warn("[collectors] Google Play fetch failed, using fallback:", err);
    }
    return { reviews: stampSamples(GOOGLE_PLAY_SAMPLES, "google_play", sourceName), real: false };
  }

  if (sourceType === "app_store") {
    try {
      const store = (await import("app-store-scraper")).default;
      const appId = (config.appId as string) || "1084248054";
      const country = (config.country as string) || "us";
      const reviews = await store.reviews({ id: appId, country, sort: store.sort.RECENT, page: 1, num: 50 });
      const fetched: FetchedReview[] = (reviews || []).map((r: { text?: string; score?: number; title?: string; updated?: string; userName?: string; id?: { toString: () => string } }) => ({
        text: r.text || "",
        title: r.title || null,
        rating: r.score || 3,
        source: "app_store" as const,
        author: r.userName || "Anonymous",
        sourceReviewId: r.id ? `app_store:${r.id.toString()}` : `app_store:${hash(r.text || "")}`,
        contentHash: hash(r.text || ""),
      })).filter((r: FetchedReview) => r.text.length > 0);
      if (fetched.length > 0) return { reviews: fetched, real: true };
    } catch (err) {
      console.warn("[collectors] App Store fetch failed, using fallback:", err);
    }
    return { reviews: stampSamples(APP_STORE_SAMPLES, "app_store", sourceName), real: false };
  }

  if (sourceType === "twitter") {
    // Twitter requires Apify API key. Fall back to samples.
    const apifyKey = config.apifyApiKey as string | undefined;
    if (!apifyKey) {
      return { reviews: stampSamples(TWITTER_SAMPLES, "twitter", sourceName), real: false };
    }
    // Real Apify integration would go here (same as the user's implementation).
    return { reviews: stampSamples(TWITTER_SAMPLES, "twitter", sourceName), real: false };
  }

  /* ------------------------------------------------------------------ */
  /* YouTube Comments collector                                           */
  /* ------------------------------------------------------------------ */
  if (sourceType === "youtube") {
    const apiKey = (config.apiKey as string) || process.env.YOUTUBE_API_KEY;
    const videoId = config.videoId as string | undefined;
    const channelId = config.channelId as string | undefined;
    const maxComments = Number(config.maxComments) || 50;

    if (apiKey && (videoId || channelId)) {
      try {
        let targetVideoIds: string[] = [];

        if (videoId) {
          // Single video
          targetVideoIds = [videoId];
        } else if (channelId) {
          // Fetch latest videos from channel first
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=5&key=${apiKey}`;
          const searchRes = await fetch(searchUrl, { cache: "no-store" });
          if (searchRes.ok) {
            const searchJson = (await searchRes.json()) as { items?: { id?: { videoId?: string } }[] };
            targetVideoIds = (searchJson.items ?? [])
              .map((i) => i.id?.videoId)
              .filter((id): id is string => !!id);
          }
        }

        const allComments: FetchedReview[] = [];
        for (const vid of targetVideoIds) {
          const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(vid)}&maxResults=${maxComments}&order=relevance&key=${apiKey}`;
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const json = (await res.json()) as {
            items?: {
              id: string;
              snippet?: {
                topLevelComment?: {
                  id: string;
                  snippet?: {
                    textDisplay?: string;
                    authorDisplayName?: string;
                    likeCount?: number;
                  };
                };
              };
            }[];
          };
          for (const item of json.items ?? []) {
            const snippet = item.snippet?.topLevelComment?.snippet;
            const commentId = item.snippet?.topLevelComment?.id ?? item.id;
            if (!snippet?.textDisplay) continue;
            const text = snippet.textDisplay.replace(/<[^>]+>/g, "").trim();
            if (!text) continue;
            // Infer rating from sentiment words in comment
            const lower = text.toLowerCase();
            const neg = /(bad|worst|terrible|awful|broken|scam|fake|poor|disappoint|return|refund|wrong|miss|lost|delayed|never|useless|horrible)/.test(lower);
            const pos = /(love|great|amazing|perfect|awesome|best|excellent|fantastic|beautiful|quality|recommend|happy|satisfied|good|nice|worth)/.test(lower);
            const rating = neg ? (pos ? 2 : 1) : pos ? 5 : 3;
            allComments.push({
              text: text.slice(0, 2000),
              title: null,
              rating,
              source: "youtube",
              author: snippet.authorDisplayName ?? "YouTubeUser",
              sourceReviewId: `youtube:${vid}:${commentId}`,
              contentHash: hash(text),
            });
          }
        }
        if (allComments.length > 0) return { reviews: allComments, real: true };
      } catch (err) {
        console.warn("[collectors] YouTube fetch failed, using fallback:", err);
      }
    } else {
      console.info("[collectors] YOUTUBE_API_KEY not set or no videoId/channelId — using fashion sample data.");
    }
    return { reviews: stampSamples(YOUTUBE_FASHION_SAMPLES, "youtube", sourceName), real: false };
  }

  /* ------------------------------------------------------------------ */
  /* Web / Product Reviews collector                                      */
  /* ------------------------------------------------------------------ */
  if (sourceType === "web_reviews") {
    const url = config.url as string | undefined;
    if (url) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; FashionReviewBot/1.0; +https://reviewpulse.app)",
            Accept: "text/html,application/json,application/ld+json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const html = await res.text();
          // Try to parse JSON-LD Review schema
          const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
          const webReviews: FetchedReview[] = [];
          for (const block of jsonLdMatches) {
            const inner = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
            try {
              const parsed = JSON.parse(inner);
              const items: unknown[] = Array.isArray(parsed)
                ? parsed
                : parsed["@graph"]
                ? (parsed["@graph"] as unknown[])
                : [parsed];
              for (const item of items) {
                const obj = item as Record<string, unknown>;
                if (obj["@type"] !== "Review" && obj["@type"] !== "UserReview") continue;
                const body = (obj.reviewBody as string) || (obj.description as string);
                if (!body) continue;
                const ratingObj = obj.reviewRating as Record<string, unknown> | undefined;
                const rating = ratingObj ? Math.round(Number(ratingObj.ratingValue) || 3) : 3;
                const author = (obj.author as Record<string, string> | undefined)?.name ?? "Reviewer";
                const reviewId = (obj["@id"] as string) ?? `web:${hash(body)}`;
                webReviews.push({
                  text: body.slice(0, 2000),
                  title: (obj.name as string | undefined) ?? null,
                  rating: Math.min(5, Math.max(1, rating)),
                  source: "web_reviews",
                  author,
                  sourceReviewId: `web_reviews:${reviewId}`,
                  contentHash: hash(body),
                });
              }
            } catch {
              // skip malformed JSON-LD
            }
          }
          if (webReviews.length > 0) return { reviews: webReviews, real: true };
        }
      } catch (err) {
        console.warn("[collectors] Web reviews fetch failed, using fallback:", err);
      }
    }
    return { reviews: stampSamples(WEB_REVIEWS_FASHION_SAMPLES, "web_reviews", sourceName), real: false };
  }

  return { reviews: [], real: false };
}

function stampSamples(
  base: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[],
  source: FetchedReview["source"],
  sourceName: string,
): FetchedReview[] {
  const stamp = Date.now();
  return base.map((b, i) => ({
    ...b,
    source,
    sourceReviewId: `${source}:${sourceName}:${stamp}:${i}`,
    contentHash: hash(b.text),
  }));
}

/** Back-compat: synchronous sample collector used by older call sites. */
export function collectSampleReviews(sourceType: string, sourceName: string): FetchedReview[] {
  let base: Omit<FetchedReview, "sourceReviewId" | "contentHash" | "source">[];
  let source: FetchedReview["source"];
  switch (sourceType) {
    case "google_play": base = [...GOOGLE_PLAY_SAMPLES, ...GOOGLE_PLAY_FASHION_SAMPLES]; source = "google_play"; break;
    case "app_store": base = [...APP_STORE_SAMPLES, ...APP_STORE_FASHION_SAMPLES]; source = "app_store"; break;
    case "reddit": base = [...REDDIT_SAMPLES, ...REDDIT_FASHION_SAMPLES]; source = "reddit"; break;
    case "twitter": base = TWITTER_SAMPLES; source = "twitter"; break;
    case "youtube": base = YOUTUBE_FASHION_SAMPLES; source = "youtube"; break;
    case "web_reviews": base = WEB_REVIEWS_FASHION_SAMPLES; source = "web_reviews"; break;
    default: return [];
  }
  return stampSamples(base, source, sourceName);
}

export const SOURCE_TYPE_INFO = [
  {
    type: "google_play",
    label: "Google Play",
    description: "Reviews from the Google Play Store for a given app ID.",
    configFields: [
      { key: "appId", label: "App ID", placeholder: "com.myntra.android", required: true },
      { key: "lang", label: "Language", placeholder: "en", required: false },
    ],
  },
  {
    type: "app_store",
    label: "App Store",
    description: "Reviews from the Apple App Store for a given numeric app ID.",
    configFields: [
      { key: "appId", label: "App ID", placeholder: "341299515", required: true },
      { key: "country", label: "Country", placeholder: "in", required: false },
    ],
  },
  {
    type: "reddit",
    label: "Reddit",
    description: "Posts from a subreddit via the public JSON API (no key needed). Real fetch attempted.",
    configFields: [
      { key: "subreddit", label: "Subreddit", placeholder: "IndianFashionAddicts", required: true },
      { key: "query", label: "Search query (optional)", placeholder: "sizing quality review", required: false },
    ],
  },
  {
    type: "twitter",
    label: "Twitter / X",
    description: "Tweets matching a query (requires an Apify/Twitter API key in production).",
    configFields: [
      { key: "query", label: "Query", placeholder: "myntra review OR ajio haul", required: true },
      { key: "limit", label: "Limit", placeholder: "100", required: false },
    ],
  },
  {
    type: "youtube",
    label: "YouTube Comments",
    description: "Comments from YouTube fashion haul and review videos via the YouTube Data API v3.",
    configFields: [
      { key: "videoId", label: "Video ID", placeholder: "dQw4w9WgXcQ", required: false },
      { key: "channelId", label: "Channel ID (alternative to Video ID)", placeholder: "UCxxxxxx", required: false },
      { key: "maxComments", label: "Max comments per video", placeholder: "50", required: false },
      { key: "apiKey", label: "YouTube API Key (overrides env)", placeholder: "AIza...", required: false },
    ],
  },
  {
    type: "web_reviews",
    label: "Web / Product Reviews",
    description: "Scrape structured reviews (JSON-LD schema) from any public review page (Trustpilot, Sitejabber, brand sites, etc.).",
    configFields: [
      { key: "url", label: "Review Page URL", placeholder: "https://www.trustpilot.com/review/myntra.com", required: true },
    ],
  },
] as const;
