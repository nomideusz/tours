-- Add audit log table for admin action tracking
-- Run this in production to enable persistent audit logging

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT concat('audit_', extract(epoch from now())::bigint, '_', substr(md5(random()::text), 1, 9)),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Admin who performed the action
    admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_email VARCHAR(255) NOT NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- e.g., 'update_tour', 'delete_tour', 'update_user_status'
    resource VARCHAR(50) NOT NULL, -- e.g., 'tour', 'user', 'booking'
    resource_id TEXT NOT NULL,
    resource_name VARCHAR(255), -- human-readable name for context
    
    -- Action context and metadata
    details JSONB, -- flexible storage for action-specific data
    ip_address INET,
    user_agent TEXT,
    
    -- Indexes for efficient querying
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_timestamp ON audit_logs(admin_id, timestamp DESC);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Tracks all administrative actions for compliance and accountability';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (update_tour, delete_user, etc.)';
COMMENT ON COLUMN audit_logs.resource IS 'Type of resource affected (tour, user, booking, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object containing action-specific metadata and context';

-- Optional: Add retention policy (keep audit logs for 7 years for compliance)
-- This can be implemented with a cron job or automated cleanup
COMMENT ON COLUMN audit_logs.created_at IS 'Use for retention policy - keep audit logs for 7 years minimum';

-- Sample query to verify the table was created correctly
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'audit_logs' 
-- ORDER BY ordinal_position; 