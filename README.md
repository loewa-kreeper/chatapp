# Chatapp (Expo + WebRTC)

This app supports 1:1 video calling via:
- A WebSocket signaling server (`signaling/server.js`)
- WebRTC media on mobile (`react-native-webrtc`)

It works on iPhone and Android with development builds and can be deployed for internet use.

## Local LAN setup

1. Install dependencies:

```bash
npm install
```

2. Start signaling server:

```bash
npm run signaling:start
```

3. Configure app URL in `Settings`:
- `ws://<your-computer-lan-ip>:3001/ws`

4. Run native app build:

```bash
npm run ios
npm run android
```

Notes:
- Expo Go is not supported (`react-native-webrtc` requires native modules).
- Both phones and your computer must be on the same Wi-Fi for LAN mode.

## Production deployment (server)

### 1. Deploy signaling service on Linux server

On the server:

```bash
git clone <your-repo-url> /opt/chatapp
cd /opt/chatapp
npm ci --omit=dev
```

Run service:

```bash
HOST=127.0.0.1 PORT=3001 SIGNALING_PATH=/ws node signaling/server.js
```

You should get:
- Health endpoint: `http://127.0.0.1:3001/healthz`
- WS endpoint path: `/ws`

Recommended: run with `pm2` or `systemd` so it restarts automatically.

### 2. Put Nginx in front (TLS / `wss://`)

Use domain like `signal.yourdomain.com` and proxy to localhost:3001.

Example Nginx site:

```nginx
server {
  listen 80;
  server_name signal.yourdomain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name signal.yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/signal.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/signal.yourdomain.com/privkey.pem;

  location /ws {
    proxy_pass http://127.0.0.1:3001/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 65s;
  }

  location /healthz {
    proxy_pass http://127.0.0.1:3001/healthz;
    proxy_set_header Host $host;
  }
}
```

Then obtain certs (for example with Certbot) and reload Nginx.

Important:
- iPhone requires secure transport for internet use, so use `wss://` in production.
- Open ports 80/443 in firewall. Keep 3001 private (localhost only).

### 3. Configure mobile app for production server

Create `.env`:

```env
EXPO_PUBLIC_SIGNALING_URL=wss://signal.yourdomain.com/ws
EXPO_PUBLIC_STUN_URLS=stun:stun.l.google.com:19302
EXPO_PUBLIC_TURN_URLS=turns:turn.yourdomain.com:5349?transport=tcp
EXPO_PUBLIC_TURN_USERNAME=chatapp
EXPO_PUBLIC_TURN_CREDENTIAL=replace-me
```

`EXPO_PUBLIC_SIGNALING_URL` is the main setting.  
You can still override it in the app `Settings` screen.

### 4. TURN server (required for reliable mobile internet)

For iPhone + Android on mobile networks, TURN is usually required.  
Without TURN, some NAT combinations will fail even if signaling is working.

Typical setup:
- Install coturn on a public server
- Expose TURN ports (3478 UDP/TCP, and/or 5349 TLS)
- Create username/password used in `EXPO_PUBLIC_TURN_*`

## Signaling server environment variables

- `HOST` (default: `0.0.0.0`)
- `PORT` (default: `3001`)
- `SIGNALING_PATH` (default: `/ws`)
- `HEALTH_PATH` (default: `/healthz`)
- `MAX_ROOM_SIZE` (default: `2`)
- `HEARTBEAT_MS` (default: `30000`)
- `ALLOWED_ORIGINS` (comma-separated list, optional)

## Build apps for devices

Development builds:

```bash
npm run ios
npm run android
```

For distribution/testing outside local machine, use EAS builds (`eas build`) for iOS and Android.
