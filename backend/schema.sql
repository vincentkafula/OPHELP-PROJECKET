-- OPHELP backend schema.
--
-- Every entity (users, participants, shifts, cards, ...) is stored as a
-- JSONB document under its entity name. This mirrors the shape the
-- frontend already used with its localStorage Collection<T> layer, so the
-- API surface can stay a thin, mostly-generic CRUD layer instead of one
-- hand-written table per entity.
--
-- Frequently-filtered fields (email for login, entity for listing) are
-- indexed directly off the JSONB column.

CREATE TABLE IF NOT EXISTS store (
  entity     VARCHAR(64) NOT NULL,
  id         VARCHAR(64) NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity, id)
);

CREATE INDEX IF NOT EXISTS idx_store_entity ON store (entity);
CREATE INDEX IF NOT EXISTS idx_store_users_email
  ON store ((data ->> 'email'))
  WHERE entity = 'users';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_updated_at ON store;
CREATE TRIGGER trg_store_updated_at
  BEFORE UPDATE ON store
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
