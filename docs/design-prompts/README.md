# Tayfa — Visual Design Language

> The single source of truth for every generated image, illustration, and rendered UI
> surface in Tayfa. Read this before authoring or editing any prompt in this folder.
> When a prompt and this file disagree, **this file wins** — keep the brand coherent.

Tayfa is a **verified, location-based social meeting app** for 18–32yo urban newcomers,
launching in Istanbul (beachhead: Kadıköy). It is emphatically **not a dating app**. It
helps people who just moved to a city find a "tayfa" (Turkish slang: *crew / your people*)
and actually *do things together* — cycling along the coast, bouldering, board-game
nights, third-wave coffee, street food, run clubs. Every pixel must read as **safe,
warm, optimistic, and alive** — friends in motion, never romance, never loneliness-bait.

---

## 1. Brand personality

**Instagram × Discord × Apple × Airbnb.**

| Reference | What we borrow |
|-----------|----------------|
| **Instagram** | Vibrant, photographic, story-first; bold but tasteful gradients; content feels personal and real. |
| **Discord** | Playful community warmth; the feeling of *belonging to a crew*; friendly rounded geometry, approachable not childish. |
| **Apple** | Restraint, generous whitespace, precise type, soft realistic depth, material honesty, premium calm. |
| **Airbnb** | Trust and belonging; human-centered real photography; warmth that says "you're welcome here." |

Four adjectives that every asset must satisfy: **premium · alive · trustworthy · social.**

If an image feels like a bank, a B2B SaaS, a stock-photo site, or a dating app —
it is wrong. Start over.

---

## 2. Color palette (exact hex)

A warm, optimistic, distinctly **non-corporate** system anchored by a confident coral
accent and a deep, trustworthy ink. No corporate blue as the hero color.

### Core

| Token | Hex | Role |
|-------|-----|------|
| **Tayfa Coral** (primary accent) | `#FF5A3C` | Hero brand color. CTAs, logo mark, active states, energy. Confident, social, warm. |
| **Sunset Amber** (secondary) | `#FFB23E` | Gradient partner to coral; highlights, badges, optimism. |
| **Deep Plum Ink** (text/ground) | `#1E1530` | Primary text, dark surfaces, premium depth (warm near-black, never pure `#000`). |
| **Soft Cream** (canvas) | `#FFF7F0` | Light backgrounds; warm paper, never sterile white. |
| **Mint Verify** (trust) | `#2DD4A7` | Verification ticks, safety/"you're protected" cues, success. |

### Supporting

| Token | Hex | Role |
|-------|-----|------|
| Coral Tint | `#FFE2DA` | Soft fills, chips, surfaces behind coral content. |
| Plum 600 | `#3A2A55` | Secondary dark surface, elevated cards on dark. |
| Slate Muted | `#6B6275` | Secondary text, captions on light. |
| Sky Calm | `#5B8DEF` | Informational only (links, info toasts). Never the hero. |
| Warn Rose | `#E5484D` | Errors, destructive — used sparingly, never for "report" framing as scary. |

### Signature gradients

- **Crew Glow** — `#FF5A3C → #FFB23E` (135°). The flagship gradient: warm sunset over the Bosphorus. Use on hero CTAs, app-icon background, marketing heroes.
- **Dusk Depth** — `#3A2A55 → #1E1530` (160°). Premium dark backdrop for recap cards and night surfaces.
- **Mint Assure** — `#2DD4A7 → #5B8DEF` (135°). Reserved for safety / verification storytelling only.

Gradients are **smooth and subtle**, with a faint grain to avoid banding — never harsh
rainbow or cheap web-2.0 glossiness.

---

## 3. Typography style

> We do not render final product UI from images, but illustrated/marketing type must
> match the real stack so mockups feel native.

- **Display / headlines:** a modern **geometric-humanist grotesque** — think *General Sans*,
  *Satoshi*, or *SF Pro Display*. Tight but breathable tracking, medium-to-bold weight,
  confident, friendly, never condensed-corporate.
- **Body / UI:** highly legible humanist sans (*Inter* / SF Pro Text). Comfortable, neutral.
- **Accent / wordmark "Tayfa":** lowercase or sentence-case, rounded terminals, slight
  warmth; the dot/counter shapes can echo the rounded community geometry.
