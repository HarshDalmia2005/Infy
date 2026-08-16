import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';
import { useBoardStore } from '../stores/boardStore';
import { useUserStore, User } from '../stores/userStore';
import { CanvasElement } from '../engine/types';

export function useSocket(roomId: string) {
  // Use refs to avoid stale closures and prevent effect from re-running
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();

    const handleRoomState = (state: { elements: CanvasElement[]; users: Record<string, User>; chat: unknown[]; me: User }) => {
      useBoardStore.getState().setElements(state.elements);
      useUserStore.getState().setUsers(state.users);
      useUserStore.getState().setMe(state.me);

      try {
        localStorage.setItem('infy-user-profile', JSON.stringify({ name: state.me.name, color: state.me.color }));
      } catch { /* ignore */ }
    };

    const handleUserJoined = (user: User) => useUserStore.getState().addUser(user);
    const handleUserLeft = (userId: string) => useUserStore.getState().removeUser(userId);
    const handleElementAdd = (element: CanvasElement) => useBoardStore.getState().addElement(element);
    const handleElementRemove = (elementId: string) => useBoardStore.getState().removeElement(elementId);
    const handleElementUpdate = (element: CanvasElement) => useBoardStore.getState().updateElement(element.id, element);
    const handleClearAll = () => useBoardStore.getState().clearAll();
    const handleCursorMove = ({ userId, cursor }: { userId: string; cursor: { x: number; y: number } }) => {
      useUserStore.getState().updateUserCursor(userId, cursor);
    };

    // Register all listeners first
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.ELEMENT_ADD, handleElementAdd);
    socket.on(SOCKET_EVENTS.ELEMENT_REMOVE, handleElementRemove);
    socket.on(SOCKET_EVENTS.ELEMENT_UPDATE, handleElementUpdate);
    socket.on('clear-all', handleClearAll);
    socket.on(SOCKET_EVENTS.CURSOR_MOVE, handleCursorMove);

    const joinRoom = () => {
      console.log('[socket] connected, joining room', roomIdRef.current);

      let profile = null;
      try {
        const saved = localStorage.getItem('infy-user-profile');
        if (saved) profile = JSON.parse(saved);
      } catch { /* ignore */ }

      socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomIdRef.current, profile);
    };

    if (socket.connected) {
      // Already connected (e.g. hot reload)
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    socket.connect();

    return () => {
      socket.off('connect', joinRoom);
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
      socket.off(SOCKET_EVENTS.ELEMENT_ADD, handleElementAdd);
      socket.off(SOCKET_EVENTS.ELEMENT_REMOVE, handleElementRemove);
      socket.off(SOCKET_EVENTS.ELEMENT_UPDATE, handleElementUpdate);
      socket.off('clear-all', handleClearAll);
      socket.off(SOCKET_EVENTS.CURSOR_MOVE, handleCursorMove);
      socket.disconnect();
    };
  }, []); // Empty deps — runs once, uses refs for roomId
}
