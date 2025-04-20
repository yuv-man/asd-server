// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Core dependencies
import express from 'express';
import router from "./router.js";
import http from 'http';
import socketIO from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './utils/errorHandler.js';

import initializeSocket from './socket/socket-handler.js';

// Initialize express application
class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIO(this.server, {
      cors: {
        origin: [process.env.CLIENT_URL , 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Make io instance available for export
    Server.io = this.io;

    // Initialize socket handlers
    initializeSocket(this.io);

    // Middleware
    this.app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(morgan('dev'));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(router);
    this.app.use(errorHandler);
    
  }
  // Get the Socket.IO instance
  static getIO() {
    return Server.io;
  }

  start() {
    return new Promise((resolve, reject) => {
      const PORT = process.env.PORT || 5000;
      this.server.listen(PORT, (err) => {
        if (err) {
          console.error('Failed to start server:', err);
          reject(err);
          return;
        }
        console.log(`Server running on port ${PORT}`);
        resolve();
      });
    });
  }
}

export const server = new Server();
export const io = Server.getIO();