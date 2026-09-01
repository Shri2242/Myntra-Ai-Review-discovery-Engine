import type { FetchedReview } from "./collectors";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const myntraReviews = [
  // Wishlist intent & behavior
  { text: "I add fashion products to my wishlist mainly to track price drops. Whenever End of Reason Sale (EORS) starts, I check my wishlist first and buy what's on discount.", rating: 5, source: "google_play", author: "DealTracker_Priya", sentiment: "positive", theme: "Features" },
  { text: "My wishlist is basically a Pinterest mood board. I save aesthetic outfits and styling ideas, but I only end up purchasing maybe 10% of what's in there.", rating: 4, source: "reddit", author: "u/aesthetic_curator", sentiment: "positive", theme: "Content" },
  { text: "Wishlisted 6 dresses for a wedding next month. I use the wishlist as a shortlisting mechanism to compare colors and necklines before making a final choice.", rating: 5, source: "app_store", author: "WeddingGuestSneha", sentiment: "positive", theme: "Features" },
  
  // Purchase blockers & hesitation
  { text: "What prevents me from buying wishlisted items is sizing uncertainty. Every brand on Myntra has different size metrics — M in Vero Moda fits differently than M in Roadster. Wish there was a universal fit score.", rating: 2, source: "google_play", author: "Ananya_FitIssues", sentiment: "negative", theme: "Usability" },
  { text: "I liked a blazer and wishlisted it, but the fabric details were so vague (just 'polyester blend') that I hesitated and didn't purchase. I need to know the fabric thickness and lining quality.", rating: 2, source: "app_store", author: "FabricConscious", sentiment: "negative", theme: "Content" },
  { text: "The return pickup policy has become so strict and unreliable with delivery partners cancelling that I postpone buying expensive items unless I'm 100% sure about the fit.", rating: 2, source: "reddit", author: "u/return_anxiety", sentiment: "negative", theme: "Support" },

  // Uncertainties after identifying liked product
  { text: "Even after finding a dress I love, I hesitate because model photos are heavily edited. I need to see real customer photo reviews and videos under natural lighting before I checkout.", rating: 3, source: "app_store", author: "RealPhotoSeeker", sentiment: "neutral", theme: "Usability" },
  { text: "Big uncertainty: how does this fabric look after 2 washes? The product page doesn't show wash-care durability or transparency level.", rating: 3, source: "google_play", author: "DurabilityCheck", sentiment: "neutral", theme: "Content" },
  { text: "Virtual try-on AR is great in theory, but it doesn't accurately represent curvy or petite Indian body types. That uncertainty keeps items sitting in my wishlist.", rating: 3, source: "google_play", author: "CurvyStyleGuide", sentiment: "neutral", theme: "Features" },

  // Postponing purchase & Comparison behavior
  { text: "I postpone purchases until salary day or major sale alerts. If an item in my wishlist gives me a 'Low stock' or 'Price dropped by ₹400' alert, I checkout immediately.", rating: 5, source: "app_store", author: "SalaryDayShopper", sentiment: "positive", theme: "Pricing" },
  { text: "Before purchasing on Myntra, I always open Ajio and Nykaa Fashion to compare the same brand's price and bank card offers. Whichever app gives 10% extra discount gets my order.", rating: 4, source: "reddit", author: "u/dual_app_comparator", sentiment: "positive", theme: "Pricing" },
  { text: "I search for YouTube try-on haul videos and Instagram fashion reels before buying anything over ₹2000. Seeing the movement and drape on a real person is essential validation.", rating: 4, source: "youtube", author: "@fashionhaulseeker", sentiment: "positive", theme: "Content" },
  { text: "I often compare 4-5 shortlisted black heels side by side. It's so frustrating that Myntra doesn't have a split-screen or side-by-side spec comparison table for wishlisted items.", rating: 2, source: "app_store", author: "ComparisonQueen", sentiment: "negative", theme: "Usability" },

  // Role of fit, styling, social validation & segments
  { text: "The 'Complete the Look' and matching outfit suggestions are phenomenal! It helped me pick the right trousers to style with my shirt in one go.", rating: 5, source: "app_store", author: "StylingEnthusiast", sentiment: "positive", theme: "Features" },
  { text: "As a college student on a tight budget, my segment relies heavily on discounts and influencer styling tags. We use wishlist as a collective bucket with friends before placing group orders.", rating: 5, source: "reddit", author: "u/college_trends", sentiment: "positive", theme: "Pricing" },
  { text: "Working professionals like me care most about express delivery and premium office-wear fabric. When delivery takes 6 days, I abandon my cart and buy from Zara retail store.", rating: 3, source: "google_play", author: "CorporateWardrobe", sentiment: "neutral", theme: "Performance" },

  // Unmet needs & Friction
  { text: "Consistently unmet need: We need a 'Filter by Occasion' (e.g. Haldi ceremony, Sunday brunch, Formal boardroom) and exact garment measurements in cm instead of S/M/L.", rating: 4, source: "reddit", author: "u/occasion_filter_fan", sentiment: "positive", theme: "Features" },
  { text: "App crashes and payment gateway timeouts during EORS flash sales cause me to lose wishlisted items that sell out in minutes. Fix the payment stability!", rating: 1, source: "google_play", author: "SaleCrashVictim", sentiment: "negative", theme: "Reliability" },
  { text: "I wish Myntra had a 'Notify me when back in stock' that actually works reliably for wishlisted items.", rating: 4, source: "app_store", author: "RestockWatcher", sentiment: "positive", theme: "Features" },
  { text: "Customer service chat bot is too generic when dealing with sizing exchange requests. Need human support for fit queries.", rating: 2, source: "app_store", author: "SupportHelpMe", sentiment: "negative", theme: "Support" },
];

