-- D1 schema for Cloud Save + full-online backend
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  pass_algo TEXT NOT NULL DEFAULT 'legacy-sha256',
  pass_iters INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saves (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS mailbox_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  read_at INTEGER,
  claimed_at INTEGER,
  source TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mailbox_user_created ON mailbox_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mailbox_user_claimed ON mailbox_messages(user_id, claimed_at);

CREATE TABLE IF NOT EXISTS active_battles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_active_battles_updated ON active_battles(updated_at DESC);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope_key TEXT NOT NULL,
  hit_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_scope_time ON api_rate_limits(scope_key, hit_at);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idem_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, idem_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_type_time ON security_events(event_type, created_at DESC);
