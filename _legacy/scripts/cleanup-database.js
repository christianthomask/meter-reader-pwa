#!/usr/bin/env node

/**
 * Meter Reader PWA - Database Cleanup Script
 * Deletes all mock data while preserving auth users
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

config();

const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://qjvexijvewosweznmgtg.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
};

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

async function cleanup() {
  console.log('🧹 Meter Reader PWA - Database Cleanup\n');
  console.log(`📍 Supabase URL: ${CONFIG.supabaseUrl}`);
  console.log('⚠️  This will DELETE ALL mock data (preserving auth users)\n');
  
  const tables = [
    'route_assignments',
    'readers',
    'readings',
    'meters',
    'cycles',
    'cities'
  ];
  
  for (const table of tables) {
    console.log(`   Deleting from ${table}...`);
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error(`   ❌ Error deleting from ${table}:`, error.message);
    } else {
      console.log(`   ✅ ${table} cleared`);
    }
  }
  
  console.log('\n🎉 Cleanup complete!\n');
  console.log('📊 Next steps:');
  console.log('   1. Run: node scripts/generate-mock-data.js');
  console.log('   2. Verify data in Supabase Dashboard\n');
}

cleanup().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
