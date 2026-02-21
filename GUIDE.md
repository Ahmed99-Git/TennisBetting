# Tennis Betting Scraper — Complete Setup & Implementation Guide

This guide walks you through every step needed to get the Tennis Betting
Scraper running on your machine, explains how every part of the codebase works,
and shows you how to read the data it collects.

---

## What This Project Does

This is a **Node.js application** that scrapes real-time tennis betting odds
from two online bookmakers:

| Bookmaker | How It Connects | What It Collects |
|-----------|----------------|-----------------|
| **Winamax** (French bookmaker) | WebSocket (Socket.IO protocol) | Match winner, Set 1 winner, Handicap lines, Over/Under totals, Set 1 game totals |
| **Pinnacle** | REST API (HTTP GET) | Raw matchup data (currently not processed into the database) |

The Winamax scraper runs continuously in a loop, fetching fresh odds every
10 seconds (configurable) and saving them to a local **SQLite database**.

---

## Prerequisites

Before you start, make sure you have:

### 1. Node.js (latest version)

Download from [https://nodejs.org](https://nodejs.org). Choose the **LTS**
version. This also installs `npm` (the package manager).

Verify your installation:

```bash
node --version
# Should print v25.6.1

npm --version
# Should print 11.9.0
```

### 2. C++ Build Tools (required for the SQLite dependency)

The project uses `better-sqlite3`, a native C++ addon. On **Windows**, you
need one of:

- **Option A (recommended):** Install
  [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  and select the **"Desktop development with C++"** workload during
  installation.

- **Option B:** Run this in an **Administrator** PowerShell:

  ```powershell
  npm install -g windows-build-tools
  ```

On **macOS**, install Xcode Command Line Tools:

```bash
xcode-select --install
```

On **Linux (Debian/Ubuntu)**:

```bash
sudo apt-get install build-essential python3
```

### 3. Network Access to Winamax (France)

Winamax is a French bookmaker. Their servers may **block connections from
non-French IP addresses**. If you are outside France, you will need a **VPN
with a French exit node** (e.g., NordVPN, ExpressVPN, Mullvad — any provider
with French servers).

**How to tell if you're blocked:** You will see errors like `ETIMEDOUT`,
`ECONNREFUSED`, or `ENOTFOUND` in the console when the scraper tries to
connect.

---

## Step-by-Step Installation

### Step 1: Get the Code

Clone or download the repository, then open a terminal in the project folder:

```bash
cd TennisBetting-main
```

Your folder should look like this:

```
TennisBetting-main/
├── .env
├── env sample
├── package.json
├── package-lock.json
├── README.md
├── GUIDE.md          ← this file
└── src/
    ├── index.js
    ├── config/
    ├── dataParsers/
    ├── database/
    ├── models/
    ├── scrapers/
    ├── services/
    └── utils/
```

### Step 2: Install Dependencies

```bash
npm install
```

This downloads all required packages into a `node_modules/` folder. It may
take a few minutes because `puppeteer` downloads a Chromium browser binary
(~170 MB). This binary is not actively used by the current code, but it is
listed as a dependency.

**Expected output:** You should see packages being downloaded with no `ERR!`
lines. Warnings (`WARN`) are generally safe to ignore.

**If `better-sqlite3` fails to install**, it means the C++ build tools are
missing. Go back to the Prerequisites section above.

### Step 3: Configure Environment Variables

The project already ships with a working `.env` file:

```
WINAMAX_URL = 'https://www.winamax.fr/paris-sportifs/sports/5/'
PINNACLE_URL = "https://guest.api.arcadia.pinnacle.com/0.1/sports/33/matchups?withSpecials=false&brandId=0"

FETCH_ONCE_TIME = 10
WINAMAX_FULL_FETCH_PERIOD =  60
```

| Variable | What It Does | Default |
|----------|-------------|---------|
| `WINAMAX_URL` | Winamax tennis page URL (informational — not directly used by the WebSocket scraper) | Winamax tennis URL |
| `PINNACLE_URL` | Pinnacle API endpoint for tennis matchups | Pinnacle tennis API |
| `FETCH_ONCE_TIME` | **Seconds** between each scrape cycle | `10` |
| `WINAMAX_FULL_FETCH_PERIOD` | Intended full-refresh period in seconds (currently unused — every cycle does a full fetch) | `60` |

You can adjust `FETCH_ONCE_TIME` to scrape more or less frequently. A value
of `10` means the scraper fetches new odds every 10 seconds.

> **Important:** Do not use the `env sample` file as your template — it uses
> different variable names (`URL1`, `URL2`, `WINAMAX_FETCH_PERIOD`) that do
> not match what the code expects. Use the `.env` file as-is.

### Step 4: Run the Scraper

```bash
node src/index.js
```

> **Do not use `npm start`** — the `package.json` start script points to
> `node index.js` (in the project root), but the actual entry point is
> `src/index.js`. Using `npm start` will fail with "Cannot find module".

### What You Should See

On a successful run, you will see output like:

```
96:0{"sid":"xxxxx","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":60000,"maxPayload":1000000}
✅ Connected
2probe
📩 Message: 6
5
📩 Message: 2
Ping: 2
📩 Message: ...
```

- `✅ Connected` — WebSocket connection established
- `2probe` / `5` — Engine.IO handshake completed
- `📩 Message: NNN` — data messages arriving (NNN = character count)
- `Ping: 2` — keepalive pings every 25 seconds

The scraper will keep running indefinitely. Press **Ctrl+C** to stop it.

### If Something Goes Wrong

| Error | Cause | Fix |
|-------|-------|-----|
| `ETIMEDOUT` or `ECONNREFUSED` | Winamax is blocking your IP (geo-restriction) | Use a VPN with a French IP |
| `ENOTFOUND` | DNS cannot resolve the Winamax hostname | Check your internet connection |
| `Cannot find module 'better-sqlite3'` | Native addon failed to compile | Install C++ build tools (see Prerequisites) |
| `Cannot find module` (other) | Dependencies not installed | Run `npm install` |
| `Request timeout` | Server did not respond in time | Retry; may be temporary server issue |

---

## Running the Pinnacle Scraper (Optional)

The Pinnacle scraper is **commented out** in the main loop. You can run it
standalone:

```bash
node src/scrapers/pinnacle/index.js
```

**Known issue:** The Pinnacle scraper reads `process.env.URL2`, but the `.env`
file defines the variable as `PINNACLE_URL`. To make the standalone Pinnacle
scraper work, add this line to your `.env`:

```
URL2 = "https://guest.api.arcadia.pinnacle.com/0.1/sports/33/matchups?withSpecials=false&brandId=0"
```

The Pinnacle scraper fetches data and prints it to the console. It does not
save to the database in its current form.

---

## Where the Data Goes

### SQLite Database

All scraped Winamax data is stored in a SQLite database file at:

```
src/assets/database/matches.db
```

This file is **created automatically** on first run. The folder
`src/assets/database/` is also created automatically if it does not exist.

### Database Table: `matches`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-incrementing primary key |
| `match_id` | INTEGER | Winamax's unique match identifier (unique index) |
| `home_team` | TEXT | Player 1 name |
| `away_team` | TEXT | Player 2 name |
| `status` | TEXT | Match status (e.g., `"PREMATCH"`, `"LIVE"`) |
| `start_time` | DATETIME | Scheduled match start time |
| `odds` | TEXT | JSON string — match winner odds `[player1_odds, player2_odds]` |
| `set1_odds` | TEXT | JSON string — set 1 winner odds |
| `handicap` | TEXT | JSON string — handicap betting lines keyed by set number |
| `total_rounds` | TEXT | JSON string — over/under total rounds lines |
| `set1_game_count` | TEXT | JSON string — set 1 over/under game count lines |
| `created_at` | DATETIME | When the row was first inserted |
| `updated_at` | DATETIME | When the row was last updated |

Matches are **upserted** — if a match already exists in the database (same
`match_id`), its odds and status are updated. If it's new, a row is inserted.

### Reading the Database

You can inspect the database with any SQLite client:

**Using the `sqlite3` command-line tool:**

```bash
sqlite3 src/assets/database/matches.db
```

```sql
-- List all matches
SELECT match_id, home_team, away_team, status, odds FROM matches;

-- Get a specific match
SELECT * FROM matches WHERE match_id = 12345;

-- Count total matches
SELECT COUNT(*) FROM matches;
```

**Using a GUI tool** like [DB Browser for SQLite](https://sqlitebrowser.org/)
— just open the `matches.db` file.

**Programmatically (Node.js):**

```javascript
const Betting = require('./src/models/winamax/Betting.js');

// Get all matches (odds fields are automatically parsed from JSON)
const allMatches = Betting.findAll();
console.log(allMatches);

// Get a specific match by its Winamax ID
const match = Betting.findByMatchId(12345);
console.log(match);
```

---

## How the Code Works — File by File

Below is a walkthrough of every file in the project, what it does, and how
they connect to each other.

### Entry Point: `src/index.js`

This is the main file you run. It does three things:

1. Loads environment variables from `.env`
2. Starts an infinite `while(true)` loop
3. Each iteration: calls the Winamax scraper, waits N seconds, repeats

The WebSocket connection (`savedWs`) is kept alive between iterations so the
scraper doesn't have to reconnect every cycle. If the connection drops, a new
one is created on the next iteration.

### Winamax Scraper: `src/scrapers/winamax/index.js`

The `run(ws, count)` function is the core scraper logic:

1. **If no WebSocket exists** — calls `initSocketInfo()` to establish a
   connection (see below), then `createSocket()` to open a WebSocket.
2. **Waits for the connection** to be ready (`waitForConnection` polls until
   `ws.status === "connected"`).
3. **Fetches the sport overview** — sends `sport:5` (tennis = sport ID 5) over
   the WebSocket and receives a list of all current tennis matches.
4. **Fetches each match's details** — iterates over every match ID and sends
   `match:{id}` to get full odds data.
5. **Parses and saves** — passes everything to `winamaxParser.resortAllData()`.

### Connection Handshake: `src/scrapers/winamax/init/initConnection.js`

This file handles the Socket.IO/Engine.IO handshake with Winamax's server:

1. **`initializeWebSocket()`** — sends an HTTP GET to the Socket.IO endpoint
   with `transport=polling`. Receives back a session ID (`sid`) and AWS
   load-balancer cookies.
2. **`sendWithSID()`** — confirms the session by sending a follow-up GET with
   the `sid`.
3. **`isAvailableUse()`** — sends a test request (`sport:5`) via HTTP POST to
   verify the server is responding.
4. **`initSocketInfo()`** — orchestrates the above three steps and returns the
   session credentials.

### WebSocket Client: `src/services/ws.js`

`createSocket(data)` opens a real WebSocket connection (`wss://`) using the
session ID and cookies obtained during the handshake:

- On **open**: sends `2probe` (Engine.IO upgrade probe)
- On receiving **`3probe`**: sends `5` (upgrade confirmation), marks the
  connection as `"connected"`, and starts a ping heartbeat every 25 seconds
- On receiving **`2`** (server ping): responds with `3` (pong)
- On **close/error**: cleans up the ping interval

### Data Parser: `src/dataParsers/winamaxParser.js`

`resortAllData({standardInfo, fullMatchInfo})` processes raw Winamax data:

- For each match, it extracts:
  - **Match winner odds** (`getMatchWinner`) — looks for bets with
    `specialBetValue == "type=prematch"`
  - **Set 1 winner odds** (`getSet1Winner`) — looks for
    `specialBetValue == "setnr=1"`
  - **Handicap lines** (`getHandicapInfo`) — all bets starting with `"setnr="`
  - **Total rounds** (`getTotalBigRounds`) — all bets starting with `"total="`
  - **Set 1 game count** (`getSet1GameCount`) — bets starting with
    `"setnr=1|total="`
- If match winner odds exist, calls `Betting.save(matchInfo)` to upsert into
  the database.

### Database Model: `src/models/winamax/Betting.js`

The `Betting` class provides an ORM-style interface to the SQLite database:

| Method | What It Does |
|--------|-------------|
| `Betting.save(matchInfo)` | Static method — upserts a match from parser output |
| `new Betting({...}).save()` | Instance method — inserts a new row |
| `new Betting({...}).upsert()` | Instance method — inserts or updates |
| `Betting.findAll()` | Returns all matches (JSON fields auto-parsed) |
| `Betting.findByMatchId(id)` | Returns one match by its Winamax ID |
| `Betting.updateStatus(id, status)` | Updates only the status field |
| `Betting.delete(id)` | Deletes a match |

### Database Setup: `src/database/db.js`

Opens (or creates) the SQLite database and runs `schema.sql` to create the
`matches` table if it doesn't exist. The database file lives at
`src/assets/database/matches.db`.

### Utilities

- **`src/utils/common.js`** — Three helpers:
  - `getCookieValue(str, name)` — extracts a cookie value from a Set-Cookie
    header
  - `getDataFromReceive(raw)` — parses raw Socket.IO/Engine.IO messages into
    `{type, event, payload}` objects
  - `makeSendMsgContent(route, requestId)` — builds a `42[...]` Socket.IO
    message string

- **`src/utils/wsUtils.js`** — `safeSendReceive(ws, data, requestId)` sends a
  message over the WebSocket and returns a Promise that resolves when a
  matching response arrives (or rejects on timeout).

### Configuration: `src/config/winamaxConfig.js`

Contains pre-configured HTTP headers that mimic a Chrome browser. These
headers are used for both the polling handshake (Axios requests) and the
WebSocket connection to avoid being blocked by the server.

### Pinnacle Scraper: `src/scrapers/pinnacle/index.js`

A simple HTTP scraper that calls the Pinnacle API via Axios and returns the
raw JSON response. Currently commented out of the main loop and not connected
to the database.

### Pinnacle HTTP Helper: `src/services/api.js`

`getTennisInfoByAxios(url)` — a thin wrapper around `axios.get()` for
fetching Pinnacle data.

---

## Complete Data Flow Diagram

```
  YOU RUN: node src/index.js
           │
           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  src/index.js                                           │
  │                                                         │
  │  1. Load .env                                           │
  │  2. while(true):                                        │
  │       winamaxScraper.run(ws, count)                     │
  │       wait FETCH_ONCE_TIME seconds                      │
  │       repeat                                            │
  └───────────────────────┬─────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────┐
  │  scrapers/winamax/index.js  →  run(ws, count)           │
  │                                                         │
  │  First call (ws == null):                               │
  │    initSocketInfo()  ──►  HTTP polling handshake        │
  │    createSocket()    ──►  WebSocket connection          │
  │                                                         │
  │  Every call:                                            │
  │    send "sport:5"    ──►  get list of tennis matches    │
  │    for each match:                                      │
  │      send "match:ID" ──►  get full odds for that match  │
  └───────────────────────┬─────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────┐
  │  dataParsers/winamaxParser.js  →  resortAllData()       │
  │                                                         │
  │  For each match:                                        │
  │    Extract match winner odds (pre-match)                │
  │    Extract set 1 winner odds                            │
  │    Extract handicap lines                               │
  │    Extract over/under total rounds                      │
  │    Extract set 1 game count lines                       │
  │    ──►  Betting.save(matchInfo)                         │
  └───────────────────────┬─────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────┐
  │  models/winamax/Betting.js  →  Betting.save()           │
  │                                                         │
  │  UPSERT into SQLite:                                    │
  │    INSERT ... ON CONFLICT(match_id) DO UPDATE SET ...   │
  └───────────────────────┬─────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────┐
  │  src/assets/database/matches.db                         │
  │                                                         │
  │  SQLite file with the "matches" table                   │
  │  One row per match, odds stored as JSON strings         │
  └─────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Start scraping

```bash
node src/index.js
```

### Stop scraping

Press `Ctrl+C` in the terminal.

### Check what's in the database

```bash
sqlite3 src/assets/database/matches.db "SELECT match_id, home_team, away_team, odds FROM matches;"
```

### Change the scraping interval

Edit `.env` and change `FETCH_ONCE_TIME` (value is in seconds):

```
FETCH_ONCE_TIME = 30
```

Then restart the scraper.

### Reset the database

Delete the database file and restart:

```bash
rm src/assets/database/matches.db
node src/index.js
```

A fresh database will be created automatically.

---

## Troubleshooting

### "Network error: cannot reach Winamax"

You are likely outside France. Winamax geo-blocks non-French IPs. Connect to a
VPN with a French server, then try again.

### The scraper connects but no data appears in the database

Check the console output. If you see `📩 Message:` lines with small numbers
(under 100 characters), the server may not be sending match data. This can
happen if:

- There are no tennis matches currently scheduled on Winamax
- The connection handshake partially failed (try restarting)

### "Request timeout" errors

The server took too long to respond. This can be transient. The scraper will
retry on the next cycle. If it happens consistently, check your network
connection and VPN.

### `npm install` fails on `better-sqlite3`

This means the C++ compiler is not available. See the **Prerequisites** section
for platform-specific installation instructions.

### The scraper runs but `matches.db` is empty

The parser only saves matches that have match winner odds
(`matchWinner.length > 0`). If all current matches are live or have no
pre-match odds available, no rows will be written. Wait until new pre-match
odds are published by Winamax.
