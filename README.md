# Myntra Fashion AI Review Discovery Engine 👗✨

An AI-powered product discovery and customer review analysis engine built as a Product Management case study for **Myntra (Fashion E-Commerce & Growth)**.

This engine ingests unstructured user feedback, app store reviews, Reddit discussions (`r/IndianFashionAddicts`), and YouTube try-on haul comments. It uses RAG vector retrieval with DeepSeek to understand why users add items to wishlists, identify purchase friction, and quantify high-impact non-monetary opportunity areas to increase the **30-day Wishlist-to-Purchase Conversion Rate**.

---

## 🎯 Strategic PM Objective

- **Role**: Product Manager on the Growth Team at Myntra.
- **Mission**: Increase the percentage of users who purchase at least one item from their wishlist within 30 days of adding it.
- **Strict Solution Constraint**: Zero monetary incentives (No discounts, coupons, cashback, or price cutting).

---

## 🚀 Key Modules & Capabilities

1. **💬 Ask Assistant (RAG Vector Discovery)**:
   - Grounded vector search answering core PM discovery questions:
     - *Why do users add fashion products to their wishlist?*
     - *What prevents wishlisted products from being purchased?*
     - *What uncertainties remain around fit, fabric, and sizing?*
     - *How do users compare shortlisted products?*
   - Cites real user reviews with confidence scores and excerpt chips.

2. **📊 Executive Dashboard**:
   - High-level KPIs: Total Reviews Indexed, 30-Day Conversion Target (Baseline: 9.4% → Target: 22.0%), Intent Category Breakdown (Occasion, Ethnic, Footwear, Athleisure, Western).

3. **🎯 Quantified Opportunity Areas**:
   - 6 comparative non-monetary solution spaces:
     - Sizing & Universal Fit Calibration
     - Fabric Translucency & GSM Transparency
     - Side-by-Side Split Screen Spec Comparison
     - Smart Wishlist Buckets & Scarcity Signals
     - Occasion Styling & Complete-the-Look Bundles
     - High-Intent Checkout Reservation Timers

4. **👥 Fashion Segments & Cohorts**:
   - Deep NLP clustering across 4 user personas:
     - *Deal & Price-Drop Trackers* (34% of wishlists)
     - *Gen-Z Trend & Moodboarders* (32% of wishlists)
     - *Body-Type & Fit Seekers* (18% of wishlists)
     - *Occasion & Event Planners* (16% of wishlists)

5. **💡 Thematic Insights & Unmet Needs**:
   - Real-time friction rankings, severity indexing, and user-requested feature rankings.

6. **🔄 Multi-Channel Review Sources**:
   - Automated ingestion pipelines for Google Play Store, Apple App Store, Reddit, and YouTube.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons
- **Database**: SQLite (via Prisma ORM) with local fast file persistence
- **AI Inference**: DeepSeek LLM (`deepseek-ai/DeepSeek-V3` / `deepseek-chat`) via Router API
- **Embeddings**: In-memory 384-dimensional cosine similarity vector search
- **Themes**: High-visibility Light Mode & Dark Mode with 1-click switcher

---

## 📦 Getting Started

### 1. Installation

```bash
# Install dependencies
npm install

# Run database setup
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001) in your browser.

---

## 💡 Usage

1. **Ask Assistant**: Select any of the 10 PM prompt pills or type custom queries to get grounded answers.
2. **Explore Opportunities**: Review the impact matrix, revenue lift projections, and non-monetary interventions.
3. **Sync Data**: Click the **Sync Data** button on the bottom left sidebar to trigger multi-channel review collection and live vector re-indexing.
