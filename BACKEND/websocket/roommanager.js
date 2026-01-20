import { log } from "../utils/logger.js";

const rooms = new Map(); 
// roomId -> Set of clients

export function handleMessage(ws, data) {
  const { roomId, type } = data;
  if (!roomId || !type) return;

  // ================= CREATE ROOM =================
  if (type === "create-room") {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      log(`🆕 Room created: ${roomId}`);
    }

    rooms.get(roomId).add(ws);

    ws.send(JSON.stringify({
      type: "room-created",
      roomId
    }));
    return;
  }

  // ================= JOIN ROOM =================
  if (type === "join-room") {
    if (!rooms.has(roomId)) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Room does not exist"
      }));
      return;
    }

    const clients = rooms.get(roomId);

    if (clients.size >= 2) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Room already full"
      }));
      return;
    }

    clients.add(ws);

    clients.forEach(client => {
      client.send(JSON.stringify({
        type: "peer-joined",
        roomId
      }));
    });

    log(`👤 Peer joined room: ${roomId}`);
    return;
  }

  // ================= RELAY EVERYTHING =================
  if (
    type === "offer" ||
    type === "answer" ||
    type === "ice-candidate" ||
    type === "gesture"
  ) {
    broadcast(roomId, ws, data);
    return;
  }

  log("⚠️ Unknown message type:", type);
}


export function handleDisconnect(ws) {
  rooms.forEach((clients, roomId) => {
    if (clients.has(ws)) {
      clients.delete(ws);

      clients.forEach(client => {
        client.send(JSON.stringify({
          type: "peer-left",
          roomId
        }));
      });

      if (clients.size === 0) {
        rooms.delete(roomId);
        log(`🧹 Room destroyed: ${roomId}`);
      }
    }
  });
}

function broadcast(roomId, sender, message) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  clients.forEach(client => {
    if (client !== sender && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}
