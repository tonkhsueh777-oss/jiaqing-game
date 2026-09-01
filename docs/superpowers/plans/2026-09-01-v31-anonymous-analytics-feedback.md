# V31 Anonymous Analytics & Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add anonymous shared visit/game counters plus like/dislike feedback with quick improvement reasons to the existing GitHub Pages game.

**Architecture:** Keep the game static on GitHub Pages and add a very small Supabase data layer. The browser calls narrowly scoped Postgres RPC functions so no raw feedback rows are exposed. The analytics UI is isolated in new V31 files and hooks into existing render/new-game/winner flows without changing game rules.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, Supabase Postgres RPC, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-01-anonymous-game-analytics-feedback-design.md`

## Global Constraints

- No player registration, name, phone, email, or account information.
- Count every page open as one `visit`; no device deduplication.
- Public UI shows today visits, total visits, likes, dislikes.
- Track game starts and completed games for owner-side reporting.
- Dislike opens quick reasons: rules, controls, mobile, pace, visuals/audio, other.
- Optional short comment is allowed but not required.
- Analytics failure must never block the game.
- Do not change game rules, AI, deck, victory conditions, card artwork, or board topology.

---

### Task 1: Supabase schema and RPC boundary

**Files:**
- Database migration only (Supabase project)

**Interfaces:**
- Produces RPC `record_game_event(p_event_type text) -> void`
- Produces RPC `submit_game_feedback(p_rating text, p_reason text default null, p_comment text default null) -> void`
- Produces RPC `get_public_game_stats() -> jsonb`

- [ ] **Step 1: Apply migration**

Create `game_events` and `game_feedback`, indexes, constraints, RLS, and three RPCs. Revoke direct table access from anon; grant only RPC execution needed by the public page.

- [ ] **Step 2: Verify schema**

Run SQL calls for each RPC and confirm public stats return keys `today_visits`, `total_visits`, `likes`, `dislikes`, while owner SQL can query starts/completions/reasons.

- [ ] **Step 3: Run Supabase security advisor**

Expected: no new high-severity RLS exposure caused by these tables/functions.

### Task 2: Analytics client logic with TDD

**Files:**
- Create: `src/v31-analytics-logic.js`
- Create: `tests/v31-analytics.test.js`

**Interfaces:**
- Produces `JQGame.AnalyticsLogic.normalizeStats(value)`
- Produces `JQGame.AnalyticsLogic.validReason(value)`
- Produces `JQGame.AnalyticsLogic.shouldRecordCompletion(previousWinnerId, nextWinnerId)`

- [ ] **Step 1: Write failing tests**

Tests cover zero-default stats, allowed reasons, and completion only on null→winner transition.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/v31-analytics.test.js`
Expected: FAIL because V31 logic is absent.

- [ ] **Step 3: Implement minimal logic**

Implement only normalization/reason validation/completion-transition helpers.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/v31-analytics.test.js`
Expected: PASS.

### Task 3: Browser data client and feedback UI

**Files:**
- Create: `src/v31-analytics-client.js`
- Create: `src/v31-analytics-ui.js`
- Create: `v31-analytics-feedback.css`
- Modify: `index.html`

**Interfaces:**
- `game.Analytics.recordEvent(type)`
- `game.Analytics.submitFeedback({rating, reason, comment})`
- `game.Analytics.fetchStats()`
- `game.AnalyticsUI.refresh()`

- [ ] **Step 1: Add client using project URL and publishable key**

Use `fetch` against Supabase `/rest/v1/rpc/...`; requests catch failures and return safe defaults instead of throwing into game flow.

- [ ] **Step 2: Add public panel**

Render `今日体验`, `累计体验`, `👍 好玩`, `👎 需要改进` in the existing information rail/footer area without moving the board or hand.

- [ ] **Step 3: Add feedback interaction**

Like submits immediately. Dislike opens a small modal with six reason buttons and optional short text; submit anonymously and refresh stats.

- [ ] **Step 4: Load V31 assets from index**

Load logic before client/UI, and CSS after existing theme files.

### Task 4: Hook visit/start/complete events without changing rules

**Files:**
- Create: `src/v31-analytics-hooks.js`
- Modify: `index.html`
- Test: `tests/v31-analytics.test.js`

**Interfaces:**
- Page load records exactly one `visit` per document load.
- `startNewGame()` records `game_start` only when a fresh game is created.
- Winner transition records `game_complete` once per game.

- [ ] **Step 1: Add failing completion transition test**

Ensure repeated renders with same winner do not create another completion transition.

- [ ] **Step 2: Implement wrappers/hooks**

Wrap exposed `game.APP.startNewGame` for explicit starts where safe, record first bootstrap-created game, and monitor render winner transitions with local in-memory guard.

- [ ] **Step 3: Run regression tests**

Run: `node --test tests/v31-analytics.test.js tests/v30-beginner-assist.test.js tests/v25-mobile-layout.test.js tests/v23-visual-effects.test.js tests/draw-ritual.test.js`
Expected: all PASS.

- [ ] **Step 4: Syntax check new scripts**

Run `node --check` on all `src/v31-*.js`.

### Task 5: End-to-end verification and deploy

**Files:**
- Modify: `index.html` cache query to `v=31` as needed.

- [ ] **Step 1: Deploy GitHub Pages**

Wait for Pages workflow success.

- [ ] **Step 2: Verify live RPC effects**

Open/fetch the live V31 page once, confirm visit counter increments, submit one controlled test like/dislike only if needed, and clean test rows if practical.

- [ ] **Step 3: Verify owner reporting SQL**

Query today visits, total visits, game starts, game completions, likes, dislikes, and grouped dislike reasons.

- [ ] **Step 4: Final report**

Provide V31 URL and state exactly what is public vs owner-only, plus deployment/test evidence.