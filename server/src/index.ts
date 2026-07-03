import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './socket/handlers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow dev client
    methods: ['GET', 'POST']
  }
});

registerSocketHandlers(io);

app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

httpServer.listen(PORT, () => {
  console.log(`Catan Server running on http://localhost:${PORT}`);
});
