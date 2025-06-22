#!/usr/bin/env node

/**
 * Payment Sync Script
 * Chạy job đồng bộ thanh toán từ command line
 * 
 * Usage:
 *   node scripts/sync-payments.js
 *   npm run sync-payments
 */

const https = require('https');
const http = require('http');

const SYNC_JOB_TOKEN = process.env.SYNC_JOB_TOKEN || 'sync-job-secret-token';
const API_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function callSyncAPI() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/payment/sync-job', API_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = JSON.stringify({});
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYNC_JOB_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting payment sync job...');
  console.log(`📡 API URL: ${API_URL}`);
  console.log('⏳ Calling sync API...');

  try {
    const { status, data } = await callSyncAPI();
    
    if (status === 200 && data.success) {
      console.log('✅ Payment sync completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   - Total payments checked: ${data.data.total}`);
      console.log(`   - Payments updated: ${data.data.updated}`);
      console.log(`   - Duration: ${data.data.duration}ms`);
      
      if (data.data.updated > 0) {
        console.log(`🎉 ${data.data.updated} payments were synchronized!`);
      } else {
        console.log('ℹ️  No payments needed to be updated.');
      }
    } else {
      console.error('❌ Payment sync failed:');
      console.error(`   Status: ${status}`);
      console.error(`   Error: ${data.error || 'Unknown error'}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to call sync API:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { callSyncAPI };
