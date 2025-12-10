# Better Auth Database Migration Guide

## Problem
If you've signed up multiple times but your database shows no tables, the migration hasn't run successfully.

## Solution Steps

### Step 1: Verify Environment Variables

Make sure your `.env` file in the `Auth` directory contains:
```env
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

### Step 2: Test Database Connection

Run the test script to verify your database connection and check for existing tables:

```bash
cd Auth
npm run test-db
```

This will:
- Test the database connection
- Check if Better Auth tables exist
- List all tables in your database

### Step 3: Run Migration

**Option A: Using npm script (recommended)**
```bash
cd Auth
npm run migrate
```

**Option B: Using npx directly**
```bash
cd Auth
npx @better-auth/cli migrate
```

**Option C: Using bash script (if npm/npx not in PowerShell PATH)**
```bash
cd Auth
bash run-migration.sh
```

### Step 4: Verify Migration Success

After running the migration, you should see output like:
```
✓ Checking database...
✓ Creating tables...
✓ Migration completed successfully
```

Then verify tables were created:
```bash
npm run test-db
```

You should see tables like:
- `user`
- `session`
- `account`
- `verification`
- `verification_token`

### Troubleshooting

#### Issue: Migration command doesn't show any output
- Make sure `DATABASE_URL` is set correctly in `.env`
- Try running with environment variables explicitly:
  ```bash
  export DATABASE_URL="your-connection-string"
  npx @better-auth/cli migrate
  ```

#### Issue: "Cannot find module" errors
- Make sure you're in the `Auth` directory
- Run `npm install` to ensure all dependencies are installed

#### Issue: Node.js version warnings
- These are warnings, not errors
- Migration should still work with Node.js v21.7.1
- For best compatibility, upgrade to Node.js 20.x or 22.x LTS

#### Issue: Database connection errors
- Verify your `DATABASE_URL` is correct
- Check that your database server is accessible
- For Neon Postgres, ensure SSL is enabled (should be in connection string)

### Manual Table Creation (Last Resort)

If the migration command continues to fail, you can manually create the tables. However, this is not recommended as Better Auth's schema may change. The migration command is the preferred method.

## Next Steps

After successful migration:
1. Test sign-up: `curl -X POST http://localhost:3000/api/auth/sign-up -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'`
2. Check your database - you should see a new user record
3. Start your Docusaurus frontend and test the sign-up/sign-in pages

