# MapTap Game

MapTap is a small educational geography game built with React + TypeScript.

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

## Architecture

The app is split into two layers:

1. **Pure engine layer**
   - `src/core/engine.ts`
   - Renderer-agnostic state machine and deterministic scoring
2. **Pluggable renderer layer**
   - `src/renderers/SvgMapRenderer.tsx` (required, `react-simple-maps`)
   - `src/renderers/MapboxGlobeRenderer.tsx` (optional, `mapbox-gl`)

Game logic is shared regardless of renderer choice.

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
