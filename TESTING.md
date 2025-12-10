# Testing Authentication

## Prerequisites

1. ✅ Environment variables set in `Auth/.env`:
   - `DATABASE_URL` - Neon Postgres connection string
   - `BETTER_AUTH_SECRET` - Secret key (32+ chars)
   - `BETTER_AUTH_URL=http://localhost:3000`
   - `FRONTEND_URL=http://localhost:3001`
   - `NODE_ENV=development`

2. ✅ Dependencies installed: `npm install`

## Step 1: Run Database Migrations

Better Auth needs to create its database tables:

```powershell
cd Auth
npx @better-auth/cli migrate
```

This will create the following tables:
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts (if used)
- `verification` - Email verification tokens
- `password` - Password hashes

## Step 2: Create Custom Tables (Optional)

If you want to test personalization features, run the custom tables migration:

```powershell
# Connect to your Neon database and run:
psql $DATABASE_URL -f src/db/migrations/001-custom-tables.sql
```

Or use a database client to execute the SQL from `src/db/migrations/001-custom-tables.sql`.

## Step 3: Start the Auth Server

```powershell
cd Auth
npm run dev
```

The server should start on `http://localhost:3000` and you'll see:
```
Auth service running on http://localhost:3000
Better Auth endpoints available at http://localhost:3000/api/auth/*
```

## Step 4: Test Authentication Endpoints

### Health Check
```powershell
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-27T..."}
```

### Sign Up (Create Account)
```powershell
curl -X POST http://localhost:3000/api/auth/sign-up/email `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User"
  },
  "session": {...}
}
```

### Sign In
```powershell
curl -X POST http://localhost:3000/api/auth/sign-in/email `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

### Get Session
```powershell
curl http://localhost:3000/api/auth/get-session `
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

## Step 5: Test Frontend Integration

1. Start Docusaurus dev server (in root directory):
   ```powershell
   npm start
   ```

2. Navigate to:
   - Sign Up: `http://localhost:3001/signup`
   - Sign In: `http://localhost:3001/signin`
   - Dashboard: `http://localhost:3001/dashboard` (requires sign in)

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check Neon database is running
- Ensure SSL is configured correctly

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Update `BETTER_AUTH_URL` accordingly

### CORS Errors
- Verify `FRONTEND_URL` matches your Docusaurus URL
- Check browser console for specific CORS errors

### Migration Errors
- Ensure database connection is working
- Check if tables already exist (may need to drop and recreate)

