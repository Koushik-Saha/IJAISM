# syntax=docker/dockerfile:1.7

# ---------- Stage 1: deps ----------
# Install all dependencies (including devDeps; needed for prisma generate + next build).
FROM node:20-alpine AS deps
WORKDIR /app

# Alpine needs libc6-compat for some native modules (prisma, sharp, bcrypt, pdf-parse).
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
# Prisma schema must be present *before* `npm ci` because the postinstall hook runs `prisma generate`.
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund

# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Build-time args (Sentry source-map upload). Optional: build succeeds without them.
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN
# DATABASE_URL must point at a reachable Postgres during `next build` because
# several pages call Prisma during static prerender. In CI this is the
# `postgres` service container. Locally pass --build-arg DATABASE_URL=... .
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    DATABASE_URL=$DATABASE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true \
    # Next.js page-data collection imports every API route, which evaluates
    # module-level env checks (auth.ts requires JWT_SECRET, Stripe needs a key,
    # etc.). These placeholders satisfy those checks at build time only; real
    # values are injected at runtime via docker-compose env_file.
    JWT_SECRET=build-time-placeholder \
    NEXTAUTH_SECRET=build-time-placeholder \
    NEXTAUTH_URL=http://localhost:3000 \
    NEXT_PUBLIC_APP_URL=http://localhost:3000 \
    STRIPE_SECRET_KEY=sk_test_build_placeholder \
    STRIPE_WEBHOOK_SECRET=whsec_build_placeholder \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_build_placeholder \
    STRIPE_PRICE_BASIC=price_build_placeholder \
    STRIPE_PRICE_PREMIUM=price_build_placeholder \
    STRIPE_PRICE_INSTITUTIONAL=price_build_placeholder \
    PAYPAL_CLIENT_ID=build_placeholder \
    PAYPAL_CLIENT_SECRET=build_placeholder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma generate` first so the Next.js build can import the generated client.
RUN npx prisma generate
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl curl tini \
    && addgroup -S -g 1001 nodejs \
    && adduser  -S -u 1001 -G nodejs nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone output bundles only the deps the app actually imports.
# This is what keeps the final image small.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Prisma needs its query engine binary and the schema at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma               ./prisma

# Node CLIs we may need at startup (prisma db push) — copy just the prisma binary, not the whole devDep tree.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma  ./node_modules/prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

# tini reaps zombies and forwards SIGTERM cleanly to node.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
