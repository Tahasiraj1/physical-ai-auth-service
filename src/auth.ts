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
    'http://localhost:3001', // Explicitly allow localhost:3001
  ],
  advanced: {
    // Configure cookies for cross-origin requests (localhost:3000 -> localhost:3001)
    defaultCookieAttributes: {
      sameSite: 'lax', // Use 'lax' for localhost, 'none' for production with HTTPS
      secure: false, // false for localhost http, true for production https
      httpOnly: true,
    },
  },
});