# IMMEDIATE FIX: CapRover 502 Errors on Complex Routes

## Problem Identified
Your complex routes (`/tours/[id]`, `/tours/[id]/qr`, `/tours/[id]/schedule`) are hitting CapRover's 60-second nginx timeout due to:

1. **Large dataset loading** (200+ bookings with joins)
2. **Complex statistics calculations** 
3. **QR code processing**
4. **Recurring slot creation logic**

## Immediate Solution

### Step 1: Update CapRover Nginx Timeout
SSH into your CapRover server:

```bash
# Create custom nginx config for your app
sudo nano /captain/data/config/nginx-custom/zaur.conf
```

Add this content:
```nginx
# Increase timeouts for complex operations
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
send_timeout 300s;

# Increase buffer sizes for large responses
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
proxy_max_temp_file_size 256m;

# Prevent timeout on uploads
client_max_body_size 50M;
client_body_timeout 300s;
client_header_timeout 300s;
```

### Step 2: Restart Nginx
```bash
docker service update captain-nginx --force
```

### Step 3: Alternative Method (if above doesn't work)
In CapRover dashboard, go to your app's "App Configs" tab and update the config:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile",
  "customNginxConfig": "proxy_read_timeout 300s; proxy_connect_timeout 300s; proxy_send_timeout 300s; send_timeout 300s; proxy_buffer_size 128k; proxy_buffers 4 256k; proxy_busy_buffers_size 256k; client_max_body_size 50M; client_body_timeout 300s; client_header_timeout 300s;"
}
```

## Quick Code Optimizations (Deploy After Nginx Fix)

### Optimize Main Tour Page Query 