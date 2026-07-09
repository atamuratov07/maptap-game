# Source tree

The full source tree, excluding `node_modules` and the large checked-in vector tile/font tree under `apps/web/public/map/**` (style.json, `tiles/**`, `fonts/**`).

```text
maptap/
|-- apps/
|   |-- server/
|   |   |-- package.json
|   |   `-- src/
|   |       |-- index.ts                # server composition root and shutdown
|   |       |-- app.ts                  # Express app and /health route
|   |       |-- server.ts               # HTTP + Socket.IO /game namespace
|   |       |-- config/
|   |       |   `-- env.ts              # zod env parsing (PORT, HOST, CORS_ORIGIN, timers)
|   |       `-- features/
|   |           `-- rooms/
|   |               |-- ids.ts          # room/member/session/game id generation
|   |               |-- publisher.ts    # emits host/player snapshots and close events
|   |               |-- repository.ts   # in-memory room/session/timer storage
|   |               |-- service.ts      # multiplayer application service
|   |               |-- socket.ts       # Socket.IO handlers and validation
|   |               `-- types.ts        # typed Socket.IO namespace/socket data
|   `-- web/
|       |-- package.json
|       |-- vite.config.ts              # React + Tailwind plugins, pbf content-type/headers
|       |-- public/
|       |   |-- _headers
|       |   |-- _redirects
|       |   `-- map/                    # style.json, checked-in vector tiles, glyph PBFs
|       `-- src/
|           |-- app/
|           |   |-- main.tsx            # React root + BrowserRouter
|           |   |-- App.tsx             # route map
|           |   |-- HomePage.tsx        # mode chooser
|           |   `-- globals.css
|           |-- shared/
|           |   |-- i18n/               # react-i18next setup, locales, language switcher
|           |   |-- map/                # MapRenderer and MapLibre styles
|           |   |-- ui/                 # buttons, panels, form controls
|           |   |-- utils/              # small utilities such as cn()
|           |   `-- widgets/            # CountryInfoCard, GameCard, ScoreBanner
|           |-- singleplayer-game/
|           |   |-- index.ts
|           |   |-- core/
|           |   |   |-- config.ts          # URL <-> singleplayer config conversion
|           |   |   `-- useGameSession.ts  # local game orchestration hook
|           |   |-- screens/
|           |   |   |-- SetupPage.tsx
|           |   |   |-- GamePage.tsx
|           |   |   |-- GameScreen.tsx
|           |   |   `-- InvalidConfigScreen.tsx
|           |   `-- components/
|           |       |-- GameHeader.tsx
|           |       |-- GameResultModal.tsx
|           |       |-- Hearts.tsx         # attempts-remaining indicator
|           |       `-- QuestionTimer.tsx
|           `-- multiplayer-game/
|               |-- index.ts
|               |-- api/
|               |   |-- socketGateway.ts   # typed Socket.IO client boundary
|               |   `-- errors.ts          # gateway error mapping
|               |-- create/
|               |   `-- CreateRoomForm.tsx
|               |-- join/
|               |   |-- JoinRoomForm.tsx
|               |   `-- PlayerJoinScreen.tsx
|               |-- lobby/
|               |   |-- RoomLobbyScreen.tsx
|               |   `-- GameConfigPanel.tsx
|               |-- game/
|               |   |-- ActiveGameScreen.tsx
|               |   |-- country-map/       # map-click multiplayer game UI
|               |   |   |-- CountryMapGameScreen.tsx
|               |   |   |-- GameQuestionBar.tsx
|               |   |   |-- LeaderboardOverlay.tsx
|               |   |   |-- SelectedAnswerMarker.tsx
|               |   |   `-- useGameMap.tsx
|               |   |-- quiz/
|               |   |   `-- QuizGameScreen.tsx   # multiple-choice quiz UI
|               |   `-- hooks/
|               |       |-- useCountdown.ts
|               |       `-- useTimestampGate.ts
|               |-- finished/
|               |   |-- RoomFinishedScreen.tsx
|               |   `-- ResultsList.tsx
|               |-- model/
|               |   |-- gameConfig.ts      # persisted host game config helpers
|               |   |-- gameSelectors.ts
|               |   `-- roomSelectors.ts
|               |-- pages/
|               |   |-- HomePage.tsx
|               |   |-- RoomHostPage.tsx
|               |   `-- RoomPlayerPage.tsx
|               |-- screens/
|               |   |-- RoomClosedScreen.tsx
|               |   |-- RoomErrorScreen.tsx
|               |   `-- RoomLoadingScreen.tsx
|               `-- session/
|                   |-- sessionStorage.ts          # localStorage persistence for host/player sessions
|                   |-- types.ts
|                   |-- useActionStatus.ts
|                   |-- useRoomHostController.ts
|                   |-- useRoomPlayerController.ts
|                   `-- useRoomRuntime.ts          # connection status + reconnect orchestration
|-- packages/
|   |-- game-domain/
|   |   `-- src/
|   |       |-- shared/                 # base types, result, random, time, errors
|   |       |-- catalog/                # country eligibility selectors
|   |       |-- singleplayer/           # local singleplayer state machine
|   |       |-- multiplayer/            # legacy multiplayer domain (not used by the server)
|   |       `-- multiplayer-next/       # active room/game domain used by the server
|   |           |-- orchestration.ts    # room + active-game command glue
|   |           |-- errors.ts
|   |           |-- room/               # room membership, phases, visibility
|   |           `-- game/               # game session, scoring, transitions, quiz content
|   |               `-- quiz/content/
|   |                   |-- uzbekistan-geography.ts
|   |                   `-- tashkent-city.ts
|   |-- game-protocol/
|   |   `-- src/
|   |       |-- ack.ts
|   |       |-- errors.ts
|   |       |-- events.ts               # Socket.IO event contract
|   |       |-- requests.ts             # zod request schemas
|   |       |-- responses.ts            # response and push-event types
|   |       `-- index.ts
|   |-- country-catalog/
|   |   |-- generated/
|   |   |   |-- countries.registry.json
|   |   |   `-- countries.playable.json
|   |   `-- src/
|   |       |-- index.ts                # in-memory catalog + country pool
|   |       `-- types.ts
|   |-- country-build/
|   |   |-- data/                       # curated playable states and manual overrides
|   |   |-- upstream/                   # source zips and mbtiles
|   |   |-- tools/                      # bundled tippecanoe/tile-join binaries
|   |   `-- scripts/
|   |       |-- 01_get_fallback_sources.sh
|   |       |-- 02_prepare_base.sh
|   |       |-- 02b_dump_base_country_tiles.sh
|   |       |-- 02c_merge_base_countries.mjs
|   |       |-- 03_build_data.mjs
|   |       |-- 04_build_tiles.sh          # also invokes 05_make_tilesjson.mjs internally
|   |       |-- 05_make_tilesjson.mjs
|   |       |-- 06_build_registry.mjs
|   |       |-- 06_build_registry.sh
|   |       |-- 07_backfill_uz_latn_catalog.mjs
|   |       `-- lib/
|   |           |-- continent.mjs
|   |           |-- output-paths.mjs
|   |           |-- uz-latn.mjs
|   |           `-- wdqs.mjs
|   `-- map-assets/                     # package.json only; dist/ (generated tiles) is gitignored
|-- docs/
|   `-- project-architecture.md         # the canonical, in-repo architecture doc
|-- package.json
|-- tsconfig.base.json
`-- tsconfig.json
```

See [`README.md`](README.md) for how these packages depend on each other.
