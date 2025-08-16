-- Beta Feedback Database Schema
-- Run this SQL to set up feedback collection tables

-- 1. Feedback submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- bug, feature, general, praise
  category VARCHAR(100), -- tours, bookings, payments, qr_codes, etc.
  description TEXT NOT NULL,
  urgency INTEGER CHECK (urgency >= 1 AND urgency <= 5),
  screenshot_url TEXT,
  browser_info TEXT,
  page_url TEXT,
  status VARCHAR(50) DEFAULT 'new', -- new, acknowledged, in_progress, resolved, wont_fix
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- Indexes for feedback
CREATE INDEX idx_feedback_user_id ON feedback_submissions(user_id);
CREATE INDEX idx_feedback_status ON feedback_submissions(status);
CREATE INDEX idx_feedback_type ON feedback_submissions(type);
CREATE INDEX idx_feedback_created_at ON feedback_submissions(created_at DESC);

-- 2. Pulse survey responses
CREATE TABLE IF NOT EXISTS pulse_surveys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
  improvement_suggestion TEXT,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for surveys
CREATE INDEX idx_pulse_user_id ON pulse_surveys(user_id);
CREATE INDEX idx_pulse_week_year ON pulse_surveys(year, week_number);
CREATE INDEX idx_pulse_created_at ON pulse_surveys(created_at DESC);

-- 3. Feature usage events (for analytics)
CREATE TABLE IF NOT EXISTS feature_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  feature_name VARCHAR(100) NOT NULL, -- tour_creation, booking_management, qr_generation, etc.
  action VARCHAR(100) NOT NULL, -- created, updated, deleted, viewed, exported, etc.
  metadata JSONB, -- Additional context about the action
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feature usage
CREATE INDEX idx_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_usage_feature ON feature_usage(feature_name);
CREATE INDEX idx_usage_action ON feature_usage(action);
CREATE INDEX idx_usage_created_at ON feature_usage(created_at DESC);
CREATE INDEX idx_usage_session ON feature_usage(session_id);

-- 4. Beta user interviews
CREATE TABLE IF NOT EXISTS beta_interviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  interviewer TEXT,
  notes TEXT,
  recording_url TEXT,
  key_insights TEXT[],
  action_items TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Beta rewards tracking
CREATE TABLE IF NOT EXISTS beta_rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  reward_type VARCHAR(50) NOT NULL, -- bug_report, feature_suggestion, survey_completion, interview, etc.
  reward_value TEXT NOT NULL, -- "1 month free", "3 months free", etc.
  reason TEXT,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rewards
CREATE INDEX idx_rewards_user_id ON beta_rewards(user_id);
CREATE INDEX idx_rewards_type ON beta_rewards(reward_type);

-- 6. Feedback votes (for community voting on features)
CREATE TABLE IF NOT EXISTS feedback_votes (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback_submissions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  vote_type VARCHAR(20) NOT NULL, -- upvote, downvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_id) -- One vote per user per feedback
);

-- Indexes for votes
CREATE INDEX idx_votes_feedback ON feedback_votes(feedback_id);
CREATE INDEX idx_votes_user ON feedback_votes(user_id);

-- View for feedback with vote counts
CREATE OR REPLACE VIEW feedback_with_votes AS
SELECT 
  f.*,
  u.name as user_name,
  u.email as user_email,
  COALESCE(upvotes.count, 0) as upvote_count,
  COALESCE(downvotes.count, 0) as downvote_count,
  COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0) as net_votes
FROM feedback_submissions f
JOIN users u ON f.user_id = u.id
LEFT JOIN (
  SELECT feedback_id, COUNT(*) as count 
  FROM feedback_votes 
  WHERE vote_type = 'upvote' 
  GROUP BY feedback_id
) upvotes ON f.id = upvotes.feedback_id
LEFT JOIN (
  SELECT feedback_id, COUNT(*) as count 
  FROM feedback_votes 
  WHERE vote_type = 'downvote' 
  GROUP BY feedback_id
) downvotes ON f.id = downvotes.feedback_id;

-- View for weekly pulse survey averages
CREATE OR REPLACE VIEW weekly_pulse_averages AS
SELECT 
  year,
  week_number,
  COUNT(DISTINCT user_id) as respondents,
  AVG(satisfaction_score) as avg_satisfaction,
  AVG(nps_score) as avg_nps,
  COUNT(*) as total_responses
FROM pulse_surveys
GROUP BY year, week_number
ORDER BY year DESC, week_number DESC;

-- View for user engagement metrics
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT f.id) as feedback_count,
  COUNT(DISTINCT p.id) as survey_count,
  COUNT(DISTINCT i.id) as interview_count,
  COUNT(DISTINCT r.id) as reward_count,
  MAX(f.created_at) as last_feedback,
  MAX(p.created_at) as last_survey
FROM users u
LEFT JOIN feedback_submissions f ON u.id = f.user_id
LEFT JOIN pulse_surveys p ON u.id = p.user_id
LEFT JOIN beta_interviews i ON u.id = i.user_id
LEFT JOIN beta_rewards r ON u.id = r.user_id
WHERE u.created_at >= NOW() - INTERVAL '90 days' -- Beta users from last 90 days
GROUP BY u.id, u.name, u.email;

-- Sample data for testing (optional)
-- INSERT INTO feedback_submissions (id, user_id, type, description, urgency, status) VALUES
-- ('test1', 'USER_ID_HERE', 'bug', 'QR code not generating on mobile', 5, 'new'),
-- ('test2', 'USER_ID_HERE', 'feature', 'Would love to see group booking discounts', 3, 'new'),
-- ('test3', 'USER_ID_HERE', 'praise', 'The new dashboard is amazing!', 1, 'new');
