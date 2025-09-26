-- Development Tracking System Migration
-- Run this SQL to set up the development tracking tables

-- Create development priority enum
DO $$ BEGIN
    CREATE TYPE development_priority AS ENUM ('critical', 'high', 'medium', 'low', 'backlog');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create development category enum
DO $$ BEGIN
    CREATE TYPE development_category AS ENUM (
        'tours', 'bookings', 'payments', 'qr_codes', 'notifications', 
        'analytics', 'ui_ux', 'performance', 'security', 'integrations', 
        'mobile', 'api', 'admin', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create development effort enum
DO $$ BEGIN
    CREATE TYPE development_effort AS ENUM ('xs', 's', 'm', 'l', 'xl', 'xxl');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create release status enum
DO $$ BEGIN
    CREATE TYPE release_status AS ENUM ('planned', 'in_development', 'testing', 'deployed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create development items table
CREATE TABLE IF NOT EXISTS development_items (
    id TEXT PRIMARY KEY,
    
    -- Link to original feedback (if originated from feedback)
    feedback_id TEXT, -- References feedback_submissions.id
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- bug, feature, improvement, technical_debt
    
    -- Development tracking
    priority development_priority NOT NULL DEFAULT 'medium',
    category development_category NOT NULL DEFAULT 'other',
    effort development_effort, -- Story points/complexity estimation
    
    -- Status and progress
    status VARCHAR(50) NOT NULL DEFAULT 'backlog', -- backlog, planned, in_progress, testing, completed, cancelled
    progress INTEGER NOT NULL DEFAULT 0, -- 0-100 percentage
    
    -- Assignment and ownership
    assigned_to TEXT, -- References users.id
    reported_by TEXT, -- References users.id
    
    -- Business impact
    user_impact INTEGER DEFAULT 3, -- 1-5 scale (how many users affected)
    business_value INTEGER DEFAULT 3, -- 1-5 scale (business importance)
    
    -- Technical details
    technical_notes TEXT,
    acceptance_criteria JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Release tracking
    target_release VARCHAR(50),
    release_status release_status DEFAULT 'planned',
    
    -- Dependencies
    blocked_by JSONB DEFAULT '[]'::jsonb, -- Array of development_item IDs
    blocks JSONB DEFAULT '[]'::jsonb, -- Array of development_item IDs
    
    -- Time tracking
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    target_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for development_items
CREATE INDEX IF NOT EXISTS idx_development_items_priority ON development_items(priority);
CREATE INDEX IF NOT EXISTS idx_development_items_status ON development_items(status);
CREATE INDEX IF NOT EXISTS idx_development_items_category ON development_items(category);
CREATE INDEX IF NOT EXISTS idx_development_items_assigned_to ON development_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_development_items_created_at ON development_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_development_items_feedback_id ON development_items(feedback_id);

-- Create development comments table
CREATE TABLE IF NOT EXISTS development_comments (
    id TEXT PRIMARY KEY,
    development_item_id TEXT NOT NULL REFERENCES development_items(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- References users.id
    comment TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'comment', -- comment, status_change, assignment, etc.
    metadata JSONB, -- Additional data for different comment types
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for development_comments
CREATE INDEX IF NOT EXISTS idx_development_comments_item_id ON development_comments(development_item_id);
CREATE INDEX IF NOT EXISTS idx_development_comments_created_at ON development_comments(created_at DESC);

-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    status release_status NOT NULL DEFAULT 'planned',
    
    -- Dates
    planned_date TIMESTAMP WITH TIME ZONE,
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for releases
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_planned_date ON releases(planned_date);

-- Create development metrics table
CREATE TABLE IF NOT EXISTS development_metrics (
    id TEXT PRIMARY KEY,
    
    -- Time period
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Velocity metrics
    story_points_completed INTEGER NOT NULL DEFAULT 0,
    items_completed INTEGER NOT NULL DEFAULT 0,
    bugs_fixed INTEGER NOT NULL DEFAULT 0,
    features_delivered INTEGER NOT NULL DEFAULT 0,
    
    -- Quality metrics
    bugs_introduced INTEGER NOT NULL DEFAULT 0,
    cycle_time DECIMAL(5,2), -- Average days from start to completion
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(year, week_number)
);

-- Create indexes for development_metrics
CREATE INDEX IF NOT EXISTS idx_development_metrics_year_week ON development_metrics(year, week_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to development_items
DROP TRIGGER IF EXISTS update_development_items_updated_at ON development_items;
CREATE TRIGGER update_development_items_updated_at 
    BEFORE UPDATE ON development_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to releases
DROP TRIGGER IF EXISTS update_releases_updated_at ON releases;
CREATE TRIGGER update_releases_updated_at 
    BEFORE UPDATE ON releases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO development_items (id, title, description, type, priority, category, reported_by)
-- VALUES 
--     ('dev_item_1', 'Fix tour booking confirmation email', 'The confirmation email is not being sent after successful booking', 'bug', 'high', 'bookings', 'admin_user_id'),
--     ('dev_item_2', 'Add QR code analytics dashboard', 'Create a dashboard to track QR code scan analytics and conversion rates', 'feature', 'medium', 'analytics', 'admin_user_id'),
--     ('dev_item_3', 'Improve payment processing speed', 'Optimize payment processing to reduce loading times', 'improvement', 'medium', 'payments', 'admin_user_id');

COMMENT ON TABLE development_items IS 'Tracks all development tasks including bugs, features, improvements, and technical debt';
COMMENT ON TABLE development_comments IS 'Comments and activity log for development items';
COMMENT ON TABLE releases IS 'Release/milestone tracking';
COMMENT ON TABLE development_metrics IS 'Weekly development velocity and quality metrics';
