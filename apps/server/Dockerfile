FROM node:24-alpine AS deps
# Enable Corepack to manage pnpm natively
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/game-domain/package.json ./packages/game-domain/package.json
COPY packages/game-protocol/package.json ./packages/game-protocol/package.json
COPY packages/country-catalog/package.json ./packages/country-catalog/package.json
RUN pnpm ci

FROM deps AS build
COPY apps/server ./apps/server
COPY packages/game-domain ./packages/game-domain
COPY packages/game-protocol ./packages/game-protocol
COPY packages/country-catalog ./packages/country-catalog

RUN pnpm --filter @georally/server check
RUN pnpm build

# Extract & isolate apps/server into /prod/server (Prunes devDependencies automatically)
RUN pnpm --filter=@georally/server deploy --prod --legacy /prod/server

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup -S georally && adduser -S georally -G georally

COPY --from=build --chown=georally:georally /prod/server .

USER georally

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
