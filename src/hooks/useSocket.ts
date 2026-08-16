import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';
import { useBoardStore } from '../stores/boardStore';
import { useUserStore } from '../stores/userStore';
import { CanvasElement } from '../engine/types';

export function useSocket(roomId: string) {
  // Use refs to avoid stale closures and prevent effect from re-running
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    const socket = getSocket();

    const handleRoomState = (state: { elements: CanvasElement[]; users: any; me: any }) => {
      useBoardStore.getState().setElements(state.elements);
      useUserStore.getState().setUsers(state.users);
      useUserStore.getState().setMe(state.me);
    };

    const handleUserJoined = (user: any) => useUserStore.getState().addUser(user);
    const handleUserLeft = (userId: string) => useUserStore.getState().removeUser(userId);
    const handleElementAdd = (element: CanvasElement) => useBoardStore.getState().addElement(element);
    const handleElementRemove = (elementId: string) => useBoardStore.getState().removeElement(elementId);
    const handleCursorMove = ({ userId, cursor }: { userId: string; cursor: { x: number; y: number } }) => {
      useUserStore.getState().updateUserCursor(userId, cursor);
    };

    // Register all listeners first
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(SOCKET_EVENTS.ELEMENT_ADD, handleElementAdd);
    socket.on(SOCKET_EVENTS.ELEMENT_REMOVE, handleElementRemove);
    socket.on(SOCKET_EVENTS.CURSOR_MOVE, handleCursorMove);

    const joinRoom = () => {
      console.log('[socket] connected, joining room', roomIdRef.current);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomIdRef.current);
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
      socket.off(SOCKET_EVENTS.CURSOR_MOVE, handleCursorMove);
      socket.disconnect();
    };
  }, []); // Empty deps — runs once, uses refs for roomId
}
