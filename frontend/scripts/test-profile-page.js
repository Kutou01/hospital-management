const puppeteer = require('puppeteer');

async function testProfilePage() {
  console.log('🧪 Testing Professional Profile Page...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to login page
    console.log('📱 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/signin');
    
    // Login with doctor credentials
    console.log('🔐 Logging in as doctor...');
    await page.type('input[type="email"]', 'doctor@hospital.com');
    await page.type('input[type="password"]', 'Doctor123.');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation();
    console.log('✅ Login successful');
    
    // Navigate to profile page
    console.log('👤 Navigating to profile page...');
    await page.goto('http://localhost:3000/doctors/profile');
    
    // Wait for profile to load
    await page.waitForSelector('[data-testid="professional-profile"]', { timeout: 10000 });
    console.log('✅ Profile page loaded');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'profile-page-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as profile-page-test.png');
    
    // Test edit functionality
    console.log('✏️ Testing edit functionality...');
    const editButton = await page.$('button:has-text("Chỉnh sửa")');
    if (editButton) {
      await editButton.click();
      console.log('✅ Edit mode activated');
      
      // Take another screenshot
      await page.screenshot({ 
        path: 'profile-page-edit-mode.png',
        fullPage: true 
      });
      console.log('📸 Edit mode screenshot saved');
    }
    
    console.log('🎉 Profile page test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testProfilePage().catch(console.error);
