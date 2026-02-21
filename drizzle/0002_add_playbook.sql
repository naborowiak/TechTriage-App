-- Add playbook_processed column to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS playbook_processed BOOLEAN;

-- Create playbook_branches table for recursive learning decision tree
CREATE TABLE IF NOT EXISTS playbook_branches (
  id VARCHAR(255) PRIMARY KEY,
  path_key JSONB NOT NULL,
  path_hash VARCHAR(64) NOT NULL UNIQUE,
  category VARCHAR(255) NOT NULL,
  choice_counts JSONB DEFAULT '{}',
  something_else_count INTEGER DEFAULT 0,
  freeform_counts JSONB DEFAULT '{}',
  total_hits INTEGER DEFAULT 0,
  resolved_count INTEGER DEFAULT 0,
  promoted_choices JSONB DEFAULT '[]',
  depth INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_playbook_branches_path_hash ON playbook_branches (path_hash);
CREATE INDEX IF NOT EXISTS idx_playbook_branches_category ON playbook_branches (category);
CREATE INDEX IF NOT EXISTS idx_playbook_branches_depth ON playbook_branches (depth);
