# TAYFA — MANDATORY DEVICE VALIDATION & CONTINUE EXECUTION

Read:

* PHASE_1_REPORT.md
* PHASE_2_REPORT.md
* PHASE_3_REPORT.md

The reports indicate that runtime validation on a real Android device has NOT been completed.

This is now the highest priority.

Stop all roadmap progression temporarily.

Before implementing any additional phases, perform a COMPLETE real-device validation using the Android phone currently connected via USB.

# DEVICE VALIDATION OBJECTIVE

The application must be validated on a PHYSICAL Android device.

Do NOT rely solely on unit tests.

Do NOT rely solely on emulator tests.

Real device validation is mandatory.

Use adb to discover the connected device.

Example:

adb devices

If multiple devices exist:

choose the physical USB-connected device.

# EXECUTION STEPS

## 1. BUILD

Create a fresh debug build.

Verify:

* no TypeScript errors
* no lint errors
* no build warnings that could affect runtime

Build:

Android debug APK

Install on the connected device.

## 2. RUNTIME INSPECTION

Launch application.

Continuously monitor:

adb logcat

Capture:

* crashes
* exceptions
* warnings
* ANRs
* rendering problems
* network failures

Any runtime issue discovered:

FIX IMMEDIATELY.

Rebuild.

Retest.

Repeat until clean.

# REQUIRED USER JOURNEYS

Execute ALL journeys manually or through Maestro.

## AUTH

* launch app
* onboarding starts
* age gate
* OTP flow (mock if necessary)
* profile creation
* interest selection
* consent collection

Verify:

* no UI overflow
* no clipping
* no broken navigation
* no dead buttons

## HOME / DISCOVERY

Verify:

* feed renders
* cards render correctly
* empty states look premium
* loading states exist
* skeleton states exist

## EVENT FLOW

Test:

* create event
* edit event
* join event
* leave event
* RSVP transitions

Verify:

* capacity behavior
* error states
* success states

## CHAT

Verify:

* group chat UI
* composer
* keyboard behavior
* scrolling
* safe area
* dark mode
* long messages

## SAFETY

Test:

* block flow
* report flow
* safety center
* verification prompts

## RESPONSIVENESS

Test:

portrait

landscape

small screen

large text accessibility

Android font scaling

# UI / UX AUDIT

Perform a complete visual audit.

Compare every screen against:

Instagram
Discord
WhatsApp
Airbnb

Reject screens that look:

* generic
* empty
* amateur
* flat
* enterprise-like

Any screen below premium consumer-app quality:

REDESIGN IT.

Use OpenAI image generation if necessary.

Generate new premium assets.

Implement them.

# SCREENSHOT AUDIT

Capture screenshots for every screen.

Store in:

/screenshots/device-validation/

Create:

DEVICE_VALIDATION_REPORT.md

Include:

* screenshots
* discovered issues
* fixes applied
* remaining issues
* performance observations

# PERFORMANCE AUDIT

Measure:

* startup time
* navigation latency
* dropped frames
* memory usage

Fix obvious regressions.

# HARD GATE

You may proceed to Phase 4 ONLY IF:

✓ app installs

✓ app launches

✓ no crashes

✓ no ANRs

✓ onboarding complete

✓ feed usable

✓ event flow usable

✓ chat usable

✓ safety flows usable

✓ UI quality approved

✓ screenshots captured

✓ DEVICE_VALIDATION_REPORT.md completed

After successful validation:

Resume roadmap execution beginning with the next incomplete phase.

Continue autonomous execution normally.

Maintain:

commit → push → CI green → next phase

discipline.

Do not ask questions.

Make engineering decisions autonomously and document them.

