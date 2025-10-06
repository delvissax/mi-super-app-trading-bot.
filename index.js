// index.js
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import nodeCron from 'node-cron';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

// Puerto provisto por Render o 3000 en local
const PORT = process.env.PORT || 3000;

// Endpoints básicos
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    name: 'Super App Trading Bot',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Healthcheck para despliegues y monitoreo
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Ejemplo de endpoint de sesión (ajusta lógica real)
app.post('/session', async (req, res) => {
  try {
    const { email, password, apiKey, mode } = req.body;
    // TODO: autenticar contra broker o servicio externo
    res.json({ success: true, email, mode });
  } catch (err) {
    console.error('SESSION_ERROR:', err);
    res.status(500).json({ error: 'Error en la sesión' });
  }
});

// Crea server HTTP y comparte con WebSocket
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Gestión de conexiones WS
wss.on('connection', (ws, req) => {
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket.remoteAddress;

  console.log('WS conectado:', ip);

  ws.send(JSON.stringify({ type: 'welcome', message: 'Conexión WebSocket exitosa!' }));

  ws.on('message', (raw) => {
    try {
      const data = raw.toString();
      console.log('WS mensaje:', data);
      // Echo + parsing opcional
      ws.send(JSON.stringify({ type: 'echo', payload: data }));
    } catch (e) {
      console.error('WS_MESSAGE_ERROR:', e);
      ws.send(JSON.stringify({ type: 'error', message: 'Mensaje inválido' }));
    }
  });

  ws.on('close', (code, reason) => {
    console.log('WS cerrado:', code, reason?.toString());
  });

  ws.on('error', (err) => {
    console.error('WS_ERROR:', err);
  });
});

// Broadcast helper (puedes usarlo en señales/cron)
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

// Cron job cada minuto (ejecuta lógica de trading, señales, pings, etc.)
nodeCron.schedule('* * * * *', async () => {
  try {
    console.log('Cron: ejecutando tarea por minuto');
    // EJEMPLO: ping keepalive a clientes
    broadcast({ type: 'ping', ts: Date.now() });
    // EJEMPLO: consulta externa
    // const res = await axios.get('https://api.example.com/market/ticker');
    // broadcast({ type: 'ticker',  res.data });
  } catch (err) {
    console.error('CRON_ERROR:', err);
  }
});

// Manejo de señales para cerrar limpio (opcional en Render)
function gracefulShutdown() {
  console.log('Cerrando servidor...');
  server.close(() => {
    console.log('HTTP cerrado.');
    wss.close(() => {
      console.log('WS cerrado.');
      process.exit(0);
    });
  });
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Arranque
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP/WS escuchando en puerto ${PORT}`);
});
