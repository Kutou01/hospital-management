#!/usr/bin/env node

/**
 * Daily Payment Recovery Script
 * Chạy hàng ngày để kiểm tra và khôi phục giao dịch bị sót
 * 
 * Usage:
 *   node scripts/daily-recovery.js
 *   npm run daily-recovery
 */

const https = require('https');
const http = require('http');

const SYNC_JOB_TOKEN = process.env.SYNC_JOB_TOKEN || 'sync-job-secret-token';
const API_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function callRecoveryAPI(hours = 24) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/payment/recovery', API_URL);
    url.searchParams.set('action', 'recover');
    url.searchParams.set('hours', hours.toString());
    
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SYNC_JOB_TOKEN}`,
        'Content-Type': 'application/json'
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

    req.end();
  });
}

async function sendAlert(message) {
  // Có thể tích hợp với email/SMS service ở đây
  console.log('🚨 ALERT:', message);
  
  // Ghi vào log file
  const fs = require('fs');
  const logFile = 'logs/recovery-alerts.log';
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

async function main() {
  console.log('🔧 Starting daily payment recovery job...');
  console.log(`📡 API URL: ${API_URL}`);
  console.log(`⏰ Time: ${new Date().toLocaleString('vi-VN')}`);

  try {
    // Kiểm tra 24h qua
    const { status, data } = await callRecoveryAPI(24);
    
    if (status === 200 && data.success) {
      const result = data.data;
      
      console.log('✅ Daily recovery completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   - PayOS transactions: ${result.summary.payosTotal}`);
      console.log(`   - Database payments: ${result.summary.databaseTotal}`);
      console.log(`   - Missing transactions found: ${result.summary.missingCount}`);
      console.log(`   - Status mismatches found: ${result.summary.mismatchCount}`);
      console.log(`   - Transactions recovered: ${result.recovered}`);
      console.log(`   - Transactions updated: ${result.updated}`);
      console.log(`   - Total fixed: ${result.total}`);
      
      // Gửi cảnh báo nếu có giao dịch bị sót
      if (result.total > 0) {
        const alertMessage = `Daily recovery found and fixed ${result.total} transactions (${result.recovered} recovered, ${result.updated} updated)`;
        await sendAlert(alertMessage);
        console.log(`🚨 ${result.total} transactions were missing and have been recovered!`);
      } else {
        console.log('✅ No missing transactions found. All payments are in sync!');
      }
      
      // Kiểm tra tỷ lệ sót giao dịch
      if (result.summary.payosTotal > 0) {
        const missRate = ((result.summary.missingCount + result.summary.mismatchCount) / result.summary.payosTotal * 100).toFixed(2);
        console.log(`📈 Miss rate: ${missRate}%`);
        
        if (parseFloat(missRate) > 5) {
          await sendAlert(`High miss rate detected: ${missRate}% (${result.summary.missingCount + result.summary.mismatchCount}/${result.summary.payosTotal})`);
        }
      }
      
    } else {
      console.error('❌ Daily recovery failed:');
      console.error(`   Status: ${status}`);
      console.error(`   Error: ${data.error || 'Unknown error'}`);
      await sendAlert(`Daily recovery failed: ${data.error || 'Unknown error'}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to run daily recovery:');
    console.error(`   ${error.message}`);
    await sendAlert(`Daily recovery script failed: ${error.message}`);
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

module.exports = { callRecoveryAPI, sendAlert };
