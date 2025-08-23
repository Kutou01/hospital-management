/**
 * Test MFA Functionality for Hospital Management System
 * Tests MFA enrollment, verification, and authentication flows
 */

const CONFIG = {
  baseUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  testUser: {
    email: process.env.TEST_USER_EMAIL || "admin@hospital.com",
    password: process.env.TEST_USER_PASSWORD || "admin123",
  },
  timeout: 30000,
};

class MFATester {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.mfaFactorId = null;
    this.challengeId = null;
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log("---");
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${CONFIG.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(this.accessToken && {
          Authorization: `Bearer ${this.accessToken}`,
        }),
      },
      timeout: CONFIG.timeout,
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();

      return {
        status: response.status,
        ok: response.ok,
        data,
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
      };
    }
  }

  async login() {
    this.log("🔐 Attempting to login...");

    const response = await this.makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: CONFIG.testUser.email,
        password: CONFIG.testUser.password,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Login failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.accessToken = response.data.data.access_token;
    this.refreshToken = response.data.data.refresh_token;

    this.log("✅ Login successful", {
      accessToken: this.accessToken ? "***" : null,
      refreshToken: this.refreshToken ? "***" : null,
    });

    return true;
  }

  async getMFAStatus() {
    this.log("📊 Getting MFA status...");

    const response = await this.makeRequest("/api/auth/mfa/status");

    if (!response.ok) {
      throw new Error(
        `Failed to get MFA status: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ MFA status retrieved", response.data);
    return response.data;
  }

  async enrollTOTP() {
    this.log("🔐 Starting TOTP enrollment...");

    const response = await this.makeRequest("/api/auth/mfa/enroll", {
      method: "POST",
      body: JSON.stringify({
        friendlyName: "Hospital Staff MFA Test",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `TOTP enrollment failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    const enrollment = response.data.data.enrollment;
    this.mfaFactorId = enrollment.factorId;

    this.log("✅ TOTP enrollment started", {
      factorId: enrollment.factorId,
      qrCode: enrollment.qrCode ? "Generated" : "Not generated",
      secret: enrollment.secret ? "***" : "Not provided",
    });

    return enrollment;
  }

  async completeEnrollment(code) {
    if (!this.mfaFactorId) {
      throw new Error("No factor ID available. Please enroll first.");
    }

    this.log(`🔐 Completing TOTP enrollment with code: ${code}...`);

    const response = await this.makeRequest("/api/auth/mfa/enroll/complete", {
      method: "POST",
      body: JSON.stringify({
        factorId: this.mfaFactorId,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `TOTP enrollment completion failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ TOTP enrollment completed successfully");
    return true;
  }

  async createChallenge() {
    if (!this.mfaFactorId) {
      throw new Error("No factor ID available. Please enroll first.");
    }

    this.log("🔐 Creating TOTP challenge...");

    const response = await this.makeRequest("/api/auth/mfa/challenge", {
      method: "POST",
      body: JSON.stringify({
        factorId: this.mfaFactorId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Challenge creation failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.challengeId = response.data.data.challengeId;

    this.log("✅ TOTP challenge created", {
      challengeId: this.challengeId,
    });

    return this.challengeId;
  }

  async verifyTOTP(code) {
    if (!this.mfaFactorId || !this.challengeId) {
      throw new Error(
        "Missing factor ID or challenge ID. Please create challenge first."
      );
    }

    this.log(`🔐 Verifying TOTP with code: ${code}...`);

    const response = await this.makeRequest("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({
        factorId: this.mfaFactorId,
        challengeId: this.challengeId,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `TOTP verification failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ TOTP verification successful");
    return true;
  }

  async authenticateWithMFA(code) {
    if (!this.mfaFactorId || !this.challengeId) {
      throw new Error(
        "Missing factor ID or challenge ID. Please create challenge first."
      );
    }

    this.log(`🔐 Authenticating with MFA using code: ${code}...`);

    const response = await this.makeRequest("/api/auth/mfa/authenticate", {
      method: "POST",
      body: JSON.stringify({
        factorId: this.mfaFactorId,
        challengeId: this.challengeId,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `MFA authentication failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ MFA authentication successful");
    return true;
  }

  async checkCompliance() {
    this.log("📋 Checking MFA compliance...");

    const response = await this.makeRequest("/api/auth/mfa/compliance");

    if (!response.ok) {
      throw new Error(
        `Compliance check failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ MFA compliance check completed", response.data);
    return response.data;
  }

  async getAuditHistory() {
    this.log("📝 Getting MFA audit history...");

    const response = await this.makeRequest("/api/auth/mfa/audit?limit=10");

    if (!response.ok) {
      throw new Error(
        `Audit history retrieval failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ MFA audit history retrieved", response.data);
    return response.data;
  }

  async unenrollTOTP() {
    if (!this.mfaFactorId) {
      throw new Error("No factor ID available. Please enroll first.");
    }

    this.log("🗑️ Unenrolling TOTP factor...");

    const response = await this.makeRequest(
      `/api/auth/mfa/unenroll/${this.mfaFactorId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(
        `TOTP unenrollment failed: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }

    this.log("✅ TOTP factor unenrolled successfully");
    this.mfaFactorId = null;
    this.challengeId = null;
    return true;
  }

  async runFullTest() {
    try {
      this.log("🚀 Starting MFA Full Test Suite");

      // Step 1: Login
      await this.login();

      // Step 2: Check initial MFA status
      await this.getMFAStatus();

      // Step 3: Enroll TOTP
      const enrollment = await this.enrollTOTP();

      // Step 4: Complete enrollment (requires manual code input)
      this.log("⚠️  MANUAL STEP REQUIRED:");
      this.log(
        "Please scan the QR code with your authenticator app and enter the 6-digit code:"
      );
      this.log(`QR Code: ${enrollment.qrCode}`);
      this.log(`Secret: ${enrollment.secret}`);

      // For testing purposes, we'll simulate completion
      // In real usage, user would input the code from their authenticator app
      const testCode = "123456"; // This would normally come from user input
      this.log(`Using test code: ${testCode}`);

      await this.completeEnrollment(testCode);

      // Step 5: Check MFA status after enrollment
      await this.getMFAStatus();

      // Step 6: Create challenge
      await this.createChallenge();

      // Step 7: Verify TOTP
      await this.verifyTOTP(testCode);

      // Step 8: Authenticate with MFA
      await this.authenticateWithMFA(testCode);

      // Step 9: Check compliance
      await this.checkCompliance();

      // Step 10: Get audit history
      await this.getAuditHistory();

      // Step 11: Cleanup - unenroll TOTP
      await this.unenrollTOTP();

      // Step 12: Final MFA status check
      await this.getMFAStatus();

      this.log("🎉 MFA Full Test Suite completed successfully!");
    } catch (error) {
      this.log("❌ Test failed:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async runBasicTest() {
    try {
      this.log("🚀 Starting MFA Basic Test Suite");

      // Step 1: Login
      await this.login();

      // Step 2: Check MFA status
      await this.getMFAStatus();

      // Step 3: Check compliance
      await this.checkCompliance();

      this.log("✅ MFA Basic Test Suite completed successfully!");
    } catch (error) {
      this.log("❌ Basic test failed:", {
        error: error.message,
      });
      throw error;
    }
  }
}

// Main execution
async function main() {
  const tester = new MFATester();

  try {
    const testType = process.argv[2] || "basic";

    if (testType === "full") {
      await tester.runFullTest();
    } else {
      await tester.runBasicTest();
    }
  } catch (error) {
    console.error("Test execution failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MFATester;
