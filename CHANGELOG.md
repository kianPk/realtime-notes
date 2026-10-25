# Changelog

## 1.1.0

- Presence count per room (`presence` event)
- Per-room title with `title` / `edit-title` events
- `GET /api/rooms/:id` export `{ text, title, updatedAt }`
- Light rate-limit on edit events (max 20/s per socket)
- CI workflow and project docs

## 1.0.0

- Shared notepad via Socket.IO + Vue 3
