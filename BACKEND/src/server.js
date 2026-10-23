import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import { sequelize } from './database/models/index.js';
import { initSocket } from './sockets/socket.service.js';
import { startBroadcastScheduler } from './modules/broadcast/broadcastScheduler.worker.js';
import { startSchedulerWorker } from './modules/scheduler/scheduler.worker.js';

const port = Number(process.env.PORT || 3000);

await sequelize.authenticate();

const server = http.createServer(app);
await initSocket(server, { origin: process.env.SOCKET_CORS_ORIGIN || '*' });
startBroadcastScheduler();
startSchedulerWorker();

server.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