const fullReviews = [...myntraReviews, ...myntraReviews.map(r => ({
  ...r,
  author: r.author + "_v2",
  text: r.text.replace("Myntra", "The app").replace("EORS", "sale").replace("Ajio", "competitor"),
  source: r.source === "reddit" ? "twitter" : "app_store"
}))];

export const SEED_REVIEWS = fullReviews.map((r, i) => {
  const isBug = r.sentiment === 'negative' && r.rating <= 2;
  const isFeat = r.theme === 'Features' || r.text.includes('need') || r.text.includes('wish');
  let priority = 'low';
  if (r.rating <= 2) priority = 'high';
  if (r.rating === 1) priority = 'critical';
  if (r.rating === 3) priority = 'medium';
  
  return {
    text: r.text,
    title: null,
    rating: r.rating,
    source: r.source,
    author: r.author,
    daysAgo: Math.floor(Math.random() * 14),
    sentiment: r.sentiment,
    sentimentScore: r.sentiment === 'positive' ? 0.9 : r.sentiment === 'negative' ? 0.1 : 0.5,
    theme: r.theme.toLowerCase(),
    subTheme: r.theme.toLowerCase() + "_detail",
    priority: priority,
    priorityReason: "Automated tagging based on rating and keywords",
    summary: r.text.substring(0, 40) + '...',
    keyPhrases: [],
    isBug: isBug,
    isFeatureRequest: isFeat,
    isActionable: isBug || isFeat,
  };
});

