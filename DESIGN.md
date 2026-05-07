# Design System — Paperwork Second Brain

**Aesthetic: Industrial / Utilitarian**
> "This is serious software for serious paperwork."

Precision tool, not productivity app. Warm archival palette, Germanic clarity, zero decorative chrome. Every visual decision earns its place by communicating information faster.

---

## Typography

Three typefaces, each with a specific job. Never swap them.

| Role | Typeface | Weight | Size | Notes |
|------|----------|--------|------|-------|
| App chrome / body / labels | Barlow | 400–700 | 13–17px | All UI text |
| Table headers / tabs / chips / condensed labels | Barlow Condensed | 700 | 11–15px | UPPERCASE + letter-spacing 0.06–0.1em |
| All numbers, dates, costs, codes | IBM Plex Mono | 400–500 | 13–14px | Tabular figures always |

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

font-family: 'Barlow', sans-serif;          /* body / UI */
font-family: 'Barlow Condensed', sans-serif; /* headers / tabs */
font-family: 'IBM Plex Mono', monospace;     /* numbers / dates */
```

**Type scale:**
- `11px / 700 / Barlow Condensed / 0.1em` — column headers, chips
- `13px / 500 / IBM Plex Mono` — dates, secondary numbers
- `13px / 600 / Barlow Condensed / 0.04em / UPPERCASE` — count labels, meta
- `14px / 400–600 / Barlow` — body, provider names, descriptions
- `14px / 500 / IBM Plex Mono` — cost figures
- `15px / 600 / Barlow Condensed` — document type label (primary table cell)
- `17px / 700 / Barlow` — app logo / wordmark

---

## Color

### Light Mode (default)

```css
:root {
  /* Surfaces */
  --bg:            #F7F6F3;  /* page background — warm cream */
  --surface:       #FAF9F6;  /* elevated surface (inputs, modals) */
  --header:        #1A1A1A;  /* charcoal — top header bar */

  /* Text */
  --text:          #1A1A1A;  /* primary — near-black */
  --text-muted:    #6B6560;  /* secondary — warm gray */

  /* Borders */
  --border:        #E5E1D8;  /* row dividers, subtle separations */
  --border-strong: #CCC8BF;  /* section boundaries, input borders */

  /* Accent — Amber (warnings + active state) */
  --amber:         #D97706;
  --amber-bg:      #FFFBEB;

  /* Status — Green (active documents) */
  --green:         #15803D;
  --green-bg:      #DCFCE7;

  /* Error */
  --error:         #DC2626;
  --error-bg:      #FEF2F2;
}
```

### Dark Mode

```css
[data-theme="dark"] {
  --bg:            #1C1917;  /* warm dark — not cool black */
  --surface:       #292524;
  --header:        #0C0A09;
  --text:          #F7F6F3;
  --text-muted:    #A8A29E;
  --border:        #3C3836;
  --border-strong: #57534E;
  --amber:         #F59E0B;
  --amber-bg:      #1C1200;
  --green:         #22C55E;
  --green-bg:      #052E16;
  --error:         #F87171;
  --error-bg:      #1C0404;
}
```

### Color usage rules

- **Amber** is the only accent. Active tabs, warning icons, uncertain-cost flags, focus rings, primary CTA hover.
- **Green** for status only: `chip-aktiv`. Never use green as an accent elsewhere.
- **Red** (`--error`) for destructive actions and validation errors only. Never for navigation or brand.
- **Header bar** is always `--header` (#1A1A1A). Buttons inside it use `--bg` fill with `--text` color.

---

## Spacing

Base unit: **4px**.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Inline gap between icon and label |
| `--space-2` | 8px | Chip padding, tight gaps |
| `--space-3` | 12px | Button padding, small gaps |
| `--space-4` | 16px | Table cell padding, form field padding |
| `--space-5` | 24px | Section gap within a panel |
| `--space-6` | 32px | Section gap between major blocks |
| `--space-8` | 48px | Page horizontal padding |
| `--space-10` | 64px | Empty-state padding |

Page max-width: **1200px** (centered, `padding: 0 48px`).

---

## Border Radius

Near-flat. Chrome communicates through structure and color, not rounded softness.

| Component | Radius |
|-----------|--------|
| Table rows | 0px |
| Chips / badges | 3px |
| Inputs, buttons, filter controls | 4px |
| Modals, drawers, card wrappers (rare) | 6px |
| Circular indicators (warn dot, avatar) | 50% |

---

## Components

### Header Bar

```css
.header-bar {
  background: var(--header);       /* #1A1A1A */
  height: 56px;
  padding: 0 48px;
}
.header-logo {
  font: 700 17px/1 'Barlow', sans-serif;
  color: var(--bg);
  letter-spacing: -0.01em;
}
.btn-add {
  background: var(--bg);
  color: var(--text);
  border-radius: 4px;
  padding: 8px 18px;
  font: 700 14px 'Barlow', sans-serif;
}
```

### Tab Navigation (Sub-nav)

```css
.sub-nav {
  border-bottom: 1px solid var(--border-strong);
  padding: 0 48px;
}
.tab {
  font: 600 14px 'Barlow', sans-serif;
  color: var(--text-muted);
  border-bottom: 3px solid transparent;
  padding: 11px 18px 9px;
  margin-bottom: -1px;
}
.tab.active {
  color: var(--text);
  border-bottom-color: var(--amber);    /* amber underline */
}
.tab .count {
  font: 700 11px 'Barlow Condensed', sans-serif;
  background: var(--border);
  color: var(--text-muted);
  padding: 1px 7px;
  border-radius: 10px;
}
.tab.active .count {
  background: var(--amber);             /* amber badge when active */
  color: #FFFFFF;
}
```

### Table

Structure rules:
- **No card wrapper.** Table runs edge-to-edge within the content area.
- `thead` has `border-top: 1px solid --border-strong` + `border-bottom: 2px solid --text`.
- Last row: `border-bottom: 2px solid --border-strong`.
- Row hover: `background: rgba(26,26,26,0.025)` — barely-there tint.
- Column headers: Barlow Condensed 700, 11px, `UPPERCASE`, `letter-spacing: 0.1em`, `color: --text-muted`.
- Document type cell: Barlow Condensed 600, 15px.
- Cost cell: IBM Plex Mono 500, 14px.
- Date cell: IBM Plex Mono 400, 13px, `color: --text-muted`.

```css
thead tr {
  border-top: 1px solid var(--border-strong);
  border-bottom: 2px solid var(--text);
}
th {
  font: 700 11px/1 'Barlow Condensed', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 9px 16px;
}
td { padding: 13px 16px; border-bottom: 1px solid var(--border); }
tr:last-child td { border-bottom: 2px solid var(--border-strong); }
```

### Chips / Status Badges

```css
.chip {
  font: 700 12px/1 'Barlow Condensed', sans-serif;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 3px;
}
.chip-aktiv  { background: var(--green-bg);  color: var(--green); }
.chip-abgelaufen { background: var(--error-bg); color: var(--error); }
.chip-unklar { background: var(--amber-bg);  color: var(--amber); }
```

### Warning / Uncertain Cost

Amber underline on the number + circular `!` badge.

```css
.cost-warn .cost {
  color: var(--amber);
  border-bottom: 2px solid var(--amber);
  padding-bottom: 1px;
}
.warn-icon {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--amber);
  color: var(--amber);
  font: 700 10px 'Barlow', sans-serif;
  display: flex; align-items: center; justify-content: center;
}
```

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 4px;
  padding: 9px 20px;
  font: 700 14px 'Barlow', sans-serif;
}

/* Secondary / outline */
.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1.5px solid var(--border-strong);
  border-radius: 4px;
  padding: 9px 20px;
  font: 600 14px 'Barlow', sans-serif;
}
.btn-secondary:hover { border-color: var(--text); }

/* Destructive */
.btn-danger {
  background: var(--error);
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 9px 20px;
  font: 700 14px 'Barlow', sans-serif;
}
```

