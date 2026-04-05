#!/usr/bin/env node

/**
 * Meter Reader PWA - Mock Data Generator
 * 
 * Generates realistic test data for development/testing:
 * - 100+ meters (water, electric, gas, solar)
 * - 1000+ readings with varied timestamps
 * - GPS coordinates (default: Los Angeles area)
 * - Realistic usage patterns
 * 
 * Usage:
 *   npm install
 *   node scripts/generate-mock-data.js
 * 
 * Environment variables (or .env file):
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_ANON_KEY - Your Supabase anon/public key
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
config();

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://qjvexijvewosweznmgtg.supabase.co',
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj',
  
  // Data generation settings
  numUsers: 5,
  numMetersPerUser: 20,  // Total: 100 meters
  numReadingsPerMeter: 15,  // Total: 1500+ readings
  daysOfHistory: 365,
  
  // Geographic center (Los Angeles)
  centerLat: 34.0522,
  centerLon: -118.2437,
  locationRadiusKm: 50,  // Spread meters within 50km
  
  // Meter type distribution
  meterTypes: {
    water: 0.35,
    electric: 0.35,
    gas: 0.20,
    solar: 0.10
  },
  
  // Units by meter type
  units: {
    water: 'gallons',
    electric: 'kWh',
    gas: 'therms',
    solar: 'kWh'
  },
  
  // Typical reading ranges by meter type (per reading period)
  readingRanges: {
    water: { min: 500, max: 5000 },
    electric: { min: 100, max: 2000 },
    gas: { min: 10, max: 200 },
    solar: { min: 0, max: 1500 }  // Solar can be 0 at night
  }
};

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
  // Convert radius to degrees (approximate)
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

function generateMockUser(index) {
  return {
    id: uuidv4(),
    email: `user${index}@meterreader.test`,
    full_name: `Test User ${index}`,
    phone: `+1-555-01${randomInt(10, 99)}`,
    timezone: 'America/Los_Angeles',
    preferences: JSON.stringify({
      notifications: true,
      units: 'imperial',
      theme: 'light'
    })
  };
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
    install_date: randomDate(365 * 3).split('T')[0],  // Within last 3 years
    location: `SRID=4326;POINT(${gps.lon} ${gps.lat})`,
    address: `${randomInt(100, 9999)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine'][randomInt(0, 4)]} St`,
    city: ['Los Angeles', 'Santa Monica', 'Pasadena', 'Burbank', 'Long Beach'][randomInt(0, 4)],
    state: 'CA',
    zip_code: `${randomInt(90001, 93599)}`,
    status: randomChoice({ active: 0.85, inactive: 0.10, maintenance: 0.05 }),
    last_reading_date: randomDate(30),
    metadata: JSON.stringify({
      installYear: randomInt(2018, 2024),
      lastMaintenance: randomDate(180).split('T')[0]
    })
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
    metadata: JSON.stringify({
      temperature: randomFloat(50, 95).toFixed(1),
      humidity: randomFloat(20, 80).toFixed(1)
    }),
    photo_url: Math.random() > 0.7 ? `https://example.com/meter-photos/${uuidv4()}.jpg` : null
  };
}

// Main generation function
async function generateMockData() {
  console.log('🧪 Meter Reader PWA - Mock Data Generator\n');
  console.log(`📍 Supabase URL: ${CONFIG.supabaseUrl}`);
  console.log(`📊 Generating:`);
  console.log(`   - ${CONFIG.numUsers} users`);
  console.log(`   - ~${CONFIG.numUsers * CONFIG.numMetersPerUser} meters`);
  console.log(`   - ~${CONFIG.numUsers * CONFIG.numMetersPerUser * CONFIG.numReadingsPerMeter} readings\n`);
  
  const users = [];
  const meters = [];
  const readings = [];
  
  // Generate users
  console.log('👤 Generating users...');
  for (let i = 1; i <= CONFIG.numUsers; i++) {
    users.push(generateMockUser(i));
  }
  
  // Generate meters
  console.log('📊 Generating meters...');
  let meterIdMap = {};  // Maps internal index to generated meter ID
  let cumulativeValue = {};  // Track cumulative readings per meter (moved outside user loop)
  
  for (const user of users) {
    for (let i = 0; i < CONFIG.numMetersPerUser; i++) {
      const meterType = randomChoice(CONFIG.meterTypes);
      const meter = generateMockMeter(user.id, meterType, i);
      
      // Initialize cumulative value for this meter
      cumulativeValue[meter.id] = randomFloat(1000, 50000);
      
      meters.push(meter);
      meterIdMap[`${user.id}-${i}`] = { id: meter.id, type: meterType };
    }
  }
  
  // Generate readings
  console.log('📈 Generating readings...');
  for (const meter of meters) {
    const meterInfo = Object.values(meterIdMap).find(m => m.id === meter.id);
    if (!meterInfo) continue;
    
    let meterCumulativeValue = cumulativeValue[meter.id] || randomFloat(1000, 50000);
    
    for (let i = 0; i < CONFIG.numReadingsPerMeter; i++) {
      const reading = generateMockReading(meter.id, meterInfo.type, meterCumulativeValue);
      meterCumulativeValue = reading.value;  // Update cumulative for next reading
      readings.push(reading);
    }
  }
  
  // Insert data into Supabase
  console.log('\n📤 Inserting data into Supabase...\n');
  
  // Insert users
  console.log('   Inserting users...');
  const { error: userError } = await supabase.from('users').insert(users);
  if (userError) {
    console.error('   ❌ Error inserting users:', userError.message);
    return;
  }
  console.log(`   ✅ Inserted ${users.length} users`);
  
  // Insert meters
  console.log('   Inserting meters...');
  const { error: meterError } = await supabase.from('meters').insert(meters);
  if (meterError) {
    console.error('   ❌ Error inserting meters:', meterError.message);
    return;
  }
  console.log(`   ✅ Inserted ${meters.length} meters`);
  
  // Insert readings in batches (avoid timeout)
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
  console.log(`   Users:    ${users.length}`);
  console.log(`   Meters:   ${meters.length}`);
  console.log(`   Readings: ${inserted}`);
  console.log('\n🔍 Verify in Supabase Dashboard:');
  console.log(`   ${CONFIG.supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/qjvexijvewosweznmgtg/editor\n`);
}

// Run
generateMockData().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
