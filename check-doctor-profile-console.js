// Simple script to check console logs from doctor profile page
const puppeteer = require('puppeteer');

async function checkConsole() {
  let browser;
  let page;

  try {
    console.log('🔍 Checking Doctor Profile Console Logs...\n');

    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
    page = await browser.newPage();

    // Collect console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log(`🖥️  ${text}`);
    });

    // Navigate to doctor profile (assuming already logged in)
    await page.goto('http://localhost:3000/doctors/profile', { waitUntil: 'networkidle0' });
    
    // Wait a bit for all logs
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n📊 Summary:');
    console.log(`Total console messages: ${logs.length}`);
    
    const debugLogs = logs.filter(log => log.includes('[DoctorProfile]'));
    console.log(`Debug logs: ${debugLogs.length}`);
    
    debugLogs.forEach(log => {
      console.log(`  📝 ${log}`);
    });

    // Check current page content
    const doctorName = await page.$eval('h2', el => el.textContent).catch(() => 'Not found');
    const doctorId = await page.evaluate(() => {
      const elements = document.querySelectorAll('p');
      for (let el of elements) {
        if (el.textContent.includes('GENE-DOC') || el.textContent.includes('DOC-')) {
          return el.textContent;
        }
      }
      return 'Not found';
    });

    console.log(`\n👨‍⚕️ Current Display:`);
    console.log(`  Name: ${doctorName}`);
    console.log(`  ID: ${doctorId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      // Keep browser open for manual inspection
      console.log('\n🔍 Browser kept open for manual inspection...');
      // await browser.close();
    }
  }
}

checkConsole();
