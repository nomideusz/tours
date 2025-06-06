#!/bin/bash

# Fix Upload Permissions Script
# This script fixes common permission issues with image uploads

set -e

echo "🔧 Fixing upload directory permissions..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root. Consider running as the application user instead."
fi

# Get the current directory
APP_DIR=$(pwd)
UPLOAD_DIR="$APP_DIR/static/uploads"
TOURS_DIR="$UPLOAD_DIR/tours"

# Function to check if directory exists and create if not
create_dir() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        echo "📁 Creating directory: $dir"
        mkdir -p "$dir"
    else
        echo "✅ Directory exists: $dir"
    fi
}

# Function to set permissions
set_permissions() {
    local dir=$1
    local perms=$2
    echo "🔒 Setting permissions $perms on $dir"
    chmod -R "$perms" "$dir"
}

# Function to set ownership (if running as root)
set_ownership() {
    local dir=$1
    local owner=$2
    if [ "$EUID" -eq 0 ]; then
        echo "👤 Setting ownership to $owner on $dir"
        chown -R "$owner" "$dir"
    fi
}

echo "📂 Working directory: $APP_DIR"
echo "📁 Upload directory: $UPLOAD_DIR"
echo "🎯 Tours directory: $TOURS_DIR"

# Create directories
create_dir "$UPLOAD_DIR"
create_dir "$TOURS_DIR"

# Set permissions
set_permissions "$UPLOAD_DIR" "755"

# If running in Docker or as specific user, set ownership
if [ ! -z "$USER" ] && [ "$USER" != "root" ]; then
    echo "👤 Current user: $USER"
    if [ "$EUID" -eq 0 ]; then
        set_ownership "$UPLOAD_DIR" "$USER:$USER"
    fi
fi

# Special handling for common deployment scenarios
if [ -f "/.dockerenv" ]; then
    echo "🐳 Docker environment detected"
    # Common Docker user is 'node'
    if id "node" &>/dev/null; then
        set_ownership "$UPLOAD_DIR" "node:node"
    fi
elif [ -f "/etc/railway" ]; then
    echo "🚂 Railway deployment detected"
    # Railway typically runs as a specific user
    set_permissions "$UPLOAD_DIR" "777"
elif [ ! -z "$VERCEL" ]; then
    echo "⚡ Vercel deployment detected"
    echo "⚠️  Vercel doesn't support file uploads to local filesystem."
    echo "    Consider using cloud storage (S3, Google Cloud, etc.)"
    exit 1
fi

# Test write permissions
echo "🧪 Testing write permissions..."
TEST_FILE="$UPLOAD_DIR/permission_test.txt"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    echo "✅ Write test successful"
    rm -f "$TEST_FILE"
else
    echo "❌ Write test failed"
    echo "🔍 Debugging information:"
    echo "   Current user: $(whoami)"
    echo "   Directory permissions:"
    ls -la "$UPLOAD_DIR"
    echo "   Directory ownership:"
    stat -c "%U:%G" "$UPLOAD_DIR" 2>/dev/null || echo "   (stat command not available)"
    exit 1
fi

# Check available disk space
echo "💾 Checking disk space..."
df -h "$UPLOAD_DIR" | tail -1 | awk '{print "   Available space: " $4 " (" $5 " used)"}'

# Set environment variable if not set
if [ -z "$UPLOAD_DIR" ]; then
    echo "🔧 Consider setting UPLOAD_DIR environment variable:"
    echo "   export UPLOAD_DIR=\"$UPLOAD_DIR\""
fi

echo ""
echo "🎉 Upload directory permissions fixed successfully!"
echo ""
echo "📋 Summary:"
echo "   ✅ Upload directory created: $UPLOAD_DIR"
echo "   ✅ Tours directory created: $TOURS_DIR"
echo "   ✅ Permissions set to 755"
echo "   ✅ Write test passed"
echo ""
echo "🚀 You can now restart your application to upload images."
echo ""

# Optional: restart application if PM2 is detected
if command -v pm2 &> /dev/null; then
    echo "🔄 PM2 detected. Restart with: pm2 restart all"
fi

# Optional: restart docker if docker-compose is detected
if [ -f "docker-compose.yml" ]; then
    echo "🐳 Docker Compose detected. Restart with: docker-compose restart"
fi

echo "📖 For more deployment help, see: docs/DEPLOYMENT_GUIDE.md" 