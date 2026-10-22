# Responsive Phone-Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Constrain the wedding invitation to a centered 560px phone-column on large screens and fix overflow/spacing so mobile has no horizontal scroll.

**Architecture:** Add a `.site-shell` class on `<main>` with max-width, centering, and overflow clipping. Put shell styles and targeted overflow overrides in `css/custom.css` so decorative elements (countdown medallions, ceremony garland, RSVP topiary) stay inside the column.

**Tech Stack:** Static HTML, Tailwind-compiled `css/styles.css`, hand-written `css/custom.css`

## Global Constraints

- Max content width: exactly 560px
- No navigation UI
- No copy/section-order changes
- Music toggle and toasts remain viewport-fixed
- Prefer `custom.css` overrides over rewriting Tailwind utilities in HTML when possible
- Do not edit the minified `css/styles.css` bundle

---

### Task 1: Site shell on main

**Files:**
- Modify: `index.html` (the `<main>` element)
- Modify: `css/custom.css` (append shell rules)

**Interfaces:**
- Produces: `.site-shell` class applied to `<main>`

- [ ] **Step 1: Add class to main**

Change:

```html
<main class="bg-background overflow-x-hidden">
```

to:

```html
<main class="site-shell bg-background overflow-x-hidden">
```

- [ ] **Step 2: Add shell CSS to custom.css**

Append:

```css
/* Centered phone-column invitation shell */
.site-shell {
  width: 100%;
  max-width: 560px;
  margin-inline: auto;
  overflow-x: hidden;
  position: relative;
  box-shadow: 0 0 40px hsl(30 24% 20% / 0.06);
}

@media (max-width: 560px) {
  .site-shell {
    box-shadow: none;
  }
}
```

- [ ] **Step 3: Verify in browser**

Open `index.html` at desktop width (≥1200px): content column centered at 560px, ivory sides visible. At ≤560px: full width, no side shadow.

- [ ] **Step 4: Commit**

```bash
git add index.html css/custom.css
git commit -m "feat: add centered 560px site shell for desktop"
```

---

### Task 2: Countdown overflow inside shell

**Files:**
- Modify: `css/custom.css`

**Interfaces:**
- Consumes: `.site-shell` clipping from Task 1
- Produces: Countdown medallions sized relative to shell, not viewport `vw` blowouts

- [ ] **Step 1: Override countdown medallion sizing**

The countdown uses `w-[38vw]` / negative margins that overflow a 560px column. Append:

```css
/* Countdown: fit three medallions inside the phone column */
#countdown .relative.aspect-square {
  width: min(28vw, 140px);
  max-width: 140px;
}

@media (min-width: 480px) {
  #countdown .relative.aspect-square {
    width: min(26vw, 160px);
    max-width: 160px;
  }
}

#countdown .flex.w-full.items-start.justify-center > div {
  margin-inline: -0.25rem;
}

@media (min-width: 480px) {
  #countdown .flex.w-full.items-start.justify-center > div {
    margin-inline: -0.5rem;
  }
}

#countdown {
  min-height: auto;
  padding-bottom: 8rem;
  padding-top: 4rem;
}

@media (min-width: 768px) {
  #countdown {
    padding-bottom: 10rem;
    padding-top: 5rem;
  }
}
```

- [ ] **Step 2: Verify**

At 375px and 1200px: three countdown units visible side-by-side, no horizontal scrollbar on `body`.

- [ ] **Step 3: Commit**

```bash
git add css/custom.css
git commit -m "fix: scale countdown medallions to fit phone column"
```

---

### Task 3: Garland and RSVP containment

**Files:**
- Modify: `css/custom.css`

**Interfaces:**
- Consumes: `.site-shell` overflow-x hidden
- Produces: Garland and RSVP decorative elements contained

- [ ] **Step 1: Constrain garland width**

Ceremony section uses a garland at `w-[130%]`. Append:

```css
/* Ceremony garland: keep vines inside the invitation column */
#wedding-events .absolute.top-full {
  width: 100%;
  max-width: 100%;
}

#garland {
  width: 100%;
  max-width: 100%;
}
```

- [ ] **Step 2: RSVP topiary + form safety**

```css
/* RSVP: keep decorative topiary and form inside shell */
#rsvp {
  overflow-x: hidden;
}

#rsvp form input,
#rsvp form textarea,
#rsvp form button[type='submit'] {
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 390px) {
  #rsvp .max-w-xl {
    padding-inline: 0.25rem;
  }
}
```

- [ ] **Step 3: Verify**

Scroll through ceremony → dress code (garland hangs within column). RSVP form: inputs full width of column; topiary clipped, not causing page-level horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add css/custom.css
git commit -m "fix: contain garland and RSVP decorations in phone column"
```

---

### Task 4: Final cross-breakpoint pass

**Files:**
- Modify: `css/custom.css` only if verification finds gaps

- [ ] **Step 1: Manual checklist**

| Viewport | Checks |
|----------|--------|
| ~375px | No horizontal scroll; intro/hero readable; countdown fits; RSVP usable |
| ~560px | Shell at natural max; no double-padding issues |
| ≥1200px | Centered column; ivory gutters; soft edge shadow; music toggle still top-right of viewport |

- [ ] **Step 2: Fix any remaining overflow with targeted CSS** (only if needed)

- [ ] **Step 3: Final commit if changes were made**

```bash
git add css/custom.css
git commit -m "fix: polish phone-column overflow at edge breakpoints"
```
