import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const rooms = new Map();
const socketToRoom = new Map();

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
const ANIMALS = ['Fox', 'Panda', 'Falcon', 'Tiger', 'Bear', 'Wolf', 'Hawk', 'Lion'];

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId, profile) => {
      socket.join(roomId);
      socketToRoom.set(socket.id, roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { elements: [], users: {}, chat: [] });
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
        socket.to(roomId).emit('element-add', element);
      }
    });

    socket.on('element-remove', (elementId) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.elements = room.elements.filter(el => el.id !== elementId);
        socket.to(roomId).emit('element-remove', elementId);
      }
    });

    socket.on('element-update', (element) => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const idx = room.elements.findIndex(el => el.id === element.id);
        if (idx !== -1) room.elements[idx] = element;
        socket.to(roomId).emit('element-update', element);
      }
    });

    socket.on('clear-all', () => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).elements = [];
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
