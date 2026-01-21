import { createWebSocketServer } from "./websocket/index.js";
import { log } from "./utils/logger.js";
import os from "os";

const PORT = 3000;

// Get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

createWebSocketServer(PORT);

const localIP = getLocalIP();

log(` Signaling server running on:`);
log(`   Local:   ws://localhost:${PORT}`);
log(`   Network: ws://${localIP}:${PORT}`);
log(`\n Connect other devices using: ws://${localIP}:${PORT}\n`);