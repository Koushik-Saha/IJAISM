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

# --- Sentry source-map upload (optional; build succeeds without them) ---
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

# --- DATABASE_URL: required during `next build` because several pages call
# Prisma during static prerender. In CI this is the `postgres` service
# container. Locally pass --build-arg DATABASE_URL=... .
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

# --- NEXT_PUBLIC_* : these are INLINED into the client bundle at build time,
# so they MUST be real values here (passed as --build-arg from CI). They are
# not secret — they ship to the browser regardless. Defaults are safe fallbacks.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME=IJAISM
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_build_placeholder
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID=
ARG NEXT_PUBLIC_PAYPAL_PLAN_BASIC=
ARG NEXT_PUBLIC_PAYPAL_PLAN_PREMIUM=
ARG NEXT_PUBLIC_PAYPAL_PLAN_INSTITUTIONAL=
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_MOCK_PAYMENT=false

ENV SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    DATABASE_URL=$DATABASE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true \
    # Client-side vars baked into the bundle (from build args above):
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID \
    NEXT_PUBLIC_PAYPAL_PLAN_BASIC=$NEXT_PUBLIC_PAYPAL_PLAN_BASIC \
    NEXT_PUBLIC_PAYPAL_PLAN_PREMIUM=$NEXT_PUBLIC_PAYPAL_PLAN_PREMIUM \
    NEXT_PUBLIC_PAYPAL_PLAN_INSTITUTIONAL=$NEXT_PUBLIC_PAYPAL_PLAN_INSTITUTIONAL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_MOCK_PAYMENT=$NEXT_PUBLIC_MOCK_PAYMENT \
    # Server-side placeholders: Next.js page-data collection imports every API
    # route, which evaluates module-level env checks (auth needs JWT_SECRET,
    # Stripe needs a key, etc.). These satisfy those checks at build time only;
    # real values are injected at runtime from /opt/ijaism/.env on the VM.
    JWT_SECRET=build-time-placeholder \
    NEXTAUTH_SECRET=build-time-placeholder \
    NEXTAUTH_URL=http://localhost:3000 \
    STRIPE_SECRET_KEY=sk_test_build_placeholder \
    STRIPE_WEBHOOK_SECRET=whsec_build_placeholder \
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
