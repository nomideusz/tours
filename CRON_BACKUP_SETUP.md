# CapRover PostgreSQL Automated Backup Setup Guide

This guide will help you set up automated daily backups for your PostgreSQL database on CapRover using SSH and cron.

## 🔧 Prerequisites

- SSH access to your CapRover server
- The `caprover_postgres_backup.sh` script (already created)
- Basic knowledge of Linux/bash commands

## 📝 Step 1: SSH Access Setup

### Connect to your CapRover server:
```bash
ssh root@your-server-ip
# or if you have a custom SSH key:
ssh -i ~/.ssh/your-key root@your-server-ip
```

### If you don't have SSH access, enable it:
1. Log into your CapRover dashboard
2. Go to **Settings** → **SSH**
3. Add your SSH public key
4. Or enable password authentication (less secure)

## 📋 Step 2: Upload and Configure Backup Script

### Create backup directory structure:
```bash
# Create directories
mkdir -p /captain/scripts
mkdir -p /captain/data/backups

# Set proper permissions
chmod 755 /captain/scripts
chmod 755 /captain/data/backups
```

### Upload the backup script:

**Option A: Copy-paste method**
```bash
# Create the script file
nano /captain/scripts/postgres_backup.sh
```
Then copy-paste the contents of `caprover_postgres_backup.sh`.

**Option B: SCP upload method** (from your local machine):
```bash
# Upload from your local machine
scp caprover_postgres_backup.sh root@your-server-ip:/captain/scripts/postgres_backup.sh
```

**Option C: Download method** (if script is in a repo):
```bash
# Download directly to server
curl -o /captain/scripts/postgres_backup.sh https://raw.githubusercontent.com/your-repo/caprover_postgres_backup.sh
```

### Make script executable:
```bash
chmod +x /captain/scripts/postgres_backup.sh
```

### Test the script:
```bash
# Run a test backup
/captain/scripts/postgres_backup.sh
```

## ⏰ Step 3: Set Up Cron Job

### Open crontab for editing:
```bash
crontab -e
```

### Add backup schedule:

**Daily backup at 2:00 AM:**
```bash
# PostgreSQL backup - Daily at 2:00 AM
0 2 * * * /captain/scripts/postgres_backup.sh >> /captain/data/backups/backup.log 2>&1
```

**Alternative schedules:**
```bash
# Every 12 hours (2 AM and 2 PM)
0 2,14 * * * /captain/scripts/postgres_backup.sh >> /captain/data/backups/backup.log 2>&1

# Every 6 hours
0 */6 * * * /captain/scripts/postgres_backup.sh >> /captain/data/backups/backup.log 2>&1

# Weekly (Sunday at 3 AM)
0 3 * * 0 /captain/scripts/postgres_backup.sh >> /captain/data/backups/backup.log 2>&1

# Multiple times per day (every 4 hours)
0 */4 * * * /captain/scripts/postgres_backup.sh >> /captain/data/backups/backup.log 2>&1
```

### Save and exit:
- In nano: `Ctrl+X`, then `Y`, then `Enter`
- In vim: `:wq`

## 🔍 Step 4: Verify Cron Setup

### Check if cron service is running:
```bash
systemctl status cron
# or
service cron status
```

### Start cron if not running:
```bash
systemctl start cron
systemctl enable cron
```

### List current cron jobs:
```bash
crontab -l
```

### Check cron logs:
```bash
# View recent cron activity
tail -f /var/log/cron
# or
grep CRON /var/log/syslog
```

## 📊 Step 5: Monitor and Test

### Test manual execution:
```bash
# Run backup manually to test
/captain/scripts/postgres_backup.sh

# Check if backup was created
ls -la /captain/data/backups/
```

### Check backup logs:
```bash
# View backup log
tail -f /captain/data/backups/backup.log

# View recent backups
ls -lah /captain/data/backups/backup_*.sql.gz
```

### Monitor disk space:
```bash
# Check disk usage
df -h

# Check backup directory size
du -sh /captain/data/backups/
```

## 🔒 Step 6: Security and Best Practices

### Secure the backup directory:
```bash
# Set restrictive permissions
chmod 700 /captain/data/backups
chown root:root /captain/data/backups
```

### Set up log rotation:
```bash
# Create logrotate config
cat > /etc/logrotate.d/postgres-backup << 'EOF'
/captain/data/backups/backup.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    copytruncate
}
EOF
```

