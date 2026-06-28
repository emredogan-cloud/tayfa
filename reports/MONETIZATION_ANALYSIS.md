# MONETIZATION ANALYSIS — Tayfa (working codename)

> **Companion deep-dive to** `roadmaps/APP_EXECUTION_ROADMAP.md` (the source of truth). This report expands §7 (Monetization Strategy) and the P7/P9 phases; it never contradicts the roadmap.
> **Scope:** pricing, unit economics, conversion engine, churn, marketplace, projections, experiments, risks.
> **Product:** verified, location-based, small-group hobby-hangout app for 18–32s new to a city. Beachhead **Istanbul** → TR (İzmir/Ankara) → EU university cities. **NOT a dating app.**
> **North Star Metric (NSM):** **Weekly Completed Meetups.** Monetization's prime directive: *never depress the NSM.*
> **Reporting currency:** EUR (EU-domiciled infra/expansion). TR consumer prices quoted in ₺.
> **Generated:** 2026-06-26 · Monetization report version 1.0

---

## 0. Planning Assumptions (every number below traces here)

These are **illustrative planning assumptions**, not forecasts or promises. They are stated explicitly so the models are auditable and so a single input can be re-run when reality disagrees.

| Assumption | Value (base) | Range / sensitivity | Source / rationale |
|---|---|---|---|
| FX — EUR/TRY | **47** | 40–55 | Mid-2026 planning rate; ₺ is high-inflation/depreciating — treat as a moving target, re-peg quarterly |
| FX — USD/TRY | 43 | 38–50 | For store-proceeds and Persona ($-denominated) costs |
| FX — EUR/USD | 1.09 | — | Cross-rate |
| TR net minimum wage (2026, planning) | ~₺26,000/mo (€553) | ₺24k–30k | Anchors price-as-%-of-income for WTP |
| Young Istanbul early-career income | ₺30,000–70,000/mo | — | Persona *Nilay/Burak* wallet |
| Store commission (mobile IAP) | **15%** | 15% (SBP/sub) → 30% | Apple Small Business Program + Google sub rate at <$1M; 30% conservative at scale/year-1 |
| RevenueCat fee | ~1% of tracked rev | 0% (<$2.5k MTR) → 1% | Roadmap §3 |
| Blended store+RC haircut | **16%** (keep 0.84) | up to 31% | 15% store + 1% RC |
| Variable serving cost / MAU / mo | **€0.12** | €0.06–0.25 | Sum of roadmap §8 (embeddings, moderation, infra, push, amortized verification) |
| ID+liveness (Persona) | €1.00–1.50 one-time | — | Roadmap §8; **gated to hosts/DM/Verified+, never all users** |
| Conversion free→paid (saturated city) | TR **4%** · EU **5%** | 3–5% TR · 4–6% EU | Roadmap target 3–5% |
| Monthly : annual payer mix | 60 : 40 | shifts toward annual | Early skew monthly; annual grows with trust |
| Blended monthly churn (payers) | **5.5%** | 8% → 4% | Annual plans pull blended down; benchmark below |
| Avg paying-subscriber lifetime | **18 mo** (=1/5.5%) | 12.5 → 24 mo | Self-selected engaged cohort |
| Trial → paid | **≥30%** | 30–45% | Engagement-gated trials over-index |
| Marketplace ARPU / MAU / mo (at P9 maturity) | **€0.30** | €0.05–0.60 | Ramps from €0 at P7; modeled in §6 |
| Blended CAC / activated user (lead city) | **€2–5** | €0.5 organic → €30 paid | Organic/community-led dominant (see §4) |

**Activated user** = reached first completed meetup (the roadmap's activation definition), not an install. **MAU** = monthly active (created/joined/attended). All ARPU/LTV figures are **net of store + RevenueCat** unless labeled "gross."

---

## 1. Monetization Thesis & Philosophy

### 1.1 Why freemium consumer subscription fits *this* product

Tayfa is a **local-network-effect social good**: its value to any user is a function of *liquidity in their city* (≥40 live events/week within 5km of the median user — roadmap §6), not of global scale. That single fact dictates the entire monetization posture:

1. **Liquidity is the asset; revenue is the lien against it.** Every paywall that suppresses a join, a create, or a chat removes an event from someone *else's* feed. In a network-effect business the marginal free user is not a cost to be converted — she is **supply and demand simultaneously** (she hosts the padel game *and* fills someone's coffee crawl). Taxing her participation is taxing the product's core asset. Therefore the free tier must be *generous on purpose*, and we monetize **convenience, acceleration, and self-expression** — never access.

2. **Subscription, not ads or transactions, is the right primary model — early.** 
   - *Ads* would pit attention-harvesting against the brand promise ("memories made offline, not doomscroll") and would require scale we don't have. Rejected as primary.
   - *Pure transaction/marketplace* needs supply density we won't have until P8–P9; it can't fund the MVP-to-PMF years.
   - *Consumer subscription* aligns with a recurring-value product (you come back weekly to meet people), produces predictable MRR, and is operationally trivial via **RevenueCat over App Store/Google Play IAP** (roadmap §3). It is the only model that is *both* available early *and* non-destructive to liquidity — **if** gated correctly.

