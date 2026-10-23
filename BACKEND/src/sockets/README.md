# Socket.IO Architecture

## Goals

Realtime layer untuk 1000+ concurrent users dengan room-based fanout, small payloads, JWT authentication, dan event contract yang stabil.

## Events

Server emits:

- `chat:new`
- `chat:update`
- `message:new`
- `message:update`
- `message:read`
- `agent:online`
- `agent:offline`
- `typing:start`
- `typing:stop`

Client emits:

- `chat:join`
- `chat:leave`
- `message:read`
- `typing:start`
- `typing:stop`

## Rooms

- `user:{userId}`: semua socket milik satu user, termasuk multi-tab.
- `role:{role}`: `role:admin` atau `role:agent`.
- `chat:{chatId}`: user yang sedang membuka satu chat.
- `admins`: shortcut room untuk admin.
- `agents`: shortcut room untuk agent.

## Presence

Presence memakai in-memory map per process:

- Agent online saat koneksi socket pertama untuk user tersebut tersambung.
- Agent offline saat koneksi socket terakhir user tersebut disconnect.
- Multi-tab aman karena presence menghitung jumlah socket per user.

Untuk multi-node production, pindahkan presence ke Redis dan pakai Socket.IO Redis adapter.

## Scale Notes For 1000+ Users

- Gunakan rooms untuk menghindari broadcast global yang tidak perlu.
- Payload event harus kecil. Untuk list/detail besar, client fetch REST API.
- `message:new` hanya dikirim ke `chat:{chatId}`.
- `chat:update` dikirim ke room chat dan admin room; assigned agent bisa menerima via `user:{agentId}`.
- Typing event tidak disimpan ke database.
- `pingInterval`, `pingTimeout`, dan `maxHttpBufferSize` sudah diset di `socket.service.js`.
- Untuk horizontal scaling:
  - Tambahkan `@socket.io/redis-adapter`.
  - Gunakan sticky sessions di load balancer.
  - Simpan presence di Redis.
