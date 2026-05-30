# Pinned to a minor for reproducibility. Alpine variant is multi-arch (amd64 + arm64).
FROM postgres:16.4-alpine

# Custom postgresql.conf overrides via include directive — keeps the image stock
# and lets us version-control the tuning separately.
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Anything in /docker-entrypoint-initdb.d runs once, on first cluster init.
COPY init/ /docker-entrypoint-initdb.d/

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
