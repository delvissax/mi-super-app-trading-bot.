import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import WebSocket from "ws";
import nodeCron from "node-cron";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

// Endpoint de ejemplo
app.post("/session", async (req, res) => {
  try {
    const { email, password, apiKey, mode } = req.body;
    const baseUrl =
      mode === "real"
        ? "https://api-capital.backend-capital.com/api/v1"
        : "https://demo-api-capital.backend-capital.com/api/v1";

    const r = await axios.post(
      `${baseUrl}/session`,
      {
        identifier: email,
        password,
      },
      {
        headers: { "X-CAP-API-KEY": apiKey, "Content-Type": "application/json" },
      }
    );

    res.json(r.data);
  } catch (e) {
    console.log("Error proxy:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

// Servidor HTTP
const server = app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));

// WebSocket
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.send("Conexión WebSocket exitosa!");
  ws.on("message", (message) => {
    console.log("Mensaje recibido WS:", message);
    ws.send(`Echo: ${message}`);
  });
});

// Tarea programada cada minuto
nodeCron.schedule("* * * * *", () => {
  console.log("Tarea automática ejecutada cada minuto");
});
