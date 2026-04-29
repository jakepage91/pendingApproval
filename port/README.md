# MetalBear Reskin — Port Bundle

This folder mirrors the structure of your `pendingApproval/` repo. Every file here is a drop-in replacement or addition.

## How to apply

From the **root of your `pendingApproval/` repo**:

```bash
# adjust the source path to wherever you downloaded this folder
cp -R /path/to/port/* .
```

Or copy file-by-file in your editor.

## What changes

### New files
- `public/brand/metalbear-logo.png` (+ `-white`, `metalbear-mark`, `mark-white`) — brand assets
- `components/Logo.tsx` — wordmark/mark, light/dark variants
- `components/Avatar.tsx` — initial-based avatar with palette gradients

### Replaced files
- `app/globals.css` — full token rewrite (MetalBear palette, Plus Jakarta + Fraunces, button + utility classes, light + dark theme)
- `app/layout.tsx` — swaps Inter → Plus Jakarta Sans + Fraunces (Google Fonts via `next/font`)
- `app/page.tsx` — landing page reskinned (slim top bar, "Where are you headed?" hero, 2px ink-bordered portal cards)
- `app/team/page.tsx` — same logic, new visual treatment (logo + avatar in sidebar, Fraunces section titles, yellow Lorena response card, bear empty state, bordered buttons)
- `app/manager/page.tsx` — same logic, new visual treatment (yellow filter pills, Fraunces section titles, bordered action buttons, yellow response card)
- `components/Badges.tsx` — pill-style badges with thin colored borders (accepts any `Priority`/`Status`/`ItemType`)
- `components/ItemRow.tsx` — adds avatar next to "submitted by", monospace dates
- `components/Toast.tsx` — same hook signature, restyled with ink border + drop shadow

### Untouched
- `app/api/**` — all routes work as-is
- `lib/types.ts`, `lib/prisma.ts`
- `prisma/schema.prisma`
- `package.json` (no new dependencies — `next/font` ships with Next)

## Visual changes summary

- **Type**: Plus Jakarta Sans for UI, Fraunces for display headlines (`.display` class)
- **Color**: MetalBear purple `#756DF3` accent, yellow `#FFCB7D` for filter chips and the Lorena response card, blush `#F36869` for urgent priority
- **Borders + shadows**: 1.5–2px ink borders with hard-offset drop shadows (`0 2px 0 0 black`) on buttons, cards, modals, and inputs — no fuzzy soft shadows
- **Empty states**: bear emoji in a yellow circle replaces the "·" dot
- **Dark theme**: still wired through `html.dark` — toggle by adding/removing the class

## After applying

```bash
npm run dev
```

Both fonts load from Google Fonts on first build. No package changes required.

If anything looks off, the most likely culprits are:
1. **Tailwind v4 + `@import "tailwindcss"`** — your current `globals.css` uses this; the new file preserves it
2. **CSS variable name collisions** — I kept all the old variable names (`--accent`, `--bg-base`, `--text-primary`, etc.) so existing components Just Work
