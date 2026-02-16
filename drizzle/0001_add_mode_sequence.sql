-- Add mode_sequence column to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mode_sequence INTEGER;

-- Backfill: assign sequential mode_sequence per user+sessionMode by created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, session_mode
    ORDER BY created_at ASC
  ) AS seq
  FROM cases
  WHERE mode_sequence IS NULL
)
UPDATE cases
SET mode_sequence = numbered.seq
FROM numbered
WHERE cases.id = numbered.id;
