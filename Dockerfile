FROM oven/bun:1 AS base

# --- Build stage ---
FROM base AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN bun prisma generate

COPY src ./src/
COPY tsconfig.json ./
RUN bun build --compile --minify-whitespace --minify-syntax --target bun --outfile server src/server.ts

# --- Production stage ---
FROM base AS production
WORKDIR /app

COPY --from=build /app/server ./server
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules/

ENV NODE_ENV=production
EXPOSE 8888

CMD ["sh", "-c", "bun prisma migrate deploy && ./server"]
