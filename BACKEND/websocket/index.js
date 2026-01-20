import { WebSocketServer } from "ws";
import { handleMessage, handleDisconnect } from "./roommanager.js";
import { log } from "../utils/logger.js";

export function createWebSocketServer(port) {
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    log("🔗 Client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(ws, data);
      } catch (err) {
        log("❌ Invalid message format");
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
      log("❌ Client disconnected");
    });
  });
}
