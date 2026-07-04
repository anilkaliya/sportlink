# syntax=docker/dockerfile:1

# ---- Base image -------------------------------------------------------------
# Pin Bun to match the version used in development (bun --version => 1.3.13).
FROM oven/bun:1.3.13-slim AS base
WORKDIR /app

# ---- Dependencies -----------------------------------------------------------
# Install into a cached layer so source changes don't re-run bun install.
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- Runtime ----------------------------------------------------------------
FROM base AS runtime

ENV NODE_ENV=production \
    # SQLite lives on a mounted volume so it survives redeploys.
    DB_PATH=/app/data/sportlink.db

# Non-root user "bun" is provided by the oven/bun image.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src

# Directories that are backed by volumes at runtime. Pre-create + chown so the
# non-root process can write to them even before the volume is populated.
RUN mkdir -p /app/data /app/uploads/photos \
    && chown -R bun:bun /app/data /app/uploads

USER bun

EXPOSE 3000

# Bun's TS runner executes the entrypoint directly — migrations run on boot.
CMD ["bun", "run", "src/index.ts"]
