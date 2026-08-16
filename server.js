import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOARDS_DIR = path.join(process.cwd(), '.boards');

// Ensure boards directory exists
async function ensureBoardsDir() {
  try {
    await fs.access(BOARDS_DIR);
  } catch {
    await fs.mkdir(BOARDS_DIR, { recursive: true });
  }
}

const rooms = new Map();
const socketToRoom = new Map();
const roomDirtyFlags = new Map(); // Track which rooms need saving

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
const ANIMALS = ['Fox', 'Panda', 'Falcon', 'Tiger', 'Bear', 'Wolf', 'Hawk', 'Lion'];

async function loadRoomState(roomId) {
  const filePath = path.join(BOARDS_DIR, `${roomId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return null; // File does not exist or invalid JSON
  }
}

async function saveDirtyRooms() {
  for (const [roomId, isDirty] of roomDirtyFlags.entries()) {
    if (isDirty) {
      const room = rooms.get(roomId);
      if (room) {
        const filePath = path.join(BOARDS_DIR, `${roomId}.json`);
        try {
          // We only save elements and chat, not active users
          const saveData = { elements: room.elements, chat: room.chat };
          await fs.writeFile(filePath, JSON.stringify(saveData, null, 2));
          roomDirtyFlags.set(roomId, false);
        } catch (err) {
          console.error(`Failed to save room ${roomId}:`, err);
        }
      }
    }
  }
}

function markRoomDirty(roomId) {
  roomDirtyFlags.set(roomId, true);
}

app.prepare().then(async () => {
  await ensureBoardsDir();

  // Auto-save every 10 seconds
  setInterval(saveDirtyRooms, 10000);

  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-room', async (roomId, profile) => {
      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);

      if (!rooms.has(roomId)) {
        // Try to load from disk
        const savedState = await loadRoomState(roomId);
        rooms.set(roomId, {
          elements: savedState?.elements || [],
          users: {},
          chat: savedState?.chat || []
        });
      }

      const room = rooms.get(roomId);

      const user = {
        id: socket.id,
        name: profile?.name || `${COLORS[Math.floor(Math.random() * COLORS.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`,
        color: profile?.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      };

      room.users[socket.id] = user;

      socket.emit('room-state', {
        elements: room.elements,
        users: room.users,
        chat: room.chat,
        me: user,
      });

      socket.to(roomId).emit('user-joined', user);
    });

    socket.on('element-add', (element) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).elements.push(element);
        markRoomDirty(roomId);
        socket.to(roomId).emit('element-add', element);
      }
    });

    socket.on('element-remove', (elementId) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.elements = room.elements.filter(el => el.id !== elementId);
        markRoomDirty(roomId);
        socket.to(roomId).emit('element-remove', elementId);
      }
    });

    socket.on('element-update', (element) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const idx = room.elements.findIndex(el => el.id === element.id);
        if (idx !== -1) room.elements[idx] = element;
        markRoomDirty(roomId);
        socket.to(roomId).emit('element-update', element);
      }
    });

    socket.on('clear-all', () => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).elements = [];
        markRoomDirty(roomId);
        socket.to(roomId).emit('clear-all');
      }
    });

    socket.on('cursor-move', (cursor) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('cursor-move', { userId: socket.id, cursor });
      }
    });

    socket.on('chat-message', (msg) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).chat.push(msg);
        markRoomDirty(roomId);
        socket.to(roomId).emit('chat-message', msg);
      }
    });

    socket.on('disconnect', () => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        delete room.users[socket.id];
        socket.to(roomId).emit('user-left', socket.id);
        socketToRoom.delete(socket.id);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