export const SEED_COLLECTOR_SOURCES = [
  {
    sourceType: "google_play",
    name: "Myntra — Google Play Reviews",
    config: JSON.stringify({ appId: "com.grofers.customerapp", lang: "en", sort: "newest" }),
    enabled: true,
    schedule: "0 9 * * *",
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastRunStatus: "success",
    lastRunCount: 0,
    totalCollected: 15
  },
  {
    sourceType: "app_store",
    name: "Myntra — App Store Reviews (IN)",
    config: JSON.stringify({ id: "1084248054", country: "us", sort: "recent" }),
    enabled: true,
    schedule: "30 9 * * *",
    lastRunAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    lastRunStatus: "success",
    lastRunCount: 0,
    totalCollected: 15
  },
  {
    sourceType: "reddit",
    name: "r/IndianFashionAddicts — Reddit Posts",
    config: JSON.stringify({ subreddit: "IndianFashionAddicts", sort: "new" }),
    enabled: true,
    schedule: "0 */6 * * *",
    lastRunAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    lastRunStatus: "partial",
    lastRunCount: 0,
    totalCollected: 10
  },
  {
    sourceType: "twitter",
    name: "Myntra Fashion Mentions",
    config: JSON.stringify({ query: "myntra fashion review" }),
    enabled: true,
    schedule: "0 */4 * * *",
    lastRunAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    lastRunStatus: "success",
    lastRunCount: 0,
    totalCollected: 10
  }
];

export async function seedDatabase(db: PrismaClient): Promise<{
  project: any;
  reviewsInserted: number;
  sourcesInserted: number;
  user: { id: string; email: string; name: string } | null;
}> {
  await db.activityLog.deleteMany();
  await db.webhookDelivery.deleteMany();
  await db.webhookConfig.deleteMany();
  await db.reportSchedule.deleteMany();
  await db.analyticsDaily.deleteMany();
  await db.savedSearch.deleteMany();
  await db.insight.deleteMany();
  await db.chatMessage.deleteMany();
  await db.uploadBatch.deleteMany();
  await db.apiKey.deleteMany();
  await db.reviewEmbedding.deleteMany();
  await db.collectorLog.deleteMany();
  await db.collectorSource.deleteMany();
  await db.review.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();

  const { hashPassword } = await import("./auth");
  const admin = await db.user.create({
    data: {
      email: "pm@reviewpulse.dev",
      name: "Product Manager",
      passwordHash: hashPassword("ReviewPulse123!"),
      authProvider: "email",
    },
  });

  const project = await db.project.create({
    data: {
      name: "Myntra Fashion Discovery Engine",
      description: "Growth team initiative: analyze user feedback to increase meaningful product discovery.",
      ownerId: admin.id,
      members: { create: { userId: admin.id, role: "admin" } },
    },
  });

  await db.review.createMany({
    data: SEED_REVIEWS.map((r) => ({
      projectId: project.id,
      text: r.text,
      title: r.title,
      rating: r.rating,
      reviewDate: new Date(Date.now() - r.daysAgo * MS_PER_DAY),
      source: r.source,
      author: r.author,
      contentHash: createHash("sha256").update(r.text).digest("hex"),
      processingStatus: "completed",
      processedAt: new Date(),
      sentiment: r.sentiment,
      sentimentScore: r.sentimentScore,
      theme: r.theme,
      subTheme: r.subTheme,
      priority: r.priority,
      priorityReason: r.priorityReason,
      summary: r.summary,
      keyPhrases: JSON.stringify(r.keyPhrases),
      isBug: r.isBug,
      isFeatureRequest: r.isFeatureRequest,
      isActionable: r.isActionable,
    })),
  });

  await db.collectorSource.createMany({
    data: SEED_COLLECTOR_SOURCES.map((s) => ({
      projectId: project.id,
      sourceType: s.sourceType,
      name: s.name,
      config: s.config,
      enabled: s.enabled,
      schedule: s.schedule,
      lastRunAt: s.lastRunAt,
      lastRunStatus: s.lastRunStatus,
      lastRunCount: s.lastRunCount,
      totalCollected: s.totalCollected,
    })),
  });

  return {
    project,
    reviewsInserted: SEED_REVIEWS.length,
    sourcesInserted: SEED_COLLECTOR_SOURCES.length,
    user: { id: admin.id, email: admin.email, name: admin.name },
  };
}
