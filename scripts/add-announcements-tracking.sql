-- Add announcements_sent table for tracking sent announcements
-- This helps prevent duplicate sends and allows partial batch sending

CREATE TABLE IF NOT EXISTS announcements_sent (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  sent_by TEXT NOT NULL REFERENCES users(id),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  message_id TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  error TEXT
);

-- Index for quick lookups by user and subject
CREATE INDEX IF NOT EXISTS idx_announcements_sent_user_subject 
  ON announcements_sent(user_id, subject);

-- Index for filtering by sent_at
CREATE INDEX IF NOT EXISTS idx_announcements_sent_sent_at 
  ON announcements_sent(sent_at DESC);

-- Index for admin tracking
CREATE INDEX IF NOT EXISTS idx_announcements_sent_by 
  ON announcements_sent(sent_by);

