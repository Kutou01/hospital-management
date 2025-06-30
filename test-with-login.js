// Test doctor profile with proper login flow
const puppeteer = require('puppeteer');

async function testWithLogin() {
  let browser;
  let page;

  try {
    console.log('🚀 Testing Doctor Profile with Login...\n');

    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
    page = await browser.newPage();

    // Collect console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[DoctorProfile]') || text.includes('Doctor data loaded')) {
        console.log(`🔍 ${text}`);
      }
    });

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[name="email"]', 'doctor@hospital.com');
    await page.type('input[name="password"]', 'Doctor123.');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');

    // Step 2: Navigate to doctor profile
    console.log('2️⃣ Navigating to doctor profile...');
    await page.goto('http://localhost:3000/doctors/profile', { waitUntil: 'networkidle0' });
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Check current content
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

    const hasLoadingText = await page.evaluate(() => {
      return document.body.textContent.includes('Loading...');
    });

    console.log('\n📊 Results:');
    console.log(`👨‍⚕️ Doctor Name: ${doctorName}`);
    console.log(`🆔 Doctor ID: ${doctorId}`);
    console.log(`⏳ Has Loading Text: ${hasLoadingText ? 'Yes' : 'No'}`);

    // Take screenshot
    await page.screenshot({ path: 'doctor-profile-with-login.png', fullPage: true });
    console.log('📸 Screenshot saved');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔍 Browser kept open for inspection...');
      // await browser.close();
    }
  }
}

testWithLogin();
