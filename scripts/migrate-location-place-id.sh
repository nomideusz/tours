#!/bin/bash

# Migration script for adding location_place_id column
# This is a standalone migration that only adds the Places API field

echo "🔧 Running migration: Add location_place_id to tours table"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in environment"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

echo "✅ Database connection found"
echo ""

# Run the migration using psql
echo "📝 Executing SQL migration..."
psql "$DATABASE_URL" -f drizzle/migrations/0034_add_location_place_id.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your dev server: npm run dev"
    echo "2. Test by creating a new tour with a Places API location"
    echo "3. Verify location_place_id is saved in the database"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

