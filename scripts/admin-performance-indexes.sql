-- Performance optimization indexes for admin dashboard queries
-- Run this after adding the audit_logs table

-- Optimize admin tour management queries
-- Index for filtering tours by user (operator)
CREATE INDEX IF NOT EXISTS idx_tours_user_id_status ON tours(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tours_status_created ON tours(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_location_status ON tours(location, status) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tours_category_status ON tours(category, status) WHERE category IS NOT NULL;

-- Optimize booking statistics queries for admin dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_tour_status_amount ON bookings(tour_id, status, total_amount);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at DESC);

-- Optimize time slot queries for admin statistics
CREATE INDEX IF NOT EXISTS idx_time_slots_tour_status_time ON time_slots(tour_id, status, start_time);

-- Optimize user queries for admin user management
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_country_role ON users(country, role) WHERE country IS NOT NULL;

-- Optimize search queries (for admin search functionality)
-- Add GIN indexes for full-text search if needed
CREATE INDEX IF NOT EXISTS idx_tours_name_search ON tours USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tours_description_search ON tours USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', coalesce(name, '')));

-- Add comments for documentation
COMMENT ON INDEX idx_tours_user_id_status IS 'Optimize queries filtering tours by operator and status';
COMMENT ON INDEX idx_tours_status_created IS 'Optimize admin dashboard tour listing by status and creation date';
COMMENT ON INDEX idx_bookings_tour_status_amount IS 'Optimize revenue calculations for admin statistics';
COMMENT ON INDEX idx_users_role_created IS 'Optimize admin user management queries';

-- Optional: Analyze tables after creating indexes for better query planning
-- ANALYZE tours;
-- ANALYZE bookings;
-- ANALYZE time_slots;
-- ANALYZE users; 