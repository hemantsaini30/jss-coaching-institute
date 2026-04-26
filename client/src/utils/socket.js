import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (socket) return socket;
  socket = io('/', {
    auth: { token },
    withCredentials: true,
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}