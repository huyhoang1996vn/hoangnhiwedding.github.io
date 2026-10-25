# Project context — Hoang & Nhi wedding site

Static wedding invitation site for **Hoang & Nhi**, wedding **Tuesday 1 December 2026**, hosted as a GitHub Pages–style static front end with a small FastAPI backend for RSVPs.

Live feel: embroidered / château / sage–ivory invitation. Invitation copy in English. Venue: **Da Nang Mikazuki Japanese Resorts & Spa** (Da Nang, Vietnam). Recovery day: **Le Comptoir des Halles**, Beaune, France (13 June 2027).

---

## Stack

| Layer | Tech |
| --- | --- |
| Invitation | Plain HTML + CSS + vanilla JS (no framework, no build step for the page) |
| Styles | Bundled Tailwind export (`css/styles.css`) + overrides (`css/custom.css`) |
| Fonts | Adobe Fonts (Typekit): `yyb5qhs`, `dbv4jbd` |
| RSVP API | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2, PostgreSQL 16 |
| Optional sync | Google Sheets via `gspread` + service account |
| Local serving | Nginx Docker image proxies `/rsvp`, `/rsvps`, `/health` to the API |

---

## Repo layout

```
index.html              # Main invitation
guests/index.html       # Private-ish guest list UI (GET /rsvps)
js/main.js              # Countdown, intro video, music, maps/calendar, RSVP submit
css/styles.css          # Generated / bundled utility styles
css/custom.css          # Project overrides, reveal, guests table, site-shell
assets/                 # Images, intro video, music
server/                 # FastAPI + Postgres (Docker Compose)
nginx/                  # Static site reverse proxy for local/prod-like serve
docs/superpowers/       # Design specs and implementation plans
```

Do not commit: `server/.env`, `server/secrets/*.json` (service account keys).

---

## Pages & sections (`index.html`)

Scroll-only invitation; **no on-page nav**. Desktop uses a **phone-column** shell (`main.site-shell`, max-width **560px**, centered on ivory).

1. **Intro** — doors video; tap to play; names + date overlay  
2. **Hero invitation** — embroidered swans art; English welcome  
3. **Countdown** — days / hours / minutes to ceremony (`2026-12-01T17:00:00+07:00`)  
4. **Welcome** — Hoang and Nhi  
5. **Ceremony & Reception** — Mikazuki; ceremony 5:00 PM Orangery; reception 7:00 PM Wine Cellar; Maps + Calendar  
6. **Dress code** — Black Tie  
7. **Our Story**  
8. **Timeline** — 4:45 → 11:00 PM with scroll-driven pearl  
9. **Recovery Day** — Beaune, 13 June 2027  
10. **Gifts** — wishing well  
11. **RSVP** — name, attendees (1–20), optional message; honeypot `website`  
12. **Footer**

Fixed UI: music toggle + toast container (viewport-fixed, outside the column).

`guests/index.html` loads RSVPs into a simple table and links back to `/`.

---

## Front-end behavior (`js/main.js`)

- `RSVP_API_URL = '/rsvp'` (same-origin; nginx proxies to API)
- Ceremony / recovery maps URLs and ICS-style calendar dates live as constants at the top of the file
- Intro video, background music (autoplay constrained — starts after user gesture), scroll reveals, garland sway, timeline pearl
- RSVP: `POST` JSON `{ fullName, attendees, message, website }`; success/error via toasts

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

- Honeypot: non-empty `website` → `201` with `{ "id": null }`, nothing stored  
- Sheet failure must not fail the RSVP (logged only)  
- Tables created on API startup (`create_all`); no migration tooling  

Docker: `cd server && docker compose up --build` → API `:8000`, Postgres host port `54322`.

---

## Nginx (`nginx/`)

Serves the static tree; denies `/server/` and dotfiles; proxies:

- `=/rsvp`, `=/rsvps`, `=/health` → `http://host.docker.internal:8000`

Front end always talks to same-origin `/rsvp` and `/rsvps` so CORS is not required when using this proxy. Direct Live Server + API still needs `CORS_ORIGINS` on the API.

---

## Conventions for agents

- Prefer edits in `css/custom.css` over regenerating the whole Tailwind bundle unless utilities are missing.  
- Keep HTML section structure and asset naming; new art usually lands in `assets/` with versioned filenames (`*-v2`, `*-v3`).  
- Do not add SPA frameworks, build pipelines, or on-page navigation unless explicitly asked.  
- Secrets stay out of git; document env vars in `server/README.md`, not in committed `.env`.  
- Vietnamese comments exist in `server/README.md`; UI copy is English — keep new copy in English (venue proper names may stay as branded).  
- Before claiming RSVP/API work is done, hit `/health` and verify `POST /rsvp` / `GET /rsvps` against a running stack.

---

## Quick local paths

| Goal | How |
| --- | --- |
| Static preview | Open `index.html` via Live Server / static server |
| API only | `server/docker-compose.yml` or `uvicorn app.main:app --reload --port 8000` |
| Static + proxy | `nginx/` compose (expects API on host `:8000`) |
| Guest list | Open `/guests/` with API (or proxy) available |
