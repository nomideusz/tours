#!/bin/bash

echo "CapRover Nginx Timeout Fix Script"
echo "=================================="
echo ""
echo "This script will help you increase nginx timeout to prevent 502 errors"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo or as root"
    exit 1
fi

echo "1. Creating nginx timeout configuration..."

# Create nginx timeout config
cat > /captain/data/nginx-timeout.conf << 'EOF'
# Increase timeout to 5 minutes (300 seconds)
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
send_timeout 300s;
client_body_timeout 300s;
keepalive_timeout 300s;

# Also increase buffer sizes for large responses
proxy_buffer_size 128k;
proxy_buffers 16 256k;
proxy_busy_buffers_size 256k;
proxy_temp_file_write_size 256k;

# Increase client max body size for large uploads
client_max_body_size 100m;
EOF

echo "2. Configuration file created at /captain/data/nginx-timeout.conf"
echo ""
echo "3. Now you need to:"
echo "   a) Login to CapRover dashboard at https://captain.yourdomain.com"
echo "   b) Go to your app (zaur-app)"
echo "   c) Click on 'HTTP Settings' tab"
echo "   d) Click 'Edit Default Nginx Configurations'"
echo "   e) Add the following line at the top:"
echo "      include /nginx-shared/nginx-timeout.conf;"
echo "   f) Save and Update"
echo ""
echo "Alternatively, for ALL apps globally:"
echo "   - Go to Settings > NGINX Configurations"
echo "   - Edit the base nginx config"
echo "   - Add the include line in the http block"
echo ""

# Show current nginx logs to verify the timeout issue
echo "Recent nginx error logs:"
docker service logs captain-nginx --since 10m 2>&1 | grep -i "timeout" | tail -5

echo ""
echo "Script completed!" 