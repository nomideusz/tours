-- Create feature_feedback table for beta testing system
CREATE TABLE IF NOT EXISTS feature_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  feature_id VARCHAR(100) NOT NULL,
  feature_version VARCHAR(50) NOT NULL,
  rating VARCHAR(20) NOT NULL CHECK (rating IN ('like', 'dislike')),
  comment TEXT,
  improvements TEXT[], -- Array of improvement suggestions
  would_use BOOLEAN DEFAULT false,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Additional fields for analysis
  session_id TEXT, -- For grouping feedback in same session
  comparison_group VARCHAR(50) -- For A/B testing
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature 
  ON feature_feedback(feature_id, feature_version);

CREATE INDEX IF NOT EXISTS idx_feature_feedback_user 
  ON feature_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_feature_feedback_created 
  ON feature_feedback(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE feature_feedback IS 'Stores feedback from beta testers on feature previews';
COMMENT ON COLUMN feature_feedback.feature_id IS 'Identifier for the feature being tested (e.g., pricing-section)';
COMMENT ON COLUMN feature_feedback.feature_version IS 'Version or configuration being tested (e.g., simple, advanced)';
COMMENT ON COLUMN feature_feedback.improvements IS 'Array of suggested improvements from predefined options';
COMMENT ON COLUMN feature_feedback.would_use IS 'Whether the user would use this feature in their tours';

-- Example query to get aggregated feedback
/*
SELECT 
  feature_version,
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN rating = 'like' THEN 1 END) as likes,
  COUNT(CASE WHEN rating = 'dislike' THEN 1 END) as dislikes,
  ROUND(AVG(CASE WHEN would_use THEN 1 ELSE 0 END) * 100, 1) as would_use_percent
FROM feature_feedback
WHERE feature_id = 'pricing-section'
GROUP BY feature_version
ORDER BY likes DESC;
*/
