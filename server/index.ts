import express from 'express';
import autoroutes from 'express-automatic-routes';

const app = express();
autoroutes(app, { dir: process.cwd() + '/server/api' });

module.exports = {
  path: '/api/',
  handler: app,
};
