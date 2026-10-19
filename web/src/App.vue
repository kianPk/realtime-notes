<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";

const room = ref("demo");
const text = ref("");
const status = ref("connecting");
let socket;
let applyingRemote = false;

onMounted(() => {
  socket = io("http://localhost:4200");
  socket.on("connect", () => { status.value = "live"; socket.emit("join", room.value); });
  socket.on("disconnect", () => { status.value = "offline"; });
  socket.on("doc", (doc) => { applyingRemote = true; text.value = doc; applyingRemote = false; });
});

onBeforeUnmount(() => socket?.disconnect());

watch(text, (v) => {
  if (applyingRemote || !socket) return;
  socket.emit("edit", { roomId: room.value, text: v });
});

watch(room, (r) => socket?.emit("join", r));
</script>

<template>
  <div class="page">
    <header>
      <h1>Realtime Notes</h1>
      <span class="pill">{{ status }}</span>
    </header>
    <label>Room <input v-model="room" /></label>
    <textarea v-model="text" rows="16" placeholder="Type — others see it live…"></textarea>
  </div>
</template>

<style>
body { margin: 0; font-family: Georgia, serif; background: #111; color: #eee; }
.page { max-width: 720px; margin: 0 auto; padding: 1.5rem; }
header { display: flex; justify-content: space-between; align-items: center; }
.pill { font-family: monospace; font-size: 0.8rem; color: #8f8; border: 1px solid #353; padding: 0.2rem 0.5rem; border-radius: 999px; }
label { display: block; margin: 1rem 0 0.5rem; font-size: 0.9rem; color: #aaa; }
input, textarea { width: 100%; background: #1a1a1a; color: #eee; border: 1px solid #333; border-radius: 8px; padding: 0.75rem; font: inherit; }
textarea { resize: vertical; line-height: 1.5; }
</style>
