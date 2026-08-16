import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';
import { useBoardStore } from '../stores/boardStore';
import { useUserStore, User } from '../stores/userStore';
import { CanvasElement } from '../engine/types';
import { useSession } from 'next-auth/react';

export function useSocket(roomId: string) {
  const { data: session, status } = useSession();
  // Use refs to avoid stale closures and prevent effect from re-running
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (status === 'loading') return;

    const socket = getSocket();

    const handleRoomState = (state: { elements: CanvasElement[]; users: Record<string, User>; chat: unknown[]; me: User; title?: string }) => {
      useBoardStore.getState().setElements(state.elements);
      useBoardStore.getState().setBoardTitle(state.title || 'Untitled Board');
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
    const handleBoardTitleUpdate = (title: string) => {
      useBoardStore.getState().setBoardTitle(title);
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
    socket.on(SOCKET_EVENTS.BOARD_TITLE_UPDATE, handleBoardTitleUpdate);

    const joinRoom = () => {
      console.log('[socket] connected, joining room', roomIdRef.current);

      let profile: any = null;
      try {
        if (session?.user) {
          profile = {
            identityId: session.user.id || session.user.email,
            name: session.user.name,
            image: session.user.image,
          };
        } else {
          const saved = localStorage.getItem('infy-user-profile');
          if (saved) profile = JSON.parse(saved);
          if (!profile?.identityId) {
            profile = { ...profile, identityId: Math.random().toString(36).substring(7) };
          }
        }
        
        // Save the profile so anonymous users keep their identity across refreshes
        if (profile) {
          localStorage.setItem('infy-user-profile', JSON.stringify({
            identityId: profile.identityId,
            name: profile.name,
            color: profile.color
          }));
        }
      } catch { /* ignore */ }

      socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomIdRef.current, profile);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
      socket.connect();
    }

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
      socket.off(SOCKET_EVENTS.BOARD_TITLE_UPDATE, handleBoardTitleUpdate);
      socket.disconnect();
    };
  }, [roomId, session, status]);
}