3. **The premium surface is naturally "discovery & expansion."** The features users will pay for (advanced interest filters, see-who's-interested, ranking boost, travel mode, early access to events that fill fast) are all about *meeting more / better / sooner*. They accelerate the core loop rather than gating it — so a Tayfa+ subscriber generates **more** NSM, not less. Monetization and the North Star point the same direction.

### 1.2 Why monetization is gated *after* retention (P7, after P6)

The roadmap's hard gate — **don't monetize before P6 retention + k are proven** — is an economic necessity, not caution theater:

- **A paywall on a leaky bucket is negative-sum.** If D30 is weak, every euro of conversion spend (and every paywall impression that nudges a marginal user to churn instead of convert) accelerates the leak. You'd be charging for a product that doesn't yet retain — the fastest way to a 1-star reputation in a trust-based category.
- **Premium value must *exist* before it can be sold.** "Boost into events that fill fast" only has value once events actually fill fast (liquidity) and once users have had enough good meetups to want more (retention). Pre-PMF, the premium features are worthless and the paywall converts nobody while annoying everybody.
- **The conversion trigger lives inside the retention loop.** Our best paywall moment is the **post-meetup high** (§3). That moment only exists at volume once P3 (the loop) and P6 (crews/habit) are working. Monetization is *literally built on top of* the retention engine.

**Sequencing (canonical):** P3 (loop + NSM) → P4–P6 (matching, safety, retention/virality) → **P7 monetization** (only after retention + k≥0.4) → P8 multi-city (only after LTV:CAC ≥3 in lead city) → **P9 marketplace/B2B2C**.

### 1.3 The "never tax liquidity or safety" principle

Two firewalls, treated as inviolable product law:

- **Liquidity firewall.** Discover, join, create, group-chat, and RSVP are **free forever and unlimited.** A free user must be able to run the *entire* core loop end-to-end without ever seeing a wall. Paywalls appear only at *aspiration* moments adjacent to the loop, never inside it. **Guardrail metric:** NSM and per-geocell liquidity must be **flat-or-up** after any paywall ships, or the flag is reverted (roadmap P7 success metric; experiments E8/E10 guardrail).
- **Safety firewall.** Verification-to-be-safe, block, report, the safety center, women-only/verified-only filters, SOS/check-in, reliability & safety scores — **free forever, no exceptions.** Trust *is* the moat; selling it would burn the asset we're monetizing around. Verified+ may gate *hosting/DM* (a privilege), never *protection*.

### 1.4 Revenue diversification logic (subs → marketplace → B2B2C)

A single revenue line in a **structurally low-WTP beachhead** (Turkey — §2.4) is fragile. The diversification is deliberate and sequenced:

| Layer | When | What | Why it matters here |
|---|---|---|---|
| **Consumer subscription (Tayfa+)** | P7 | Recurring ₺/€ subs | Available early; aligns with weekly-return product; but low TR ARPU caps it |
| **Marketplace take** | P9 | Featured/ticketed events (Stripe Connect), venue/brand sponsored events, host pro-tools | Monetizes *all* actives (not just the 4% who subscribe), in harder currency, and **smooths seasonality** (indoor/ticketed events in winter offset the activity dip) |
| **B2B2C** | P9 | Campus / relocation / HR contracts | Sells to the *exact* newcomer persona via institutions; contract revenue (not consumer WTP); EUR/USD-denominated |

The thesis the rest of this report proves with numbers: **TR consumer subscriptions alone barely wash against serving cost at target conversion. The business becomes healthy only when EU mix + marketplace + B2B2C layer on.** That is not a weakness in the plan — it is the plan.

---

## 2. Pricing Strategy & Tiers

### 2.1 Free vs Tayfa+ — the feature matrix

The governing rule for *which side of the line* a feature sits on: **Access, social, and safety are Free. Acceleration, refinement, and self-expression are Tayfa+.**

| Capability | Free | Tayfa+ | Rationale for the split |
|---|:---:|:---:|---|
| Discover events (interest + geo feed) | ✅ | ✅ | Core access — liquidity firewall |
| Join unlimited public events | ✅ | ✅ | Core access |
| **Create** events (unlimited) | ✅ | ✅ | Supply! Never tax it |
| Group chat (event + crew) | ✅ | ✅ | Core social — liquidity firewall |
| Phone verification (baseline) | ✅ | ✅ | Trust baseline |
| **ID + liveness verification (to host/DM)** | ✅ | ✅ | **Safety/trust — free forever**, even though it costs us €1–1.5 |
| Block / report / appeals | ✅ | ✅ | **Safety firewall** |
| Safety center (share-plan, SOS, check-in, live-loc-to-crew) | ✅ | ✅ | **Safety firewall** |
| Women-only / verified-only **safety** filters | ✅ | ✅ | **Safety firewall** — these are protection, not convenience |
| Reliability & safety scores | ✅ | ✅ | Trust signal, shared good |
| Standard match ranking | ✅ | ✅ | Baseline relevance for everyone |
| Active crews | up to **3** | **Unlimited** | Free users can form their core crews; power-users (Burak) pay to run many |
| Profile photos / prompts | 3 photos / 3 prompts | **Extra** photos & prompts | Self-expression upsell |
| Post-meetup recap cards | Standard | **Premium** (animated, branded-frame) | Self-expression + viral share asset |
| **Advanced interest filters** (sub-genre, specific artists/teams, vibe) | — | ✅ | Refinement — accelerates *better* matches |
| **See who's interested** (in your event/activity, before you commit) | — | ✅ | Highest-intent converter; *platonic* framing (interest in the plan, not "who likes you") |
| **Match-ranking boost** (your profile/events surfaced higher) | — | ✅ | Acceleration; capped to protect feed integrity |
| **Travel mode** (browse/plan a city before you move) | — | ✅ | Pure newcomer value — Nilay plans Istanbul from Ankara |
| **Early access** to popular / "fills-fast" events | — | ✅ | Acceleration; loss-aversion converter |
| Read receipts | — | ✅ | Convenience/self-expression |

**Boundary discipline:** *Safety* filters (women-only, verified-only) are free; *taste* filters (sub-genre, specific artist, "chill vs competitive") are premium. The user-facing line is legible: "You never pay to be safe or to show up. You pay to go faster and stand out."

### 2.2 Price points & localization (TR ₺ vs EU €, PPP)

| Plan | Turkey (₺) | TR in € (@47) | EU (€) | Effective €/mo | Discount vs monthly run-rate |
|---|---|---|---|---|---|
| **Monthly** | **₺149** | €3.17 | **€6.99** | TR €3.17 · EU €6.99 | — |
| **Annual** | **₺999** | €21.26 | **€49.99** | TR ₺83.25 (€1.77) · EU €4.17 | **TR 44.1%** · **EU 40.4%** |

*Annual math:* TR monthly run-rate ₺149×12 = ₺1,788; annual ₺999 ⇒ 44.1% off, effective ₺83.25/mo. EU run-rate €6.99×12 = €83.88; annual €49.99 ⇒ 40.4% off, effective €4.17/mo. Both satisfy the canonical "~40% off."

**The PPP localization story — and why ₺149 ≠ €6.99.** At EUR/TRY 47, €6.99 would be **₺328**. We deliberately price Turkey at **₺149 (€3.17)** — roughly **half** the EU price in hard-currency terms. This is the single most important pricing decision in the plan: **TR pricing is set to local willingness-to-pay, not to FX parity.** The consequence — TR net ARPPU is structurally ~45% of EU's — is carried explicitly through the unit economics (§4) and is the reason marketplace + EU expansion exist (§1.4, §6).

**Charm pricing & local anchors.** All prices are charm-pointed (₺149, ₺999, €6.99, €49.99). TR price-points are benchmarked against the local subscription wallet:

| Local TR subscription (planning) | ~Monthly ₺ | vs Tayfa+ ₺149 |
|---|---|---|
| Spotify Premium (individual) | ~₺60 | Tayfa+ is ~2.5× |
| YouTube Premium | ~₺58 | ~2.6× |
| Netflix (mid tier) | ~₺150–230 | comparable / below |
| Tinder Gold / dating premium | ~₺150–300 | at/below |

Read honestly: **₺149 sits *above* music subs and *at* video/dating subs.** It is defensible as a launch anchor (Tayfa+ is closer to dating-premium in felt value than to music), but it is **at the top of the acceptable band** and must be pressure-tested *downward* (§8, E-P1).

### 2.3 Pricing psychology

- **Anchoring (annual against monthly).** The paywall leads with the annual plan and shows the crossed-out monthly run-rate: *"₺1,788 → ₺999/yr · save 44%."* The monthly price is the anchor that makes annual feel like a steal; the annual price is the one we *want* chosen (cash upfront, ~half the churn).
- **Decoy potential (test, don't assume).** A 3-month plan can be priced to be *deliberately unattractive* (e.g., ₺349/3mo = ₺116/mo) so it makes annual's ₺83/mo obviously dominant — a classic asymmetric-dominance decoy. Flagged as an experiment (E-P5), not a launch default, because a bad decoy can depress total conversion.
- **Framing: "more & better plans," never "unlock basics."** Copy and UI present Tayfa+ as *additive* ("Go further with Tayfa+") not *restrictive* ("Unlock chat"). This protects the liquidity firewall psychologically: a free user never feels *blocked*, only *offered more*. (Roadmap E10: "more plans" framing > "unlock basics", guardrail = NSM.)
- **Loss aversion at trial expiry.** Engagement-gated trials (§3) create real endowment: by trial's end the user has *used* boost and *seen who's interested*. Expiry copy is loss-framed against that endowment — *"You'll go back to standard ranking and lose visibility into who wants to join your plans."* — which converts far better than feature-gain framing.
- **Effort/identity justification.** The post-meetup-high trigger pairs payment with a *peak positive* identity moment ("I'm someone who does things"), reducing price salience.

### 2.4 Willingness-to-pay — the Istanbul reality, head-on

This is a genuine constraint, not a footnote. Four compounding pressures on a young Istanbul audience's WTP:

1. **Low purchasing power.** ₺149/mo is **0.57% of a ₺26,000 net minimum wage**; even a mid-career young professional (₺50k) spends ~0.3%. That is fine *as a ratio* — but the absolute hard-currency value (€3.17) is tiny, so even *good* conversion yields *small* EUR ARPU.
2. **FX volatility.** A ₺ price held flat erodes ~20–40%/yr in EUR as the lira depreciates; raising the ₺ price to compensate risks churning price-sensitive users. There is no free lunch here (addressed in §5.3, §9).
3. **Subscription fatigue & wallet share.** Young users already carry Spotify + Netflix/streaming + possibly a dating sub. Tayfa+ competes for a *small marginal* discretionary line, not a fresh one.
4. **Trust-to-pay lag.** TR consumers are (rationally) cautious about auto-renewing IAP subs from new apps; this depresses early conversion and argues for transparent cancellation and engagement-gated trials.

**Van Westendorp-style reasoning (TR, qualitative PSM).** Pending a real survey (E-P0), the implied price-sensitivity points for the target segment:

| PSM question | Implied ₺ threshold | € (@47) |
|---|---|---|
| "Too cheap" (quality doubt) | ~₺49 | €1.04 |
| "Cheap / good bargain" (Point of Marginal Cheapness) | ~₺79–99 | €1.68–2.11 |
| "Getting expensive but I'd consider" | ~₺149–179 | €3.17–3.81 |
| "Too expensive — won't buy" (Point of Marginal Expensiveness) | ~₺249+ | €5.30+ |

- **Optimal Price Point (OPP, ~indifference):** **₺99–129.**
- **Range of Acceptable Pricing:** **₺79–179.**
- **Read:** the canonical **₺149 is at the upper edge** of acceptable. It is a legitimate *anchor* to launch and discount from (annual ₺999 lands the *effective* price at ₺83 — squarely in the OPP band). But **monthly ₺149 should be A/B-tested against ₺99 and ₺129** before being locked (E-P1). EU's €6.99 sits just above its OPP (~€4.99–5.99) and is defensible for a premium position; test €5.99.

**Implication carried forward:** price *to local WTP* (₺), recover hard-currency economics through *annual mix, EU pricing, and marketplace* — never by forcing a TR user to pay EU-parity prices.

### 2.5 Why the ~40% annual discount is *cheaper than it looks* (cash-flow & FX timing)

The 40%+ annual discount is not a giveaway — in this market it is **paid for three times over** by churn reduction, cash-flow acceleration, and FX timing. This matters disproportionately for a cash-constrained startup in a high-inflation economy.

1. **Churn reduction funds most of the discount.** A monthly TR payer at 8% churn lives ~12.5 months → expected gross collection ≈ ₺149 × 12.5 = **₺1,863**, spread out and at constant churn risk. An annual payer prepays **₺999 certain, today**, and is contractually locked for 12 months (effective churn ~4%). The discount trades *uncertain, drawn-out* revenue for *certain, immediate* revenue — a trade a startup should take.
2. **Cash-flow / working-capital advantage.** Annual collects **₺999 × 0.84 = ₺839 net on day 1.** A base of annual subscribers generates **deferred revenue** that is, in effect, an interest-free float funding CAC and ops *before* the service is delivered. For a company spending to seed liquidity city-by-city, pulling 12 months of cash forward is a genuine balance-sheet lever.
3. **FX timing — the TR-specific kicker.** Under ~20–40%/yr lira depreciation, **₺ collected today is worth materially more in EUR than the same ₺ collected monthly over the next year.** Annual prepay lets us convert/deploy ₺ before it erodes — partially neutralizing the FX risk in §5.3 *at the point of collection*, not just via revenue mix.

| | Monthly (TR) | Annual (TR) |
|---|---|---|
| Day-1 net cash | ₺125/mo | **₺839 (12 mo upfront)** |
| Effective monthly churn | ~8% | ~4% (locked) |
| Expected gross collection | ₺1,863 (~12.5 mo) | **₺999 certain** |
| FX erosion exposure | full year, drip | **collected before erosion** |
| Decision frequency (fatigue) | 12 renew decisions/yr | **1** |

**Strategic read:** push annual *hard* (default-selected on the paywall, anchored against monthly run-rate), especially in TR. The discount depth itself is an experiment (E-P4) — but the *direction* (favor annual) is unambiguous given churn + cash + FX. This is why §0 assumes the annual mix grows over time and why the blended-churn assumption (5.5%) sits well below the monthly-plan ceiling (8%).

---

## 3. Free → Paid Conversion Engine

### 3.1 The conversion funnel

```
Install → Activate (1st completed meetup) → Engaged (≥2 meetups / in a crew)
       → Trial-eligible (gated) → Paywall impression (aspiration moment)
       → Trial start → Trial→Paid → Retained subscriber → Annual upgrade
```

Conversion is **engagement-gated at the top**: a user does not even *see* a Tayfa+ trial offer until she has had real value (≥2 completed meetups). This deliberately *shrinks* the top of the paywall funnel to *raise* its quality.

### 3.2 Paywall placements — which aspiration moments, and why

Placement is everything. Each paywall sits **adjacent to the loop at a moment of peak desire**, never inside the loop blocking an action.

| # | Trigger moment | Tayfa+ pitch | Why it converts | Guardrail |
|---|---|---|---|---|
| P-1 | **Post-meetup high** (just rated a great meetup) | "Loved that? See who else wants to join your plans + boost into the events that fill fast." | Peak positive affect; identity primed ("I do things"); proven value precedes ask | NSM, no-show rate |
| P-2 | **"This event fills fast"** (taps a near-full popular event) | "Get early access to events like this." | Live loss-aversion (scarcity is real, not manufactured) | Free users must still be able to join *most* events |
| P-3 | **Advanced-filter tap** (free user opens a premium filter) | "Filter by sub-genre, specific artists & vibe with Tayfa+." | High intent; user self-identified a refinement need | Standard filters stay free & sufficient |
| P-4 | **3rd active crew** (free cap reached) | "Run unlimited crews with Tayfa+." | Power-user (Burak) at a natural ceiling | First 3 crews always free |
| P-5 | **See-who's-interested curiosity** (event detail) | "See who's interested before you commit." | Curiosity gap; strongest single dating-app-proven lever, here platonic | Never expose identities to free users in a way that feels punitive |

Placements ship as **PostHog-flagged, A/B-testable surfaces** (roadmap P7). Default cadence is *capped* — a user sees at most one paywall per session and never two sessions in a row, to protect the experience and the guardrail.

### 3.3 Trial mechanics — engagement-gated, post-meetup-triggered

- **Eligibility gate: ≥2 completed meetups** (or membership in ≥1 crew). Rationale:
  - **Higher convert:** the user already has habit + felt value; the trial demonstrates *acceleration* of something she already enjoys.
  - **Lower post-trial churn:** engaged users who convert are the stickiest cohort (they were retaining anyway).
  - **Anti-abuse:** gating on *real meetups* (geofence + mutual-confirm NSM, roadmap §4) makes trial-farming require actually showing up — fraud-resistant by construction, same principle as referral rewards (roadmap §6).
- **Trial length:** 7 days (test 14, E-P3). Long enough to use boost + see-who's-interested across at least one weekend's events; short enough to keep loss-aversion sharp.
- **Trigger:** fired at the **post-meetup high** (P-1), not at install. (Roadmap E8: post-meetup trial trigger vs generic.)
- **Mechanics:** standard store free-trial → auto-convert; transparent reminder at T-2 days (trust-building, reduces chargebacks/uninstalls and TR cancellation anxiety); RevenueCat manages entitlement and restore.

### 3.4 Conversion math (saturated city, base case)

Worked example on a **100,000-MAU saturated Istanbul** at base assumptions:

| Funnel stage | Rate (base) | Users |
|---|---|---|
| MAU | — | 100,000 |
| Engaged & trial-eligible (≥2 meetups / in crew) | 40% of MAU | 40,000 |
| Sees a paywall in period | 60% of eligible | 24,000 |
| Starts trial | 25% of paywalled | 6,000 |
| Trial → paid | 35% (engagement-gated) | 2,100 |
| Direct purchase (no trial, annual upfront) | +~0.9% of MAU | +900 |
| **Total paying** | **~3.0–4.0% of MAU** | **~3,000–4,000** |

The **3–5% free→paid target is reached *from the engaged sub-population*, not from raw MAU** — which is why the gate (≥2 meetups) and the trigger (post-meetup) are non-negotiable. A generic "show everyone a paywall on day 1" approach would convert <1% and harm retention.

---

## 4. Unit Economics Model

### 4.1 ARPPU build (net of store + RevenueCat)

| Step | Turkey | EU |
|---|---|---|
| Monthly plan (gross) | ₺149 (€3.17) | €6.99 |
| Annual plan, monthly-equiv (gross) | ₺83.25 (€1.77) | €4.17 |
| **Blended gross ARPPU @ 60/40 mix** | ₺122.70 (**€2.61**) | **€5.86** |
| × (1 − 16% store+RC haircut) = ×0.84 | ₺103.07 (**€2.19**) | **€4.92** |
| **Net ARPPU / paying user / mo** | **€2.19** | **€4.92** |

**EU net ARPPU (€4.92) ≈ 2.25× TR (€2.19)** — the PPP gap, quantified.

### 4.2 Blended ARPU (subscription only)

`Blended ARPU/MAU = Net ARPPU × conversion`

| | TR @4% | EU @5% |
|---|---|---|
| Subs ARPU / MAU / mo | €2.19 × 0.04 = **€0.088** | €4.92 × 0.05 = **€0.246** |

### 4.3 The honest centerpiece — contribution per MAU & break-even conversion

`Contribution/MAU = Subs ARPU/MAU − Variable serving cost/MAU (€0.12)`

| | TR @4% | EU @5% |
|---|---|---|
| Subs ARPU/MAU | €0.088 | €0.246 |
| − Serving cost/MAU | (€0.12) | (€0.12) |
| **Subs-only contribution/MAU/mo** | **−€0.032 (negative)** | **+€0.126** |
| **Break-even conversion (subs cover serving)** | **5.48%** | **2.44%** |

**This is the defining finding of the entire analysis.** In Turkey, at the *target* 3–5% conversion and €0.12/MAU serving cost, **subscription revenue does not cover even the variable cost of serving the user base.** TR subs break even only at **~5.5% conversion** — above the realistic ceiling. EU breaks even at a comfortable **2.4%**.

**Sensitivity to cost discipline (TR break-even conversion):**

| Serving cost/MAU | TR break-even conversion |
|---|---|
| €0.06 (aggressive optimization) | 2.7% — *works* |
| €0.12 (base) | 5.5% — *marginal* |
| €0.25 (undisciplined) | 11.4% — *impossible* |

→ **Cost-per-MAU discipline (roadmap §8: cached/async/in-DB everything) is not hygiene in TR — it is existential.** Every cent on the serving line moves the break-even conversion by ~0.5pp.

### 4.4 Variable serving cost stack (the €0.12/MAU/mo)

| Cost line | €/MAU/mo | Note (roadmap §8) |
|---|---|---|
| Embeddings (interest/event) | <€0.01 | Recompute only on change; cached |
| Match ranking (pgvector ANN, in-DB) | ~€0.00 | The moat is ~free at the margin |
| Text moderation (chat) | €0.02 | Only new/edited messages; hash-cache |
| Image moderation | €0.02 | At upload, not per-view |
| Generative (icebreakers/onboarding, Claude Haiku) | €0.02 | Cached by interest-cluster; capped |
| Infra (Supabase/Vercel/Upstash/PostHog/Sentry) | €0.05 | Usage-based; scales sub-linearly with discipline |
| Push/CRM (Expo→Braze) | €0.02 | Frequency caps cap cost |
| ID+liveness, **amortized** | €0.02 | €1.25 one-time × ~25% who verify ÷ 18-mo life; **gated, not per-user** |
| **Total** | **~€0.15 → €0.12** | Use €0.12 base after caching maturity |

### 4.5 LTV (subscriber) and per-activated-user value

`Subscriber LTV = Net ARPPU × lifetime − serving cost over life`
Lifetime (base) = 1 / 5.5% churn = **18 months**; serving = €0.12 × 18 = €2.16.

| | TR | EU |
|---|---|---|
| Gross subscriber LTV (net-of-store ARPPU × 18) | €39.42 | €88.56 |
| − Serving over life | (€2.16) | (€2.16) |
| **Subscriber LTV (contribution)** | **€37.26** | **€86.40** |
| × conversion → **subs LTV per *activated* user** | €37.26 × 4% = **€1.49** | €86.40 × 5% = **€4.32** |

### 4.6 CAC by channel & the LTV:CAC reality

| Channel | CAC / activated user | Notes |
|---|---|---|
| Structural virality (event invites, recap shares) | **~€0** | Inherent multiplayer; k≥0.4 (roadmap §6) |
| Quality-gated referral (mutual trial, unlocks on referee's 1st meetup) | **€1–3** | Reward cost ≈ marginal serving + a trial we'd partly give anyway |
| Community partnerships (running clubs, climbing gyms, campus, board-game cafés) | **€2–8** | Front-loaded per city |
| Ambassador / seed-host (cold-start) | **€5–15** | City-launch only; perks/pay |
| Paid (Meta/TikTok/ASA), TR | **€10–30** | Low CPM but low intent; install→activated 20–35% |
| Paid, EU | **€20–50** | Higher CPMs |

**The brutal arithmetic.** Compare subs LTV per *activated* user against CAC:

- **TR subs LTV/activated = €1.49.** For LTV:CAC ≥3, CAC must be **≤ €0.50.** Even quality-gated referral (€1–3) fails the 3:1 bar **on subscriptions alone.** Paid acquisition in TR is **value-destructive** until other revenue layers exist.
- **EU subs LTV/activated = €4.32.** 3:1 needs CAC ≤ €1.44 — only the cheapest organic channels clear it on subs alone.
- **Virality multiplier helps but doesn't rescue paid:** effective LTV ×1/(1−k) = ×1.67 at k=0.4 → TR €2.49, EU €7.21. Paid CAC still loses.

**Conclusion (validates the roadmap's growth thesis):** the unit economics *require* organic/community-led growth in TR. This is not a marketing preference — **paid acquisition cannot return 3:1 on TR subscription revenue, period.** It becomes viable only when marketplace revenue is stacked on (below).

### 4.7 Marketplace changes the equation (the path to LTV:CAC ≥3)

Marketplace + B2B2C monetize **all MAU** (not the 4% who subscribe), in harder currency. Adding the base **€0.30/MAU/mo** at P9 maturity:

| | TR | EU |
|---|---|---|
| Subs contribution/MAU/mo | −€0.032 | +€0.126 |
| + Marketplace/MAU/mo | +€0.300 | +€0.300 |
| **Total contribution/MAU/mo** | **+€0.268** | **+€0.426** |
| **LTV/MAU (× 18 mo)** | **€4.82** | **€7.67** |
| Payback @ organic CAC €2 | 7.5 mo | 4.7 mo |
| **LTV:CAC @ CAC €1.5 (organic)** | **3.2 ✓** | **5.1 ✓** |
| LTV:CAC @ CAC €5 | 1.0 | 1.5 |

**The ≥3 LTV:CAC target in the lead city is reachable — but only via (a) organic-dominant CAC (≤~€1.5–2) AND (b) marketplace revenue layered on.** Subscriptions are the *retention-aligned* revenue; the marketplace is the *economics-fixing* revenue. In a low-WTP market, **the marketplace is the linchpin, not the bonus.**

### 4.8 Saturated-city scenario table (100k-MAU lead city)

| Metric | Conservative | **Base** | Optimistic |
|---|---|---|---|
| Conversion (TR) | 3% | **4%** | 5% |
| Net ARPPU (TR) | €2.19 | **€2.19** | €2.30 |
| Marketplace €/MAU/mo | €0.10 | **€0.30** | €0.50 |
| Serving cost €/MAU/mo | €0.15 | **€0.12** | €0.10 |
| Subscriber lifetime (mo) | 12.5 | **18** | 24 |
| Subs MRR | €6,570 | **€8,760** | €11,500 |
| Marketplace MRR | €10,000 | **€30,000** | €50,000 |
| **Total MRR** | **€16,570** | **€38,760** | **€61,500** |
| **ARR** | **€199k** | **€465k** | **€738k** |
| Contribution/MAU/mo | +€0.017 | +€0.268 | +€0.509 |
| Blended CAC (lead city) | €5 | €2 | €1 |
| **LTV:CAC** | **~0.04 (paid) / >3 (pure organic)** | **~2.4–3.2** | **~12** |

Even the **base** lead city is a **~€0.5M ARR** business — modest. Tayfa's value is not one city's MRR; it is *many* saturated cities × a marketplace × an EU mix (§7).

### 4.9 Payback period

`Payback (months) = CAC ÷ contribution per MAU per month.` Because an acquired user *becomes* a MAU, the relevant denominator is total contribution/MAU/mo (subs + marketplace − serving).

| Region · stage | Contribution/MAU/mo | CAC €2 (organic) | CAC €5 (community) | CAC €15 (paid) |
|---|---|---|---|---|
| TR · subs-only (pre-marketplace) | −€0.032 | **never** | never | never |
| TR · + marketplace (P9) | +€0.268 | **7.5 mo** | 18.7 mo | >life ✗ |
| EU · subs-only | +€0.126 | 15.9 mo | >life ✗ | >life ✗ |
| EU · + marketplace (P9) | +€0.426 | **4.7 mo** | 11.7 mo | 35 mo ✗ |

**Read:** organic CAC pays back inside a year *once marketplace exists*; **paid CAC never pays back in TR** and is borderline-to-bad in EU. This is the quantitative reason the roadmap makes paid acquisition optional, not load-bearing (P6 business goal) — and why P7 (monetization, incl. marketplace groundwork) gates P8 (scaled, partly-paid acquisition).

### 4.10 Portfolio blended ARPPU — how EU mix lifts the average

Subscription ARPPU is not one number; it is a **portfolio weighted by where the paying users are.** As the EU paying base grows, blended ARPPU rises even with TR pricing untouched:

| | TR payers × €2.19 | EU payers × €4.92 | Blended net ARPPU | vs TR-only |
|---|---|---|---|---|
| Y2 (all TR) | 2,700 × €2.19 | 0 | **€2.19** | — |
| Y3 (170k/40k) | 6,800 × €2.19 = €14,892 | 1,800 × €4.92 = €8,856 | €23,748 / 8,600 = **€2.76** | **+26%** |
| Y4 (280k/150k) | 12,600 × €2.19 = €27,594 | 7,500 × €4.92 = €36,900 | €64,494 / 20,100 = **€3.21** | **+47%** |

By Y4, **EU is 37% of paying users but contributes 57% of subscription revenue**, lifting blended net ARPPU **+47%** over TR-only — without raising a single TR price. Blended subs ARPU/MAU correspondingly rises to €64,494 / 430,000 = **€0.150/MAU/mo**, and **+marketplace €0.30 → €0.45/MAU/mo total** — the level at which organic-led, partly-paid growth finally clears 3:1. **The EU mix is a margin lever, not just a growth lever.**

---

## 5. Churn Analysis

### 5.1 Churn drivers specific to Tayfa

| Driver | Mechanism | Severity |
|---|---|---|
| **Seasonal / winter dip** | Outdoor activities (bikes, padel, running) collapse Nov–Feb; fewer events → fewer meetups → "why am I paying?" | High (seasonal) |
| **"Found my crew" graduation** | User assembles a stable crew, no longer needs *discovery* → cancels Tayfa+ (but keeps using free!) | High (structural) |
| **Price sensitivity / FX** | ₺ price feels heavier as real incomes are squeezed; any price increase spikes cancels | Med-High (TR) |
| **Subscription fatigue** | Discretionary line cut first in a tight month | Medium |
| **Trial-end cliff** | Cold (non-engagement-gated) trials churn hard at conversion | High if mis-gated (we mitigate via §3.3) |
| **Meetup disappointment / no-show** | A bad/unsafe meetup → churn the whole product, not just premium | Existential (handled by safety, not pricing) |

### 5.2 The crew paradox (and why it's *fine*)

**Crews paradoxically reduce premium need but increase the North Star.** Once Nilay has her Sunday bike crew and Thursday board-game crew, she needs *discovery boost* and *see-who's-interested* far less — so she may cancel Tayfa+. Naively this looks like churn to fear. It is not:

- A graduated-to-crew user **keeps generating Weekly Completed Meetups** (NSM up) and **keeps inviting friends** (k up, recap shares). She is a *retained, viral, NSM-positive* user who happens not to pay — exactly the free-tier user the liquidity firewall is designed to cherish.
- **Design implication:** premium value must live in *exploration/expansion*, not *maintenance*. Tayfa+ should always be about meeting *new* people / *new* activities / *new* cities (travel mode), so there's always a frontier to pay for. We monetize the **exploration phase** of the user lifecycle; we let the **maintenance phase** run free and feed NSM/virality.
- **Re-conversion loop:** life events (move cities → travel mode; crew disbands; want a new hobby) re-open the exploration phase → win-back offer fires. Churn here is **cyclical, not terminal.**

### 5.3 Benchmarks & the FX dilemma

- **Consumer social/dating sub monthly churn benchmarks:** typically **5–10%/mo** for monthly plans; annual plans realize **far lower** effective churn (renewal 55–70%). Our **<8% monthly target** is realistic; the **5.5% blended** base assumes a healthy annual mix.
- **The FX dilemma (TR), stated plainly:** holding ₺149 flat means EUR ARPPU erodes ~20–40%/yr with lira depreciation; raising the ₺ price to defend EUR yields risks churning a price-sensitive base. **Resolution:** (1) hold ₺ *nominally* flat between annual inflation resets — the absolute EUR loss is small because TR ARPU is small anyway; (2) **grandfather existing subscribers** through any increase (loyalty + churn protection); (3) recover hard currency through **EU mix + marketplace (Stripe, often EUR-denominated) + B2B2C contracts (EUR/USD)** rather than squeezing TR consumers. FX risk is *hedged by revenue mix*, not by punishing the beachhead.

### 5.4 Retention & win-back tactics

| Tactic | Targets | Lever |
|---|---|---|
| **Annual plan push** | All payers | Locks 12 months → structurally cuts churn ~half (E9) |
| **Winter indoor programming** | Seasonal churners | Board games, climbing, cooking, museum crawls — keep meetups (and value) alive Nov–Feb |
| **Win-back at re-exploration** | "Found my crew" graduates | "Your old crew is meeting" + "try a new hobby" + discounted re-trial |
| **Travel-mode trigger** | Relocating users | Re-opens exploration phase → natural re-subscribe |
| **Transparent trial reminders** | Trial cohort | T-2-day notice cuts angry uninstalls/chargebacks (TR trust) |
| **Pause, don't cancel** | Wavering payers | Offer a 1–2 month pause (RevenueCat) instead of losing them |

### 5.5 Cohort survival — why annual mix is the #1 LTV lever

Subscriber lifetime (the multiplier on every LTV figure in §4) is *entirely* a function of churn. The table shows survivors per 100 starters under three regimes — the monthly-plan ceiling (8%), the base blend (5.5%), and an annual-heavy mix (4%):

| Month | Monthly-plan (8%/mo) | **Base blend (5.5%)** | Annual-heavy (4%) |
|---|---|---|---|
| M0 | 100 | 100 | 100 |
| M3 | 78 | 85 | 88 |
| M6 | 61 | 71 | 78 |
| M12 | 37 | 50 | 61 |
| M18 | 22 | 36 | 48 |
| M24 | 13 | 26 | 38 |
| **Avg lifetime (mo) = 1/churn** | **12.5** | **18.2** | **25.0** |
| **Relative LTV** | 1.0× | **1.46×** | **2.0×** |

**Moving the payer base from monthly-dominant to annual-heavy doubles LTV** — a larger lever than any plausible price increase or conversion-rate gain, and it does so *while reducing* perceived price (the discount) and FX risk (§2.5). This is why "push annual" is the single highest-priority retention move, and why the LTV:CAC ≥3 target leans on annual mix as much as on CAC discipline. The seasonal winter dip (§5.1) is precisely *when* annual subscribers keep paying while monthly subscribers cancel — annual is also a **seasonality shock-absorber.**

---

## 6. Marketplace & Secondary Revenue (Scale — P9)

Sequenced strictly behind a proven, safe, multi-city core (roadmap P9: "only on top of a proven, safe core"). Marketplace monetizes **all actives in harder currency** and **smooths the seasonality** that hits consumer subs.

### 6.1 Revenue lines

| Line | Mechanism | Take / model | Currency | Seasonality role |
|---|---|---|---|---|
| **Ticketed / featured events** | Host charges; we take a platform fee via **Stripe Connect** | **10–15% take** on GMV + Stripe fees passed appropriately | ₺ (TR) / € (EU) | Winter indoor *ticketed* events offset outdoor dip |
| **Venue / brand sponsored events** | Venue/brand pays to host or promote a **clearly-labeled** sponsored event | Flat sponsorship + CPM-style reach fee; strict policy engine | € mostly | Counter-cyclical (brands push indoor/seasonal campaigns) |
| **Host pro-tools** | Recurring/ticketed mgmt, waitlists, host analytics, payouts | Tayfa+ for hosts / rev-share | mixed | Recurring liquidity |
| **B2B2C contracts** | Campus / relocation / HR onboard cohorts of newcomers | Per-seat / annual contract | **€ / $** | Contract revenue independent of season |

### 6.2 GMV & take modeling (illustrative, one mature 100k-MAU city)

- **Ticketed events:** assume **8% of MAU** buy ~1 ticketed event/mo at avg **₺150 (€3.19)** → GMV = 8,000 × €3.19 = **€25,500/mo**; at **12% take** = **€3,060/mo**.
- **Sponsored / venue:** at density, brand/venue budgets ≈ **€0.15/MAU/mo** = **€15,000/mo**.
- **Host pro-tools + misc:** ≈ €3,000/mo.
- **Total marketplace ≈ €21,000/mo** → **€0.21/MAU/mo** (consistent with the €0.05–0.30 ramp; €0.30 base assumes B2B2C contribution on top).

### 6.3 Why this is the economics fix, not a nice-to-have

- **It monetizes the 96% who never subscribe.** A free user who buys one €3 ticketed padel session generates more contribution than her share of serving cost — *without* a subscription.
- **It's in harder currency** (Stripe/€/$ for sponsorship + B2B2C), directly hedging TR FX erosion (§5.3).
- **It smooths seasonality** (ticketed indoor + brand campaigns peak when outdoor meetups dip).
- **B2B2C sells to the exact persona** (newcomer Nilay arrives *via* her employer's relocation package or her campus) — the lowest-CAC top-of-funnel imaginable.
- **It diversifies beyond low consumer WTP** — the structural ceiling identified in §2.4 and §4.

**Brand guardrail (non-negotiable):** sponsored content meets the same safety bar as organic, is *unmissably labeled*, and never disguised as peer content (roadmap P9). The marketplace must never make Tayfa feel "ads-first" — that would erode the trust the whole model is built on.

---

## 7. Revenue Projection (illustrative multi-year, multi-city)

**These are planning models for sizing and sequencing decisions — explicitly NOT promises or forecasts.** They build MRR bottom-up from city count × MAU/city × conversion × ARPPU + marketplace, using §0 assumptions. Monetization starts only at P7 (after retention proven), so **Year 1 ≈ €0 revenue by design.**

### 7.1 City build-up (base case)

| Period | Cities (MAU) | Total MAU | TR / EU split |
|---|---|---|---|
| **Y1** (2026–27) | Istanbul (MVP→PMF, *not monetizing*) | ~40k | 100% TR |
| **Y2** (2027–28) | Istanbul 60k, İzmir 15k, Ankara 15k | ~90k | 100% TR |
| **Y3** (2028–29) | + EU pilots (Berlin, Amsterdam 20k ea); TR grows | ~210k | 170k TR / 40k EU |
| **Y4** (2029–30) | 5 TR cities (280k) + 5 EU cities (150k) | ~430k | 280k TR / 150k EU |

### 7.2 MRR / ARR build (base case)

| | Y1 | Y2 | Y3 | Y4 |
|---|---|---|---|---|
| MAU | 40k | 90k | 210k | 430k |
| Conversion (TR / EU) | — | 3% / — | 4% / 4.5% | 4.5% / 5% |
| TR paying | 0 | 2,700 | 6,800 | 12,600 |
| EU paying | 0 | 0 | 1,800 | 7,500 |
| Subs MRR (net) | €0 | €5,913 | €23,748 | €64,494 |
| Marketplace €/MAU | €0 | €0 | €0.10 | €0.30 |
| Marketplace MRR | €0 | €0 | €21,000 | €129,000 |
| **Total MRR** | **€0** | **€5,913** | **€44,748** | **€193,494** |
| **ARR (run-rate)** | **€0** | **~€71k** | **~€537k** | **~€2.32M** |

**What the model reveals:**
- **Marketplace overtakes subscriptions by Y3** (€21k vs €24k) and dominates by Y4 (€129k vs €64k, **67% of revenue**) — the direct consequence of low TR consumer WTP.
- **EU is ~35% of MAU but ~57% of *subscription* revenue** by Y4 (€36.9k of €64.5k) — the PPP gap in action.
- The business is a **"many modest cities + marketplace"** story, not a "one big subscription city" story.

### 7.3 Conservative vs base vs optimistic (Year 4 ARR)

| Case | Y4 MAU | Conv (TR/EU) | Mktpl €/MAU | Subs MRR | Mktpl MRR | Total MRR | **Y4 ARR** |
|---|---|---|---|---|---|---|---|
| **Conservative** | 250k (180 TR/70 EU) | 3.5% / 4.5% | €0.15 | €29,295 | €37,500 | €66,795 | **~€802k** |
| **Base** | 430k (280/150) | 4.5% / 5% | €0.30 | €64,494 | €129,000 | €193,494 | **~€2.32M** |
| **Optimistic** | 700k (400/300) | 5% / 6% | €0.50 | €132,360 | €350,000 | €482,360 | **~€5.79M** |

The 7× spread between conservative and optimistic is driven mostly by **(1) EU MAU share** and **(2) marketplace ARPU/MAU** — i.e., by the two diversification levers, not by squeezing more out of TR subscriptions. *This is the strategic message of the whole report, expressed as a number range.*

---

## 8. Pricing & Paywall Experiment Backlog

Run on **PostHog flags + experiments** (roadmap §11). Every experiment: one primary metric, predefined **guardrails (NSM + liquidity + free-tier health + safety NEVER regress)**, MDE & sample set before launch, no peeking. Reversible by flag. Extends the roadmap's E8–E10.

| # | Area | Hypothesis | Primary metric | Guardrail | Risk |
|---|---|---|---|---|---|
| **E-P0** | WTP research | A real Van Westendorp/Gabor-Granger survey of engaged TR users locates OPP | OPP / acceptable band | — (survey) | Low |
| **E-P1** | Price ladder (TR) | ₺99 or ₺129 monthly nets higher *revenue-per-eligible* than ₺149 (volume > price) | Rev-per-eligible-user | NSM, free-tier health | Med — under-pricing leaves money on table |
| **E-P2** | Price ladder (EU) | €5.99 beats €6.99 on conversion without hurting ARPU enough to matter | Net new MRR | Free-tier health | Low |
| **E-P3** | Trial length | 14-day trial > 7-day on trial→paid (more value exposure) | Trial→paid | Trial-start rate, NSM | Med — longer free ride if it doesn't convert |
| **E-P4** | Annual discount depth | 50%-off annual lifts annual-mix & LTV more than it cannibalizes (E9 extension) | LTV, annual mix | Blended ARPPU, free-tier health | Med — over-discounting erodes ARPPU |
| **E-P5** | Decoy / 3-mo plan | Adding a deliberately-weak quarterly plan steers users to annual | Annual-mix, total conversion | Total conversion (decoy can suppress it) | Med |
| **E-P6** | Paywall placement | Post-meetup-high (P-1) > "fills-fast" (P-2) on trial-start (E8 extension) | Trial-start rate | **NSM, liquidity, no-show** | Med |
| **E-P7** | Framing | "More & better plans" > "unlock basics" on conversion (E10) | Conversion | **NSM, liquidity** | Low |
| **E-P8** | Trigger gate | ≥2-meetup gate beats ≥1-meetup and beats no-gate on trial→paid & post-trial churn | Trial→paid; D30-post-conversion | Eligible-pool size, NSM | Med |
| **E-P9** | See-who's-interested | Offered standalone (micro-unlock) vs only-in-bundle | Conversion, ARPPU | Bundle ARPPU | Med — unbundling can lower ARPPU |
| **E-P10** | Intra-TR localization | Lower price in lower-income TR cities than Istanbul lifts conversion enough to net positive | City-level rev-per-eligible | NSM per city | Med — complexity, fairness optics |
| **E-P11** | Founder / early-bird | A capped lifetime/heavy-discount offer to the first city's pioneers seeds advocacy | Referral k from cohort | LTV dilution | Low-Med |
| **E-P12** | Win-back offer | Discounted re-trial at re-exploration beats full-price | Reactivation rate | Margin on reactivated | Low |
| **E-P13** | Pause vs cancel | Offering pause cuts net churn vs hard cancel | Net churn | — | Low |

**Discipline reminder (canonical):** the *liquidity/NSM guardrail* on every pricing experiment means a pricing win that *depresses Weekly Completed Meetups* is treated as a **loss** and reverted, regardless of MRR lift.

---

## 9. Monetization Risks & Guardrails

| Risk | Why it's real here | Guardrail / mitigation | Reversible? |
|---|---|---|---|
| **Low WTP in TR** | €3.17 TR price; subs alone don't cover serving cost at target conversion (§4.3) | PPP pricing to local WTP; **marketplace + EU + B2B2C carry economics**; ruthless cost-per-MAU discipline | n/a (structural) |
| **Store-cut erosion** | 15–30% off the top of every IAP | Apple SBP + Google sub rate (15%) while <$1M; push **annual** (amortizes); pursue compliant **web checkout** where store rules allow; Stripe for marketplace (no store cut) | Yes |
| **Paywall harms liquidity/growth** | A wall on a network-effect product removes events from others' feeds | **NSM & per-geocell liquidity guardrail flat-or-up** post-paywall or revert flag (roadmap P7); free tier generous; placements *adjacent* to loop, never inside | **Yes — flag-gated** |
| **FX volatility (₺)** | EUR ARPPU erodes 20–40%/yr; raising ₺ price churns users | Hold ₺ nominal between inflation resets; grandfather existing subs; hedge via EU/marketplace/B2B2C hard-currency revenue (§5.3) | Partial |
| **Subscription fatigue** | Small marginal discretionary line; many subs compete | Engagement-gated trials (sell to those with proven value); annual reduces decision frequency | Yes |
| **Over-monetization erodes trust/brand** | Trust is the moat; "ads-first" feel would burn it | Sponsored events **unmissably labeled** + same safety bar; one-paywall-per-session cap; never interrupt the loop | Yes |
| **Entitlement/revenue leakage** | Client-trusted unlocks, webhook gaps | Server-side entitlement source-of-truth (RevenueCat), idempotent webhooks, cross-store test matrix (roadmap P7) | n/a (engineering) |
| **Trial / referral abuse** | Trial-farming, fake referrals | Gate on **real completed meetups** (geofence+mutual-confirm), fingerprinting (roadmap §6) | Yes |

### 9.1 The reversibility guarantee

Every monetization surface ships as a **PostHog-flagged, A/B-testable, instantly-revertible** experiment with the **NSM/liquidity guardrail wired into the rollout dashboard** (roadmap P7 execution prompt). Monetization is treated as a *reversible overlay* on a healthy free product — if any paywall depresses the North Star, it is rolled back by flag, no deploy required. **We would rather under-monetize than damage liquidity.**

### 9.2 What we will NEVER monetize (the inviolable list)

- **Safety:** block, report, appeals, the safety center, SOS/check-in, share-my-plan, live-location-to-crew.
- **Verification-to-be-safe:** phone *and* ID+liveness verification — even though ID costs us €1–1.5/verify, it stays free because it is a *trust/protection* primitive, not a convenience.
- **Safety filters:** women-only and verified-only event filters (these are protection; *taste* filters are premium).
- **Core loop:** discover, **create**, join, RSVP, group chat — unlimited, free, forever. The liquidity firewall.
- **Reporting/blocking & moderation access** for users.

> Selling any of the above would monetize the moat by destroying it. **Trust and liquidity are the assets; subscriptions and the marketplace are claims we carefully draw against them — never the assets themselves.**

---

## 10. Synthesis — the one-paragraph thesis

Tayfa monetizes a **local-network-effect, trust-based social good** with a **generous freemium subscription (Tayfa+)** that is gated *after* retention is proven (P7), priced to *local* willingness-to-pay (₺149 / €6.99, ~40%-off annual), and triggered at the *post-meetup high* for engaged users — so that paying *accelerates* the North Star rather than taxing it. The unmissable financial truth, surfaced honestly in §4: **at Turkey's purchasing power, subscription revenue at target (3–5%) conversion barely covers the cost of serving the user base** (TR subs-only break-even ≈ 5.5% conversion vs EU's 2.4%). The plan does not pretend otherwise — it **diversifies deliberately into a marketplace (Stripe Connect take, sponsored events, host tools) and B2B2C (campus/relocation/HR)** that monetize *all* actives in *harder currency* and *smooth seasonality*, and it **expands into higher-ARPU EU cities**. Subscriptions are the retention-aligned revenue; the **marketplace is the economics-fixing revenue**, overtaking subs by ~Year 3 in the base model. Everything is **flag-reversible behind an NSM/liquidity guardrail**, and **safety + the core loop are never, ever paywalled.**

---

*Companion to `roadmaps/APP_EXECUTION_ROADMAP.md` (source of truth) and sibling reports `RISK_ANALYSIS.md`, `GROWTH_STRATEGY.md`, `TECH_DECISIONS.md`. All figures are illustrative planning models with stated assumptions (§0), not forecasts or commitments.*
