CREATE TABLE IF NOT EXISTS parsed_lists_cache (
  url TEXT PRIMARY KEY,
  result TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);