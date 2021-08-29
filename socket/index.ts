import express from 'express';
import { Server, Socket } from 'socket.io';
import http from 'http';
import os from 'os';

const app = express();

const httpServer = http.createServer(app);
httpServer.on('close', () => {
  console.log('httpServer onClose');
});

const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://' +
        (process.env.HOSTNAME || os.hostname()) +
        ':' +
        process.env.NUXT_PORT,
    ],
  },
});
io.on('close', () => {
  console.log('socket.io onClose');
});

io.on('connection', (socket: Socket) => {
  console.log('server onConnection', { id: socket.id });
  socket.on('echo', (args, ack) => {
    console.log('server echo', { id: socket.id });
    ack('echo-response-acknowladge', args);
    socket.emit('echo-response', args);
  });
});
io.on('disconnect', (socket: Socket) => {
  console.log('server onDisconnect', { id: socket.id });
});
io.on('connect', (socket: Socket) => {
  console.log('server onConnect', { id: socket.id });
});

console.log('socket.io listen start');
httpServer.listen(process.env.SOCKET_IO_PORT);

module.exports = {
  handler: app,
  unload: () => {
    io.disconnectSockets();
    io.close();
    httpServer.close();
  },
};
