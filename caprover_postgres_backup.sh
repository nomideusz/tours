#!/bin/bash

# CapRover PostgreSQL Backup Script
# Usage: ./caprover_postgres_backup.sh

# Configuration
POSTGRES_CONTAINER="srv-captain--zaur-db"  # Change this to your container name
POSTGRES_USER="nom"                             # Change this to your username
DATABASE_NAME="postgres"                        # Change this to your database name
BACKUP_DIR="/captain/data/backups"                   # Backup directory
RETENTION_DAYS=7                                     # Keep backups for 7 days

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting PostgreSQL backup...${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Check if container exists
if ! docker ps --format "table {{.Names}}" | grep -q "^${POSTGRES_CONTAINER}$"; then
    echo -e "${RED}❌ Error: PostgreSQL container '${POSTGRES_CONTAINER}' not found${NC}"
    echo "Available containers:"
    docker ps --format "table {{.Names}}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}📦 Creating backup: ${BACKUP_FILE}${NC}"
if docker exec $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER -d $DATABASE_NAME > $BACKUP_FILE; then
    # Get backup size
    BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}📁 File: ${BACKUP_FILE}${NC}"
    echo -e "${GREEN}📊 Size: ${BACKUP_SIZE}${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Compress backup (optional)
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip $BACKUP_FILE
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h $COMPRESSED_FILE | cut -f1)
echo -e "${GREEN}✅ Compressed: ${COMPRESSED_FILE} (${COMPRESSED_SIZE})${NC}"

# Clean up old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
DELETED_COUNT=$(find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "${GREEN}🗑️  Deleted ${DELETED_COUNT} old backup(s)${NC}"

# Show backup summary
echo -e "${GREEN}📋 Backup Summary:${NC}"
echo -e "${GREEN}   Database: ${DATABASE_NAME}${NC}"
echo -e "${GREEN}   Container: ${POSTGRES_CONTAINER}${NC}"
echo -e "${GREEN}   Backup file: ${COMPRESSED_FILE}${NC}"
echo -e "${GREEN}   Size: ${COMPRESSED_SIZE}${NC}"
echo -e "${GREEN}   Timestamp: ${TIMESTAMP}${NC}"

# List recent backups
echo -e "${YELLOW}📂 Recent backups:${NC}"
ls -lah $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | tail -5 || echo "No previous backups found"

echo -e "${GREEN}🎉 Backup process completed!${NC}"