# Project context — Hoang & Nhi wedding site

Static wedding invitation site for **Hoang & Nhi**, wedding **Saturday 9 January 2027**, with a small FastAPI backend for RSVPs.

Live feel: embroidered / château / sage–ivory invitation. Invitation copy in English. Venue: **Da Nang Mikazuki Japanese Resorts & Spa** / **Nami Hall** (Da Nang, Vietnam). Beach ceremony, meal in the restaurant.

**Live site:** [https://hoangnhiwedding.run.place](https://hoangnhiwedding.run.place)  
**Personalized invite:** `https://hoangnhiwedding.run.place/?Alex` (or `?Alex%20%26%20Sam`)

---

## Stack

| Layer | Tech |
| --- | --- |
| Invitation | Plain HTML + CSS + vanilla JS (no framework, no build step for the page) |
| Styles | Bundled Tailwind export (`css/styles.css`) + overrides (`css/custom.css`) |
| Fonts | Adobe Fonts (Typekit): `yyb5qhs`, `dbv4jbd` |
| RSVP API | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2, PostgreSQL 16 |
| Optional sync | Google Sheets via `gspread` + service account |
| Serving | Nginx Docker image serves static files; proxies `/rsvp`, `/rsvps`, `/health` to API on host `:8000` |

---

## Repo layout

```
index.html              # Main invitation
guests/index.html       # Guest list UI (GET /rsvps) — shows stay column
js/main.js              # Countdown, intro, music, maps/calendar, invitee, RSVP
css/styles.css          # Generated / bundled utility styles
css/custom.css          # Project overrides, reveal, guests table, site-shell
assets/                 # Images, intro video, music
server/                 # FastAPI + Postgres
nginx/                  # Static site image + reverse proxy
docs/superpowers/       # Design specs and implementation plans
PROJECT_CONTEXT.md      # This file
```

Do not commit: `server/.env`, `server/secrets/*.json` (service account keys).

---

## Pages & sections (`index.html`)

Scroll-only invitation; **no on-page nav**. Desktop uses a **phone-column** shell (`main.site-shell`, max-width **560px**, centered on ivory).

1. **Intro** — doors video; tap to play; names + date overlay  
2. **Hero invitation** — embroidered art; optional invitee name from `?Name`  
3. **Countdown** — days / hours / minutes to `2027-01-09T16:00:00+07:00`  
4. **Welcome** — Hoang and Nhi (+ invitee names when personalized)  
5. **Ceremony & Reception** — Mikazuki; ceremony **4:00 PM**; reception **6:30 PM**; Maps + Calendar  
6. **Dress code** — Black Tie  
7. **Our Story**  
8. **Timeline** — 3:00 → 9:00 PM with scroll-driven pearl  
9. **The Venue** (`#recovery-day`) — Nami Hall / Mikazuki (maps/calendar reuse ceremony constants)  
10. **Gifts** — wishing well  
11. **RSVP** — name, attendees (1–20), **stay** yes/no, optional message; honeypot `website`  
12. **Footer**

Fixed UI: music toggle + toast container (viewport-fixed, outside the column).

`guests/index.html` lists RSVPs (name, attendees, stay, message, time) and links back to `/`.

Script cache-bust: bump `js/main.js?v=N` in `index.html` whenever `main.js` changes, then rebuild the nginx image.

---

## Front-end behavior (`js/main.js`)

- `RSVP_API_URL = '/rsvp'` (same-origin; nginx proxies to API)
- `WEDDING_DATE`, `CEREMONY`, `RECOVERY` constants at top of file (maps URLs + ICS dates). Venue section buttons use `data-maps` / `data-calendar` → those constants.
- Intro video (poster held until first real frame), background music after user gesture, scroll reveals, garland sway, timeline pearl, auto slow-scroll with section pauses after intro
- Invitee: `/?Alex` or `/?Alex%20%26%20Sam` fills hero/welcome names and pre-fills RSVP `fullName`
- RSVP `POST` JSON:

```json
{
  "fullName": "Alex",
  "attendees": 1,
  "stay": "yes",
  "message": "optional",
  "website": ""
}
```

`stay` must be `"yes"` or `"no"` (radio `name="stay"`). Client validates before fetch; API also requires it (`422` if missing).

When changing event facts (date, venue, times), update **both** HTML copy and the constants in `js/main.js`.

---

## Design language

Preserve the existing look; do not restyle toward generic AI defaults (purple gradients, cream+terracotta broadsheet, etc.).

- **Palette:** ivory backgrounds, sage / sage-dark text, dusty-rose accents, gold rules  
- **Type:** display (headings), script (names / flourishes), body (serif-ish italic copy), subtitle tracking for uppercase labels — via CSS variables / Typekit  
- **Imagery:** embroidery frames, painted timeline icons, château footer — assets under `assets/`  
- **Motion:** intentional (reveal on scroll, intro fade, garland sway, timeline pearl) — avoid noisy effects  
- **Layout rule:** one composition, phone-column on large screens; decorative overflow clipped by the shell  

Design decisions for the column layout: `docs/superpowers/specs/2026-10-22-responsive-phone-column-design.md`.

---

## RSVP API (`server/`)

Full detail: [`server/README.md`](server/README.md).

| Method | Path | Role |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/rsvp` | Create RSVP → Postgres; best-effort Google Sheet append |
| `GET` | `/rsvps` | List RSVPs (newest first) for `guests/` |

**`POST /rsvp` body**

| Field | Rules |
| --- | --- |
| `fullName` | Required, 1–120 chars after trim |
| `attendees` | Integer 1–20 |
| `stay` | **Required** `"yes"` or `"no"` |
| `message` | Optional, max 1000; empty → `null` |
| `website` | Honeypot; non-empty → `201` `{ "id": null }`, nothing stored |

- Sheet columns (append order): `id`, name, attendees, **stay**, message, created (`Asia/Ho_Chi_Minh`)
- Sheet failure must not fail the RSVP (logged only)
- On startup: `create_all` + `ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS stay TEXT` (no migration tool)

---

## Docker on this VPS (important)

Production path: `/var/www/hoangnhiwedding`.

| Issue | What to do |
| --- | --- |
| Snap Docker cannot bind-mount `/var/www` | Mount Google credentials from a **home** path via `SECRETS_HOST_PATH` in `server/.env` (currently `/root/hoangnhi-wedding-secrets`). Keep that folder in sync when rotating the key. |
| Legacy `/usr/bin/docker-compose` 1.29 | Breaks with `KeyError: 'ContainerConfig'`. Prefer raw `docker` / `docker run`, or `snap run docker compose` from a Snap-visible directory. Do **not** rely on apt `docker-compose` for recreate. |
| Nginx image bakes static files at **build** time | Rebuild/recreate `hoangnhi-nginx` after every front-end change. |
| JS caching | Bump `?v=` on the `main.js` script tag when shipping JS changes. |

`GOOGLE_CREDENTIALS_FILE` is the **in-container** path (e.g. `secrets/hoangnhi-wedding-….json` → `/app/secrets/…`).

Containers in use:

- `hoangnhi-nginx` — host `:8090` → `:80` (TLS usually terminates in front of this)
- `server_api_1` — host `:8000`
- `server_db_1` — Postgres on compose network alias `db`; data in volume `server_pgdata`

---

## Nginx (`nginx/`)

Serves the static tree; denies `/server/` and dotfiles; proxies:

- `=/rsvp`, `=/rsvps`, `=/health` → `http://host.docker.internal:8000`

Front end always talks to same-origin `/rsvp` and `/rsvps`, so CORS is not required when using this proxy. Direct Live Server + API still needs `CORS_ORIGINS` on the API.

---

## Conventions for agents

- Prefer edits in `css/custom.css` over regenerating the whole Tailwind bundle unless utilities are missing.
- Keep HTML section structure and asset naming; new art usually lands in `assets/` with versioned filenames (`*-v2`, `*-v3`).
- Do not add SPA frameworks, build pipelines, or on-page navigation unless explicitly asked.
- Secrets stay out of git; document env vars in `server/README.md`, not in committed `.env`.
- UI copy is English; venue proper names stay branded.
- After JS changes: bump `main.js?v=`, rebuild nginx, hard-refresh when verifying RSVP payloads in DevTools.
- Before claiming RSVP/API work is done: `curl /health`, `POST /rsvp` **with** `stay`, `GET /rsvps` and confirm `stay` is stored.

---

## Quick local paths

| Goal | How |
| --- | --- |
| Static preview | Open `index.html` via Live Server / static server |
| API only | `uvicorn app.main:app --reload --port 8000` in `server/` (needs Postgres + `.env`) |
| Static + proxy | Rebuild/run `nginx/` (expects API on host `:8000`) |
| Guest list | Open `/guests/` with API (or proxy) available |

---

## Deploy on production

### 0. One-time / secrets

1. Repo at `/var/www/hoangnhiwedding`.
2. `server/.env` with `DATABASE_URL`, `CORS_ORIGINS`, `GOOGLE_SHEET_*`, `GOOGLE_CREDENTIALS_FILE`, `SECRETS_HOST_PATH=/root/hoangnhi-wedding-secrets`.
3. Copy service-account JSON into `/root/hoangnhi-wedding-secrets/` (and share the Sheet with that account as Editor).
4. TLS reverse proxy in front of `127.0.0.1:8090` for `hoangnhiwedding.run.place`.

### 1. Ship code

```bash
cd /var/www/hoangnhiwedding
git pull
# or copy changed files into this tree
```

### 2. Redeploy static site (invitation)

Whenever `index.html`, `css/`, `js/`, `assets/`, or `guests/` change:

```bash
cd /var/www/hoangnhiwedding/nginx
docker-compose build          # or: docker build -f nginx/Dockerfile -t hoangnhi-nginx ..
docker rm -f hoangnhi-nginx
docker-compose up -d          # or: docker run … matching nginx/docker-compose.yml
```

### 3. Redeploy RSVP API (when `server/` changes)

Avoid apt `docker-compose` recreate on this host. Working pattern:

```bash
cd /var/www/hoangnhiwedding/server
docker build -t server_api:latest .

docker rm -f server_api_1
# db must already be up on network server_default (alias db), volume server_pgdata
docker run -d --name server_api_1 \
  --network server_default --network-alias api \
  -p 8000:8000 \
  --env-file .env \
  -e DATABASE_URL=postgresql+psycopg://wedding:wedding@db:5432/wedding \
  -v /root/hoangnhi-wedding-secrets:/app/secrets:ro \
  --restart unless-stopped \
  server_api:latest

curl http://127.0.0.1:8000/health
# expect: {"status":"ok"}
```

If Postgres is down, recreate `server_db_1` on `server_default` with alias `db` and volume `server_pgdata` (image `postgres:16`, user/password/db `wedding`).

### 4. Smoke-check

1. `https://hoangnhiwedding.run.place/` — intro / hero load.
2. `https://hoangnhiwedding.run.place/?Alex` — invitee name appears.
3. RSVP with **Yes/No stay** selected — toast success; DevTools body includes `"stay":"yes"` or `"no"`.
4. `https://hoangnhiwedding.run.place/guests/` — new reply lists stay.
5. `curl https://hoangnhiwedding.run.place/health` → `{"status":"ok"}`.
6. Missing `stay` must `422`:

```bash
curl -sS -X POST https://hoangnhiwedding.run.place/rsvp \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test","attendees":1,"message":"x","website":""}'
```
