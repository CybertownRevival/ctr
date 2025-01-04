import 'reflect-metadata';
import * as http from 'http';
import express from 'express';
const fileUpload = require('express-fileupload');
import { Request, Response } from 'express';
import morgan from 'morgan';
import {
  adminRoutes,
  avatarRoutes,
  blockRoutes,
  clubRoutes,
  colonyRoutes,
  fleamarketRoutes,
  homeRoutes,
  hoodRoutes,
  inboxRoutes,
  mallRoutes,
  memberRoutes,
  messageRoutes,
  messageboardRoutes,
  objectInstanceRoutes,
  objectRoutes,
  placeRoutes,
} from './routes';

require('./cron/cron')();

interface HttpException extends Error {
  status: number;
}

const app = express();
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use((request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, apitoken',
  );
  if (request.method === 'OPTIONS') {
    response.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return response.status(200).json({});
  }
  next();
});

app.use('/api/member', memberRoutes);
app.use('/api/place', placeRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/object_instance', objectInstanceRoutes);
app.use('/api/object', objectRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/hood', hoodRoutes);
app.use('/api/colony', colonyRoutes);
app.use('/api/block', blockRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/messageboard', messageboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/mall', mallRoutes);
app.use('/api/fleamarket', fleamarketRoutes);
app.use('/api/club', clubRoutes);

app.use((request, response, next) => {
  const error = new Error('Not found');
  response.status(404);
  next(error);
});

app.use((error: HttpException, request: Request, response: Response) => {
  response.status(error.status || 500);
  response.json({ error: { message: error.message } });
});

const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Listening on port ${port}`));
