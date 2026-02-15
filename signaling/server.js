const WebSocket = require("ws");

const WSServer = WebSocket.WebSocketServer || WebSocket.Server;
const port = Number(process.env.PORT || 3001);
const wss = new WSServer({ port });

const rooms = new Map();
const clientState = new WeakMap();

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

wss.on("connection", (ws) => {
  const clientId = randomId();

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

      const room = getRoom(roomId);
      if (room.clients.size >= 2) {
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
});

console.log(`LAN signaling server is running on ws://0.0.0.0:${port}`);
