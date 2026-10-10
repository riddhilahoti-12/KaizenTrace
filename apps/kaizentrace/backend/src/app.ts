import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  app.use(express.json());

  // Mount API
  app.use('/api', apiRouter);

  // Fallback 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}
