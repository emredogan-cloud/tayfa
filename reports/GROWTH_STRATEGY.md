# GROWTH STRATEGY — Tayfa (working codename)

> **Companion to:** `roadmaps/APP_EXECUTION_ROADMAP.md` (the source of truth). This report expands §6 (Growth & Retention) and §11 (Experimentation); it never contradicts the roadmap.
> **Product:** A verified, location-based social app that turns shared hobbies into real-life **small-group** hangouts for young people (18–32) new to a city or lonely in it. **Not a dating app** — *"friends through doing, not swiping."*
> **Beachhead:** Istanbul (hyperlocal first: Kadıköy / Beşiktaş) → İzmir / Ankara → EU university cities.
> **North Star Metric (NSM):** **Weekly Completed Meetups** — distinct events with ≥2 verified users confirmed present (geofence ∩ mutual confirmation).
> **Activation (canonical):** **first completed meetup** — *not* signup, not onboarding.
> **Growth stack:** PostHog (analytics · flags · experiments) → BigQuery + dbt · Braze (lifecycle) · Inngest (durable triggers) · RevenueCat (subs).
> **Targets:** D1 ≥45% · D7 ≥30% · D30 ≥22% · k ≥0.4 in a saturated city · ≥1.3 meetups/active/mo (→2.5+) · onboarding ≥70% · <90s to a populated feed · median time-to-first-meetup <7 days.
> **Non-negotiable:** Safety is **never** paywalled, never gamified into risk, never traded for growth.

> **Terminology note (read once):** This report uses **activation = first completed meetup** (canonical). Where the roadmap's MVP-metrics line says *"≥35% of activated users attend ≥1 meetup within 14 days,"* read "activated" there as **onboarded/registered**. To avoid circularity, this report names the funnel step **onboarded → first meetup** and targets **≥35% within 14 days**.

---

## 1. Growth Thesis

### 1.1 Why this product grows (three compounding forces)

**(a) Local network effects — value is per-city density, not global scale.** A user in Kadıköy does not care how many people use Tayfa in Berlin. They care whether there are ≥40 live events within 5 km *this week*. This is the defining property of the entire growth model: **the unit of the network is a neighborhood-radius liquidity pool, not the app.** Every strategic decision flows from it — we win cities, not users. The flip side is the opportunity: a saturated city is a near-impregnable local monopoly, because a competitor must out-seed *liquidity in that exact geography*, not just out-spend on ads.

**(b) Structural, multiplayer virality — inviting is the product, not a bolt-on.** Unlike a single-player app where "invite a friend" is an awkward growth-team ask, **every Tayfa event has a minimum capacity that the host is intrinsically motivated to fill.** "Padel tonight, need 2" is a referral with no growth incentive attached — the host *needs* you to come or the plan dies. The act of using the product (organizing a hangout) is identical to the act of recruiting. Virality is not grafted on; it is the mechanic. This is the single most important structural advantage and the reason paid acquisition should never lead (see §5, §8).

**(c) Interest-graph + reputation moat — switching costs that compound.** Every onboarding taste card, every attended meetup, every vibe rating, every formed crew, and every point of reliability score deepens a per-user data asset that a competitor starts from zero on. The interest embedding makes matches "uncanny" over time; the reliability score becomes social currency the user has *earned* and won't abandon (loss aversion + the IKEA effect — people value what they build). Crews are the highest-order moat: once your Sunday bike crew lives in Tayfa, leaving means leaving your friends, not an app.

### 1.2 The ONE bottleneck

> **Cold-start liquidity, per city.** Everything else is solvable with code and craft. Liquidity is the gate. A new user who opens the app and sees an empty or sparse feed within 5 km has had the value proposition *disproven* in their first session — and they do not come back. The entire growth program is, in priority order: **(1) manufacture liquidity in one neighborhood, (2) convert that liquidity into completed meetups, (3) turn completed meetups into retention and virality so liquidity becomes self-sustaining, (4) repeat the playbook city by city.** Steps 2–4 are leverage; step 1 is the bottleneck. We do not spend a lira on broad demand acquisition until a geocell can pass the liquidity bar (≥40 live events/week within 5 km of the median user).

### 1.3 The growth model in one paragraph

Tayfa grows by **saturating one neighborhood-radius liquidity pool at a time.** We seed the *supply* side first (ambassador hosts + partner communities + AI-assisted event creation so a city is never a ghost town), which makes the feed dense enough that onboarding's "12 events near you this week" promise is *true*. Density drives the activation event — a **first completed meetup** — which is where real retention begins. Completed meetups trigger two compounding loops: a **retention loop** (rate → "meet again?" → crew formation → recurring rituals → habit) that lifts D30 and meetups/user, and a **virality loop** (multiplayer event invites + shareable recap cards + quality-gated referrals) that produces k ≥ 0.4 and feeds *new supply and demand back into the same pool*. More meetups → more crews + more shares → more users → more events → denser liquidity → more meetups. Once a pool's flywheel spins on its own (organic events ≥ seeded events, k ≥ 0.4, D30 ≥ 22%), we graduate the city, redeploy seeding capital to the next neighborhood/city, and repeat. **Paid acquisition is a backfill, never the engine.**

---

## 2. The Cold-Start Playbook (the most important section)

> **Mission:** take one neighborhood from **zero** to a self-sustaining liquidity pool, then expand by adjacency. This is the founder's job, not the code's (per roadmap §12 execution bottlenecks). The playbook below is the literal sequence for **Kadıköy** as the first pool; **Beşiktaş** is the second; their union is the Istanbul beachhead.

### 2.1 Why Kadıköy first (geography is destiny)

The Bosphorus is a **natural network boundary.** A young person in Kadıköy (Asian side) will not cross to Beşiktaş (European side) for a casual Tuesday coffee or a Sunday pickup football game — the ferry/bridge friction is real. This is a *gift*: it means a 5 km radius around Moda/Kadıköy is a **self-contained liquidity pool** we can saturate without leaking spend across a city of 16M. Concentrate, don't spread.

Kadıköy specifically because: (1) dense, young, mobile-first, high disposable-time population (students + early-career creatives); (2) walkable, café-and-coastline culture (Moda, Yeldeğirmeni, the Caddebostan–Bostancı coastal running/cycling path) — *built-in activity surfaces*; (3) a high concentration of the primary persona — **Newcomer Nilay**, who moved to Istanbul for work with zero local friends; (4) existing third-wave coffee, board-game café, climbing, and running-crew scenes to partner with. Beşiktaş is the natural second pool: student-heavy (adjacent to Boğaziçi University), Bebek–Ortaköy coastline, nightlife — same persona density, different side of the water.

### 2.2 The chicken-and-egg: seed SUPPLY before DEMAND

The fatal cold-start mistake is acquiring demand (lonely newcomers) into an empty feed. **Supply is seeded first and deliberately over-provisioned**, so that the very first organic demand user lands on a feed that *already looks alive*. Sequencing:

```
 WEEK -2 → 0   SUPPLY SEEDING (no public launch)
   • Recruit 15–25 ambassador hosts in Kadıköy (see 2.3)
   • Sign 6–10 niche-community partners (see 2.4)
   • Pre-load 40–60 events across the next 2 weeks via AI templates
   • Ghost-town guard ON: feed can never render empty (see 2.5)
        │
        ▼
 WEEK 0 → 4    CONTROLLED DEMAND (invite-only / waitlist)
   • Open to partner communities + campus ambassadors' networks only
   • Goal: every demand user finds a "perfect first event" < 5 km, this week
   • Measure: time-to-first-meetup, RSVP→attend, no-show, feed-density-at-open
        │
        ▼
 WEEK 4 → 10   LIQUIDITY BUILD → cross the bar
   • Drive organic event creation up; reduce seeded share each week
   • Target the bar: ≥40 live events/week within 5km of median user
   • Crews start forming → recurring events become "free" supply
        │
        ▼
 WEEK 10+      FLYWHEEL / GRADUATE
   • Gate: organic events ≥ seeded events; k ≥0.4; D30 ≥22%
   • Pull back ambassador spend; redeploy to Beşiktaş (pool #2)
```