### Form Inputs

```css
.input {
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  padding: 9px 14px;
  font: 400 14px 'Barlow', sans-serif;
  background: #FFFFFF;
  color: var(--text);
}
.input:focus { border-color: var(--text); outline: none; }
.input::placeholder { color: var(--text-muted); }

/* Warning state (uncertain extracted value) */
.input-warn {
  border-color: var(--amber);
  background: var(--amber-bg);
}
.input-warn:focus { border-color: var(--amber); }
```

### Search Bar

Uses magnifier glyph positioned absolutely within the input wrapper.

```css
.search-wrap { position: relative; }
.search-icon {
  position: absolute;
  left: 12px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.search-input { padding-left: 34px; }
```

---

## Motion

Minimal-functional. Animation exists to orient, not to delight.

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Row hover tint | 0ms | instant |
| Button/input hover | 80ms | ease |
| Tab color + border | 150ms | ease |
| Modal overlay fade | 150ms | ease |
| Modal panel slide-in | 200ms | ease-out |
| Chip color change | 100ms | ease |

No page transitions. No skeleton loaders unless load > 300ms. No spring physics.

---

## Empty States

```css
.empty {
  text-align: center;
  padding: 64px 0;
  color: var(--text-muted);
}
.empty-title {
  font: 600 18px/1 'Barlow Condensed', sans-serif;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}
.empty-sub { font-size: 14px; }
```

German copy pattern: `"Keine Dokumente in dieser Kategorie"` + `"Klicke auf + Dokument um das erste hinzuzufügen."`

---

## Document Upload UI

Upload trigger is `+ Dokument` button in the header bar. Opens modal, not full-page navigation.

**Modal anatomy:**
1. **Drop zone** — dashed border, amber on hover/drag-over, `border-radius: 6px`
2. **File list** — shows filename + mime type + file size; remove `×` per file
3. **Process button** — `btn-primary`, disabled until at least one file selected
4. **Progress state** — single progress bar (amber fill), status text below

---

## Extraction Correction UI

When Claude extracts fields from a document, uncertain values get amber treatment:

- Input field: `border-color: var(--amber)` + `background: var(--amber-bg)`
- Hint text below: `font-size: 13px; color: var(--amber)` — e.g. "Bitte prüfen — aus Seite 2 extrahiert"
- After user confirms value: field reverts to normal input styling

Keyboard shortcut: `Tab` cycles through uncertain fields. `Enter` confirms current field.

---

## Approved Reference Screen

**Source file:** `~/.gstack/projects/unnamed/designs/document-list-20260502/variant-E.html`

This file is the canonical reference for all layout proportions, column widths, spacing, and visual weight. When in doubt, match it.

**Approval record:** `~/.gstack/projects/unnamed/designs/document-list-20260502/approved.json`

---

## What this system is NOT

- Not a productivity / GTD app — no color-coded folders, no confetti, no progress rings
- Not a consumer app — no rounded-everything, no pastel backgrounds, no friendly illustrations
- Not dark-by-default — light mode is primary; dark mode is a preference, not the hero
- Not enterprise SaaS gray — the warmth of the cream palette is intentional and load-bearing

The amber accent, condensed headers, and monospace numbers are functional choices: they communicate "this field has a specific value and that value matters."
