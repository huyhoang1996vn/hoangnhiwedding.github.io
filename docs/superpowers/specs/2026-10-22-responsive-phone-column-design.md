# Responsive Phone-Column Layout Design

**Date:** 2026-10-22  
**Status:** Approved

## Goal

Optimize the wedding invitation site for a professional, responsive experience: mobile-first on small screens, and a centered phone-column layout on larger screens with balanced ivory whitespace on both sides. No on-page navigation.

## Decisions

| Topic | Choice |
|-------|--------|
| Desktop layout | Phone-column: entire page (including intro video, hero, embroidery) constrained |
| Max content width | 560px |
| Navigation | None — pure scroll |
| Implementation | Single shell wrapper on `<main>` |
| Side margins | Existing ivory body background |
| Fixed UI | Music toggle (and toasts) remain viewport-fixed |

## Architecture

1. Style `<main>` (or add `.site-shell`) with:
   - `max-width: 560px`
   - `margin-inline: auto`
   - `overflow-x: hidden` (clip decorative overflow to the column)
   - Optional subtle vertical edge shadow for card separation on desktop
2. Below 560px, the shell is full viewport width (mobile-first; no layout regression).
3. Prefer CSS overrides in `css/custom.css` for overflow fixes; minimize HTML churn.

## Mobile / overflow polish (in scope)

- **Countdown:** Scale medallions so three columns fit inside the shell without horizontal scroll (replace aggressive `vw` + negative margins behavior inside the column).
- **Ceremony garland:** Prevent `w-[130%]` from spilling past the shell; clip or constrain width.
- **RSVP:** Keep tap targets; ensure form inputs and topiary decoration stay within the shell.
- **Typography/spacing:** Minor padding tweaks only for ~320–390px where text feels cramped.

## Out of scope

- New navigation or section jump UI
- Visual rebrand, copy changes, or section reordering
- Changing music / intro video behavior (except layout containment)

## Files

- `index.html` — add shell class on `<main>`
- `css/custom.css` — shell styles + overflow overrides

## Verification

- ~375px: no horizontal scroll; content readable; tap targets usable
- ~560px: shell edge case; content fills width
- ≥1200px: centered 560px column, balanced ivory sides; imagery full-width *within* shell
- Music toggle and toasts still positioned relative to the viewport
