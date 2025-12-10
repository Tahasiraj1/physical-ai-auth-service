# Quick Start Guide - Testing Authentication

## ✅ Prerequisites Check
- [x] Environment variables set in `Auth/.env`
- [x] Dependencies installed (`npm install`)

## Step 1: Run Database Migrations

**Important**: Before starting the server, you need to create the database tables.

```powershell
cd Auth
npx @better-auth/cli migrate
```

This creates Better Auth tables: `user`, `session`, `account`, `verification`, `password`.

**Note**: If migration fails, ensure:
- `DATABASE_URL` is correct and database is accessible
- Database connection has proper permissions

## Step 2: Start the Auth Server

```powershell
cd Auth
npm run dev
```

You should see:
```
Auth service running on http://localhost:3000
Better Auth endpoints available at http://localhost:3000/api/auth/*
```

## Step 3: Test Endpoints

### Health Check
```powershell
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Sign Up (Create Account)
```powershell
curl -X POST http://localhost:3000/api/auth/sign-up/email `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test1234!\",\"name\":\"Test User\"}'
```

### Sign In
```powershell
curl -X POST http://localhost:3000/api/auth/sign-in/email `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test1234!\"}'
```

### Get Session
```powershell
curl http://localhost:3000/api/auth/get-session `
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

## Step 4: Test Frontend

1. **Start Docusaurus** (in root directory):
   ```powershell
   npm start
   ```

2. **Navigate to**:
   - Sign Up: `http://localhost:3001/signup`
   - Sign In: `http://localhost:3001/signin`
   - Dashboard: `http://localhost:3001/dashboard` (requires sign in)

## Troubleshooting

### Server Won't Start
- Check if port 3000 is already in use
- Verify `.env` file exists in `Auth/` directory
- Check database connection: `DATABASE_URL` must be valid

### Migration Errors
- Ensure database is accessible
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- For Neon: Ensure SSL is enabled in connection string

### CORS Errors
- Verify `FRONTEND_URL` matches Docusaurus URL (`http://localhost:3001`)
- Check browser console for specific CORS errors

### Database Connection Errors
- Test connection: `psql $DATABASE_URL` (if psql is installed)
- Verify Neon database is running
- Check SSL configuration for Neon

