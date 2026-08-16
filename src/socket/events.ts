export const SOCKET_EVENTS = {
  // Connection
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_STATE: 'room-state', // Sent when a user joins
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  
  // Drawing state
  ELEMENT_ADD: 'element-add',
  ELEMENT_REMOVE: 'element-remove',
  ELEMENT_UPDATE: 'element-update',
  
  // Cursor
  CURSOR_MOVE: 'cursor-move',
  
  // Chat
  CHAT_MESSAGE: 'chat-message',
} as const;
