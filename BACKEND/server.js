import { createWebSocketServer } from "./websocket/index.js";
import { log } from "./utils/logger.js";

const PORT = 3000;

createWebSocketServer(PORT);

log(`Signaling server running on ws://localhost:${PORT}`);
 