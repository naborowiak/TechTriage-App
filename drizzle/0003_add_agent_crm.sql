-- Migration 0003: Agent CRM schema additions
-- Adds role-based access, case priority/assignment, internal notes, and audit trail

-- Add role column to users table (ServiceNow sys_user pattern: one table for all user types)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';

-- Add agent-related columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS assigned_agent_id VARCHAR(255) REFERENCES users(id);

-- Create case_notes table (internal agent notes, never visible to customers)
CREATE TABLE IF NOT EXISTS case_notes (
  id VARCHAR(255) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
  author_id VARCHAR(255) NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create case_activity table (immutable audit trail)
CREATE TABLE IF NOT EXISTS case_activity (
  id VARCHAR(255) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
  actor_id VARCHAR(255) NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Essential indexes for agent portal queries
CREATE INDEX IF NOT EXISTS idx_cases_assigned_agent ON cases (assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_cases_status_priority ON cases (status, priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes (case_id);
CREATE INDEX IF NOT EXISTS idx_case_activity_case_id ON case_activity (case_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
