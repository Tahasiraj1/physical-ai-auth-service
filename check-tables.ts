import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkTables() {
  try {
    console.log('Checking existing tables in database...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (result.rows.length === 0) {
      console.log('No tables found in database.');
      console.log('\n⚠ You need to run Better Auth migration first:');
      console.log('   npm run migrate');
    } else {
      console.log(`Found ${result.rows.length} table(s):\n`);
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      // Check for Better Auth tables
      const betterAuthTables = ['user', 'session', 'account', 'verification'];
      const foundAuthTables = result.rows
        .map(r => r.table_name)
        .filter(name => betterAuthTables.includes(name.toLowerCase()));
      
      if (foundAuthTables.length === 0) {
        console.log('\n⚠ No Better Auth tables found!');
        console.log('   Run: npm run migrate');
      } else {
        console.log('\n✓ Better Auth tables found:');
        foundAuthTables.forEach(table => console.log(`   - ${table}`));
      }
      
      // Check for custom tables
      const customTables = ['bookmark', 'user_note', 'user_comment', 'reading_progress'];
      const foundCustomTables = result.rows
        .map(r => r.table_name)
        .filter(name => customTables.includes(name.toLowerCase()));
      
      if (foundCustomTables.length === 0) {
        console.log('\n⚠ Custom personalization tables not found.');
        console.log('   Run: npm run migrate:custom');
      } else {
        console.log('\n✓ Custom tables found:');
        foundCustomTables.forEach(table => console.log(`   - ${table}`));
      }
    }
  } catch (error: any) {
    console.error('✗ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();

