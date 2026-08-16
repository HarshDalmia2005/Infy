import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const rooms = new Map<string, any>();
const socketToRoom = new Map<string, string>();
const roomDirtyFlags = new Map<string, boolean>(); // Track which rooms need saving

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
const ANIMALS = ['Fox', 'Panda', 'Falcon', 'Tiger', 'Bear', 'Wolf', 'Hawk', 'Lion'];

async function loadRoomState(roomId: string) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: roomId }
    });
    if (board && board.data) {
      const parsed = typeof board.data === 'string' ? JSON.parse(board.data) : board.data;
      if (Array.isArray(parsed)) {
        return { elements: parsed, chat: [], title: board.name || 'Untitled Board' };
      }
      return { elements: parsed.elements || [], chat: parsed.chat || [], title: board.name || 'Untitled Board' };
    }
  } catch (err) {
    console.error(`Failed to load room ${roomId} from DB:`, err);
  }
  return null;
}

async function saveDirtyRooms() {
  for (const [roomId, isDirty] of roomDirtyFlags.entries()) {
    if (isDirty) {
      const room = rooms.get(roomId);
      if (room) {
        try {
          const existing = await prisma.board.findUnique({ where: { id: roomId }});
          if (existing) {
            await prisma.board.update({
              where: { id: roomId },
              data: { data: JSON.stringify({ elements: room.elements, chat: room.chat }) }
            });
            roomDirtyFlags.set(roomId, false);
          }
        } catch (err) {
          console.error(`Failed to save room ${roomId} to DB:`, err);
        }
      }
    }
  }
}

function markRoomDirty(roomId: string) {
  roomDirtyFlags.set(roomId, true);
}

app.prepare().then(async () => {
  // Auto-save every 10 seconds
  setInterval(saveDirtyRooms, 10000);

  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-room', async (roomId: string, profile: any) => {
      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);

      if (!rooms.has(roomId)) {
        // Try to load from DB
        const savedState = await loadRoomState(roomId);
        rooms.set(roomId, {
          elements: savedState?.elements || [],
          users: {},
          chat: savedState?.chat || [],
          title: savedState?.title || 'Untitled Board',
        });
      }

      const room = rooms.get(roomId);

      const user = {
        id: socket.id,
        identityId: profile?.identityId,
        name: profile?.name || `${COLORS[Math.floor(Math.random() * COLORS.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`,
        color: profile?.color || COLORS[Math.floor(Math.random() * COLORS.length)],
        image: profile?.image,
      };

      room.users[socket.id] = user;

      socket.emit('room-state', {
        elements: room.elements,
        users: room.users,
        chat: room.chat,
        title: room.title,
        me: user,
      });

      socket.to(roomId).emit('user-joined', user);
    });

    socket.on('element-add', (element: any) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).elements.push(element);
        markRoomDirty(roomId);
        socket.to(roomId).emit('element-add', element);
      }
    });

    socket.on('element-remove', (elementId: string) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.elements = room.elements.filter((el: any) => el.id !== elementId);
        markRoomDirty(roomId);
        socket.to(roomId).emit('element-remove', elementId);
      }
    });

    socket.on('element-update', (element: any) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const idx = room.elements.findIndex((el: any) => el.id === element.id);
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

    socket.on('cursor-move', (cursor: any) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('cursor-move', { userId: socket.id, cursor });
      }
    });

    socket.on('chat-message', (msg: any) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).chat.push(msg);
        markRoomDirty(roomId); // Note: we only save elements to DB right now, but we'll mark dirty anyway
        socket.to(roomId).emit('chat-message', msg);
      }
    });

    socket.on('board-title-update', async (title: string) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.title = title;
        // Persist to DB immediately
        try {
          await prisma.board.update({
            where: { id: roomId },
            data: { name: title },
          });
        } catch (err) {
          console.error(`Failed to update title for room ${roomId}:`, err);
        }
        // Broadcast to all other users in the room
        socket.to(roomId).emit('board-title-update', title);
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
