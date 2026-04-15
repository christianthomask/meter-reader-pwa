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
  // Use service role key if available (bypasses RLS)
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj',
  // Warn if using anon key
  isServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Manager credentials (for auth.users creation)
  managerPassword: 'Demo123!@#',  // Default password for all mock managers
  
  // Data generation settings
  numManagers: 2,
  numReadersPerManager: 5,      // Total: 10 readers
  numRoutesPerManager: 10,      // Total: 20 routes (realistic: 10-15 per manager)
  numMetersPerRoute: 15,        // 15 meters per route (realistic: 10-200)
  numReadingsPerMeter: 12,      // Total: ~3600 readings (2 managers × 10 routes × 15 meters × 12 readings)
  daysOfHistory: 365,
  
  // Geographic center (Los Angeles)
  centerLat: 34.0522,
  centerLon: -118.2437,
  locationRadiusKm: 50,  // Spread meters within 50km
  
  // Meter type distribution - Alexander's only measures WATER meters
  meterTypes: {
    water: 1.0  // 100% water meters
  },
  
  // Units by meter type
  units: {
    water: 'gallons'
  },
  
  // Typical reading ranges by meter type (per reading period)
  // Water meters: residential use 500-5000 gallons per reading period
  readingRanges: {
    water: { min: 500, max: 5000 }
  },
  
  // Reading status distribution
  readingStatus: {
    pending: 0.30,
    approved: 0.55,
    rejected: 0.10,
    certified: 0.05
  },
  
  // Exception type distribution (for rejected readings)
  exceptionTypes: {
    high_usage: 0.35,
    low_usage: 0.25,
    zero_reading: 0.15,
    negative_reading: 0.10,
    photo_unclear: 0.10,
    gps_mismatch: 0.05
  }
};

