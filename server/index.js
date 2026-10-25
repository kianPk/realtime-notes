import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/** roomId -> { text, title, updatedAt } */
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      text: "",
      title: roomId,
      updatedAt: new Date().toISOString()
    });
  }
  return rooms.get(roomId);
}

function emitPresence(roomId) {
  const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
  io.to(roomId).emit("presence", { roomId, count });
}

io.on("connection", (socket) => {
  let currentRoom = null;
  const editTimes = [];

  socket.on("join", (roomId) => {
    const id = String(roomId || "demo");
    if (currentRoom) {
      socket.leave(currentRoom);
      emitPresence(currentRoom);
    }
    currentRoom = id;
    socket.join(id);
    const room = getRoom(id);
    socket.emit("doc", room.text);
    socket.emit("title", { roomId: id, title: room.title });
    emitPresence(id);
  });

  socket.on("edit", ({ roomId, text }) => {
    const now = Date.now();
    while (editTimes.length && now - editTimes[0] > 1000) editTimes.shift();
    if (editTimes.length >= 20) {
      socket.emit("rate-limited", { event: "edit", maxPerSec: 20 });
      return;
    }
    editTimes.push(now);

    const id = String(roomId || currentRoom || "demo");
    const room = getRoom(id);
    room.text = String(text ?? "");
    room.updatedAt = new Date().toISOString();
    socket.to(id).emit("doc", room.text);
  });

  socket.on("edit-title", ({ roomId, title }) => {
    const id = String(roomId || currentRoom || "demo");
    const room = getRoom(id);
    room.title = String(title ?? "").trim() || id;
    room.updatedAt = new Date().toISOString();
    io.to(id).emit("title", { roomId: id, title: room.title });
  });

  socket.on("disconnect", () => {
    if (currentRoom) emitPresence(currentRoom);
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/rooms/:id", (req, res) => {
  const room = getRoom(req.params.id);
  res.json({
    text: room.text,
    title: room.title,
    updatedAt: room.updatedAt
  });
});

const PORT = Number(process.env.PORT || 4200);
server.listen(PORT, () => console.log(`realtime-notes on :${PORT}`));
