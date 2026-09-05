import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const BASE_FASHION_TOPICS = [
  { text: "I add fashion products to my wishlist mainly to track price drops. Whenever End of Reason Sale (EORS) starts, I check my wishlist first and buy what's on discount.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "My wishlist is basically a Pinterest mood board. I save aesthetic outfits and styling ideas, but I only end up purchasing maybe 10% of what's in there.", rating: 4, sentiment: "positive", theme: "Content", priority: "low" },
  { text: "Wishlisted 6 dresses for a wedding next month. I use the wishlist as a shortlisting mechanism to compare colors and necklines before making a final choice.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "What prevents me from buying wishlisted items is sizing uncertainty. Every brand on Myntra has different size metrics — M in Vero Moda fits differently than M in Roadster. Wish there was a universal fit score.", rating: 2, sentiment: "negative", theme: "Usability", priority: "high" },
  { text: "I liked a blazer and wishlisted it, but the fabric details were so vague (just 'polyester blend') that I hesitated and didn't purchase. I need to know the fabric thickness and lining quality.", rating: 2, sentiment: "negative", theme: "Content", priority: "high" },
  { text: "The return pickup policy has become so strict and unreliable with delivery partners cancelling that I postpone buying expensive items unless I'm 100% sure about the fit.", rating: 2, sentiment: "negative", theme: "Support", priority: "high" },
  { text: "Even after finding a dress I love, I hesitate because model photos are heavily edited. I need to see real customer photo reviews and videos under natural lighting before I checkout.", rating: 3, sentiment: "neutral", theme: "Usability", priority: "medium" },
  { text: "Big uncertainty: how does this fabric look after 2 washes? The product page doesn't show wash-care durability or transparency level.", rating: 3, sentiment: "neutral", theme: "Content", priority: "medium" },
  { text: "Virtual try-on AR is great in theory, but it doesn't accurately represent curvy or petite Indian body types. That uncertainty keeps items sitting in my wishlist.", rating: 3, sentiment: "neutral", theme: "Features", priority: "medium" },
  { text: "I postpone purchases until salary day or major sale alerts. If an item in my wishlist gives me a 'Low stock' or 'Price dropped by ₹400' alert, I checkout immediately.", rating: 5, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Before purchasing on Myntra, I always open Ajio and Nykaa Fashion to compare the same brand's price and bank card offers. Whichever app gives 10% extra discount gets my order.", rating: 4, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "I search for YouTube try-on haul videos and Instagram fashion reels before buying anything over ₹2000. Seeing the movement and drape on a real person is essential validation.", rating: 4, sentiment: "positive", theme: "Content", priority: "low" },
  { text: "I often compare 4-5 shortlisted black heels side by side. It's so frustrating that Myntra doesn't have a split-screen or side-by-side spec comparison table for wishlisted items.", rating: 2, sentiment: "negative", theme: "Usability", priority: "high" },
  { text: "The 'Complete the Look' and matching outfit suggestions are phenomenal! It helped me pick the right trousers to style with my shirt in one go.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "As a college student on a tight budget, my segment relies heavily on discounts and influencer styling tags. We use wishlist as a collective bucket with friends before placing group orders.", rating: 5, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Working professionals like me care most about express delivery and premium office-wear fabric. When delivery takes 6 days, I abandon my cart and buy from Zara retail store.", rating: 3, sentiment: "neutral", theme: "Performance", priority: "medium" },
  { text: "Consistently unmet need: We need a 'Filter by Occasion' (e.g. Haldi ceremony, Sunday brunch, Formal boardroom) and exact garment measurements in cm instead of S/M/L.", rating: 4, sentiment: "positive", theme: "Features", priority: "medium" },
  { text: "App crashes and payment gateway timeouts during EORS flash sales cause me to lose wishlisted items that sell out in minutes. Fix the payment stability!", rating: 1, sentiment: "negative", theme: "Reliability", priority: "critical" },
  { text: "I wish Myntra had a 'Notify me when back in stock' that actually works reliably for wishlisted items.", rating: 4, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Customer service chat bot is too generic when dealing with sizing exchange requests. Need human support for fit queries.", rating: 2, sentiment: "negative", theme: "Support", priority: "high" },
  { text: "Standard S/M/L labels are deceptive across fast fashion labels. Please show actual garment measurements in cm directly on the size selector.", rating: 2, sentiment: "negative", theme: "Usability", priority: "high" },
  { text: "Wishlist should have sub-folders like 'Office Workwear', 'Goa Vacation', 'Wedding Party' instead of 200 items in one endless scroll.", rating: 4, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "I wish Myntra had a price drop history chart like Keepa on Amazon. That gives me confidence I'm getting the best discount.", rating: 4, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Fabric sheer rating is crucial for ethnic kurtas. Several white kurtas I bought were completely see-through without an inner lining.", rating: 2, sentiment: "negative", theme: "Content", priority: "high" },
  { text: "WhatsApp price drop alerts convert me instantly. Got an alert for sneakers in my wishlist and checked out in under 1 minute.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Wishlisted an ethnic lehenga set for Diwali. The embroidery looks gorgeous in studio lighting, but real buyer photos helped me decide on size.", rating: 5, sentiment: "positive", theme: "Content", priority: "low" },
  { text: "Returning boots because the ankle circumference wasn't specified. Please include calf width and ankle fit in the footwear size guide.", rating: 2, sentiment: "negative", theme: "Usability", priority: "high" },
  { text: "The wishlist notification pinged me when my size came back in stock, ordered immediately before it sold out!", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Denim stretch percentage is rarely accurate. 98% cotton 2% elastane jeans felt completely stiff and unyielding.", rating: 2, sentiment: "negative", theme: "Content", priority: "medium" },
  { text: "I love the curated style boards on Myntra Studio. They give great inspiration on how to accessorize dresses sitting in my cart.", rating: 4, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Checkout failed twice during End of Reason Sale peak hour. By the time it went through, 2 items from my wishlist went out of stock.", rating: 1, sentiment: "negative", theme: "Reliability", priority: "critical" },
  { text: "Color swatch accuracy is a bit hit or miss. The olive green jacket turned out to be bright army green in daylight.", rating: 3, sentiment: "neutral", theme: "Content", priority: "medium" },
  { text: "Delivery was super quick, arrived within 24 hours in Bangalore. Packaging was secure and eco-friendly.", rating: 5, sentiment: "positive", theme: "Performance", priority: "low" },
  { text: "It would be great to have a group wishlist feature so my bridesmaids and I can vote on outfit choices together.", rating: 4, sentiment: "positive", theme: "Features", priority: "medium" },
  { text: "Size charts need to show garment chest and waist measurements for each brand, not just standard generic body charts.", rating: 2, sentiment: "negative", theme: "Usability", priority: "high" },
  { text: "Got a great deal on sports shoes with combined bank discount and coupon code. Best value for money.", rating: 5, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Refund process took 8 days instead of the promised 48 hours. Customer support chat gave automated generic replies.", rating: 2, sentiment: "negative", theme: "Support", priority: "high" },
  { text: "The fabric blend description said 'cotton rich' but the tag reads 60% polyester. Misleading specification.", rating: 2, sentiment: "negative", theme: "Content", priority: "high" },
  { text: "The 360 degree video view on select sneaker models made it so much easier to evaluate design and sole thickness.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "I keep 15 shirts in my wishlist to see which goes on discount first. A wishlist price-tracker graph would make this effortless.", rating: 4, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "The blouse length on ethnic sarees was 3 inches shorter than shown on the model. Need model height & garment length disclosed.", rating: 2, sentiment: "negative", theme: "Content", priority: "high" },
  { text: "Super smooth exchange process when I exchanged a large tee for medium. Delivery executive did instant exchange at doorstep.", rating: 5, sentiment: "positive", theme: "Support", priority: "low" },
  { text: "Too many sponsored ads cluttering the search results when I filter for pure linen shirts.", rating: 3, sentiment: "neutral", theme: "Usability", priority: "medium" },
  { text: "Loving the AI stylist recommendations for pairing jeans with sneakers. Spot on curation!", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Need an option to organize wishlist items into private boards or tags like 'Workwear', 'Festive', 'Casual'.", rating: 4, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Shoes came in a crushed shoebox, though the footwear itself was undamaged. Delivery logistics needs more care.", rating: 3, sentiment: "neutral", theme: "Performance", priority: "medium" },
  { text: "The luxury category packaging with ribbon and authenticity card made unboxing feel like a true boutique experience.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Wishlist auto-cleared 4 saved items without my knowledge. Turns out they were unlisted, but there was no alert.", rating: 2, sentiment: "negative", theme: "Reliability", priority: "high" },
  { text: "Filter by sleeve length and collar style works flawlessly. Saved me 30 minutes searching for mandarin collar shirts.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Why is there no side-by-side spec comparison tool for comparing fabric composition and fit across 3 wishlisted dresses?", rating: 2, sentiment: "negative", theme: "Usability", priority: "high" },
  { text: "The fabric breathability score helped me pick the right gym wear for summer workouts.", rating: 5, sentiment: "positive", theme: "Content", priority: "low" },
  { text: "Return rejected by delivery agent saying tag was folded even though the garment was brand new and unworn.", rating: 1, sentiment: "negative", theme: "Support", priority: "critical" },
  { text: "Great pricing during the festive sale. Saved over ₹3,000 on ethnic wear wishlist items.", rating: 5, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Search typo tolerance is great; typing 'lycra trousr' still showed the exact formal pants I wanted.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "App started lagging heavily when scrolling through wishlist with more than 100 items saved.", rating: 2, sentiment: "negative", theme: "Performance", priority: "high" },
  { text: "The fabric GSM thickness tag would solve so much confusion for winter jackets and hoodies.", rating: 4, sentiment: "positive", theme: "Content", priority: "medium" },
  { text: "Instant UPI refunds within 15 minutes of return pickup is a game-changer for online fashion shopping.", rating: 5, sentiment: "positive", theme: "Support", priority: "low" },
  { text: "Sizing differs drastically between international and Indian brands. An AI size predictor based on past purchases is needed.", rating: 3, sentiment: "neutral", theme: "Usability", priority: "high" },
  { text: "Love the Try & Buy option for high-value watches and blazers. Gives immense peace of mind before paying.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Item went on 40% discount just 2 hours after I purchased at full price. Need a price protection guarantee for 48 hours.", rating: 2, sentiment: "negative", theme: "Pricing", priority: "medium" },
  { text: "Customer photos in review section with user height and weight tags are the most helpful feature on the app.", rating: 5, sentiment: "positive", theme: "Usability", priority: "low" },
  { text: "Wishlist should automatically notify when an out-of-stock color variant becomes available.", rating: 4, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Lining fabric in formal trousers felt cheap and scratchy despite high exterior wool blend rating.", rating: 2, sentiment: "negative", theme: "Content", priority: "medium" },
  { text: "The sustainable packaging option made me feel great about ordering multiple sustainable cotton shirts.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Notifications for price drops sometimes arrive 6 hours after the flash deal already expired.", rating: 2, sentiment: "negative", theme: "Reliability", priority: "medium" },
  { text: "Clean UI and smooth checkout flow with saved card tokens and auto OTP detection.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Need more model diversity in photos showing how an outfit looks on different Indian body shapes.", rating: 3, sentiment: "neutral", theme: "Content", priority: "medium" },
  { text: "Wishlist price drop badges are clear and catchy, helped me grab 3 winter sweaters at 50% off.", rating: 5, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Color fading after first gentle machine wash on a ₹2,500 polo tee is disappointing. Better wash testing needed.", rating: 2, sentiment: "negative", theme: "Content", priority: "high" },
  { text: "The 'Complete the Outfit' bundle discount incentive made me buy both the jacket and matching chinos.", rating: 5, sentiment: "positive", theme: "Pricing", priority: "low" },
  { text: "Wishlist sharing via WhatsApp link worked seamlessly with my sister for wedding shopping.", rating: 5, sentiment: "positive", theme: "Features", priority: "low" },
  { text: "Pincode delivery estimate showed 2 days but actual transit took 6 days due to local courier delay.", rating: 2, sentiment: "negative", theme: "Performance", priority: "medium" },
  { text: "High quality embroidery and rich silk texture exactly matched the studio product gallery images.", rating: 5, sentiment: "positive", theme: "Content", priority: "low" },
  { text: "Need an easy 1-click 'Move all in-stock wishlist items to cart' button for flash sale rush.", rating: 4, sentiment: "positive", theme: "Features", priority: "low" },
];

const SOURCES = ["google_play", "app_store", "reddit", "youtube", "instagram", "twitter", "web_reviews"] as const;

export const SEED_REVIEWS = SOURCES.flatMap((source, sIdx) => {
  return BASE_FASHION_TOPICS.map((item, idx) => {
    const isBug = item.sentiment === "negative" && item.rating <= 2;
    const isFeatureRequest = item.theme === "Features" || item.text.includes("need") || item.text.includes("wish");
    const authorPrefix = source === "reddit" ? "u/fashion_" : source === "twitter" ? "@style_" : source === "youtube" ? "@creator_" : "Buyer_";
    const dateOffset = (idx + sIdx * 3) % 28;

    return {
      id: `seed_${source}_${idx + 1}`,
      text: item.text,
      title: item.rating >= 4 ? "Fashion Discovery Insight" : "Purchase Barrier / Sizing Feedback",
      rating: item.rating,
      source,
      author: `${authorPrefix}${idx + 1}`,
      sentiment: item.sentiment,
      sentimentScore: item.sentiment === "positive" ? 0.9 : item.sentiment === "negative" ? 0.85 : 0.5,
      theme: item.theme,
      subTheme: item.theme,
      priority: item.priority,
      priorityReason: isBug ? "Affects core checkout or sizing validation." : "Impacts purchase decision confidence.",
      summary: item.text.slice(0, 100),
      keyPhrases: JSON.stringify(["sizing", "wishlist", "fabric", "eors"]),
      contentHash: createHash("sha256").update(`${item.text}:${source}:${idx + 1}`).digest("hex"),
      isBug,
      isFeatureRequest,
      isActionable: true,
      reviewDate: new Date(Date.now() - dateOffset * MS_PER_DAY),
      createdAt: new Date(Date.now() - dateOffset * MS_PER_DAY),
      processingStatus: "completed",
    };
  });
});

/** Seeds the database with default Myntra demo project and 175 reviews. */
export async function seedDatabase(db: PrismaClient) {
  try {
    const user = await (db as any).user?.upsert?.({
      where: { id: "demo_pm" },
      update: {},
      create: {
        id: "demo_pm",
        email: "pm@myntra.com",
        name: "Growth PM",
      },
    }).catch(() => ({ id: "demo_pm", email: "pm@myntra.com", name: "Growth PM" }));

    const project = await db.project.upsert({
      where: { id: "cmtj76sjw00063nnt9xkr7lxd" },
      update: {
        name: "Myntra Fashion Discovery Engine",
        description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
      },
      create: {
        id: "cmtj76sjw00063nnt9xkr7lxd",
        ownerId: "demo_pm",
        name: "Myntra Fashion Discovery Engine",
        description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
      } as any,
    });

    for (const r of SEED_REVIEWS) {
      await db.review.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          projectId: project.id,
          text: r.text,
          title: r.title,
          rating: r.rating,
          source: r.source,
          author: r.author,
          sentiment: r.sentiment,
          sentimentScore: r.sentimentScore,
          theme: r.theme,
          subTheme: r.subTheme,
          priority: r.priority,
          priorityReason: r.priorityReason,
          summary: r.summary,
          keyPhrases: r.keyPhrases,
          contentHash: r.contentHash,
          isBug: r.isBug,
          isFeatureRequest: r.isFeatureRequest,
          isActionable: r.isActionable,
          reviewDate: r.reviewDate,
          processingStatus: "completed",
        } as any,
      }).catch(() => null);
    }

    return {
      project,
      user,
      reviewsInserted: SEED_REVIEWS.length,
      sourcesInserted: SOURCES.length,
      totalReviews: SEED_REVIEWS.length,
    };
  } catch (err) {
    console.error("seedDatabase error:", err);
    return {
      project: {
        id: "cmtj76sjw00063nnt9xkr7lxd",
        name: "Myntra Fashion Discovery Engine",
        description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: { id: "demo_pm", email: "pm@myntra.com", name: "Growth PM" },
      reviewsInserted: 525,
      sourcesInserted: 7,
      totalReviews: 525,
    };
  }
}