### 2.3 Supply-side seeding (the make-or-break)

**Ambassador hosts** — the single highest-leverage cold-start tactic. Recruit 15–25 hyper-local hosts per pool: the kind of people who *already* organize ("the person who always plans the Sunday ride"). Compensation is a **per-completed-meetup bounty**, not a flat fee, so incentive aligns with the NSM (e.g., ₺X per confirmed meetup with ≥3 attendees and ≥4.0 vibe rating; bonus for forming a recurring crew). Perks stack: free Tayfa+, "Founding Host of Kadıköy" status badge, neighborhood host-leaderboard standing, early-access to features, small experience budget (covers the coffee/court fee). **Aligning the bounty to meetup *quality* (rating + recurrence), not raw event count, is critical** — otherwise you breed ghost events that poison the feed.

**AI event templates (the effort-killer).** Hosting must take **<30 seconds.** The create flow opens to a gallery of one-tap templates (Claude Haiku-generated, cached by interest cluster, per roadmap §6/Phase 4): *"Sunday coastal run · Caddebostan, 8am, 5–8 people," "Board-game night · [café], Thursday 8pm, 4–6," "Halı saha · need 2, Wednesday 9pm."* The template pre-fills title, suggested venue, capacity, and an icebreaker. **This is the supply-side analog of the demand-side liquidity proof:** lowering creation friction directly raises events/host.

**The Turkish unlock — halı saha (5-a-side football).** This deserves its own line. Pickup football in Turkey runs on a permanent, structural shortage: someone books an *halı saha* (artificial pitch) and is *always* "2 players short." That is a referral request with built-in urgency, recurring weekly, in every neighborhood. **Halı-saha "need 2" events are the highest-intent, highest-recurrence cold-start wedge in this market** — they convert, they recur (same pitch every week = instant crew), and they're male-skewed which we deliberately balance with running/board-game/brunch verticals that skew the other way. Seed halı saha hard from week 0.

**Ghost-town guard (a first-class system, per roadmap §6/Phase 8).** Hard rule: **the feed never renders empty.** If organic + seeded events within the user's radius drop below a threshold, the system (a) widens the radius gracefully, (b) surfaces curated partner events, (c) surfaces "starter" templates with a *"be the first — create one, 6 people are looking"* CTA (turning sparse supply into a demand-side prompt). The user must *never* perceive a dead city.

**Supply seeding scorecard (per pool, weekly):**

| Metric | Week 0 target | Graduation target |
|---|---|---|
| Live events/week within 5 km of median user | ≥15 (mostly seeded) | **≥40** |
| Active hosts (≥1 event/wk) | 15–25 (ambassadors) | ≥60 (mostly organic) |
| Seeded share of events | ~80% | **<50%** (organic ≥ seeded) |
| Event fill rate (reach min capacity) | ≥60% | ≥75% |
| Avg meetup vibe rating | ≥4.0 / 5 | ≥4.3 / 5 |

### 2.4 Demand-side seeding (warm, not cold)