### Monitor backup health:
```bash
# Create a simple health check script
cat > /captain/scripts/backup_health_check.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/captain/data/backups"
MAX_AGE_HOURS=25  # Alert if latest backup is older than 25 hours

# Find latest backup
LATEST_BACKUP=$(find $BACKUP_DIR -name "backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -z "$LATEST_BACKUP" ]; then
    echo "⚠️  WARNING: No backups found!"
    exit 1
fi

# Check backup age
BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))

if [ $BACKUP_AGE -gt $MAX_AGE_HOURS ]; then
    echo "⚠️  WARNING: Latest backup is $BACKUP_AGE hours old!"
    echo "Latest backup: $LATEST_BACKUP"
    exit 1
else
    echo "✅ Backup health OK - Latest backup is $BACKUP_AGE hours old"
    echo "Latest backup: $LATEST_BACKUP"
fi
EOF

chmod +x /captain/scripts/backup_health_check.sh
```

## 📧 Step 7: Optional Email Notifications

### Install mail utility:
```bash
apt-get update && apt-get install -y mailutils
```

### Enhanced backup script with email notifications:
```bash
# Create enhanced script
cat > /captain/scripts/postgres_backup_with_email.sh << 'EOF'
#!/bin/bash

# Source the original backup script
/captain/scripts/postgres_backup.sh

# Email configuration
EMAIL="your-email@example.com"
SERVER_NAME="$(hostname)"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "PostgreSQL backup completed successfully on $SERVER_NAME at $(date)" | \
    mail -s "✅ Database Backup Success - $SERVER_NAME" $EMAIL
else
    echo "PostgreSQL backup FAILED on $SERVER_NAME at $(date)" | \
    mail -s "❌ Database Backup FAILED - $SERVER_NAME" $EMAIL
fi
EOF

chmod +x /captain/scripts/postgres_backup_with_email.sh
```

### Update cron to use email version:
```bash
# Edit crontab
crontab -e

# Replace with:
0 2 * * * /captain/scripts/postgres_backup_with_email.sh >> /captain/data/backups/backup.log 2>&1
```

## 🚨 Step 8: Emergency Procedures

### Manual backup command:
```bash
# Quick manual backup
docker exec srv-captain--zaur-db pg_dump -U nom -d postgres | gzip > /captain/data/backups/emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from backup:
```bash
# List available backups
ls -la /captain/data/backups/backup_*.sql.gz

# Restore from backup (CAREFUL - this will replace current data!)
gunzip -c /captain/data/backups/backup_YYYYMMDD_HHMMSS.sql.gz | \
docker exec -i srv-captain--zaur-db psql -U nom -d postgres
```

### Backup verification:
```bash
# Verify backup integrity
gunzip -t /captain/data/backups/backup_YYYYMMDD_HHMMSS.sql.gz && echo "Backup file is valid" || echo "Backup file is corrupted"
```

## 📋 Summary

After setup, you'll have:

✅ **Automated daily backups** at 2:00 AM  
✅ **7-day retention policy** (configurable)  
✅ **Compressed backups** to save space  
✅ **Detailed logging** of all backup operations  
✅ **Health monitoring** capabilities  
✅ **Easy restoration** procedures  

### Quick Commands Reference:

```bash
# Check backup status
ls -lah /captain/data/backups/

# View recent logs
tail /captain/data/backups/backup.log

# Test backup manually
/captain/scripts/postgres_backup.sh

# Check cron jobs
crontab -l

# Health check
/captain/scripts/backup_health_check.sh
```

## 🆘 Troubleshooting

### Common Issues:

1. **Cron not running backups:**
   ```bash
   # Check cron service
   systemctl status cron
   
   # Check cron logs
   grep CRON /var/log/syslog
   ```

2. **Backup script fails:**
   ```bash
   # Run manually to see errors
   /captain/scripts/postgres_backup.sh
   
   # Check container name
   docker ps --format "table {{.Names}}"
   ```

3. **Permission denied:**
   ```bash
   # Fix permissions
   chmod +x /captain/scripts/postgres_backup.sh
   chmod 755 /captain/data/backups
   ```

4. **Disk space issues:**
   ```bash
   # Check disk usage
   df -h
   
   # Clean old backups manually
   find /captain/data/backups -name "backup_*.sql.gz" -mtime +7 -delete
   ```

Your database backups are now automated and monitored! 🎉