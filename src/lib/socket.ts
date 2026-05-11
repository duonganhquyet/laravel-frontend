import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  autoConnect: false
});

export const setSocketAuthToken = (token: string | null) => {
  socket.auth = token ? { token } : {};
};