const http = require("http");
const WebSocket = require("ws");

const WSServer = WebSocket.WebSocketServer || WebSocket.Server;
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3001);
const maxRoomSize = Math.max(2, Number(process.env.MAX_ROOM_SIZE || 2) || 2);
const heartbeatMs = Math.max(10000, Number(process.env.HEARTBEAT_MS || 30000) || 30000);
const signalingPath = normalizePath(process.env.SIGNALING_PATH || "/ws");
const healthPath = normalizePath(process.env.HEALTH_PATH || "/healthz");
const allowedOrigins = new Set(
  String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const rooms = new Map();
const clientState = new WeakMap();

function normalizePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { clients: new Map() });
  }
  return rooms.get(roomId);
}

function broadcastToRoom(roomId, payload, excludeId) {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const [clientId, client] of room.clients.entries()) {
    if (excludeId && clientId === excludeId) continue;
    send(client, payload);
  }
}

function leave(ws) {
  const state = clientState.get(ws);
  if (!state) return;

  const { roomId, clientId } = state;
  const room = rooms.get(roomId);
  if (!room) return;

  room.clients.delete(clientId);
  clientState.delete(ws);

  broadcastToRoom(roomId, { type: "peer-left" }, clientId);

  if (room.clients.size === 0) {
    rooms.delete(roomId);
  }
}

function isOriginAllowed(origin) {
  if (!allowedOrigins.size) return true;
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === healthPath) {
    const payload = JSON.stringify({
      ok: true,
      rooms: rooms.size,
      path: signalingPath,
    });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    });
    res.end(payload);
    return;
  }

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Chatapp signaling server is running.\n");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found\n");
});

const wss = new WSServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const hostHeader = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${hostHeader}`);

  if (url.pathname !== signalingPath) {
    socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  if (!isOriginAllowed(req.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.isAlive = true;
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws) => {
  const clientId = randomId();
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    if (msg.type === "join") {
      const roomId = String(msg.roomId || "").trim();
      if (!roomId) {
        send(ws, { type: "error", message: "roomId is required" });
        return;
      }

      leave(ws);

      const room = getRoom(roomId);
      if (room.clients.size >= maxRoomSize) {
        send(ws, { type: "room-full" });
        return;
      }

      const isHost = room.clients.size === 0;
      room.clients.set(clientId, ws);
      clientState.set(ws, { roomId, clientId });

      send(ws, { type: "joined", isHost, clients: room.clients.size });
      broadcastToRoom(roomId, { type: "peer-joined" }, clientId);
      return;
    }

    if (msg.type === "leave") {
      leave(ws);
      return;
    }

    const state = clientState.get(ws);
    if (!state) {
      send(ws, { type: "error", message: "Join a room first" });
      return;
    }

    if (["offer", "answer", "ice"].includes(msg.type)) {
      broadcastToRoom(state.roomId, msg, state.clientId);
      return;
    }

    send(ws, { type: "error", message: `Unsupported message type: ${msg.type}` });
  });

  ws.on("close", () => {
    leave(ws);
  });

  ws.on("error", () => {
    leave(ws);
  });
});

const heartbeatTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }

    ws.isAlive = false;
    ws.ping();
  }
}, heartbeatMs);

server.listen(port, host, () => {
  console.log(`Signaling server listening on http://${host}:${port}`);
  console.log(`WebSocket endpoint path: ${signalingPath}`);
  console.log(`Health endpoint path: ${healthPath}`);
});

server.on("close", () => {
  clearInterval(heartbeatTimer);
});
