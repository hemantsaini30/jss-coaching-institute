import { io } from 'socket.io-client'

let socket = null

export function getSocket() { return socket }

export function connectSocket() {
  if (!socket) {
    socket = io('/', { withCredentials: true, transports: ['websocket'] })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}