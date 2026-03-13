-- Screen Share Tokens: single-use, time-limited tokens for agent-initiated remote screen share sessions
CREATE TABLE IF NOT EXISTS screen_share_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screen_share_tokens_token ON screen_share_tokens (token);
CREATE INDEX IF NOT EXISTS idx_screen_share_tokens_case_id ON screen_share_tokens (case_id);
