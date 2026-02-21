# Tennis Betting Scraper

Multi-bookmaker tennis odds scraper — modular architecture and framework.

> **Current milestone:** 1 — Architecture and Basic Framework
> Bookmaker scrapers are **not yet functional**. This milestone delivers the
> full project skeleton, data models, odds normalisation pipeline, scheduler,
> and storage layer so that concrete scraper implementations can be dropped in
> without structural changes.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [Data Models](#data-models)
8. [How It Works](#how-it-works)
9. [Adding a New Bookmaker](#adding-a-new-bookmaker)
10. [Milestone Roadmap](#milestone-roadmap)

---

## Overview

The goal of this project is to scrape real-time tennis odds from multiple
online bookmakers, normalise them into a unified decimal format, and persist
the results for downstream analysis (e.g. arbitrage detection, odds comparison
dashboards).

### Milestone 1 status

| Component | Status | Notes |
|---|---|---|
| Project structure & module layout | **Done** | `src/` with clear layer separation |
| Main entry point with scheduler / refresh loop | **Done** | `src/main.js` — configurable interval, single-run & continuous modes |
| Data classes (`Match`, `Odd`) | **Done** | `src/models/` |
| Odds parser framework (per-bookmaker) | **Done** | `src/parsers/oddsParser.js` — parsing functions exist, return empty until scrapers provide data |
| Odds normaliser (decimal conversion, margin, vig removal) | **Done** | `src/parsers/normalizer.js` — fully functional with pure math |
| Winamax scraper | **Stub** | Architecture in place; `scrape()` returns empty data; no browser launched |
| Pinnacle scraper | **Stub** | Architecture in place; `scrape()` returns empty data; no browser launched |
| WebSocket interception service (CDP) | **Done** | `src/services/websocket.js` — infrastructure ready, not yet called by scrapers |
| JSON file storage (latest + history) | **Done** | `src/services/storage.js` |
| Structured logging | **Done** | `src/utils/logger.js` — timestamped, levelled |
| Configuration via `.env` | **Done** | `src/config/` |

---

## Architecture

```
                ┌──────────────┐
                │   index.js    │  Entry point & scheduler
                │  (refresh    │  Orchestrates scrape cycles
                │   loop)      │  on a configurable interval
                └──────┬───────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌─────────────┐ ┌──────────┐ ┌──────────┐
   │  Winamax    │ │ Pinnacle │ │  (future  │   Scraper layer
   │  Scraper    │ │ Scraper  │ │ scrapers) │   extends BaseScraper
   │  (stub)     │ │  (stub)  │ │          │   [stubs in M1]
   └──────┬──────┘ └────┬─────┘ └──────────┘
          │              │
          ▼              ▼
   ┌─────────────────────────────┐
   │     Services layer          │   WebSocket monitor (CDP),
   │   websocket.js / storage.js │   HTTP helpers, persistence
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │        Odds Parser          │   Parsers layer
   │   (per-bookmaker parsing)   │   Raw payload → Match + Odd
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │        Normaliser           │   Convert all odds to decimal,
   │   margin / implied prob /   │   compute derived metrics
   │       vig removal           │
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │     Storage service         │   Persist to JSON files
   │   latest.json + history     │   (data/ directory)
   └─────────────────────────────┘
```

**Key design decisions:**

- **`BaseScraper` (abstract)** defines the lifecycle contract: `init()` →
  `scrape()` → `parse()` → `close()`. Every bookmaker subclass follows this
  pattern. Helper methods `launchBrowser()` and `navigate()` are available
  for when a scraper becomes functional.
- **Scrapers are stubs in M1.** They override `init()` to skip the browser
  launch and `scrape()` to return empty data. The scheduler still exercises
  the complete pipeline so the architecture can be validated end-to-end.
- **Parsers are bookmaker-specific.** Each bookmaker gets its own parsing
  function in `oddsParser.js`. The normaliser is bookmaker-agnostic and works
  on the unified `Odd` model.
- **Configuration is centralised** in `src/config/` and driven by `.env`.

---

## Project Structure

```
.
├── src/
│   ├── main.js                  # Entry point — scheduler / refresh loop
│   ├── config/
│   │   ├── index.js             # Central config (env vars, timing, URLs)
│   │   └── browser.js           # Puppeteer launch & navigation settings
│   ├── models/
│   │   ├── Match.js             # Match data class
│   │   ├── Odd.js               # Odd data class (with margin calc)
│   │   └── index.js
│   ├── parsers/
│   │   ├── oddsParser.js        # Per-bookmaker raw → model parsing
│   │   ├── normalizer.js        # Decimal conversion, margin, vig removal
│   │   └── index.js
│   ├── scrapers/
│   │   ├── BaseScraper.js       # Abstract base class (lifecycle + browser helpers)
│   │   ├── WinamaxScraper.js    # Winamax scraper (stub)
│   │   ├── PinnacleScraper.js   # Pinnacle scraper (stub)
│   │   └── index.js
│   ├── services/
│   │   ├── websocket.js         # CDP WebSocket frame interception (infrastructure)
│   │   └── storage.js           # JSON file persistence
│   └── utils/
│       ├── common.js            # UUID, sleep, retry helpers
│       └── logger.js            # Timestamped, levelled logging
├── data/                        # Scraped output (git-ignored)
│   ├── latest.json              # Most recent cycle (overwritten)
│   └── history.json             # Append-only log of all cycles
├── .env.example                 # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** latest version
- **npm** (bundled with Node)

> Puppeteer is listed as a dependency and will download a compatible Chromium
> binary on `npm install`. In milestone 1 the browser is never launched, so
> the download is only needed to validate the dependency tree.

### Install

```bash
git clone <repo-url>
cd TennisBetting
npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env to adjust URLs, refresh interval, log level, etc.
```

---

## Configuration

All settings are controlled via environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `URL1` | Winamax tennis URL | Target URL for Winamax scraper |
| `URL2` | Pinnacle tennis URL | Target URL for Pinnacle scraper |
| `SCHEDULER_ENABLED` | `true` | Enable the continuous scheduling loop |
| `REFRESH_INTERVAL_MS` | `300000` (5 min) | Delay between scrape cycles |
| `MAX_RETRIES` | `3` | Retries per scraper on failure |
| `RETRY_DELAY_MS` | `10000` | Delay between retry attempts |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug` / `info` / `warn` / `error`) |

---

## Usage

### Continuous mode (default)

Starts the scheduler which runs all scrapers in a loop. In milestone 1 the
scrapers are stubs and will produce empty output each cycle, but the full
pipeline (init → scrape → parse → normalise → store) is exercised.

```bash
npm start
```

### Single-run mode

Run one scrape cycle and exit:

```bash
npm run start:once
```

---

## Data Models

### `Match`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID v4 |
| `homePlayer` | `string` | Player 1 name |
| `awayPlayer` | `string` | Player 2 name |
| `tournament` | `string?` | Tournament name (e.g. "Roland Garros") |
| `startTime` | `Date?` | Scheduled start |
| `status` | `string` | `upcoming` / `live` / `finished` |
| `sourceId` | `string?` | Original bookmaker id |
| `bookmaker` | `string` | Source bookmaker |
| `odds` | `Odd[]` | Attached odds entries |
| `canonicalKey` | `string` | Normalised key for cross-bookmaker dedup |

### `Odd`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID v4 |
| `bookmaker` | `string` | `winamax` / `pinnacle` / ... |
| `matchId` | `string` | Parent Match id |
| `homeWin` | `number` | Decimal odds — player 1 wins |
| `awayWin` | `number` | Decimal odds — player 2 wins |
| `margin` | `number` | Bookmaker overround (computed) |
| `timestamp` | `Date` | When odds were captured |
| `raw` | `object?` | Original payload for debugging |

### Normalised output (from `normalizer.js`)

Each odd is enriched with:

- `homeWinDecimal` / `awayWinDecimal` — guaranteed decimal format
- `homeImpliedProb` / `awayImpliedProb` — implied probabilities
- `margin` — bookmaker overround
- `fairHomeWin` / `fairAwayWin` — vig-free fair odds

---

## How It Works

1. **`main.js`** starts the scheduler and builds a registry of scrapers
   (`WinamaxScraper`, `PinnacleScraper` — both stubs in M1).
2. Each **scrape cycle** iterates through the scrapers sequentially:
   - `init()` is called if the scraper is not yet ready. In M1 this is a
     no-op (no browser is launched).
   - `scrape()` runs the bookmaker-specific logic. In M1 the stubs return
     empty `{ matches: [], odds: [] }`.
   - `parse()` converts raw data into `Match` and `Odd` model instances.
3. All collected odds are run through the **normaliser** which converts
   everything to decimal format and computes implied probabilities, margins,
   and fair odds.
4. Results are written to `data/latest.json` (overwritten each cycle) and
   appended to `data/history.json`.
5. The scheduler **sleeps** for the configured interval, then repeats
   (unless `--once` was passed).

When a scraper is made functional in a later milestone, only the concrete
scraper class needs to change — the rest of the pipeline works as-is.

---

## Adding a New Bookmaker

To add a third bookmaker (e.g. Bet365):

1. **Create the scraper** — `src/scrapers/Bet365Scraper.js` extending
   `BaseScraper`. Implement `init()`, `scrape()`, and `parse()`.
2. **Add a parsing function** — in `src/parsers/oddsParser.js`, add
   `parseBet365Payload(rawData)` that returns `{ matches, odds }`.
3. **Register it** — in `src/main.js`, add `new Bet365Scraper()` to the
   array returned by `buildScrapers()`.
4. **Add config** — add the target URL and any bookmaker-specific settings
   to `src/config/index.js` and `.env.example`.

No changes are needed in the normaliser, storage, scheduler, or models.

---

## Milestone Roadmap

### Milestone 1 — Architecture and Basic Framework *(current)*
- [x] Modular project structure with clear layer separation
- [x] Abstract `BaseScraper` with lifecycle contract and browser helpers
- [x] Winamax scraper (stub — architecture only, not yet functional)
- [x] Pinnacle scraper (stub — architecture only, not yet functional)
- [x] WebSocket interception service (infrastructure, ready to be wired)
- [x] Data classes: `Match` and `Odd` with serialisation and derived fields
- [x] Per-bookmaker odds parsing framework
- [x] Odds normaliser (decimal / fractional / American conversion, margin, vig removal)
- [x] Main entry point with configurable refresh loop and graceful shutdown
- [x] JSON file storage (latest + history)
- [x] Structured, levelled logging
- [x] Centralised configuration via `.env`

### Milestone 2 — Functional Scrapers *(planned)*
- [ ] Winamax scraper: browser launch, WebSocket interception, data extraction
- [ ] Pinnacle scraper: browser launch, DOM / API extraction
- [ ] End-to-end pipeline test with live data
- [ ] Cross-bookmaker match deduplication (using `canonicalKey`)

### Milestone 3 — Analysis & Robustness *(planned)*
- [ ] Odds comparison view per match
- [ ] Arbitrage opportunity detection
- [ ] Health-check endpoint / heartbeat
- [ ] Alerting on scraper failures
- [ ] Database storage (SQLite / PostgreSQL)
- [ ] Historical odds charting

---

## License

ISC
