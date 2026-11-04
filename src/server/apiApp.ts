import express from 'express';
import { apiRouter } from './apiRouter';

export const apiApp = express();

apiApp.use(express.json({ limit: '10mb' }));
apiApp.use(apiRouter);