// Initialize Supabase client (with service role key for admin operations)
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin API helper for creating auth users (or fetching if exists)
async function createOrGetAuthUser(email, password, fullName) {
  const adminApiUrl = `${CONFIG.supabaseUrl}/auth/v1/admin/users`;
  
  console.log(`   📡 Creating/fetching auth user: ${email}`);
  
  try {
    // Try to create new user
    const createResponse = await fetch(adminApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'prefer': 'return=representation'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      })
    });
    
    const createBody = await createResponse.json();
    
    // If user exists, query from public.users to get their ID
    if (createResponse.status === 422 && createBody.error_code === 'email_exists') {
      console.log(`   ℹ️  User exists, querying from database...`);
      
      // Query public.users or auth.users via RPC
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        // If not in public.users, we need to get from auth.users
        // List all users and find the matching one
        const listResponse = await fetch(`${adminApiUrl}?page=1&perPage=100`, {
          headers: {
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`
          }
        });
        
        const listBody = await listResponse.json();
        const foundUser = listBody.users?.find(u => u.email === email);
        
        if (foundUser) {
          console.log(`   ✅ Found existing user: ${foundUser.email}`);
          return foundUser;
        } else {
          throw new Error('User exists but could not fetch ID');
        }
      }
      
      console.log(`   ✅ Found existing user in public.users: ${data.email}`);
      return { id: data.id, email: data.email };
    }
    
    // Check if creation succeeded
    if (!createResponse.ok) {
      console.error(`   ❌ API Error:`, JSON.stringify(createBody, null, 2));
      throw new Error(`Failed to create auth user: ${createBody.message || createResponse.statusText}`);
    }
    
    console.log(`   ✅ Auth user created:`, createBody.user?.email || 'unknown');
    return createBody.user;
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    throw err;
  }
}

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

function generateMockManager(index) {
  return {
    id: uuidv4(),
    email: `manager${index}@meterreader.test`,
    full_name: `Manager ${index}`,
    phone: `+1-555-01${randomInt(10, 99)}`,
    timezone: 'America/Los_Angeles',
    preferences: JSON.stringify({
      notifications: true,
      units: 'imperial',
      theme: 'light'
    })
  };
}

function generateMockReader(managerId, index) {
  const firstNames = ['James', 'Maria', 'John', 'Jennifer', 'Robert', 'Linda', 'Michael', 'Elizabeth', 'William', 'Patricia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  return {
    id: uuidv4(),
    manager_id: managerId,
    email: `reader${index}@meterreader.test`,
    full_name: `${firstNames[randomInt(0, 9)]} ${lastNames[randomInt(0, 9)]}`,
    phone: `+1-555-${randomInt(100, 999)}`,
    active: true,
    assigned_routes_count: 0,
    completed_readings_count: 0,
    metadata: JSON.stringify({
      hireDate: randomDate(730).split('T')[0],
      certificationLevel: ['Level 1', 'Level 2', 'Level 3'][randomInt(0, 2)]
    })
  };
}

function generateMockMeter(managerId, type, index) {
  const gps = generateGPSPoint(CONFIG.centerLat, CONFIG.centerLon, CONFIG.locationRadiusKm);
  const range = CONFIG.readingRanges[type];
  
  return {
    id: uuidv4(),
    user_id: managerId,  // Manager owns the meter
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

function generateMockReading(meterId, meterType, previousValue, readerId) {
  const range = CONFIG.readingRanges[meterType];
  const delta = randomFloat(range.min, range.max);
  const status = randomChoice(CONFIG.readingStatus);
  
  // Generate GPS capture point (near the meter location)
  const captureGPS = generateGPSPoint(CONFIG.centerLat, CONFIG.centerLon, CONFIG.locationRadiusKm);
  
  // Generate rejection reason if rejected
  let rejectionReason = null;
  if (status === 'rejected') {
    const exceptionType = randomChoice(CONFIG.exceptionTypes);
    rejectionReason = {
      high_usage: 'Usage exceeds 40% increase from previous reading',
      low_usage: 'Usage significantly below normal range',
      zero_reading: 'Zero reading submitted - possible skip',
      negative_reading: 'Negative delta detected',
      photo_unclear: 'Photo is blurry or meter number unreadable',
      gps_mismatch: 'GPS location does not match meter address'
    }[exceptionType];
  }
  
  // Water-specific notes (since Alexander's only does water meters)
  const waterNotes = [
    null,  // 30% chance of no notes
    'Meter was easily accessible',
    'Dog on property - be careful',
    'Meter box was locked, had to wait for customer',
    'Photo taken from north side',
    'GPS signal weak, accuracy may vary',
    'Customer reported possible leak',
    'Meter reading confirmed with customer',
    'Difficult access - overgrown vegetation',
    'Water meter in front yard',
    'Meter box had water in it',
    'Lid stuck, required tool to open'
  ];
  const readerNotes = waterNotes[randomInt(0, waterNotes.length - 1)];
  
  // Calculate value and delta consistently (constraint requires: delta = value - previous)
  let value, previous_value, delta_value;
  
  if (previousValue !== null) {
    previous_value = parseFloat(previousValue.toFixed(4));
    delta_value = parseFloat(delta.toFixed(4));
    value = parseFloat((previous_value + delta_value).toFixed(4));
  } else {
    // First reading - no previous value
    value = parseFloat((randomFloat(10000, 50000) + delta).toFixed(4));
    previous_value = null;
    delta_value = null;
  }
  
  return {
    id: uuidv4(),
    meter_id: meterId,
    reader_id: readerId,
    reading_timestamp: randomDate(CONFIG.daysOfHistory),
    value: value,
    unit: CONFIG.units[meterType],
    reading_type: randomChoice({ actual: 0.80, estimated: 0.15, self_read: 0.05 }),
    source: 'manual',  // Readers submit manually
    previous_value: previous_value,
    delta_value: delta_value,
    cost: meterType === 'electric' && delta_value !== null ? parseFloat((delta_value * 0.15).toFixed(2)) : null,
    status: status,
    rejection_reason: rejectionReason,
    reader_notes: readerNotes,
    manager_notes: null,  // Added during review
    capture_location: `SRID=4326;POINT(${captureGPS.lon} ${captureGPS.lat})`,
    gps_accuracy_meters: parseFloat(randomFloat(3, 50).toFixed(2)),
    metadata: JSON.stringify({
      temperature: randomFloat(50, 95).toFixed(1),
      humidity: randomFloat(20, 80).toFixed(1)
    }),
    photo_url: Math.random() > 0.7 ? `https://example.com/meter-photos/${uuidv4()}.jpg` : null
  };
}

// Main generation function
async function generateMockData() {
  console.log('🧪 Meter Reader PWA - Mock Data Generator (Reader Workflow)\n');
  console.log(`📍 Supabase URL: ${CONFIG.supabaseUrl}`);
  
  // Warn about key type
  if (CONFIG.isServiceKey) {
    console.log('🔑 Using SERVICE ROLE key (bypasses RLS) ✅\n');
  } else {
    console.log('⚠️  WARNING: Using ANON key - may fail due to RLS policies!');
    console.log('   Set SUPABASE_SERVICE_ROLE_KEY in .env to bypass RLS.\n');
  }
  
  console.log(`📊 Generating:`);
  console.log(`   - ${CONFIG.numManagers} managers`);
  console.log(`   - ${CONFIG.numManagers * CONFIG.numReadersPerManager} readers`);
  console.log(`   - ${CONFIG.numManagers * CONFIG.numRoutesPerManager} routes (${CONFIG.numMetersPerRoute} meters/route)`);
  console.log(`   - ${CONFIG.numManagers * CONFIG.numRoutesPerManager * CONFIG.numMetersPerRoute} total meters`);
  console.log(`   - ~${CONFIG.numManagers * CONFIG.numRoutesPerManager * CONFIG.numMetersPerRoute * CONFIG.numReadingsPerMeter} readings\n`);
  
  const managers = [];
  const readers = [];
  const meters = [];
  const readings = [];
  const routeAssignments = [];
  
  // Generate managers (create auth users first, then public.users)
  console.log('👤 Generating managers (auth + public tables)...');
  for (let i = 1; i <= CONFIG.numManagers; i++) {
    const email = `manager${i}@meterreader.test`;
    const fullName = `Manager ${i}`;
    
    try {
      // Create or fetch auth user first
      const authUser = await createOrGetAuthUser(email, CONFIG.managerPassword, fullName);
      
      // Then create public.user record with same ID
      const publicUser = {
        id: authUser.id,  // Must match auth.users.id
        email: email,
        full_name: fullName,
        phone: `+1-555-01${randomInt(10, 99)}`,
        timezone: 'America/Los_Angeles',
        preferences: JSON.stringify({
          notifications: true,
          units: 'imperial',
          theme: 'light'
        })
      };
      managers.push(publicUser);
      
      console.log(`   ✅ Created manager ${i}: ${email}`);
    } catch (err) {
      console.error(`   ❌ Failed to create manager ${i}:`, err.message);
      // Continue with next manager
    }
  }
  
  // Generate readers (assigned to managers)
  console.log('👷 Generating readers...');
  let readerIndex = 1;
  for (const manager of managers) {
    for (let i = 0; i < CONFIG.numReadersPerManager; i++) {
      readers.push(generateMockReader(manager.id, readerIndex++));
    }
  }
  
  // Generate routes, meters, and readings
  console.log('📊 Generating routes, meters, and readings...');
  let meterIdMap = {};
  let cumulativeValue = {};
  
  // Define realistic zip codes for routes
  const zipCodes = ['90210', '90211', '90212', '90401', '90402', '90403', '90404', '90405', '90025', '90024'];
  
  for (const manager of managers) {
    // Get readers for this manager
    const managerReaders = readers.filter(r => r.manager_id === manager.id);
    
    // Generate routes (each route = multiple meters in same zip code)
    for (let routeIdx = 0; routeIdx < CONFIG.numRoutesPerManager; routeIdx++) {
      const zipCode = zipCodes[routeIdx % zipCodes.length];  // Cycle through zip codes
      const routeId = zipCode;  // Using zip_code as route identifier
      
      // Assign this route to a reader
      const assignedReader = managerReaders[routeIdx % managerReaders.length];
      
      // Create route assignment
      if (assignedReader) {
        routeAssignments.push({
          id: uuidv4(),
          route_id: uuidv4(),  // Generate UUID for route_id
          reader_id: assignedReader.id,
          manager_id: manager.id,
          status: randomChoice({ assigned: 0.2, 'in-progress': 0.3, completed: 0.4, cancelled: 0.1 }),
          assigned_at: randomDate(60),
          meters_total: CONFIG.numMetersPerRoute,
          meters_read: 0,
          meters_pending: 0,
          notes: `Route ${zipCode} assigned to ${assignedReader.full_name}`,
          metadata: JSON.stringify({ zip_code: zipCode })  // Store zip in metadata
        });
      }
      
      // Generate meters for this route (all in same zip code)
      for (let meterIdx = 0; meterIdx < CONFIG.numMetersPerRoute; meterIdx++) {
        const meterType = randomChoice(CONFIG.meterTypes);
        const meter = generateMockMeter(manager.id, meterType, routeIdx * CONFIG.numMetersPerRoute + meterIdx);
        
        // Override zip_code to match route
        meter.zip_code = zipCode;
        meter.address = `${randomInt(100, 9999)} ${['Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Park', 'Lake'][randomInt(0, 7)]} St`;
        meter.city = ['Los Angeles', 'Santa Monica', 'Pasadena', 'Burbank', 'Long Beach'][randomInt(0, 4)];
        
        // Initialize cumulative value for this meter
        cumulativeValue[meter.id] = randomFloat(1000, 50000);
        
        meters.push(meter);
        meterIdMap[meter.id] = { type: meterType, route: zipCode };
        
        // Generate readings for this meter
        let meterCumulativeValue = cumulativeValue[meter.id];
        for (let j = 0; j < CONFIG.numReadingsPerMeter; j++) {
          // Pick a random reader from this manager's team
          const readingReader = managerReaders[randomInt(0, managerReaders.length - 1)];
          const reading = generateMockReading(
            meter.id, 
            meterType, 
            meterCumulativeValue, 
            readingReader.id
          );
          meterCumulativeValue = reading.value;
          readings.push(reading);
        }
      }
    }
  }
  
  // Insert data into Supabase
  console.log('\n📤 Inserting data into Supabase...\n');
  
  // Insert managers (public.users - auth users already created)
  console.log('   Inserting managers (public.users table)...');
  if (managers.length > 0) {
    // Use upsert to handle existing users
    const { data, error: userError } = await supabase
      .from('users')
      .upsert(managers, { onConflict: 'id' })
      .select();
    
    if (userError) {
      console.error('   ❌ Error inserting managers:', userError.message);
      // Try to continue anyway
    }
    console.log(`   ✅ Inserted/updated ${data?.length || managers.length} managers in public.users`);
  } else {
    console.log('   ⚠️  No managers created, skipping public.users insert');
  }
  
  // Insert readers
  console.log('   Inserting readers...');
  const { error: readerError } = await supabase.from('readers').insert(readers);
  if (readerError) {
    console.error('   ❌ Error inserting readers:', readerError.message);
    return;
  }
  console.log(`   ✅ Inserted ${readers.length} readers`);
  
  // Insert meters
  console.log('   Inserting meters...');
  const { error: meterError } = await supabase.from('meters').insert(meters);
  if (meterError) {
    console.error('   ❌ Error inserting meters:', meterError.message);
    return;
  }
  console.log(`   ✅ Inserted ${meters.length} meters`);
  
  // Insert route assignments
  console.log('   Inserting route assignments...');
  const { error: assignmentError } = await supabase.from('route_assignments').insert(routeAssignments);
  if (assignmentError) {
    console.error('   ❌ Error inserting route assignments:', assignmentError.message);
    // Continue anyway - assignments are optional
  }
  console.log(`   ✅ Inserted ${routeAssignments.length} route assignments`);
  
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
  console.log(`   Managers:           ${managers.length}`);
  console.log(`   Readers:            ${readers.length}`);
  console.log(`   Routes:             ${CONFIG.numManagers * CONFIG.numRoutesPerManager} (${CONFIG.numMetersPerRoute} meters each)`);
  console.log(`   Total Meters:       ${meters.length}`);
  console.log(`   Route Assignments:  ${routeAssignments.length}`);
  console.log(`   Total Readings:     ${inserted}`);
  console.log(`   Avg Readings/Meter: ${(inserted / meters.length).toFixed(1)}`);
  console.log('\n📈 Reading Status Distribution:');
  const statusCounts = {};
  readings.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`   ${status}: ${count} (${Math.round(count/readings.length * 100)}%)`);
  }
  console.log('\n📍 Route Distribution:');
  const routeCounts = {};
  meters.forEach(m => {
    routeCounts[m.zip_code] = (routeCounts[m.zip_code] || 0) + 1;
  });
  for (const [zip, count] of Object.entries(routeCounts)) {
    console.log(`   Route ${zip}: ${count} meters`);
  }
  console.log('\n🔍 Verify in Supabase Dashboard:');
  console.log(`   ${CONFIG.supabaseUrl.replace('.supabase.co', '')}.supabase.co/project/qjvexijvewosweznmgtg/editor\n`);
  console.log('💡 Test Login Credentials:');
  console.log(`   Manager 1: manager1@meterreader.test / ${CONFIG.managerPassword}`);
  console.log(`   Manager 2: manager2@meterreader.test / ${CONFIG.managerPassword}`);
  console.log(`   (All mock managers use the same password: ${CONFIG.managerPassword})\n`);
}

// Run
generateMockData().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
