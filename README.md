# MapTap Game

MapTap is a small educational geography game built with React + TypeScript + Tailwind CSS.

## Project Guide

For a current repo-wide architecture map, see [docs/project-architecture.md](docs/project-architecture.md).

## Features

- Home screen with:
  - Question count selector (5/10/15/20)
  - Map mode selector (`2D Map`, optional `3D Globe (Beta)`)
  - Start button
- Game screen with:
  - Target country name + flag
  - Per-question timer
  - Give up / Skip action
  - 3-attempt hearts UI
  - Wrong-attempt country names
- Reveal flow:
  - Auto-reveal after 3 misses
  - Pinned country info card (flag, name, capital, currency)
  - Next Question button after reveal
- End modal with total score, correct count, Try again, and Home actions
- Multiplayer quiz mode with:
  - Multiple-choice packs for Uzbekistan geography and Tashkent city
  - Russian, English, and Uzbek Latin question/answer text
  - Officially validated facts for cities, regions, landmarks, rivers,
    transport, institutions, and venues

  Quiz mode sources:
  - Uzbekistan territory, borders, and geography: [gov.uz](https://gov.uz/en/pages/territory)
  - Capital and administrative information: [my.gov.uz](https://my.gov.uz/uz/for-foreigners)
  - Uzbekistan landmarks and tourism facts: [uzbekistan.travel](https://uzbekistan.travel/)
  - Tashkent landmarks: [visit.tashkent.uz](https://visit.tashkent.uz/)
  - Tashkent official place-name catalogue:
    [api.tashkent.uz PDF](https://api.tashkent.uz/upload/storage/2026/01/%D0%96%D0%BE%D0%B9_%D0%BD%D0%BE%D0%BC%D0%BB%D0%B0%D1%80%D0%B8_%D0%9B%D0%BE%D1%82%D0%B8%D0%BD.pdf)
  - Administrative and institutional confirmations:
    [president.uz](https://president.uz/), [gov.uz regional pages](https://gov.uz/),
    and official operator/institution sites for WIUT, UWED, NUU, TUIT,
    Tashkent International Airport, Humo Arena, Magic City, Uzbekistan Railways,
    and NMMC

## Architecture

The app is split into two layers:

1. **Pure engine layer**
   - `src/core/engine.ts`
   - Renderer-agnostic state machine and deterministic scoring
2. **Pluggable renderer layer**
   - `src/renderers/SvgMapRenderer.tsx` (required, `react-simple-maps`)
   - `src/renderers/MapboxGlobeRenderer.tsx` (optional, `mapbox-gl`)

Game logic is shared regardless of renderer choice.

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite`
- Utility-first classes in UI and renderer components
- Minimal global base in `src/app/global.css`

## Data Sources

- Map shapes: `world-atlas/countries-110m`
- Country facts: REST Countries API  
  `https://restcountries.com/v3.1/all?fields=name,capital,currencies,flags,ccn3`

The game uses the intersection of map feature IDs and REST Countries `ccn3` codes.

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Enable 3D Globe (Mapbox)

Add a `.env` file in the project root:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

Without this token, the app only shows the 2D SVG map option.

## Known Limitations

- The app depends on REST Countries availability/network access at runtime.
- Globe mode requires WebGL support and a valid Mapbox token.
- SVG pinned card uses `foreignObject`; a basic fallback label is shown where unsupported.
