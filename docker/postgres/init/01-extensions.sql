-- pg_trgm gives trigram-indexed ILIKE / similarity queries. The search API uses
-- contains/ILIKE patterns; this extension lets Postgres back them with a GIN index
-- if we ever add one.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- citext for case-insensitive emails / slugs (cheap, useful, no downside).
CREATE EXTENSION IF NOT EXISTS citext;
