import express from 'express';
import autoroutes from 'express-automatic-routes';
import { Server, Socket } from 'socket.io';
import http from 'http';
import os from 'os';

const app = express();
autoroutes(app, { dir: process.cwd() + '/server/api' });

module.exports = {
  path: '/api/',
  handler: app,
};
