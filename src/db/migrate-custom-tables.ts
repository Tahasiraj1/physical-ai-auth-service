import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  try {
    console.log('Running custom tables migrations...');
    
    // Run first migration: 001-custom-tables.sql
    console.log('\n1. Running migration: 001-custom-tables.sql');
    const migration1Path = join(__dirname, 'migrations', '001-custom-tables.sql');
    const migration1SQL = readFileSync(migration1Path, 'utf-8');
    await pool.query(migration1SQL);
    console.log('   ✓ Migration 001 completed');
    
    // Run second migration: 002-avatar-personalization.sql
    console.log('\n2. Running migration: 002-avatar-personalization.sql');
    const migration2Path = join(__dirname, 'migrations', '002-avatar-personalization.sql');
    const migration2SQL = readFileSync(migration2Path, 'utf-8');
    await pool.query(migration2SQL);
    console.log('   ✓ Migration 002 completed');
    
    console.log('\n✓ All migrations completed successfully!');
    
    // Verify tables were created
    const tablesToCheck = ['bookmark', 'user_note', 'user_comment', 'reading_progress', 'user_profile', 'chat_session', 'avatar'];
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (${tablesToCheck.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY table_name;
    `, tablesToCheck);
    
    console.log('\n✓ Verified tables created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    const missingTables = tablesToCheck.filter(
      table => !result.rows.some(row => row.table_name === table)
    );
    
    if (missingTables.length > 0) {
      console.log('\n⚠ Warning: Some tables were not created:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    // Verify avatar table has data
    const avatarCount = await pool.query('SELECT COUNT(*) as count FROM avatar');
    console.log(`\n✓ Avatar table contains ${avatarCount.rows[0].count} avatars`);
    
  } catch (error: any) {
    console.error('✗ Migration failed:', error.message);
    if (error.code === '42P01') {
      console.error('\n⚠ Error: A required table (likely "user") does not exist.');
      console.error('Please run Better Auth migration first: npm run migrate');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

