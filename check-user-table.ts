import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkUserTable() {
  try {
    console.log('Checking user table structure...\n');
    
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'user'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.log('✗ User table not found!');
    } else {
      console.log('User table columns:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check for id column specifically
      const idColumn = result.rows.find(r => r.column_name === 'id');
      if (idColumn) {
        console.log(`\n✓ Found id column: ${idColumn.data_type}`);
      } else {
        console.log('\n⚠ No id column found!');
      }
    }
  } catch (error: any) {
    console.error('✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserTable();

