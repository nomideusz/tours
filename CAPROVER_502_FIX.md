# CapRover 502 Error Fix

## Problem
You're experiencing 502 errors ONLY on manual browser refresh for authenticated routes. This is because CapRover's nginx proxy has a default timeout of 60 seconds, but SSR is taking longer.

## Immediate Fix

### 1. Update Your App's Environment Variables in CapRover Dashboard
Go to your app in CapRover dashboard and add:
```DISABLE_AUTH_REFRESH=true
```

### 2. Increase CapRover Nginx Timeout
SSH into your CapRover server and run:

```bash
# Create custom nginx config for your app
sudo nano /captain/data/config/nginx-custom/<YOUR_APP_NAME>.conf
```

Add this content:
```nginx
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
send_timeout 300s;

# Also increase buffer sizes to prevent issues
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

Then restart nginx:
```bash
docker service update captain-nginx --force
```

### 3. Alternative: Use CapRover's App Config
In CapRover dashboard, go to your app's "App Configs" tab and add:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile",
  "customNginxConfig": "proxy_read_timeout 300s;\nproxy_connect_timeout 300s;\nproxy_send_timeout 300s;\nsend_timeout 300s;\nproxy_buffer_size 128k;\nproxy_buffers 4 256k;\nproxy_busy_buffers_size 256k;"
}
```

### 4. Verify the Fix
After deployment, check:
1. Manual refresh should work without 502 errors
2. Check nginx logs: `docker service logs captain-nginx --tail 100`

## Why This Happens with CapRover

1. CapRover uses nginx as a reverse proxy
2. Default nginx timeout is 60 seconds
3. Your SSR with database queries takes longer than 60s
4. Nginx kills the connection = 502 Bad Gateway

## Long-term Solutions

1. **Use Redis for caching** (CapRover has one-click Redis app)
2. **Implement request queuing** to prevent simultaneous heavy queries
3. **Use CapRover's horizontal scaling** to handle more requests
4. **Consider static generation** for some pages

## CapRover-Specific Optimizations

### Enable HTTP/2
In your app's CapRover settings, enable "Force HTTPS" and CapRover will automatically use HTTP/2.

### Add Health Check
In CapRover app settings, set health check endpoint to `/api/health-check`

### Monitor Performance
Use CapRover's built-in monitoring or add Netdata:
```bash
docker run -d --name=netdata \
  -p 19999:19999 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --cap-add SYS_PTRACE \
  --security-opt apparmor=unconfined \
  netdata/netdata
```

The Dockerfile has been updated with `DISABLE_AUTH_REFRESH=true` - just redeploy your app! 