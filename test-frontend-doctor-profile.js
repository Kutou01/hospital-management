// Test script to verify frontend doctor profile is working with real data
const puppeteer = require('puppeteer');

const CONFIG = {
  FRONTEND_URL: 'http://localhost:3000',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  }
};

async function testDoctorProfileFrontend() {
  let browser;
  let page;

  try {
    console.log('🚀 Starting Doctor Profile Frontend Test...\n');

    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 }
    });
    page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      console.log(`🖥️  BROWSER: ${msg.text()}`);
    });

    // Enable error logging
    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Step 1: Navigate to login page
    console.log('1️⃣ Navigating to login page...');
    await page.goto(`${CONFIG.FRONTEND_URL}/auth/login`, { waitUntil: 'networkidle0' });

    // Step 2: Login
    console.log('2️⃣ Logging in...');
    await page.type('input[name="email"]', CONFIG.DOCTOR_CREDENTIALS.email);
    await page.type('input[name="password"]', CONFIG.DOCTOR_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');

    // Step 3: Navigate to doctor profile
    console.log('3️⃣ Navigating to doctor profile...');
    await page.goto(`${CONFIG.FRONTEND_URL}/doctors/profile`, { waitUntil: 'networkidle0' });
    
    // Wait for profile to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check if real data is displayed
    console.log('4️⃣ Checking if real data is displayed...');
    
    // Check doctor name
    const doctorName = await page.$eval('h2', el => el.textContent).catch(() => 'Not found');
    console.log(`👨‍⚕️ Doctor Name: ${doctorName}`);
    
    // Check doctor ID
    const doctorId = await page.evaluate(() => {
      const elements = document.querySelectorAll('p');
      for (let el of elements) {
        if (el.textContent.includes('GENE-DOC') || el.textContent.includes('DOC-')) {
          return el.textContent;
        }
      }
      return 'Not found';
    });
    console.log(`🆔 Doctor ID: ${doctorId}`);
    
    // Check specialty
    const specialty = await page.evaluate(() => {
      const headers = document.querySelectorAll('h3');
      for (let header of headers) {
        if (header.textContent.includes('Specialist')) {
          const nextElement = header.nextElementSibling;
          return nextElement ? nextElement.textContent : 'Not found';
        }
      }
      return 'Not found';
    });
    console.log(`🏥 Specialty: ${specialty}`);
    
    // Check availability status
    const availability = await page.evaluate(() => {
      const badges = document.querySelectorAll('[class*="badge"], [class*="Badge"]');
      for (let badge of badges) {
        if (badge.textContent.includes('Available') || badge.textContent.includes('Unavailable')) {
          return badge.textContent;
        }
      }
      return 'Not found';
    });
    console.log(`🟢 Availability: ${availability}`);
    
    // Check if loading states are gone
    const hasLoadingText = await page.evaluate(() => {
      return document.body.textContent.includes('Loading...');
    });
    console.log(`⏳ Has Loading Text: ${hasLoadingText ? 'Yes (Bad)' : 'No (Good)'}`);
    
    // Check for mock data
    const hasMockData = await page.evaluate(() => {
      const text = document.body.textContent;
      return text.includes('Dr. Petra Winsbury') || 
             text.includes('WNH-GM-001') || 
             text.includes('petra.wins@wellnesthospital.com') ||
             text.includes('+1 555-234-5678');
    });
    console.log(`🎭 Has Mock Data: ${hasMockData ? 'Yes (Bad)' : 'No (Good)'}`);

    // Step 5: Take screenshot
    console.log('5️⃣ Taking screenshot...');
    await page.screenshot({ path: 'doctor-profile-test.png', fullPage: true });
    console.log('📸 Screenshot saved as doctor-profile-test.png');

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Doctor Name: ${doctorName !== 'Loading...' && doctorName !== 'Not found' ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Doctor ID: ${doctorId.includes('DOC-') ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Specialty: ${specialty !== 'Loading...' && specialty !== 'Not found' ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No Loading States: ${!hasLoadingText ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No Mock Data: ${!hasMockData ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testDoctorProfileFrontend();
