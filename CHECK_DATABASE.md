# How to Check Your Database in Neon

## Steps to Check Users in Neon Database

1. **Go to your Neon Dashboard**: https://console.neon.tech/

2. **Select your project** (the one with your database)

3. **Click on "SQL Editor"** in the left sidebar

4. **Run these queries**:

### Count Total Users
```sql
SELECT COUNT(*) as total_users FROM "user";
```

### List All Users
```sql
SELECT id, email, name, "createdAt", "updatedAt" 
FROM "user" 
ORDER BY "createdAt" DESC;
```

### Check for Duplicate Emails
```sql
SELECT email, COUNT(*) as count 
FROM "user" 
GROUP BY email 
HAVING COUNT(*) > 1;
```

### Check Recent Sign-ups
```sql
SELECT email, name, "createdAt" 
FROM "user" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## What to Look For

- **If you see multiple users with the same email**: Better Auth is not preventing duplicates (this is a bug we need to fix)
- **If you see no users**: Sign-up is not working properly
- **If you see one user per email**: Sign-up is working correctly, but the duplicate check might not be showing errors properly

## Notes

- Better Auth should automatically prevent duplicate emails by creating a unique constraint on the email field
- If duplicates exist, the database constraint might not have been created properly during migration

