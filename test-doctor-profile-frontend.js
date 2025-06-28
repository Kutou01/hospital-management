// Test Doctor Profile Frontend Page
// This script tests the frontend page at http://localhost:3000/doctors/profile
// to verify all APIs are working and data is loading correctly

const puppeteer = require('puppeteer');

const CONFIG = {
  FRONTEND_URL: 'http://localhost:3000',
  API_GATEWAY: 'http://localhost:3100',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  }
};

let browser;
let page;

async function setupBrowser() {
  console.log('🚀 Setting up browser...');
  browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${msg.text()}`);
    } else if (type === 'log') {
      console.log(`📝 Console Log: ${msg.text()}`);
    }
  });
  
  // Monitor network requests
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/')) {
      if (status >= 400) {
        console.log(`❌ API Error: ${status} - ${url}`);
      } else {
        console.log(`✅ API Success: ${status} - ${url}`);
      }
    }
  });
  
  // Monitor failed requests
  page.on('requestfailed', request => {
    console.log(`❌ Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });
}

async function loginToApplication() {
  console.log('\n🔐 Logging into application...');
  
  try {
    // Navigate to login page
    await page.goto(`${CONFIG.FRONTEND_URL}/auth/login`, { waitUntil: 'networkidle0' });
    
    // Fill login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', CONFIG.DOCTOR_CREDENTIALS.email);
    await page.type('input[type="password"]', CONFIG.DOCTOR_CREDENTIALS.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log(`❌ Login failed: ${error.message}`);
    return false;
  }
}

async function testDoctorProfilePage() {
  console.log('\n👨‍⚕️ Testing Doctor Profile Page...');
  
  try {
    // Navigate to doctor profile page
    await page.goto(`${CONFIG.FRONTEND_URL}/doctors/profile`, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if page loaded without errors
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Test 1: Check if doctor profile information is displayed
    console.log('\n1️⃣ Testing Doctor Profile Information...');
    await testDoctorProfileInfo();
    
    // Test 2: Check appointment statistics
    console.log('\n2️⃣ Testing Appointment Statistics...');
    await testAppointmentStats();
    
    // Test 3: Check schedule calendar
    console.log('\n3️⃣ Testing Schedule Calendar...');
    await testScheduleCalendar();
    
    // Test 4: Check patient feedback section
    console.log('\n4️⃣ Testing Patient Feedback...');
    await testPatientFeedback();
    
    // Test 5: Check for any loading states or errors
    console.log('\n5️⃣ Testing Loading States and Errors...');
    await testLoadingStatesAndErrors();
    
    return true;
  } catch (error) {
    console.log(`❌ Profile page test failed: ${error.message}`);
    return false;
  }
}

async function testDoctorProfileInfo() {
  try {
    // Check for doctor name
    const doctorName = await page.$eval('[data-testid="doctor-name"], .doctor-name, h1, h2', 
      el => el.textContent).catch(() => null);
    
    if (doctorName) {
      console.log(`✅ Doctor name found: ${doctorName}`);
    } else {
      console.log('⚠️  Doctor name not found');
    }
    
    // Check for doctor specialty
    const specialty = await page.$eval('[data-testid="doctor-specialty"], .specialty', 
      el => el.textContent).catch(() => null);
    
    if (specialty) {
      console.log(`✅ Doctor specialty found: ${specialty}`);
    } else {
      console.log('⚠️  Doctor specialty not found');
    }
    
    // Check for doctor avatar/image
    const avatar = await page.$('[data-testid="doctor-avatar"], .avatar, img').catch(() => null);
    
    if (avatar) {
      console.log('✅ Doctor avatar/image found');
    } else {
      console.log('⚠️  Doctor avatar/image not found');
    }
    
  } catch (error) {
    console.log(`❌ Doctor profile info test error: ${error.message}`);
  }
}

async function testAppointmentStats() {
  try {
    // Check for appointment statistics cards
    const statsCards = await page.$$('[data-testid*="stat"], .stat-card, .card').catch(() => []);
    
    if (statsCards.length > 0) {
      console.log(`✅ Found ${statsCards.length} statistics cards`);
      
      // Check for specific stats
      const totalPatients = await page.$eval('[data-testid="total-patients"], .total-patients', 
        el => el.textContent).catch(() => null);
      
      const totalAppointments = await page.$eval('[data-testid="total-appointments"], .total-appointments', 
        el => el.textContent).catch(() => null);
      
      if (totalPatients) console.log(`✅ Total patients stat: ${totalPatients}`);
      if (totalAppointments) console.log(`✅ Total appointments stat: ${totalAppointments}`);
      
    } else {
      console.log('⚠️  No statistics cards found');
    }
    
    // Check for charts
    const charts = await page.$$('canvas, svg, .chart').catch(() => []);
    
    if (charts.length > 0) {
      console.log(`✅ Found ${charts.length} chart elements`);
    } else {
      console.log('⚠️  No chart elements found');
    }
    
  } catch (error) {
    console.log(`❌ Appointment stats test error: ${error.message}`);
  }
}

async function testScheduleCalendar() {
  try {
    // Check for calendar component
    const calendar = await page.$('[data-testid="calendar"], .calendar, .schedule').catch(() => null);
    
    if (calendar) {
      console.log('✅ Calendar component found');
      
      // Check for calendar navigation
      const navButtons = await page.$$('[data-testid*="nav"], .nav-button, button').catch(() => []);
      console.log(`✅ Found ${navButtons.length} navigation elements`);
      
    } else {
      console.log('⚠️  Calendar component not found');
    }
    
    // Check for schedule items
    const scheduleItems = await page.$$('[data-testid*="schedule"], .schedule-item').catch(() => []);
    
    if (scheduleItems.length > 0) {
      console.log(`✅ Found ${scheduleItems.length} schedule items`);
    } else {
      console.log('⚠️  No schedule items found');
    }
    
  } catch (error) {
    console.log(`❌ Schedule calendar test error: ${error.message}`);
  }
}

async function testPatientFeedback() {
  try {
    // Check for reviews/feedback section
    const feedbackSection = await page.$('[data-testid*="review"], [data-testid*="feedback"], .reviews, .feedback').catch(() => null);
    
    if (feedbackSection) {
      console.log('✅ Patient feedback section found');
      
      // Check for individual reviews
      const reviews = await page.$$('[data-testid*="review-item"], .review-item, .review').catch(() => []);
      console.log(`✅ Found ${reviews.length} review items`);
      
      // Check for rating display
      const ratings = await page.$$('[data-testid*="rating"], .rating, .stars').catch(() => []);
      console.log(`✅ Found ${ratings.length} rating elements`);
      
    } else {
      console.log('⚠️  Patient feedback section not found');
    }
    
  } catch (error) {
    console.log(`❌ Patient feedback test error: ${error.message}`);
  }
}

async function testLoadingStatesAndErrors() {
  try {
    // Check for loading spinners
    const loadingElements = await page.$$('[data-testid*="loading"], .loading, .spinner').catch(() => []);
    
    if (loadingElements.length > 0) {
      console.log(`⚠️  Found ${loadingElements.length} loading elements (should be 0 when fully loaded)`);
    } else {
      console.log('✅ No loading elements found (page fully loaded)');
    }
    
    // Check for error messages
    const errorElements = await page.$$('[data-testid*="error"], .error, .alert-error').catch(() => []);
    
    if (errorElements.length > 0) {
      console.log(`❌ Found ${errorElements.length} error elements`);
      
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`   Error ${i + 1}: ${errorText}`);
      }
    } else {
      console.log('✅ No error elements found');
    }
    
    // Check for empty states
    const emptyStates = await page.$$('[data-testid*="empty"], .empty-state, .no-data').catch(() => []);
    
    if (emptyStates.length > 0) {
      console.log(`ℹ️  Found ${emptyStates.length} empty state elements`);
    }
    
  } catch (error) {
    console.log(`❌ Loading states test error: ${error.message}`);
  }
}

async function takeScreenshot() {
  console.log('\n📸 Taking screenshot...');
  try {
    await page.screenshot({ 
      path: 'doctor-profile-test-screenshot.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved as doctor-profile-test-screenshot.png');
  } catch (error) {
    console.log(`❌ Screenshot failed: ${error.message}`);
  }
}

async function cleanup() {
  if (browser) {
    await browser.close();
  }
}

async function runTests() {
  console.log('🧪 Starting Doctor Profile Frontend Tests\n');
  
  try {
    // Setup browser
    await setupBrowser();
    
    // Login to application
    const loginSuccess = await loginToApplication();
    
    if (loginSuccess) {
      // Test doctor profile page
      const profileTestSuccess = await testDoctorProfilePage();
      
      if (profileTestSuccess) {
        console.log('\n✅ All tests completed successfully!');
      } else {
        console.log('\n❌ Some tests failed');
      }
      
      // Take screenshot for visual verification
      await takeScreenshot();
      
    } else {
      console.log('\n❌ Cannot proceed - login failed');
    }
    
  } catch (error) {
    console.log(`\n❌ Test execution failed: ${error.message}`);
  } finally {
    await cleanup();
  }
  
  console.log('\n🏁 Tests Complete');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