We do **not** buy cold individual installs in a cold pool. We import **pre-formed micro-communities** — each partner drops a cluster of people who already share an interest *and* a place, which is instant local liquidity and instant social trust (the partner's endorsement pre-solves safety anxiety).

| Partner type | Istanbul-specific examples / where | Why it works | Tactic |
|---|---|---|---|
| **Running clubs** | Caddebostan/Bağdat Cd. coastal crews, Adidas/Nike-style run crews, parkrun-style groups | Recurring, location-fixed, social-by-nature; skews mixed-gender | Co-host a weekly Sunday run *in-app*; club admin becomes ambassador host |
| **Climbing / bouldering gyms** | Kadıköy-side boulder gyms | Need partners; high repeat; tight community | "Find a belay partner / beginner night" events; gym posts QR |
| **Board-game cafés** | Kadıköy/Moda board-game cafés | Built for small groups; café wants midweek footfall | Co-branded "open table" nights; café gets bookings, we get demand |
| **Newcomer / expat groups** | InterNations Istanbul, Couchsurfing meetups, "new in Istanbul" FB/Telegram groups, relocation cohorts | **Exactly the primary persona** (Newcomer Nilay) | Seed the group with a curated welcome event; offer group-only early access |
| **Campus** | Boğaziçi, İTÜ, Koç, Sabancı, Bilgi, Marmara, Yıldız, MEF, Özyeğin | Dense, lonely-freshman moment, ambassador-friendly | Campus ambassadors (see §8); orientation-week launches |
| **Language exchange / Tandem** | Café language-exchange nights | Recurring, newcomer-heavy, explicitly platonic | Co-host weekly; perfect anti-dating positioning |
| **Hobby/sport leagues** | Halı saha groups, yoga/pilates studios, cycling shops' Sunday rides | Structural "need N more" | Template + ambassador host |

**Timing the demand wave to the calendar (Fresh Start Effect, Milkman).** Newcomers and loneliness peak on predictable dates: **September** (university intake + corporate relocation season) and **February** (spring term). Launch demand waves *on* these fresh-start moments — people are most open to new identities and routines exactly when they've just moved. Ramadan iftar gatherings are a culturally-specific *group* occasion (an opportunity, not a dead period); August is a genuine trough (city empties for the coast) — plan indoor/return-to-city programming for early September.

### 2.5 Liquidity targets before scaling (the go/no-go gate)

Per roadmap §6, the canonical bar to *scale* (i.e., open broad acquisition / move to the next pool) is:

> **≥40 live events/week within 5 km of the median user**, with organic events ≥ seeded events, event fill rate ≥75%, and median time-to-first-meetup <7 days.

Plus the flywheel proof points: **k ≥0.4** and **D30 ≥22%** in the pool. Until a pool clears these, *all* spend stays on supply seeding and warm demand, not broad demand. This is the discipline that prevents the classic IRL-social death (spreading thin across a region and being dense nowhere).

### 2.6 Geographic density strategy: neighborhood → city → region

```
  NEIGHBORHOOD (5km pool)        CITY (multi-pool)            REGION
  ───────────────────────       ──────────────────────       ─────────────────
  Kadıköy (pool #1)             Istanbul = Kadıköy           TR: İzmir, Ankara
     → cross the bar             + Beşiktaş + Şişli           (each = repeat the
  Beşiktaş (pool #2)             + Cihangir + Sarıyer/        neighborhood play)
     → cross the bar             Maslak (campus) ...               │
        │                              │                           ▼
        ▼                              ▼                      EU university
  Adjacency expansion:          A city is "won" when         cities (Berlin,
  next pool must border         pools tile the young-         Amsterdam, etc.)
  a saturated one (warm         population map and             — same playbook,
  spillover, shared crews)      organic >> seeded             newcomer-dense
```

**Rules:** (1) **Never open a non-adjacent pool** — adjacency gives warm spillover (a Kadıköy crew member who moves to Beşiktaş arrives with reputation + habit). (2) **One pool at a time per ambassador team** until it self-sustains. (3) **City-launch is a repeatable playbook** (roadmap §6/Phase 8 ops console: liquidity heatmaps, ambassador pipeline, ghost-town guard, per-city go/no-go gates) — each launch should be *faster-to-liquidity* than the last; that compression is the Phase 8 success metric. (4) The Bosphorus boundary insight generalizes: every city has natural network seams (rivers, transit lines, campus clusters) — map them and treat each as a pool.

---

## 3. Activation Engine

> **Activation = first completed meetup.** Onboarding's *only* job is to compress the distance to that event. Everything is measured against **median time-to-first-meetup <7 days** and **≥35% of onboarded users reaching a first meetup within 14 days**.

### 3.1 Onboarding psychology (the <90-second populated feed)

The roadmap mandates **<90s from signup to a populated feed** and **≥70% onboarding completion.** The design is built on four psychological moves:

1. **Taste cards, not a form (identity + IKEA effect).** Interests are captured as tappable cards — artists, shows, sports, cuisines, causes — not a text form. Tapping "indie rock," "bouldering," "Letterboxd nerd," "Beşiktaş JK" is *fun and identity-affirming*: the user is composing a self-portrait, not filling a survey. The IKEA effect makes the resulting profile feel *theirs* (raising completion and later retention). **Experiment E1** proves taste-cards > form (+10pp completion).

2. **Liquidity proof, immediately (social proof + disconfirmation-avoidance).** The moment enough interests are tapped, show **"12 events near you this week"** with real faces/venues. This is the single most important onboarding screen: it *proves the core promise before asking for anything else.* If liquidity is low, the ghost-town guard supplies seeded/partner events so the proof is always true. **Experiment E2:** showing liquidity proof early shortens signup→first-meetup.

3. **Progressive disclosure + friction stripping (value before tax).** Start with **phone OTP only.** **Defer ID/liveness verification** until the user wants to *host or DM* (value-first, trust-step-up-later, per roadmap §6). Never ask for ID to *browse or join* — that's a cash incinerator and an activation killer. Age-gate 18+ at OTP.

4. **Connect-accounts enrichment (effort transfer).** Optional one-tap Spotify / Apple Music / Letterboxd connect pre-fills 20–40 interests in two seconds, making matches instantly "uncanny" and the feed instantly relevant. **Experiment E13:** connect-prompt placement vs manual-only on interest-count and onboard→RSVP, guardrailed on total onboarding time (<90s).

### 3.2 The path to the FIRST MEETUP & the "perfect first event" mechanic

The instant interests are set, surface **one perfect, low-stakes, near, soon, social-proofed event** with a **one-tap RSVP**:

> *"Sunday coffee crawl in Moda · 4 going · 2 of them love indie rock like you · 1.2 km away · this Sunday 11am."*

Why this works (stacked psychology): **social proof** ("4 going"), **mutual-interest bridge** ("2 love indie rock like you" → instant conversation surface, kills first-meeting dread), **low stakes** (coffee, daytime, group — not a 1:1 evening = not a date), **proximity + immediacy** (near + soon = low activation energy), and **commitment-consistency** (a tiny one-tap RSVP is a public micro-commitment that the user then wants to honor). **Experiment E3** (roadmap E3): one-tap "perfect first event" CTA lifts the 14-day meetup rate +5pp, guardrailed on no-show.

**Anti-pattern guard:** the perfect first event must be **engineered for success** — small, daytime, low-stakes, hosted by a vetted ambassador, with a warm pre-event chat. A bad first meetup (no-show, awkward, unsafe) is worse than none — it disconfirms the promise permanently. The first meetup is a **peak-end** moment: invest disproportionately in making it great.

### 3.3 The activation funnel (with target conversions)

Targets are **lead-city / post-seeding** (a cold pool will be worse until liquidity clears the bar). Modeled cumulative **within 14 days** to align with the ≥35% onboarded→first-meetup target.

```
 STEP                         CONVERSION   CUM. FROM INSTALL   NOTES
 ───────────────────────────  ──────────   ─────────────────   ─────────────────────────────
 Install                          —            100.0%          (acquisition; see §8)
   ↓ start + complete phone OTP   70%           70.0%          friction: OTP delivery, 18+ gate
 Signup
   ↓ complete onboarding ≥5 int.  75%           52.5%          taste cards + connect (≥70% bar)
 Onboarded
   ↓ reach populated feed/tap     90%           47.3%          liquidity proof; <90s
 Browse (engaged)
   ↓ first RSVP (within 14d)      50%           23.6%          perfect-first-event + nudges
 RSVP
   ↓ attend (NSM confirmed)       75%           17.7%          no-show <25%; chat warm-up + reminders
 ATTEND = ACTIVATED (1st meetup)
   ↓ submit rating                80%           14.2%          peak-end capture
 Rate
   ↓ tap "meet again" / crew seed ≥40%          ~7.1%          → retention loop (§4)
```

**Funnel readouts:**
- **Onboarded → first meetup = 0.90 × 0.50 × 0.75 ≈ 34%** within 14 days → on the ≥35% target with optimization headroom (E3, E14, E15 push it over).
- **Install → first meetup ≈ 18%** — a healthy IRL-social activation rate; the leaky steps with most leverage are **OTP (70%)** and **browse→RSVP (50%)**, the two biggest activation experiments.
- **RSVP→attend = 75% (no-show <25%)** is a *trust + retention* number, not just activation — defended by pre-event group chat (the anti-shyness wedge), T-24h/T-2h reminders, and reliability scoring (§4).

### 3.4 The aha moment (defined precisely)

> **The aha moment is the end of the first completed meetup, in the rate/"meet again?" screen, when the user realizes they just made a real plan with real people and want to do it again.** It is *not* "saw a relevant feed" (that's the *promise*), and *not* "RSVP'd" (that's *intent*). The product's entire job is to drag every onboarded user to this moment within 7 days, because retention curves bifurcate sharply here: users who reach a *second* meetup or form a crew within 14 days retain at multiples of those who don't (§6).

### 3.5 Friction audit (rank-ordered by activation damage)

| Friction point | Damage | Mitigation |
|---|---|---|
| **Empty/sparse feed at first open** | Existential — disproves promise | Ghost-town guard; liquidity proof; supply seeded first (§2) |
| **ID verification asked too early** | Severe — kills browse/join | Defer to host/DM only; phone OTP to start |
| **No-show on first meetup** | Severe — disconfirms, permanent | Engineer the "perfect first event"; chat warm-up; reminders; reliability score |
| **OTP delivery failure / 18+ friction** | High — top-of-funnel leak | Reliable SMS provider, fallback, clear copy |
| **Interest capture as a form** | High — completion drop | Taste cards + connect-accounts (E1, E13) |
| **First-meeting dread (is this a date?)** | High — segment-blocking | Small-group default; explicit anti-dating copy; pre-event chat |
| **Safety anxiety (esp. women)** | High — segment-blocking | Verified badges, women-only/verified-only filters, safety-as-proof (E11, E22) |
| **Feed relevant but no clear next action** | Medium | Single, obvious one-tap "perfect first event" CTA |
| **Chat thread dead pre-meetup** | Medium → drives no-show | AI icebreaker auto-post; host welcome (E14) |

---

## 4. Retention Loops & Habit Formation

> **The retention thesis:** one-off meetups churn; **crews** (recurring groups) are the D30 engine. The roadmap is explicit (§6, Phase 6): *the recurring-crew is the single strongest D7→D30 lever.* Habit forms when a meetup becomes a *ritual* ("the Sunday bike people") — at which point the app's job is just to be the lightweight coordinator the crew already relies on.

### 4.1 D1 / D7 / D30 strategies (in depth)

**D1 — "your plan is real and warming up."** The day after signup/RSVP, the goal is to make the upcoming meetup feel alive: chat thread comes alive (host welcome + AI icebreaker so it's never an awkward empty room), "someone joined your event," "your meetup is in 3 days." D1 leans on **commitment-consistency** (you RSVP'd, now you're getting prepared) and the **Zeigarnik effect** (an open, incomplete loop — an upcoming plan — stays mentally active and pulls you back). **D1 ≥45%.**

**D7 — the post-meetup loop (the pivot point).** Within hours of a completed meetup, while the **peak-end** glow is high: rate vibe → "meet again?" → **crew-formation prompt**: *"You + 2 others clicked — make it a weekly thing?"* This is the most important retention surface in the product. It converts a one-off into a recurring obligation-to-friends. Also at D7: rebooking suggestions, "people you'd vibe with are active in your neighborhood." **D7 ≥30%; ≥40% of completers tap "meet again."**

**D30 — habit ritual + identity.** By D30 the retained user has a **crew** and a **recurring ritual** ("Your Sunday bike crew rides this week"). Reinforcement: weekly "what's your city doing this weekend" digest, gentle weekly streaks, and **identity reinforcement** ("you've made 6 real plans — top 10% in Kadıköy"). Identity-based habit (Fogg/Clear): the user now *is* "a Tayfa person who does things," not someone who *uses an app.* **D30 ≥22%; ≥30% of active users in ≥1 crew.**

### 4.2 The CREW formation engine (the #1 D30 lever — detailed)

A **crew** is a recurring group formed from repeat co-attendance (roadmap §5 data model: `crew`/`crew_member`/`crew_event`). The engine:

1. **Detect:** after a meetup, identify clusters of people who co-attended and rated each other highly ("would meet again" = true). Co-attendance + mutual positive rating = crew candidate.
2. **Prompt (at the peak):** surface the crew-formation CTA in the post-meetup high — *"make it weekly?"* — with a one-tap "schedule next week's" using the same template. **Experiment E5** (roadmap E5): crew prompt post-meetup lifts D30 +3pp.
3. **Reduce recurrence to one tap:** a crew's recurring event auto-drafts each week ("Sunday 8am coastal run — confirm?"). The crew becomes *free supply* that needs no seeding.
4. **Reinforce belonging (mere-exposure + loss aversion):** the crew has a home, members, a name, a next-meetup. Mere-exposure (Zajonc) means repeated low-stakes contact breeds genuine friendship; once that exists, loss aversion does the retention work ("your Sunday bike crew is meeting without you").

**Why crews are the moat, not just a feature:** a crew converts *individual* retention into *group* retention — to churn, you must abandon friends, not an app. Crew-formation rate is therefore the **leading indicator of D30** (§6) and a primary growth-review metric.

### 4.3 Habit mechanics — the Hook model applied (Eyal)

| Hook stage | Tayfa implementation |
|---|---|
| **Trigger** | *External:* capped, well-timed push ("your crew rides Sunday," "perfect event near you," "3 going to the thing you saved"). *Internal:* the felt emotion of an empty weekend / loneliness → open Tayfa. The product's deepest goal is to become the reflexive answer to *"I'm free and want to do something with people."* |
| **Action** | The minimum-effort behavior: one-tap RSVP, one-tap "schedule this week's crew meetup," one-tap create-from-template. Friction is engineered out of the *action*, never out of *safety*. |
| **Variable reward** | The genuinely variable, social payoff: *who* shows up, the vibe, a new friend, a great conversation — **the reward is the meetup, which happens off-app.** This is the healthy inversion of doomscroll apps: the variable reward is *real life*, not an infinite feed. (We deliberately do **not** build engagement-bait that keeps users *in* the app.) |
| **Investment** | Each loop deepens the asset that makes the next loop better: interests refined, reliability score earned, crews formed, ratings given, recap saved. Investment → better future triggers (better matches, crew rituals) → the loop tightens. |

### 4.4 Streaks & rituals (positive-framed — NOT guilt / dark patterns)

The roadmap is unambiguous: **no dark patterns, no loss-framed guilt, no engagement-bait** (we are explicitly *not* a doomscroll app; we win when users are *out* with people). So:

- **Streaks are positive and identity-framed, never punitive.** "3 weeks of real plans 🎉 — you're building something" — **not** "Don't lose your streak!" Streaks break *gracefully* (a missed week is "life happens," not a reset-to-zero shaming). Frame around the **goal-gradient effect** (progress toward a meaningful milestone) and **endowed progress** (start users at "1 of 3 toward a crew"), never around loss.
- **Rituals > streaks.** The durable habit is the *crew ritual* (the Sunday ride), not an abstract counter. Streaks are a light reinforcement of the ritual, not the point.
- **Weekly digest as a gentle ritual trigger:** "Your city this weekend" arrives Friday morning (send-time optimized) — an *invitation*, not a nag.

### 4.5 Gamification — reliability score as social currency, host leaderboards

- **Reliability score (the keystone gamification).** Built from attendance + ratings (roadmap §5). It is **social currency that aligns incentives with real value:** reliable people get invited more; flaky people get filtered out. It directly attacks the no-show problem (the biggest trust killer). Surfacing it (E18) makes "show up" the winning strategy. It is *earned*, which makes it sticky (loss aversion + IKEA effect) — but it is **never** a paywall and never weaponized into anxiety (guardrailed in E18).
- **Host leaderboards (supply-side gamification).** Neighborhood host leaderboards reward the *supply* side — the scarce, precious resource in a social network. "Top hosts in Kadıköy" confers status, drives ambassador competition, and is exactly the behavior we want more of. Status is a more durable motivator than cash for the right hosts.
- **Milestones, tastefully:** "first crew," "10 meetups," "met people from 5 neighborhoods." Identity-affirming badges, not vanity metrics. **No** follower counts, no likes, no in-app social-clout treadmill — those pull toward the doomscroll failure mode we reject.

### 4.6 Notification strategy (retention engine, not spam)

Notifications run through **Inngest (triggers) → Braze (journeys, send-time optimization, frequency caps)** per the stack. Governing principle (roadmap §6): **every push must pass the "would a friend text this?" bar.**

| Category | Priority | Examples | Cap behavior |
|---|---|---|---|
| **Your-plans** | Highest | "Your meetup is in 2h," "host confirmed you," "crew rides Sunday" | Rarely capped — these are *wanted* |
| **Social** | High | "Ayşe joined your event," "new message in your crew chat" | Bundled if frequent |
| **Discovery** | Medium | "Perfect-match event near you this weekend" | Hard-capped; send-time optimized |
| **Lifecycle / win-back** | Low | re-engagement, digest, milestones | Strict caps; easy opt-out |

**Mechanics:**
- **Hard frequency caps** enforced server-side (Braze) — a global ceiling (e.g., target ≤1–2/day, tunable via **E19**) regardless of how many triggers fire; your-plans notifications get priority within the cap.
- **ML send-time optimization** (Braze) — learn each user's open windows; the weekend digest hits Friday morning, the crew reminder hits the evening before. **E6** proves send-time lifts CTR without raising opt-out.
- **Granular category controls** — users can mute *discovery* without losing *your-plans*. This *reduces* total opt-out (the all-or-nothing unsubscribe is the enemy).
- **The "friend text" bar** — copy review: would a thoughtful friend actually text this? If not, it doesn't ship. No "We miss you 😢," no manufactured FOMO, no streak-shaming.
- **Guardrail:** notification **opt-out <15%** (roadmap Phase 6). Opt-out rate is the canary; if an experiment lifts CTR but raises opt-out past the guardrail, it loses.

### 4.7 Resurrection / win-back

- **Trigger:** lapsed = no meetup in 21–30 days (active is defined by *meetups*, not app-opens). Inngest fires a Braze win-back journey.
- **Content (loss-aware but not guilt-based):** lead with *opportunity and belonging*, not shame. Best performer hypothesis: **crew/loss-aversion framing** — "Your Kadıköy bike crew rode 18km Sunday — want in next week?" (real, specific, social) vs neutral "new events near you." **E21** tests this, guardrailed on opt-out/unsubscribe so win-back never becomes spam.
- **Seasonal win-back:** winter dip → indoor-activity programming (board games, climbing, cooking); August trough → "back in the city?" early-September wave (Fresh Start).
- **Re-onboarding the resurrected:** a returning user re-enters at a *populated* feed with a *perfect event* — never a cold restart. Their old crews and reliability score are intact (the asset that pulls them back).

---

## 5. Virality & Referral

### 5.1 Structural virality (the core advantage)

Restating the thesis because it governs the whole channel mix: **every event is multiplayer and capacity-constrained, so inviting is the natural act of using the product, not a growth-team request.** "Football tonight, need 2" *is* a viral loop with intrinsic urgency. The growth team's job is not to *create* the motivation to invite (it's already there) but to (a) **reduce the friction of inviting** (one-tap share, contact import, group links), (b) **route invites through OG share pages that convert to installs**, and (c) **shorten the cycle time** from "created an event" to "invited friends."

### 5.2 The k-factor math

**Definition:**

```
   k = i × c

   i = average invites sent per new user (per viral cycle)
   c = conversion rate per invite (invite → new activated user)

   Viral amplification multiplier  M = 1 / (1 − k)        (for k < 1)
   Cycle time T = time from a user's install to their first invite sent
   (lower T → faster compounding of the same k)
```

**What k ≥ 0.4 buys us:** k = 0.4 → M = 1/(1−0.4) = **1.67×**. Every 1,000 users we acquire through other channels become ~**1,667** once virality compounds. That is not "viral growth" (which needs k ≥ 1) — it is **a 67% discount on every other channel's CAC**, applied automatically and forever. In a low-WTP market, a 1.67× multiplier on blended CAC is the difference between LTV:CAC working and not (§8).

**How we actually hit k ≥ 0.4 — the contribution build:**

| Viral loop | i (invites/user) | c (conv/invite) | k contribution |
|---|---|---|---|
| **Event invites** (host invites off-app friends to fill min capacity) | 1.2 | 0.22 | **0.264** |
| **Quality-gated referral program** (reward on referee's first meetup) | 0.4 | 0.20 | **0.080** |
| **Recap-card shares → IG stories → installs** | 0.5 | 0.12 | **0.060** |
| **TOTAL k** | | | **≈ 0.40 ✓** |

The dominant lever is **event invites** (structural, free, intrinsic) — which is exactly why this product can hit k ≥ 0.4 where generic friend apps can't. Referral and recap-shares are *amplifiers*, not the engine. Note `c` is measured to **activation** (first meetup), not raw signup, to keep virality quality-honest and consistent with the NSM.

**Levers to push each term:**
- **Raise i:** one-tap contact-import + WhatsApp/IG share at the highest-intent moments (right after creating an event; right after a great meetup); "need 2 more" prompts that make inviting the obvious next step; group-invite links.
- **Raise c:** OG share pages (§5.4) that load fast and show the *specific* event + who's going (social proof) → high install intent; deep-link straight into RSVP for that event (not a generic store page); the receiving experience is a *populated* pool (liquidity again — virality dies in a ghost town).
- **Lower T:** prompt invites in-flow, not via a buried "invite friends" menu.

### 5.3 Incentivized referral — QUALITY-GATED (anti-fraud)

Per roadmap §6: **the referral reward unlocks on the referee's first completed meetup, not on signup.** This is the central anti-fraud and quality mechanism:

- **Mechanic:** "Bring a friend who's also new here" → on the **referee's first meetup**, *both* get a Tayfa+ trial (mutual reward = reciprocity + both sides invested). **Newcomer-framed** ("new here") aligns with the mission and the persona; **E20** tests newcomer-framed vs generic invite copy.
- **Why meetup-gated, not signup-gated:** signup-gated referral is a fraud magnet (fake accounts farm rewards) and pollutes the pool with non-activating users. Meetup-gating means a reward only fires when *real value* (an NSM event) was created — fraud requires faking a geofenced, mutually-confirmed, two-verified-user meetup, which the NSM anti-gaming design (roadmap Phase 3/6) makes expensive. **E7** (roadmap E7): meetup-gated beats signup-gated on k *and* fraud rate.
- **Anti-fraud stack:** device/phone/ID fingerprinting (shared with ban-evasion, Phase 5), idempotent reward state machine, reward cost capped as a fraction of CAC (guardrail), self-referral and circular-referral detection.

### 5.4 Shareable recap cards → IG stories → installs

- **The artifact:** a beautiful, auto-generated post-meetup **recap card** — *"Kadıköy bike crew · 5 riders · 18 km · Sunday"* — server-rendered (roadmap Phase 6), gorgeous enough to *want* to post to an Instagram story. It is social proof (look at my real life), identity ("I'm someone who does things"), and acquisition (every viewer is a prospect) in one asset.
- **The mechanic:** prompt the share at the **peak-end** moment (right after rating). **E12** tests share-prompt timing.
- **The landing:** the IG story links to an **OG share page** (Next.js ISR + edge cache) showing the event/crew with rich preview → deep-link into install → RSVP. The page is the conversion surface that turns `i` into `c`.
- **Privacy hard rule (roadmap Phase 6):** recap shares **never leak precise location or PII** — fuzzed location, no exact venue/time of *future* events, consent on faces. Virality must never compromise safety; this is non-negotiable and is a guardrail on E12.

### 5.5 Social proof mechanics (everywhere)

Social proof (Cialdini) is woven through every surface because it simultaneously drives activation, virality, and trust:
- On event cards: "4 going · 2 you'd vibe with · verified host."
- On invites/OG pages: real attendee faces + count + mutual interests.
- On trust: verified badges, reliability scores, "X meetups safely completed in your area" (E22).
- **Bandwagon + FOMO, used honestly:** "this event fills fast" (scarcity) is shown *only when true* (instrumented in Phase 3) — manufactured FOMO would violate the "friend text" bar.

### 5.6 Channel-by-channel summary (detail in §8)

| Channel | Loop type | Role | Notes |
|---|---|---|---|
| **Organic / WoM** | Structural | **Primary engine** | The meetup itself recruits; near-zero CAC |
| **Referral** | Incentivized, quality-gated | Amplifier | Reward on referee's first meetup |
| **Content / social (TikTok, Reels)** | Owned + UGC | Top-of-funnel + brand | Loneliness/newcomer storytelling; recap aesthetic |
| **Campus** | Community | Warm demand + ambassadors | Orientation-week timing; per-persona |
| **PR** | Earned | Brand halo + trust | Loneliness/newcomer/anti-dating angle |
| **Niche community partnerships** | Community | Warm liquidity injection | Running/climbing/board-game/halı saha/expat |
| **Paid** | Bought | **Last-resort backfill** | Only in already-seeded pools; never the engine |

---

## 6. Retention Math & Cohort Targets

### 6.1 What "good" looks like for an IRL-social app

Most retention benchmarks come from *daily-use* apps (social feeds, games) and **do not apply.** Tayfa's natural cadence is **weekly** (people don't make new plans daily), so the right frame is **WAU and meetups/active/month**, not DAU/MAU. **We deliberately reject DAU obsession** — a user who opens the app twice a week, RSVPs, and shows up to two great meetups a month is a *perfectly retained, high-value* user even with low daily opens. Optimizing for daily app-opens would push us toward the doomscroll dark patterns we reject.

**Canonical cohort targets (roadmap §6):**

| Metric | Target | Definition of "active" |
|---|---|---|
| **D1** | ≥45% | returned / engaged with an upcoming plan |
| **D7** | ≥30% | created / attended / joined |
| **D30** | ≥22% | created / attended / joined |
| **W4 retention** | ≥25% | cohort still attending/creating |
| **Meetups / active / month** | ≥1.3 → 2.5+ | confirmed NSM participation |
| **Crew membership** | ≥30% of active in ≥1 crew | the D30 driver |

### 6.2 The retention curve (and the bifurcation)

The healthy IRL-social curve is a **steep early drop that flattens into a high plateau** — the plateau is what matters (it's the habit cohort). The defining dynamic is **bifurcation by crew formation**:

```
 Retention
   100% ┤●
        │ ●
        │  ●●                         ── CREW cohort (formed crew ≤14d):
    45% ┤    ●●●____________________     flattens HIGH (~35–40% at D30)
        │       ●●●●●●●●●●●●●●●●●●●●●●●  → the moat; near-flat after D30
    30% ┤          ╲
        │           ╲___
    22% ┤  (blended) ╲____________      ── BLENDED target curve
        │              ╲                   D1≥45 · D7≥30 · D30≥22
        │               ╲___________
    ~8% ┤  (no-crew) ╲________________  ── NO-CREW cohort:
        │             ╲                    keeps decaying; one-off users churn
        └────┬────┬────┬────┬────┬────►
            D1   D7   D14  D30  D60   time
```

**Implication:** the entire retention program is a race to move users from the no-crew curve to the crew curve **before D14.** Time-to-second-meetup and time-to-first-crew are therefore the metrics that *predict* D30 — and the levers we actually pull (E5 crew prompt, E14 chat warm-up, E15 reminders) all target this transition.

### 6.3 Leading indicators (predict NSM before it moves)

NSM (Weekly Completed Meetups) is a *lagging* outcome. The growth team steers on **leading indicators**:

| Leading indicator | Why it predicts NSM / retention | Target |
|---|---|---|
| **Crew-formation rate** | crews → recurring meetups → flat retention | ≥30% of active in a crew |
| **Time-to-first-meetup** | faster activation → higher 14-day & D30 | median <7 days |
| **Time-to-second-meetup** | the bifurcation signal (crew vs churn) | <14 days for retained |
| **Meetups / active / month** | the NSM per-user driver | ≥1.3 → 2.5+ |
| **RSVP→attend (1 − no-show)** | trust + reliability health | ≥75% (no-show <25%) |
| **Liquidity per geocell** | the cold-start gate | ≥40 events/wk within 5km |
| **k-factor** | self-sustaining growth | ≥0.4 in saturated city |

### 6.4 The NSM input-metric tree

```
   NSM = WEEKLY COMPLETED MEETUPS
     = Active Hosts × Events per Host × Fill Rate × Attend Rate
       │              │                 │           │
       │              │                 │           └─ reminders, chat warm-up,
       │              │                 │              reliability score (no-show↓)
       │              │                 └─ matching quality, social proof, liquidity
       │              └─ AI templates, host leaderboards, crews (free recurring supply)
       └─ ambassador seeding, campus/community partners, referral, recap-share installs
```

Every growth lever maps to exactly one node of this tree. The weekly review (§9) reads NSM top-down, then drills into whichever input regressed.

### 6.5 The retention–virality flywheel (described)

```
                    ┌─────────────────────────────────────┐
                    │   DENSE LOCAL LIQUIDITY (per pool)   │
                    │   ≥40 events/wk within 5km          │
                    └───────────────┬─────────────────────┘
        seeding (§2)                │ makes "12 events near you" TRUE
        feeds in here ▲             ▼
                      │    ┌──────────────────────┐
       new users      │    │  ACTIVATION:         │
       (virality)     │    │  FIRST COMPLETED     │
       feed back ─────┘    │  MEETUP (NSM++)      │
       into liquidity      └─────────┬────────────┘
              ▲                       │ peak-end "meet again?"
              │            ┌──────────┴───────────┐
              │            ▼                       ▼
     ┌────────┴───────┐   ┌──────────────┐   ┌──────────────────┐
     │ VIRALITY LOOP  │   │ RETENTION    │   │ RECAP-CARD SHARE │
     │ event invites  │◄──│ LOOP: crew → │   │ → IG story → OG  │
     │ + referral     │   │ recurring →  │   │ page → install   │
     │ (k ≥ 0.4)      │   │ habit (D30↑) │   └────────┬─────────┘
     └────────┬───────┘   └──────┬───────┘            │
              │                  │ crews = FREE        │
              │                  │ recurring SUPPLY ───┘
              └──────────────────┴──► back to DENSE LOCAL LIQUIDITY
```

**Read it as two interlocking loops sharing the activation node:** completed meetups (1) spin the **retention loop** (crew → recurring → habit → more meetups, *and* crews generate free recurring supply that thickens liquidity) and (2) spin the **virality loop** (invites + recap shares + referrals → new users → more demand *and* more hosts → thicker liquidity). Both loops dump back into the same per-pool liquidity reservoir. Seeding (§2) primes the reservoir until the loops can sustain it; then we redeploy seeding to the next pool. **The flywheel is local — it spins per geocell — which is why we saturate one pool before opening the next.**

---

## 7. Experimentation Roadmap

> Run on **PostHog** (flags + experiments). **Discipline (roadmap §11):** ship behind a flag, **one primary metric**, predefined **guardrails (NSM + safety NEVER regress)**, minimum-detectable-effect & sample size set *before* launch, **no peeking**, kill-or-scale on the flag. **ICE** = mean of Impact / Confidence / Ease (each 1–10); higher = do sooner. Phase maps to the roadmap's build phases (P1–P9) so experiments sequence with the code that enables them.

This expands the roadmap §11 backlog (E1–E12, preserved) into a prioritized, sequenced program of **25** experiments covering onboarding, activation, matching, retention, notifications, referral, pricing, and safety-as-growth.

| ID | Area | Hypothesis | Primary metric | Guardrail (NSM/safety never regress) | ICE | Phase |
|---|---|---|---|---|---|---|
| **E1** | Onboarding | Taste-cards beat a form for interest capture | Onboarding completion +10pp | Feed relevance (match CTR) | **8.7** | P1 |
| **E2** | Onboarding | Show liquidity-proof early → faster activation | Signup→first-meetup time ↓ | NSM | **8.3** | P1–P2 |
| **E13** | Onboarding | Connect-accounts (Spotify/Letterboxd) prompt enriches interest graph | Interest count; onboard→RSVP | Onboarding time <90s | **7.7** | P1 |
| **E3** | Activation | One-tap "perfect first event" CTA lifts first meetup | 14-day meetup rate +5pp | No-show rate | **9.0** | P3 |
| **E23** | Activation (supply) | AI event templates beat blank-create for hosts | Events created/host; time-to-create | Event quality (attendance, rating) | **8.0** | P3 |
| **E15** | Activation | T-2h "your crew is meeting · 4 going" reminder (social proof) | Attend rate (no-show ↓) | Notif opt-out | **8.0** | P3 |
| **E14** | Activation | Host welcome + AI icebreaker auto-post warms pre-event chat | RSVP→attend (no-show ↓) | Report rate (icebreaker safety) | **7.7** | P4 |
| **E4** | Matching | Serendipity term raises meetup satisfaction | "Great match" rate; repeat | Meetups/user | **7.3** | P4 |
| **E16** | Matching | "People you'd vibe with → here's an event to meet them" bridge | Meetups originating from recs | Creepiness/report rate | **7.0** | P4 |
| **E11** | Safety | Verified-only filter default-on for women lifts retention | Women W4 retention | Host supply | **8.0** | P5 |
| **E22** | Safety-as-growth | "100% verified · X meetups safely completed near you" trust banner | Women signup→onboard | Claim accuracy (no overstatement) | **7.7** | P5 |
| **E18** | Retention/Safety | Surfacing reliability score (social currency) cuts no-shows | Host invite-accept; no-show ↓ | Anxiety/abuse reports | **7.3** | P5–P6 |
| **E5** | Retention | Crew prompt post-meetup lifts D30 | D30 +3pp | Notif opt-out | **8.7** | P6 |
| **E17** | Retention | Weekly "your city this weekend" digest (Fri-AM, Fresh-Start framing) | WAU return; RSVPs | Notif opt-out | **7.7** | P6 |
| **E6** | Notifications | Send-time optimization lifts open w/o opt-out | Push CTR; opt-out flat | Opt-out <15% | **7.7** | P6 |
| **E19** | Notifications | Frequency cap 1/day vs 2/day vs 4/day | D7 retention vs opt-out | Opt-out <15% | **7.3** | P6 |
| **E7** | Referral | Meetup-gated reward beats signup-gated | k-factor; fraud rate | Reward cost / CAC | **8.3** | P6 |
| **E20** | Referral | "Bring a friend who's new here" (newcomer-framed) beats generic | Invite send rate; k | Fraud rate | **7.3** | P6 |
| **E12** | Virality | Recap-card share prompt timing (post-rating vs next-day) | Shares → installs | Privacy (no PII/location leak) | **7.7** | P6 |
| **E21** | Resurrection | Crew/loss-aversion win-back ("crew rode without you") beats neutral | 21–30d reactivation rate | Opt-out / unsubscribe | **7.0** | P6 |
| **E8** | Pricing | Post-meetup trial trigger beats generic placement | Trial→paid; conversion | NSM / liquidity | **7.3** | P7 |
| **E9** | Pricing | Annual-anchored paywall raises LTV | LTV; churn | Free-tier health | **7.0** | P7 |
| **E10** | Paywall | "More & better plans" framing beats "unlock basics" | Conversion | NSM | **7.3** | P7 |
| **E25** | Pricing | TR PPP price test (₺99 vs ₺149 vs ₺199 /mo) | Net revenue; conversion; churn | Free-tier liquidity | **6.7** | P7 |
| **E24** | Supply/Ops | Ambassador bounty: per-meetup vs flat stipend | Completed meetups/ambassador; cost/meetup | Meetup quality (rating) | **7.3** | P3/P8 |

**Sequencing logic (which to run when, and why):**
- **Phase 1–3 (MVP, pre-growth-spend):** front-load **activation** experiments (E1, E2, E13, E3, E23, E15) — there is no point optimizing virality or pricing before the activation funnel and the cold-start loop work. E3 (perfect-first-event) is the highest-ICE item in the program (9.0) and gates everything downstream.
- **Phase 4–5:** matching quality (E4, E14, E16) and safety-as-growth (E11, E22, E18) — these raise meetup quality and unlock the safety-sensitive segment (esp. women), which is the highest-WoM, highest-retention cohort.
- **Phase 6 (the PMF gate):** the retention + virality battery (E5, E17, E6, E19, E7, E20, E12, E21) — this is where D7/D30 and k get pushed to target. **Crew prompt (E5)** and **meetup-gated referral (E7)** are the marquee experiments of this phase.
- **Phase 7+ (post-retention gate):** pricing/paywall (E8, E9, E10, E25) — *only after* retention is proven, because a paywall before retention fights liquidity. **Every pricing experiment is hard-guardrailed on NSM/liquidity** (roadmap §7: monetization must not depress the network).
- **Cross-phase ops:** E24 (ambassador bounty structure) runs during cold-start (P3) and re-runs at multi-city scale (P8) to tune cost-per-meetup of seeding.

**Universal guardrails on every experiment:** (1) **NSM (Weekly Completed Meetups) must not regress**; (2) **no safety metric may regress** (incident rate, report→action SLA, no-show); (3) notification opt-out <15%; (4) free-tier liquidity protected. A winner on the primary metric that trips any guardrail **does not ship.**

---

## 8. Channel Strategy & CAC

### 8.1 Why this product must be referral/community-led, not paid-led

Four structural reasons, each decisive on its own:

1. **The network effect is local → density beats volume.** Paid ads deliver *scattered individuals* across a 16M-person city; community partnerships deliver a *whole running club into one 5 km pool.* For a per-geocell liquidity model, the second is worth 10× the first. Paid spreads thin; community concentrates.
2. **Trust doesn't transfer through an ad.** The core anxieties (safety, "is this a date?") are pre-solved by a *friend's invite* or a *club's endorsement* — social proof an ad can't manufacture. Warm-acquired users activate and retain far better than cold paid installs.
3. **Structural virality already exists (k ≥ 0.4 → 1.67× multiplier).** Spending the growth budget on *enabling invites and recap-shares* compounds; spending it on paid does not. Why rent users when the product mints them?
4. **The unit economics forbid paid-led in a low-WTP market.** Walk the math: at a 4% free→paid rate × ₺149/mo, blended subscription ARPU is ~₺6/active/month. Over an ~18-month retained lifetime that's a blended **subscription LTV ≈ ₺100–110** (marketplace + B2B2C lift this later, per `MONETIZATION_ANALYSIS.md`). For **LTV:CAC ≥3** (roadmap Phase 7 gate) on subscriptions alone, **blended CAC must sit well under ~₺40.** Community/referral can hit that; **paid (₺80–250+/install in TR, and far higher per *activated* meetup-completer) cannot.** Paid-led would mathematically break the model. Hence: **paid is a backfill, never the engine.**

### 8.2 Channel-by-channel for 18–32 Istanbul

| Channel | Tactic (Istanbul-specific) | Expected CAC* | Role / why |
|---|---|---|---|
| **Organic / WoM (structural)** | The meetup recruits its own members; "need 2 more"; word-of-mouth in dense pools | **~₺0 marginal** | **The engine.** Compounds with density; target the majority of installs here |
| **Quality-gated referral** | "Bring a friend who's new here" → mutual Tayfa+ trial on referee's first meetup | **~₺30–70 effective** | Amplifier; cost only fires on real activation; fraud-resistant |
| **Niche community partnerships** | Running crews (Caddebostan coast), bouldering gyms, board-game cafés, **halı saha** groups, language-exchange, InterNations/Couchsurfing/newcomer groups | **~₺10–40** | **Highest-leverage warm demand** — drops pre-formed local liquidity + trust |
| **Campus ambassadors** | Boğaziçi, İTÜ, Koç, Sabancı, Bilgi, Marmara, Yıldız, MEF, Özyeğin; orientation-week launches | **~₺30–80** | On-persona (lonely newcomers), recurring intake (Sept/Feb), low cash cost |
| **Content / social (TikTok + IG Reels)** | "POV: you just moved to Istanbul and have no friends" UGC; recap-card aesthetic; ambassador & founder content; loneliness storytelling | **~₺20–60 organic-led** (₺80–150 if boosted) | Top-of-funnel + brand; the recap-card *is* the creative |
| **Micro-influencers (10k–100k)** | Istanbul lifestyle / expat / running / board-game niche creators; barter + small fee | **~₺50–150** | Trust-borrowing into specific interest verticals |
| **PR / earned** | The loneliness-epidemic + newcomer + **anti-dating** angle; "the app that's the opposite of Tinder"; data stories on young-urban loneliness | **~₺0 marginal** (effort cost) | Brand halo + trust; hard to attribute but high leverage |
| **Paid (Meta / TikTok / Google)** | Geo-fenced to an *already-seeded* pool; interest-targeted; **retargeting installed-not-activated** | **~₺80–250+/install** (₺400–800+/activated) | **Last resort.** Liquidity backfill only; never opens a cold pool |

*\*CAC ranges are 2026 Istanbul-market order-of-magnitude in ₺, for directional planning; per-activated-user (first-meetup) cost is meaningfully higher than per-install on every channel. Detailed unit economics live in `MONETIZATION_ANALYSIS.md`.*

### 8.3 When paid IS allowed (the narrow exceptions)

Paid is permitted **only** when: (1) the pool is **already seeded** and we're backfilling demand to hit the liquidity bar faster (not creating liquidity from zero); (2) **retargeting** installed-but-not-activated users back to a *perfect first event*; or (3) **precise geo + interest** targeting *within* a beachhead pool (e.g., "bouldering, Kadıköy, 18–32"). Paid never funds a cold pool, never leads a city launch, and is the first budget cut when CAC guardrails tighten.

### 8.4 Blended CAC target & guardrail

> **Blended-CAC target: under ~₺40–60/install** in a lead city (subscription LTV:CAC ≥3 on subs alone; improves as marketplace/B2B2C revenue lands). The community/referral/organic mix lands here; the moment paid pushes blended CAC toward ₺80+, it is throttled. **CAC by channel and the blended figure are standing items on the weekly growth review (§9).**

---

## 9. Growth Org & Cadence

### 9.1 The weekly growth review (around the NSM)

A **60–90 minute Weekly Growth Review** is the heartbeat. **NSM (Weekly Completed Meetups) is on the first slide and on every team dashboard** (roadmap §13). Standing agenda:

1. **NSM** — Weekly Completed Meetups, this week vs last, vs target. Then **drill the NSM input tree** (§6.4): which node moved — hosts, events/host, fill rate, or attend rate?
2. **Activation funnel** (§3.3) — each step's conversion vs target; biggest leak; what's the experiment on it?
3. **Cohort retention** — D1/D7/D30 by city and by acquisition source; **crew-formation rate** (the leading indicator); time-to-first/second-meetup.
4. **Liquidity per geocell** — heatmap of events/week within 5 km of median user per pool; which pools are below the bar; ghost-town-guard fire rate.
5. **k-factor** — by pool; the contribution build (§5.2); referral fraud rate.
6. **Experiment readouts** — primary metric, guardrail status, **ship/kill/iterate** decision (no peeking; decision only at pre-set sample size).
7. **Channel + CAC** — blended and by-channel CAC; paid throttle status.
8. **Guardrail check** — NSM, safety (incident rate, report→action SLA, no-show), notification opt-out, free-tier health. **Any red = stop the offending experiment.**

### 9.2 The metrics stack (PostHog → BigQuery)

Per roadmap §4 analytics pipeline:

```
  Client (Expo) + Server (BFF)        ── typed event schema (packages/shared),
        │  emit typed, consent-gated      consent-gated; schema discipline =
        ▼  events                          cost control (don't log noise)
  PostHog (EU region)
   • real-time funnels, cohorts
   • feature flags + A/B experiments
   • session replay
        │  nightly export
        ▼
  BigQuery + dbt
   • cohort / LTV / churn models
   • meetup-success attribution
   • k-factor, liquidity-per-geocell heatmaps
        │  reverse-ETL audiences
        ▼
  Braze  ── targeted lifecycle journeys (win-back, crew nudges,
            digest), send-time optimization, frequency caps
```

**Division of labor:** **PostHog** is the *activation layer* (real-time funnels, flags, experiments, replay) — where the growth team lives day-to-day. **BigQuery + dbt** is the *deep-analysis layer* (cohorts, LTV, attribution, the heatmaps) — where weekly/monthly truth is modeled. **Braze** is the *action layer* — audiences from BigQuery flow back to drive journeys. **Event-schema discipline is a direct cost control** (roadmap §8): every event in the typed schema, nothing logged "just in case."

### 9.3 Guardrails culture

- **NSM and safety never regress — full stop.** This is a cultural law, not a preference. A growth win that trips a safety guardrail is not a win; it is reverted. The roadmap encodes this on every experiment and every monetization decision.
- **Experiment discipline:** one primary metric, predefined guardrails, MDE + sample size set before launch, **no peeking**, ship behind a flag, kill-or-scale at the pre-set decision point.
- **Reversibility:** everything ships behind a PostHog flag; paywalls and ranking changes are reversible by flag if NSM/liquidity dip (roadmap Phase 7).
- **The "would a friend text this?" bar** governs every notification and every piece of growth copy.
- **Honesty in social proof:** scarcity/FOMO/streak mechanics are used *only when true and positive-framed* — manufactured urgency or guilt violates the brand and the bar.

### 9.4 Roles & cadence ladder

| Cadence | Forum | Focus |
|---|---|---|
| **Daily** | Dashboards + alerts | NSM, crash-free %, report-queue depth & SLA, verification/moderation health, liquidity alerts |
| **Weekly** | Growth Review (§9.1) | NSM tree, funnel, cohorts, liquidity, k, experiments, CAC, guardrails |
| **Monthly** | Economics review | LTV:CAC, MRR, churn, GMV, cost-per-active-user, paid throttle |
| **Quarterly** | Strategy / re-prioritization | Re-rank against NSM + the dependency-graph gates; pool/city expansion decisions; sunset features that don't earn complexity |

**Ownership map (roadmap §12):** the **founder owns cold-start/liquidity** — the true bottleneck, unsolvable by code alone (ambassador recruiting, partnerships, city-launch). **Growth engineering owns** the activation funnel, the experiment program, instrumentation, and the lifecycle/virality systems. **T&S owns** the safety guardrails (which growth may never trade away). **Design owns** onboarding friction (the activation ceiling). The interest-matching and infra teams own the systems that make matches "uncanny" and feeds fast.

---

## 10. Summary — The Highest-Leverage Tactic

If only one thing can be executed perfectly: **seed the supply side of ONE neighborhood pool (Kadıköy) to liquidity before acquiring any broad demand — using bounty-paid ambassador hosts + niche-community partnerships + <30-second AI-template event creation + an absolute ghost-town guard — so that the very first organic newcomer's onboarding promise ("12 events near you this week") is *true*, their "perfect first event" is engineered to succeed, and the local flywheel (completed meetup → crew → recurring habit → recap-share + multiplayer invite → new user → denser liquidity) starts spinning on its own.** Liquidity is the one bottleneck; everything else in this document is leverage applied *after* it clears. Win the neighborhood, then repeat the playbook, pool by pool, city by city.

---

*Companion deep-dives: `RISK_ANALYSIS.md` · `TECH_DECISIONS.md` · `MONETIZATION_ANALYSIS.md`. Source of truth: `roadmaps/APP_EXECUTION_ROADMAP.md` — this report expands it and never contradicts it.*
