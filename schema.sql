CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY DEFAULT 1,
  places TEXT NOT NULL DEFAULT '[]',
  stops TEXT NOT NULL DEFAULT '{}',
  stop_count INTEGER NOT NULL DEFAULT 10,
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO session (id, places, stops, stop_count) VALUES (1, '[]', '{}', 10);

CREATE TABLE IF NOT EXISTS saved_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  places TEXT NOT NULL,
  place_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parsed_lists_cache (
  url TEXT PRIMARY KEY,
  result TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
