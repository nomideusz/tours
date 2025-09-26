-- Feedback System Migration
-- Run this SQL to create the feedback_submissions table

-- Create feedback_submissions table
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users.id
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
    resolved_by TEXT -- References users.id
);

-- Create indexes for feedback_submissions
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback_submissions(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_submissions(created_at DESC);

-- Add table comment
COMMENT ON TABLE feedback_submissions IS 'User feedback submissions including bugs, features, and general feedback';

-- Sample data for testing (optional - remove if not needed)
-- INSERT INTO feedback_submissions (id, user_id, type, description, urgency, page_url, status)
-- VALUES 
--     ('feedback_1', 'sample_user_id', 'bug', 'The booking form is not submitting properly', 4, '/book/tour-123', 'new'),
--     ('feedback_2', 'sample_user_id', 'feature', 'Add ability to save favorite tours', 3, '/tours', 'new'),
--     ('feedback_3', 'sample_user_id', 'general', 'Great platform, very easy to use!', 5, '/dashboard', 'acknowledged');
