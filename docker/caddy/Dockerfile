# Stock Caddy doesn't ship the Cloudflare DNS module. We build a custom binary
# with xcaddy that includes only what we need.
FROM caddy:2.8-builder-alpine AS builder

RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:2.8-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
