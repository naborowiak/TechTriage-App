-- Migration 0004: Case archive table for delete-with-recovery
-- Cases archived here are hard-deleted from live tables.
-- Archives are automatically purged after 7 days by scheduled job.

CREATE TABLE IF NOT EXISTS case_archives (
  id VARCHAR(255) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  case_number INTEGER,
  title VARCHAR(255) NOT NULL,
  snapshot JSONB,
  deleted_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP DEFAULT NOW(),
  purge_after TIMESTAMP NOT NULL
);

-- Index for daily purge job (find expired archives)
CREATE INDEX IF NOT EXISTS idx_case_archives_purge_after ON case_archives (purge_after);
-- Index for restore lookups by original case ID
CREATE INDEX IF NOT EXISTS idx_case_archives_case_id ON case_archives (case_id);
-- Index for listing archives by original case owner
CREATE INDEX IF NOT EXISTS idx_case_archives_user_id ON case_archives (user_id);
