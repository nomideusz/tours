# Database Migration Scripts Guide

## Overview

This directory contains scripts for migrating from PocketBase to PostgreSQL/Drizzle. After the refactoring, you now have two main scripts for production deployment.

## 🚀 Production Deployment Scripts (KEEP THESE)

### 1. `deploy-database-caprover.js` ⭐ (Recommended for CapRover)
**Purpose**: Direct deployment to CapRover PostgreSQL database

**Usage**:
```bash
pnpm db:deploy:caprover
```

**Features**:
- Direct PostgreSQL connection (no SSH needed)
- Includes OAuth tables
- Verifies deployment
- Shows database connection string

**Production Database Info**:
- Host: `srv-captain--zaur-db`
- Port: `5432`
- User: `nom`
- Password: `ebe3f84807eb35fd`
- Database: `postgres`

### 2. `deploy-database-structure.js` (For SSH deployment)
**Purpose**: Automated deployment via SSH to VPS

**Usage**:
```bash
pnpm db:deploy
```

**Features**:
- SSH-based deployment
- Docker exec commands
- For legacy setups

### 3. `export-database-structure.js`
**Purpose**: Export database structure to SQL files for manual deployment

**Usage**:
```bash
node scripts/export-database-structure.js
```

**Features**:
- Generates SQL files in `database-export/` directory
- Includes deployment instructions
- Useful for manual deployment or backup

## 📁 Other Scripts (Can be archived/deleted)

These scripts were created during the migration process and can now be safely removed or archived:

### Development/Testing Scripts
- `test-db-connection.js` - Tests local database connection
- `test-connection-env.js` - Tests connection with environment variables
- `test-pocketbase-connection.js` - Tests PocketBase connectivity
- `direct-db-test.js` - Direct PostgreSQL connection testing
- `setup-env-and-test.js` - Environment setup testing

### Data Migration Scripts
- `migrate-from-pocketbase.js` - Migrates data from PocketBase to PostgreSQL
- `migrate-payments.js` - Specific migration for payments table
- `debug-pocketbase-structure.js` - Analyzes PocketBase data structure

### Local Setup Scripts
- `setup-local-db.js` - Sets up local PostgreSQL database
- `setup-database.js` - Database setup helper
- `migrate-local.js` - Runs migrations on local database
- `start-studio.js` - Starts Drizzle Studio for local development

### Manual Migration Helpers
- `migrate-manual.js` - Manual migration helper
- `migrate-simple.js` - Simplified migration approach
- `fix-permissions.js` - Fixes database permissions

### Partial Migrations
- `add-oauth-table.js` - Adds OAuth tables (now included in main migration)

## 🎯 Recommended Workflow

### For Production Deployment:

1. **Generate migrations** (if schema changed):
   ```bash
   pnpm db:generate
   ```

2. **Deploy to production**:
   ```bash
   # Option A: Direct to CapRover (recommended)
   pnpm db:deploy:caprover
   
   # Option B: SSH deployment (legacy)
   pnpm db:deploy
   
   # Option C: Manual via export
   pnpm db:export
   # Then follow instructions in database-export/DEPLOYMENT_INSTRUCTIONS.txt
   ```

3. **Verify deployment**:
   The deployment script will automatically verify the tables.
   You can also check manually in your database client.

### For Local Development:

1. **Use standard Drizzle commands**:
   ```bash
   pnpm db:push      # Push schema to local database
   pnpm db:studio    # Open Drizzle Studio
   pnpm db:generate  # Generate new migrations
   ```

## 🧹 Cleanup Recommendation

After confirming your production deployment is successful, you can:

1. **Keep these scripts**:
   - `deploy-database-caprover.js` (main deployment script)
   - `deploy-database-structure.js` (SSH deployment backup)
   - `export-database-structure.js` (manual export option)
   - This README file

2. **Archive or delete** all other scripts in this directory

3. **Create a backup** of the archived scripts in case you need to reference them later

## 📝 Notes

- The main migration includes all necessary tables including OAuth support
- Always test migrations on a staging environment first if possible
- Keep backups before running migrations on production
- The production database connection details are embedded in the scripts for convenience 