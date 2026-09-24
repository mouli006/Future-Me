# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Future Me" — a static, single-page web app for writing letters to your future self. A message is sealed with a name, text, and an unlock date; it stays locked (with a live countdown and progress bar) until that date, then becomes readable in a modal.

No build system, no package manager, no dependencies, no tests. The entire app is three files:

- `index.html` — markup/structure only
- `style.css` — all styling, including light/dark theme via CSS custom properties on `:root` / `[data-theme="dark"]`
- `script.js` — all behavior, wrapped in a single IIFE

## Running the app

There is no dev server or build step. Open `index.html` directly in a browser (or use a simple static file server if `file://` origin restrictions cause issues with local storage/fonts).

## Repository

- Git remote `origin` is the public GitHub repo https://github.com/mouli006/Future-Me; work happens on `main`.
- `.claude/settings.local.json` is git-ignored (local Claude Code settings); don't commit it.
- The repo-local git identity is `mouli006 <mdharan006@gmail.com>`. The owner chose to keep this real email visible on commits — don't switch it to a noreply address.

## Architecture

**Persistence**: messages are stored client-side only, in `localStorage` under `futureMe.messages` (a JSON array of `{ id, name, message, unlockDate, createdAt }`). Theme preference is stored separately under `futureMe.theme`. There is no backend.

**Render model**: `script.js` keeps `messages` as an in-memory array (loaded once from localStorage) and calls `render()` to fully rebuild `#messagesGrid` from scratch whenever the message list changes (add/delete). Rebuilding is intentionally *not* done every second, though — see below.

**Live countdown without re-render**: a `setInterval` ticks every second and calls `updateLockedCards()`, which mutates the existing DOM nodes' countdown text and progress-bar width in place rather than rebuilding cards. This exists specifically to avoid retriggering each card's CSS entrance animation (`cardIn`), which previously caused a visible blink every second. When a message transitions from locked to unlocked, `render()` is called once for that transition and a toast is shown. Keep this distinction in mind when touching the timer logic — indiscriminately calling `render()` on every tick will reintroduce the blink bug.

**Locked vs. unlocked cards**: a message is "locked" if `getTimeParts(unlockDate)` returns a non-null diff (i.e., unlock date is in the future). Locked cards show a countdown + progress bar; unlocked cards show a preview snippet and open a reveal modal on click.

**Theming**: dark/light mode is applied by setting `data-theme` on `<html>`, which switches CSS custom property values. Initial theme comes from localStorage, falling back to `prefers-color-scheme`.
