import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables FIRST, before creating the pool
dotenv.config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can be enabled later
  },
  secret: process.env.BETTER_AUTH_SECRET || '',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'https://tahasiraj1.github.io',
    'https://tahasiraj1.github.io/Physical-AI-Humanoid-Robotics-Textbook',
  ],
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production', // true for HTTPS
      httpOnly: true,
    },
  },
});