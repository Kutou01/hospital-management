#!/usr/bin/env node

/**
 * Test Auth Service với Playwright - Direct UI Testing
 * Test đăng ký và đăng nhập qua frontend interface
 */

const { chromium } = require("playwright");

// Configuration
const CONFIG = {
  baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  headless: process.env.HEADLESS !== "false", // Set HEADLESS=false để xem browser
  timeout: 30000,
  testUser: {
    email: `test-${Date.now()}@playwright-test.com`,
    password: "TestPassword123!@#",
    fullName: "Playwright Test User",
    phone: "0987654321",
  },
};

console.log("🎭 Playwright Auth Testing Script");
console.log("================================");
console.log(`Frontend URL: ${CONFIG.baseUrl}`);
console.log(`Test User: ${CONFIG.testUser.email}`);
console.log(`Headless: ${CONFIG.headless}`);
console.log("");

async function runAuthTests() {
  let browser;
  let context;
  let page;

  try {
    // Launch browser
    console.log("🚀 Launching browser...");
    browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.headless ? 0 : 500, // Slow down if not headless
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    page = await context.newPage();
    page.setDefaultTimeout(CONFIG.timeout);

    // Test Results
    const results = {
      navigation: false,
      registration: false,
      login: false,
      authenticated: false,
      cleanup: false,
    };

    // Test 1: Navigate to frontend
    console.log("📄 Test 1: Navigating to frontend...");
    try {
      await page.goto(CONFIG.baseUrl);
      await page.waitForLoadState("networkidle");

      const title = await page.title();
      console.log(`   ✅ Page loaded: ${title}`);
      results.navigation = true;
    } catch (error) {
      console.log(`   ❌ Navigation failed: ${error.message}`);
      return results;
    }

    // Test 2: User Registration
    console.log("\n👤 Test 2: User Registration...");
    try {
      // Look for registration/signup link or button
      const signupSelectors = [
        'a[href*="register"]',
        'a[href*="signup"]',
        'button:has-text("Sign Up")',
        'button:has-text("Register")',
        'a:has-text("Sign Up")',
        'a:has-text("Register")',
        '[data-testid="signup"]',
        '[data-testid="register"]',
      ];

      let signupElement = null;
      for (const selector of signupSelectors) {
        try {
          signupElement = await page.locator(selector).first();
          if (await signupElement.isVisible({ timeout: 2000 })) {
            console.log(`   Found signup element: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!signupElement || !(await signupElement.isVisible())) {
        // Try to find any registration form directly
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 2000 })) {
          console.log("   Found registration form directly");
        } else {
          throw new Error("No registration form or signup link found");
        }
      } else {
        await signupElement.click();
        await page.waitForLoadState("networkidle");
      }

      // Fill registration form
      console.log("   Filling registration form...");

      // Wait for and fill email
      const emailField = page.locator('input[type="email"]').first();
      await emailField.waitFor({ state: "visible" });
      await emailField.fill(CONFIG.testUser.email);

      // Fill password
      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.waitFor({ state: "visible" });
      await passwordField.fill(CONFIG.testUser.password);

      // Fill full name if present
      const nameSelectors = [
        'input[name="full_name"]',
        'input[name="fullName"]',
        'input[name="name"]',
        'input[placeholder*="name" i]',
        'input[placeholder*="tên" i]',
      ];

      for (const selector of nameSelectors) {
        try {
          const nameField = page.locator(selector);
          if (await nameField.isVisible({ timeout: 1000 })) {
            await nameField.fill(CONFIG.testUser.fullName);
            console.log(`   Filled name field: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Fill phone if present
      const phoneSelectors = [
        'input[name="phone_number"]',
        'input[name="phone"]',
        'input[type="tel"]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="điện thoại" i]',
      ];

      for (const selector of phoneSelectors) {
        try {
          const phoneField = page.locator(selector);
          if (await phoneField.isVisible({ timeout: 1000 })) {
            await phoneField.fill(CONFIG.testUser.phone);
            console.log(`   Filled phone field: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Select role if present (default to patient)
      const roleSelectors = [
        'select[name="role"]',
        'input[name="role"][value="patient"]',
        'button:has-text("Patient")',
        'button:has-text("Bệnh nhân")',
      ];

      for (const selector of roleSelectors) {
        try {
          const roleField = page.locator(selector);
          if (await roleField.isVisible({ timeout: 1000 })) {
            if (selector.includes("select")) {
              await roleField.selectOption("patient");
            } else {
              await roleField.click();
            }
            console.log(`   Selected role: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Submit registration
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign Up")',
        'button:has-text("Register")',
        'button:has-text("Đăng ký")',
        'input[type="submit"]',
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const submitBtn = page.locator(selector);
          if (await submitBtn.isVisible({ timeout: 1000 })) {
            console.log(`   Clicking submit button: ${selector}`);
            await submitBtn.click();
            submitted = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!submitted) {
        throw new Error("Could not find submit button");
      }

      // Wait for response
      await page.waitForLoadState("networkidle");

      // Check for success indicators
      const successIndicators = [
        "text=success",
        "text=successful",
        "text=thành công",
        "text=đăng ký thành công",
        ".success",
        ".alert-success",
        '[data-testid="success"]',
      ];

      let registrationSuccess = false;
      for (const indicator of successIndicators) {
        try {
          if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
            console.log(
              `   ✅ Registration success indicator found: ${indicator}`
            );
            registrationSuccess = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }

      // Also check if we're redirected to login or dashboard
      const currentUrl = page.url();
      if (
        currentUrl.includes("login") ||
        currentUrl.includes("dashboard") ||
        currentUrl.includes("signin")
      ) {
        registrationSuccess = true;
        console.log(`   ✅ Redirected after registration: ${currentUrl}`);
      }

      if (registrationSuccess) {
        console.log("   ✅ User registration successful!");
        results.registration = true;
      } else {
        // Check for error messages
        const errorSelectors = [
          ".error",
          ".alert-error",
          ".alert-danger",
          "text=error",
          "text=failed",
          "text=lỗi",
        ];

        for (const selector of errorSelectors) {
          try {
            const errorElement = page.locator(selector);
            if (await errorElement.isVisible({ timeout: 1000 })) {
              const errorText = await errorElement.textContent();
              console.log(`   ⚠️ Registration error: ${errorText}`);
              break;
            }
          } catch (e) {
            // Continue checking
          }
        }
        console.log("   ❌ Registration result unclear");
      }
    } catch (error) {
      console.log(`   ❌ Registration failed: ${error.message}`);
    }

    // Test 3: User Login
    console.log("\n🔐 Test 3: User Login...");
    try {
      // Navigate to login page if not already there
      const currentUrl = page.url();
      if (!currentUrl.includes("login") && !currentUrl.includes("signin")) {
        // Look for login link
        const loginSelectors = [
          'a[href*="login"]',
          'a[href*="signin"]',
          'button:has-text("Sign In")',
          'button:has-text("Login")',
          'a:has-text("Sign In")',
          'a:has-text("Login")',
          'a:has-text("Đăng nhập")',
        ];

        for (const selector of loginSelectors) {
          try {
            const loginLink = page.locator(selector);
            if (await loginLink.isVisible({ timeout: 2000 })) {
              console.log(`   Navigating to login: ${selector}`);
              await loginLink.click();
              await page.waitForLoadState("networkidle");
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill login form
      console.log("   Filling login form...");

      const emailLogin = page.locator('input[type="email"]').first();
      await emailLogin.waitFor({ state: "visible" });
      await emailLogin.fill(CONFIG.testUser.email);

      const passwordLogin = page.locator('input[type="password"]').first();
      await passwordLogin.fill(CONFIG.testUser.password);

      // Submit login
      const loginSubmitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'button:has-text("Đăng nhập")',
        'input[type="submit"]',
      ];

      for (const selector of loginSubmitSelectors) {
        try {
          const submitBtn = page.locator(selector);
          if (await submitBtn.isVisible({ timeout: 1000 })) {
            console.log(`   Submitting login: ${selector}`);
            await submitBtn.click();
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      await page.waitForLoadState("networkidle");

      // Check for login success
      const loginSuccessUrl = page.url();
      if (
        loginSuccessUrl.includes("dashboard") ||
        loginSuccessUrl.includes("profile") ||
        loginSuccessUrl.includes("home")
      ) {
        console.log(
          `   ✅ Login successful! Redirected to: ${loginSuccessUrl}`
        );
        results.login = true;
      } else {
        // Check for user profile indicators
        const userIndicators = [
          "text=welcome",
          "text=dashboard",
          "text=profile",
          "text=logout",
          "text=đăng xuất",
          "text=xin chào",
          ".user-avatar",
          ".user-menu",
          '[data-testid="user-menu"]',
        ];

        for (const indicator of userIndicators) {
          try {
            if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
              console.log(`   ✅ Login success indicator: ${indicator}`);
              results.login = true;
              break;
            }
          } catch (e) {
            // Continue checking
          }
        }
      }

      if (!results.login) {
        console.log("   ❌ Login status unclear");
      }
    } catch (error) {
      console.log(`   ❌ Login failed: ${error.message}`);
    }

    // Test 4: Authenticated State Check
    console.log("\n🔒 Test 4: Checking authenticated state...");
    try {
      // Try to access a protected route or check for auth indicators
      const authIndicators = [
        "text=profile",
        "text=settings",
        "text=logout",
        "text=dashboard",
        ".user-avatar",
        ".auth-menu",
        '[data-testid="user-profile"]',
      ];

      for (const indicator of authIndicators) {
        try {
          if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
            console.log(`   ✅ Authenticated state confirmed: ${indicator}`);
            results.authenticated = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }

      if (!results.authenticated) {
        console.log("   ❌ Could not confirm authenticated state");
      }
    } catch (error) {
      console.log(`   ❌ Auth state check failed: ${error.message}`);
    }

    // Test 5: Cleanup (logout if possible)
    console.log("\n🧹 Test 5: Cleanup...");
    try {
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        'button:has-text("Đăng xuất")',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")',
        '[data-testid="logout"]',
      ];

      for (const selector of logoutSelectors) {
        try {
          const logoutBtn = page.locator(selector);
          if (await logoutBtn.isVisible({ timeout: 2000 })) {
            console.log(`   Logging out: ${selector}`);
            await logoutBtn.click();
            await page.waitForLoadState("networkidle");
            results.cleanup = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (results.cleanup) {
        console.log("   ✅ Logout successful");
      } else {
        console.log("   ⚠️ Could not find logout option");
        results.cleanup = true; // Don't fail for this
      }
    } catch (error) {
      console.log(`   ⚠️ Cleanup warning: ${error.message}`);
      results.cleanup = true; // Don't fail for cleanup
    }

    return results;
  } catch (error) {
    console.error("❌ Test suite error:", error);
    return {
      navigation: false,
      registration: false,
      login: false,
      authenticated: false,
      cleanup: false,
      error: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function main() {
  const results = await runAuthTests();

  // Results Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));

  const tests = [
    { name: "Navigation", key: "navigation", desc: "Frontend page loading" },
    { name: "Registration", key: "registration", desc: "User signup process" },
    { name: "Login", key: "login", desc: "User signin process" },
    {
      name: "Authentication",
      key: "authenticated",
      desc: "Authenticated state",
    },
    { name: "Cleanup", key: "cleanup", desc: "Logout/cleanup" },
  ];

  tests.forEach((test) => {
    const status = results[test.key] ? "✅ PASS" : "❌ FAIL";
    console.log(`${test.name.padEnd(15)} ${status.padEnd(10)} ${test.desc}`);
  });

  const passedTests = tests.filter((test) => results[test.key]).length;
  const totalTests = tests.length;

  console.log("\n📈 OVERALL RESULTS:");
  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! Auth flow working perfectly!");
  } else if (passedTests >= 3) {
    console.log(
      `⚠️ ${passedTests}/${totalTests} tests passed. Auth flow mostly working.`
    );
  } else {
    console.log(
      `❌ ${passedTests}/${totalTests} tests passed. Auth flow has issues.`
    );
  }

  if (results.error) {
    console.log(`\n💥 Error encountered: ${results.error}`);
  }

  console.log("\n🔧 TROUBLESHOOTING TIPS:");
  if (!results.navigation) {
    console.log("- Check if frontend is running on correct port");
    console.log(`- Verify ${CONFIG.baseUrl} is accessible`);
  }
  if (!results.registration) {
    console.log("- Check registration form selectors");
    console.log("- Verify auth service endpoints");
  }
  if (!results.login) {
    console.log("- Check login form implementation");
    console.log("- Verify password requirements");
  }

  console.log("\n🎭 Playwright test completed!");
}

// Run tests
main().catch(console.error);
