#!/usr/bin/env node

/**
 * Meter Reader PWA - Mock Data Generator (Auth-Linked)
 * 
 * Generates test data linked to YOUR auth user account.
 * Run this AFTER signing up via the app.
 * 
 * Usage:
 *   1. Sign up via the app (https://meter-reader-pwa.vercel.app)
 *   2. Get your user ID from Supabase Dashboard → Authentication → Users
 *   3. Set SUPABASE_SERVICE_ROLE_KEY in .env
 *   4. Run: node scripts/generate-mock-data-linked.js
 * 
 * Environment variables (or .env file):
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (for admin operations)
 *   AUTH_USER_ID - Your auth.users.id (from Supabase Dashboard)
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://qjvexijvewosweznmgtg.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  authUserId: process.env.AUTH_USER_ID,
  
  // Data generation settings
  numMeters: 20,
  numReadingsPerMeter: 15,
  daysOfHistory: 365,
  
  // Geographic center (Los Angeles)
  centerLat: 34.0522,
  centerLon: -118.2437,
  locationRadiusKm: 50,
  
  // Meter type distribution
  meterTypes: {
    water: 0.35,
    electric: 0.35,
    gas: 0.20,
    solar: 0.10
  },
  
  units: {
    water: 'gallons',
    electric: 'kWh',
    gas: 'therms',
    solar: 'kWh'
  },
  
  readingRanges: {
    water: { min: 500, max: 5000 },
    electric: { min: 100, max: 2000 },
    gas: { min: 10, max: 200 },
    solar: { min: 0, max: 1500 }
  }
};

// Validate configuration
if (!CONFIG.authUserId) {
  console.error('❌ Missing AUTH_USER_ID environment variable');
  console.error('');
  console.error('To get your user ID:');
  console.error('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qjvexijvewosweznmgtg');
  console.error('2. Go to Authentication → Users');
  console.error('3. Find your user (the one you just signed up with)');
  console.error('4. Copy the User ID (UUID format)');
  console.error('5. Add to .env: AUTH_USER_ID=your-user-id-here');
  process.exit(1);
}

if (!CONFIG.supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Add to .env: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('(Find it in Supabase Dashboard → Settings → API)');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Utility functions
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(obj) {
  const keys = Object.keys(obj);
  const values = Object.values(obj);
  const rand = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < values.length; i++) {
    cumulative += values[i];
    if (rand <= cumulative) {
      return keys[i];
    }
  }
  return keys[keys.length - 1];
}

function randomDate(daysBack) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - randomInt(0, daysBack) * 24 * 60 * 60 * 1000);
  return pastDate.toISOString();
}

function generateGPSPoint(centerLat, centerLon, radiusKm) {
  const radiusDegrees = radiusKm / 111;
  const lat = centerLat + randomFloat(-radiusDegrees, radiusDegrees);
  const lon = centerLon + randomFloat(-radiusDegrees, radiusDegrees);
  return { lat, lon };
}

function generateMeterNumber(type) {
  const prefixes = {
    water: 'W',
    electric: 'E',
    gas: 'G',
    solar: 'S'
  };
  const prefix = prefixes[type] || 'M';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 9999)}`;
}

function generateMockMeter(userId, type, index) {
  const gps = generateGPSPoint(CONFIG.centerLat, CONFIG.centerLon, CONFIG.locationRadiusKm);
  const range = CONFIG.readingRanges[type];
  
  return {
    id: uuidv4(),
    user_id: userId,
    meter_number: generateMeterNumber(type),
    meter_type: type,
    manufacturer: ['Badger', 'Neptune', 'Sensus', 'Kamstrup', 'Landis+Gyr'][randomInt(0, 4)],
    model: `Model-${randomInt(100, 999)}`,
    serial_number: `SN-${Date.now().toString(36).toUpperCase()}`,
    install_date: randomDate(365 * 3).split('T')[0],
    location: `SRID=4326;POINT(${gps.lon} ${gps.lat})`,
    address: `${randomInt(100, 9999)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][randomInt(0, 4)]} St`,
    city: ['Los Angeles', 'Santa Monica', 'Pasadena', 'Burbank', 'Long Beach'][randomInt(0, 4)],
    state: 'CA',
    zip_code: `${randomInt(90001, 93599)}`,
    status: randomChoice({ active: 0.85, inactive: 0.10, maintenance: 0.05 }),
    last_reading_date: randomDate(30),
    metadata: {
      installYear: randomInt(2018, 2024),
      lastMaintenance: randomDate(180).split('T')[0]
    }
  };
}

function generateMockReading(meterId, meterType, previousValue) {
  const range = CONFIG.readingRanges[meterType];
  const delta = randomFloat(range.min, range.max);
  const value = previousValue + delta;
  
  return {
    id: uuidv4(),
    meter_id: meterId,
    reading_timestamp: randomDate(CONFIG.daysOfHistory),
    value: parseFloat(value.toFixed(4)),
    unit: CONFIG.units[meterType],
    reading_type: randomChoice({ actual: 0.80, estimated: 0.15, self_read: 0.05 }),
    source: randomChoice({ manual: 0.60, iot_device: 0.25, ocr: 0.10, api: 0.05 }),
    previous_value: previousValue !== null ? parseFloat(previousValue.toFixed(4)) : null,
    delta_value: parseFloat(delta.toFixed(4)),
    cost: meterType === 'electric' ? parseFloat((delta * 0.15).toFixed(2)) : null,
    metadata: {
      temperature: randomFloat(50, 95).toFixed(1),
      humidity: randomFloat(20, 80).toFixed(1)
    },
    photo_url: Math.random() > 0.7 ? `https://example.com/meter-photos/${uuidv4()}.jpg` : null,
    notes: null
  };
}

// Main generation function
async function generateMockData() {
  console.log('🧪 Meter Reader PWA - Auth-Linked Mock Data Generator\n');
  console.log(`📍 Supabase URL: ${CONFIG.supabaseUrl}`);
  console.log(`👤 Auth User ID: ${CONFIG.authUserId}`);
  console.log(`📊 Generating:`);
  console.log(`   - ${CONFIG.numMeters} meters`);
  console.log(`   - ~${CONFIG.numMeters * CONFIG.numReadingsPerMeter} readings\n`);
  
  // Verify user exists
  console.log('🔍 Verifying auth user...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', CONFIG.authUserId)
    .single();
  
  if (userError || !userData) {
    console.log('   ⚠️ User profile not found in public.users, creating...');
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: CONFIG.authUserId,
        email: 'user@meterreader.test',
        full_name: 'Test User',
        timezone: 'America/Los_Angeles',
        preferences: {}
      });
    
    if (insertError) {
      console.error('   ❌ Error creating user profile:', insertError.message);
      return;
    }
    console.log('   ✅ User profile created');
  } else {
    console.log(`   ✅ Found user: ${userData.email}`);
  }
  
  const meters = [];
  const readings = [];
  
  // Generate meters
  console.log('\n📊 Generating meters...');
  let cumulativeValue = {};
  
  for (let i = 0; i < CONFIG.numMeters; i++) {
    const meterType = randomChoice(CONFIG.meterTypes);
    const meter = generateMockMeter(CONFIG.authUserId, meterType, i);
    cumulativeValue[meter.id] = randomFloat(1000, 50000);
    meters.push(meter);
  }
  
  // Generate readings
  console.log('📈 Generating readings...');
  for (const meter of meters) {
    let meterCumulativeValue = cumulativeValue[meter.id];
    
    for (let i = 0; i < CONFIG.numReadingsPerMeter; i++) {
      const reading = generateMockReading(meter.id, meter.meter_type, meterCumulativeValue);
      meterCumulativeValue = reading.value;
      readings.push(reading);
    }
  }
  
  // Insert data
  console.log('\n📤 Inserting data into Supabase...\n');
  
  // Insert meters
  console.log('   Inserting meters...');
  const { error: meterError } = await supabase.from('meters').insert(meters);
  if (meterError) {
    console.error('   ❌ Error inserting meters:', meterError.message);
    return;
  }
  console.log(`   ✅ Inserted ${meters.length} meters`);
  
  // Insert readings in batches
  console.log('   Inserting readings (in batches)...');
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);
    const { error: readingError } = await supabase.from('readings').insert(batch);
    
    if (readingError) {
      console.error(`   ❌ Error inserting readings batch ${Math.floor(i/batchSize) + 1}:`, readingError.message);
      continue;
    }
    
    inserted += batch.length;
    console.log(`      Progress: ${inserted}/${readings.length} readings (${Math.round(inserted/readings.length * 100)}%)`);
  }
  
  console.log(`   ✅ Inserted ${inserted} readings\n`);
  
  // Summary
  console.log('🎉 Mock data generation complete!\n');
  console.log('📊 Summary:');
  console.log(`   Meters:   ${meters.length}`);
  console.log(`   Readings: ${inserted}`);
  console.log(`   User:     ${CONFIG.authUserId}`);
  console.log('\n✅ RLS can now be safely enabled - all data is linked to your user!\n');
  console.log('🔍 Verify in Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/qjvexijvewosweznmgtg/editor\n`);
}

// Run
generateMockData().catch(err => {
  console.error('❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
