import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { Pool } from 'pg';
import { auth } from './auth.js';

// Load environment variables
dotenv.config();

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Better Auth handler
app.all('/api/auth/*', toNodeHandler(auth));

// Mount personalization routes
import personalizationRoutes from './routes/personalization.js';
app.use('/api/personalization', personalizationRoutes);

// Mount avatar routes
import avatarRoutes from './routes/avatar.js';
app.use('/api/avatar', avatarRoutes);
app.use('/api/personalization', avatarRoutes); // Also mount avatar endpoints under /api/personalization

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Auth service running on http://localhost:${port}`);
  console.log(`Better Auth endpoints available at http://localhost:${port}/api/auth/*`);
});

export default app;