- **Numerals:** tabular, calm — used in event times, attendee counts.
- Avoid: serifs (except a rare editorial pull-quote), script fonts, all-caps walls,
  ransom-note mixing, ultra-thin hairline display type that reads cold.

---

## 4. Depth, material & shadow

- **Soft realism, Apple-grade.** Surfaces feel like warm frosted glass and matte
  ceramic. Light comes from top-left, golden-hour temperature (~3500–4500K).
- **Shadows:** large, soft, low-opacity, *colored* (warm coral/plum tints, never pure
  gray). Double-shadow technique — a tight contact shadow plus a broad ambient one.
- **Elevation:** cards float gently (12–24px blur, 8–12% opacity). Generous corner radii
  (16–28px on cards, fully rounded pills on chips/CTAs).
- **Material accents:** subtle inner highlight on the top edge of glass cards; faint film
  grain on gradients; occasional soft bokeh from a real city backdrop.
- Avoid: hard 1px drop shadows, neumorphism gimmicks, glassmorphism overload, heavy
  bevels, skeuomorphic textures.

---

## 5. Photography direction

The heart of the brand. **Real Istanbul, real activities, real friend-energy.**

- **Place:** Kadıköy and the Anatolian-side coast — Moda seafront, ferry decks, leafy
  backstreets, third-wave cafés, climbing gyms, weekend markets, basketball courts.
  Recognizable Istanbul *mood* (Bosphorus light, ferries, simit, plane trees) without
  showing any precise, mappable, address-identifiable landmark in user-content contexts.
- **People:** diverse 18–32 crews (3–6 people) — mixed genders, ethnicities, styles;
  newcomers' optimistic energy. **Candid, in-motion, mid-activity** — laughing over a
  board game, chalking hands before a climb, clinking coffee cups, fixing a bike,
  unfolding a picnic. Genuine micro-expressions, motion blur welcome.
- **Never:** two-people-staring-into-eyes, candlelit dinners, hand-holding, swipe/heart
  imagery, isolated lonely person, or any romance/dating signal. No posed corporate
  smiles at the camera.
- **Light:** golden hour, warm window light, soft overcast — optimistic and flattering.
- **Lens feel:** 35mm documentary, shallow-ish depth, authentic color (warm but true
  skin tones), light film grain. Editorial, not stocky.
- **Faces:** for any generated image, faces must be **non-identifiable** — turned,
  motion-blurred, mid-laugh from the side, framed below the eyes, or back-of-group.
  No real, recognizable individuals.

---

## 6. Iconography & illustration

- **Icons:** rounded-rectangle grid, 2px-equivalent strokes with the occasional filled
  duotone (coral + plum). Friendly, geometric, consistent corner radius. Activity icons
  (bike, boulder hold, coffee, dice, ferry) drawn in one coherent set.
- **Illustration:** semi-flat with depth — soft gradient fills, gentle grain, a few
  hand-drawn imperfect lines for warmth, subtle long shadows. Characters are inclusive,
  abstracted (no faces or simple dot-features), always in groups, always doing something.
- **Verification & safety** get their own calm visual language: mint shield/tick, soft
  glow, never alarming, never a "police" aesthetic.

---

## 7. What to AVOID (hard bans)

- ❌ Flat, generic, Corporate-Memphis filler illustration.
- ❌ Amateur clip-art, harsh pure-saturated colors, web-2.0 gloss, lens flares overload.
- ❌ Dating-app tropes: hearts, flames, swipe cards, candlelit couples, "matches."
- ❌ Stocky corporate: handshake-over-laptop, headset call-center, suited people pointing at charts.
- ❌ Cold corporate blue as the hero, pure white `#FFFFFF` canvas, pure black `#000000` text.
- ❌ Loneliness / sad-single framing, surveillance / creepy "tracking" imagery.
- ❌ Any precise mappable location, address, GPS pin on a real map, or recognizable real person's face.
- ❌ AI-tell artifacts: warped hands, garbled text, melted logos, uncanny faces (prefer non-identifiable framing to dodge this).

---

## 8. Prompt authoring checklist

Every prompt in this folder should explicitly state: **composition**, **lighting**,
**mood**, **color/gradient by hex token**, **depth/material/shadow**, **typography style
(if type appears)**, **social interaction shown**, **premium UI reference**, and the
**negative list**. Keep faces non-identifiable and locations non-precise.
