-- Create beta applications table
CREATE TABLE IF NOT EXISTS beta_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic contact info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Business info
    business_name VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    country VARCHAR(2) NOT NULL,
    
    -- Screening questions
    tour_types TEXT NOT NULL, -- What types of tours do you offer?
    tour_frequency TEXT NOT NULL, -- How many tours do you run per week?
    current_booking_method TEXT NOT NULL, -- How do you currently manage bookings?
    biggest_challenge TEXT NOT NULL, -- What's your biggest challenge with tour management?
    beta_contribution TEXT NOT NULL, -- How would you contribute to the beta program?
    
    -- Additional info
    years_experience INTEGER NOT NULL,
    team_size INTEGER NOT NULL DEFAULT 1,
    interested_features TEXT[], -- Array of features they're most interested in
    availability_for_feedback BOOLEAN NOT NULL DEFAULT true,
    
    -- Application status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, waitlisted
    reviewer_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT,
    
    -- Metadata
    referral_source VARCHAR(100), -- How they heard about the beta program
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_beta_applications_status ON beta_applications(status);
CREATE INDEX idx_beta_applications_created_at ON beta_applications(created_at);
CREATE INDEX idx_beta_applications_country ON beta_applications(country);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_beta_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beta_applications_updated_at
    BEFORE UPDATE ON beta_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_beta_applications_updated_at();