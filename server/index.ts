import express from 'express';
import autoroutes from 'express-automatic-routes';
import { Server, Socket } from 'socket.io';
import http from 'http';
import ip from 'ip';

const app = express();
autoroutes(app, { dir: process.cwd() + '/server/api' });

const httpServer = http.createServer(app);
httpServer.on('close', () => {
  console.log('httpServer onClose');
});

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://' + ip.address() + ':3000'],
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

try {
  console.log('socket.io listen start');
  httpServer.listen(3001);
} catch (e) {}
module.exports = {
  path: '/api/',
  handler: app,
  unload: () => {
    io.disconnectSockets();
    io.close();
    httpServer.close();
  },
};
