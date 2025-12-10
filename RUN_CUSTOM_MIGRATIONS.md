# Running Custom Personalization Tables Migration

The 500 errors you're seeing are because the custom personalization tables (bookmark, user_note, user_comment, etc.) don't exist yet in your database.

## Steps to Fix

1. **Make sure Better Auth tables exist first**:
   ```bash
   cd Auth
   npx @better-auth/cli migrate
   ```

2. **Run the custom tables migration**:
   
   You can run the SQL file directly in your Neon database:
   
   - Go to your Neon dashboard
   - Open the SQL Editor
   - Copy and paste the contents of `Auth/src/db/migrations/001-custom-tables.sql`
   - Execute the SQL
   
   OR use psql:
   ```bash
   cd Auth
   # Get your DATABASE_URL from .env
   # Then run:
   psql $DATABASE_URL -f src/db/migrations/001-custom-tables.sql
   ```
   
   OR use Node.js:
   ```bash
   cd Auth
   node -e "
   const { Pool } = require('pg');
   const fs = require('fs');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   const sql = fs.readFileSync('src/db/migrations/001-custom-tables.sql', 'utf8');
   pool.query(sql).then(() => {
     console.log('Migration successful!');
     process.exit(0);
   }).catch(err => {
     console.error('Migration failed:', err);
     process.exit(1);
   });
   "
   ```

3. **Verify tables were created**:
   ```bash
   cd Auth
   npm run test-db
   ```

## Tables Created

After running the migration, these tables will be created:
- `user_profile` - User preferences and learning level
- `reading_progress` - Tracks which sections users have viewed
- `bookmark` - User bookmarks
- `user_note` - User notes on sections
- `user_comment` - User comments/discussions
- `chat_session` - Chatbot session history
- `downloadable_resource` - Resources available for download
- `download_history` - Tracks resource downloads
- `module_recommendation` - Cached recommendations

## After Migration

Once the tables are created, restart your Auth server:
```bash
cd Auth
npm run dev
```

The dashboard and other personalization endpoints should now work!

