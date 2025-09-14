#!/usr/bin/env node

/**
 * Simple database migration utility for NCLEX311
 * Usage: node scripts/migrate.js
 */

const fs = require('fs');

const path = require('path');

const { sql } = require('@vercel/postgres');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  const migrationsDir = path.join(__dirname, '../migrations');

  try {
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`⚡ Running migration: ${file}`);

      const migrationContent = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf-8'
      );

      await sql.query(migrationContent);
      console.log(`✅ Completed migration: ${file}`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
