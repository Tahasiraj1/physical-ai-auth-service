// Quick test to verify database connection and check for tables
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful:', result.rows[0].now);

    // Check for Better Auth tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'session', 'account', 'verification', 'verification_token')
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('\n✗ No Better Auth tables found in database');
      console.log('You need to run: npx @better-auth/cli migrate');
    } else {
      console.log('\n✓ Found Better Auth tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // List all tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`\nTotal tables in database: ${allTables.rows.length}`);
    if (allTables.rows.length > 0) {
      console.log('All tables:');
      allTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();

