# Source tree

The full source tree, excluding large checked-in map assets under `apps/web/public/map/**`.

```text
maptap/
|-- apps/
|   |-- server/
|   |   |-- package.json
|   |   `-- src/
|   |       |-- index.ts                # server composition root
|   |       |-- app.ts                  # Express app and /health route
|   |       |-- server.ts               # HTTP + Socket.IO server setup
|   |       |-- config/
|   |       |   `-- env.ts              # zod env parsing
|   |       `-- features/
|   |           `-- rooms/
|   |               |-- ids.ts          # room/player/token/id generation
|   |               |-- publisher.ts    # pushes host/player snapshots and room-closed events
|   |               |-- repository.ts   # in-memory rooms + player sessions + socket mapping
|   |               |-- service.ts      # multiplayer application service
|   |               |-- socket.ts       # socket event handlers and payload validation
|   |               `-- types.ts        # Socket.IO namespace/socket types
|   `-- web/
|       |-- package.json
|       |-- vite.config.ts
|       |-- index.html
|       |-- public/
|       |   |-- _headers
|       |   |-- _redirects
|       |   `-- map/                    # checked-in vector tiles, fonts, style.json, tiles.json
|       `-- src/
|           |-- app/
|           |   |-- main.tsx            # React root + BrowserRouter
|           |   |-- App.tsx             # top-level route map
|           |   |-- HomePage.tsx        # mode chooser
|           |   `-- globals.css
|           |-- shared/
|           |   |-- components/
|           |   |   `-- GameCard.tsx
|           |   |-- ui/
|           |   |   |-- AlertMessage.tsx
|           |   |   |-- FormControls.tsx
|           |   |   |-- ScreenShell.tsx
|           |   |   |-- SurfacePanel.tsx
|           |   |   |-- Button.tsx
|           |   |   |-- CopyButton.tsx
|           |   |   |-- IconButton.tsx
|           |   |   |-- buttonStyles.ts
|           |   |   `-- index.ts
|           |   |-- widgets/
|           |   |   |-- CountryInfoCard.tsx
|           |   |   |-- GameCard.tsx
|           |   |   `-- ScoreBanner.tsx
|           |   |-- utils/
|           |   |   |-- cn.ts
|           |   |   `-- index.ts
|           |   `-- map/
|           |       |-- MapRenderer.tsx # MapLibre wrapper used by game UIs
|           |       |-- continent-view.ts
|           |       |-- map-styles.tsx
|           |       `-- types.ts
|           |-- singleplayer-game/
|           |   |-- index.ts
|           |   |-- core/
|           |   |   |-- config.ts         # URL <-> singleplayer config conversion
|           |   |   `-- useGameSession.ts # local game orchestration hook
|           |   |-- screens/
|           |   |   |-- SetupPage.tsx
|           |   |   |-- GamePage.tsx
|           |   |   |-- GameScreen.tsx
|           |   |   `-- InvalidConfigScreen.tsx
|           |   `-- components/
|           |       |-- GameHeader.tsx
|           |       |-- GameResultModal.tsx
|           |       |-- Hearts.tsx
|           |       `-- QuestionTimer.tsx
|           `-- multiplayer-game/
|               |-- index.ts
|               |-- api/
|               |   |-- errors.ts
|               |   `-- socketGateway.ts      # typed Socket.IO client boundary
|               |-- session/
|               |   |-- types.ts
|               |   |-- sessionStorage.ts     # localStorage persistence for host/player sessions
|               |   |-- useActionStatus.ts
|               |   |-- useRoomRuntime.ts
|               |   |-- useRoomHostController.ts
|               |   |-- useRoomPlayerController.ts
|               |-- model/
|               |   |-- gameConfig.ts
|               |   |-- gameSelectors.ts
|               |   `-- roomSelectors.ts
|               |-- create/
|               |   `-- CreateRoomForm.tsx
|               |-- join/
|               |   |-- JoinRoomForm.tsx
|               |   `-- PlayerJoinScreen.tsx
|               |-- lobby/
|               |   |-- GameCOnfigPanel.tsx
|               |   `-- RoomLobbyScreen.tsx
|               |-- game/
|               |   |-- ActiveGameScreen.tsx
|               |   |-- hooks/
|               |   |   |-- useCountdown.ts
|               |   |   `-- useTimestampGate.ts
|               |   `-- country-map/
|               |       |-- CountryMapGameScreen.tsx
|               |       |-- GameQuestionBar.tsx
|               |       |-- LeaderboardOverlay.tsx
|               |       |-- SelectedAnswerMarker.tsx
|               |       `-- useGameMap.tsx
|               |-- finished/
|               |   |-- ResultsList.tsx
|               |   `-- RoomFinishedScreen.tsx
|               |-- pages/
|               |   |-- HomePage.tsx
|               |   |-- RoomHostPage.tsx
|               |   `-- RoomPlayerPage.tsx
|               `-- screens/
|                   |-- RoomClosedScreen.tsx
|                   |-- RoomErrorScreen.tsx
|                   `-- RoomLoadingScreen.tsx
|-- packages/
|   |-- game-domain/
|   |   `-- src/
|   |       |-- index.ts
|   |       |-- shared/                  # base types, result, errors, random, time
|   |       |-- catalog/                 # country eligibility selectors
|   |       |-- singleplayer/            # local state machine
|   |       `-- multiplayer/             # room state machine and visibility transforms
|   |-- game-protocol/
|   |   `-- src/
|   |       |-- ack.ts
|   |       |-- errors.ts
|   |       |-- events.ts                # socket namespace + event contracts
|   |       |-- requests.ts              # zod request schemas
|   |       |-- responses.ts             # response/event types
|   |       `-- index.ts
|   |-- country-catalog/
|   |   |-- generated/
|   |   |   |-- countries.registry.json
|   |   |   `-- countries.playable.json
|   |   `-- src/
|   |       |-- index.ts                 # builds in-memory catalog + country pool
|   |       `-- types.ts
|   |-- country-build/
|   |   |-- data/
|   |   |   |-- playable_states_195.json
|   |   |   `-- manual_overrides.json
|   |   |-- upstream/                    # source zip/mbtiles inputs
|   |   |-- tools/                       # bundled tippecanoe/tile-join binaries
|   |   `-- scripts/
|   |       |-- 01_get_fallback_sources.sh
|   |       |-- 02_prepare_base.sh
|   |       |-- 02b_dump_base_country_tiles.sh
|   |       |-- 02c_merge_base_countries.mjs
|   |       |-- 03_build_data.mjs
|   |       |-- 04_build_tiles.sh
|   |       |-- 05_make_tilesjson.mjs
|   |       |-- 06_build_registry.mjs
|   |       |-- 06_build_registry.sh
|   |       `-- lib/
|   |           |-- continent.mjs
|   |           |-- output-paths.mjs
|   |           `-- wdqs.mjs
|   `-- map-assets/                      # generated map tiles, written by country-build
|-- README.md
|-- package.json
|-- tsconfig.base.json
`-- tsconfig.json
```
