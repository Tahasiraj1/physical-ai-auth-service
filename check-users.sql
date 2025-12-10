-- SQL queries to check users in your Neon database
-- Run these in the Neon SQL Editor

-- 1. Count total users
SELECT COUNT(*) as total_users FROM "user";

-- 2. List all users with their emails
SELECT id, email, name, "createdAt", "updatedAt" 
FROM "user" 
ORDER BY "createdAt" DESC;

-- 3. Check for duplicate emails
SELECT email, COUNT(*) as count 
FROM "user" 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 4. Check recent sign-ups
SELECT email, name, "createdAt" 
FROM "user" 
ORDER BY "createdAt" DESC 
LIMIT 10;

