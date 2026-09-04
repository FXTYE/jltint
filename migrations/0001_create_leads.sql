-- Quote request leads table.
-- Applied to the live database already via MCP during setup; kept here so
-- `wrangler d1 migrations apply jltint-leads` reproduces it (fresh clones,
-- local dev, CI, or a second environment).

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  services TEXT,
  project_notes TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  vehicle_colour TEXT,
  package_pref TEXT,
  timeframe TEXT,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  suburb TEXT,
  contact_method TEXT,
  extra_notes TEXT,
  photo_count INTEGER NOT NULL DEFAULT 0,
  photo_meta TEXT,
  photo_keys TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
