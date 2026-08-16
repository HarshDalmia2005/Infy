import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    // In dev, Next.js proxy handles this. In prod, same origin.
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      autoConnect: false,
    });
  }
  return socket;
};
