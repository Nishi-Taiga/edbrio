// EdBrio System Verification Script
// Run with: node tests/verify-setup.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

// Test endpoints
const endpoints = [
  { path: '/', name: 'Home page' },
  { path: '/login', name: 'Auth page' },
  { path: '/teacher/dashboard', name: 'Teacher dashboard' },
  { path: '/guardian/home', name: 'Guardian home' },
  { path: '/teacher/test-teacher', name: 'Public profile' },
];

console.log('🧪 EdBrio System Verification\n');

async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${endpoint.path}`;
    
    const req = require('http').get(url, (res) => {
      const status = res.statusCode;
      const success = status === 200 || status === 302; // 302 for auth redirects
      
      console.log(`${success ? '✅' : '❌'} ${endpoint.name}: ${status}`);
      resolve({ success, status, endpoint: endpoint.name });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${endpoint.name}: Error - ${err.message}`);
      resolve({ success: false, status: 'ERROR', endpoint: endpoint.name });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${endpoint.name}: Timeout`);
      resolve({ success: false, status: 'TIMEOUT', endpoint: endpoint.name });
    });
  });
}

async function checkEnvironment() {
  console.log('📋 Environment Check\n');
  
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  let allPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}: Present`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

async function main() {
  // Check environment
  const envOk = await checkEnvironment();
  
  console.log('\n🌐 Endpoint Check\n');
  
  // Check all endpoints
  const results = [];
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between requests
  }
  
  // Summary
  console.log('\n📊 Summary\n');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Environment: ${envOk ? '✅ OK' : '❌ Issues found'}`);
  console.log(`Endpoints: ${successful}/${total} responding correctly`);
  
  if (successful === total && envOk) {
    console.log('\n🎉 System appears to be working correctly!');
    console.log('\nNext steps:');
    console.log('1. Run database setup in Supabase Studio');
    console.log('2. Create test accounts using the guide');
    console.log('3. Test the full user flow');
  } else {
    console.log('\n⚠️  Issues detected. Please check:');
    console.log('- Development server is running (npm run dev)');
    console.log('- Environment variables are correct');
    console.log('- Database is set up in Supabase');
  }
}

main().catch(console.error);
