import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map(); // roomId -> text

io.on("connection", (socket) => {
  socket.on("join", (roomId) => {
    socket.join(roomId);
    socket.emit("doc", rooms.get(roomId) || "");
  });
  socket.on("edit", ({ roomId, text }) => {
    rooms.set(roomId, text);
    socket.to(roomId).emit("doc", text);
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));
const PORT = Number(process.env.PORT || 4200);
server.listen(PORT, () => console.log(`realtime-notes on :${PORT}`));
