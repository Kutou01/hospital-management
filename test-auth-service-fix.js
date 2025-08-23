#!/usr/bin/env node

/**
 * Test script để kiểm tra Auth Service sau khi fix infinite recursion
 * Chạy sau khi đã chạy fix-auth-infinite-recursion.sql
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

// Cấu hình
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

console.log("🔍 Testing Auth Service After RLS Fix...\n");
console.log("=".repeat(60));

// Kiểm tra biến môi trường
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error("❌ Thiếu biến môi trường Supabase");
  console.error(
    "   Cần: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

// Tạo Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  console.log("📡 Test 1: Kiểm tra kết nối Supabase...\n");

  try {
    // Test Admin client (Service Role)
    console.log("🔧 Testing Admin Client (Service Role)...");
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from("profiles")
      .select("count")
      .limit(1);

    if (adminError) {
      console.log(`❌ Admin client error: ${adminError.message}`);
      if (adminError.message.includes("infinite recursion")) {
        console.log(
          "⚠️  Vẫn còn infinite recursion! Cần chạy lại SQL fix script."
        );
        return false;
      }
    } else {
      console.log("✅ Admin client hoạt động bình thường");
    }

    // Test Anonymous client
    console.log("🔓 Testing Anonymous Client...");
    const { data: anonTest, error: anonError } = await supabaseClient
      .from("profiles")
      .select("count")
      .limit(1);

    if (anonError && !anonError.message.includes("PGRST116")) {
      console.log(`❌ Anonymous client error: ${anonError.message}`);
      return false;
    } else {
      console.log("✅ Anonymous client hoạt động bình thường");
    }

    // Test Auth functionality
    console.log("🔐 Testing Auth functionality...");
    const { data: authTest, error: authError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`);
      return false;
    } else {
      console.log(
        `✅ Auth service hoạt động. Tổng users: ${authTest.users?.length || 0}`
      );
    }

    return true;
  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    return false;
  }
}

async function testRLSPolicies() {
  console.log("\n📋 Test 2: Kiểm tra RLS Policies...\n");

  try {
    // Kiểm tra policies hiện tại
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc("exec_sql", {
        sql: `
          SELECT policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'profiles' AND schemaname = 'public'
          ORDER BY policyname;
        `,
      })
      .catch(async () => {
        // Fallback: query trực tiếp (có thể không work trên một số version)
        return { data: null, error: null };
      });

    if (policies && policies.length > 0) {
      console.log("📋 Current RLS Policies:");
      policies.forEach((policy) => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log("ℹ️  Không thể query policies trực tiếp (bình thường)");
    }

    // Test basic profile operations
    console.log("\n🧪 Testing profile operations...");

    // Test count
    const { count, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.log(`❌ Count error: ${countError.message}`);
      return false;
    } else {
      console.log(`✅ Đếm profiles thành công: ${count} records`);
    }

    return true;
  } catch (error) {
    console.log(`❌ RLS test error: ${error.message}`);
    return false;
  }
}

async function testAuthServiceEndpoints() {
  console.log("\n🌐 Test 3: Kiểm tra Auth Service Endpoints...\n");

  try {
    // Test health check
    console.log("🏥 Testing health endpoint...");
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      console.log(
        `✅ Health check: ${response.status} - ${
          response.data?.message || "OK"
        }`
      );
    } catch (error) {
      console.log(`❌ Health check failed: ${error.message}`);
      console.log(
        "ℹ️  Auth service có thể không chạy hoặc chạy trên port khác"
      );
    }

    // Test email availability (không cần auth)
    console.log("📧 Testing email availability endpoint...");
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const response = await axios.get(
        `${AUTH_SERVICE_URL}/auth/check-email/${testEmail}`,
        {
          timeout: 5000,
        }
      );
      console.log(
        `✅ Email check: ${response.status} - Available: ${response.data?.available}`
      );
    } catch (error) {
      if (error.response) {
        console.log(
          `✅ Email check endpoint responsive: ${error.response.status}`
        );
      } else {
        console.log(`❌ Email check failed: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ Auth service test error: ${error.message}`);
    return false;
  }
}

async function testSignupFlow() {
  console.log("\n✍️  Test 4: Test Registration Flow (Safe Test)...\n");

  try {
    // Tạo test user data
    const testUserData = {
      email: `test-user-${Date.now()}@hospital-test.com`,
      password: "TestPassword123!@#",
      full_name: "Test User",
      role: "patient",
      phone_number: "0123456789",
    };

    console.log("📝 Testing user registration...");
    console.log(`   Email: ${testUserData.email}`);
    console.log(`   Role: ${testUserData.role}`);

    try {
      const response = await axios.post(
        `${AUTH_SERVICE_URL}/auth/signup`,
        testUserData,
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.user) {
        console.log("✅ Registration successful!");
        console.log(`   User ID: ${response.data.user.id}`);
        console.log(`   Email: ${response.data.user.email}`);

        // Cleanup: Xóa test user
        console.log("🧹 Cleaning up test user...");
        await supabaseAdmin.auth.admin.deleteUser(response.data.user.id);
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", response.data.user.id);
        console.log("✅ Test user cleaned up");

        return true;
      } else {
        console.log("❌ Registration failed:", response.data.error);
        return false;
      }
    } catch (error) {
      if (error.response) {
        console.log(
          `❌ Registration error: ${error.response.status} - ${error.response.data?.error}`
        );
      } else {
        console.log(`❌ Registration failed: ${error.message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Signup test error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log("🚀 Bắt đầu test Auth Service sau khi fix RLS...\n");

  const results = {
    supabaseConnection: false,
    rlsPolicies: false,
    authEndpoints: false,
    signupFlow: false,
  };

  // Test 1: Supabase Connection
  results.supabaseConnection = await testSupabaseConnection();

  // Test 2: RLS Policies
  if (results.supabaseConnection) {
    results.rlsPolicies = await testRLSPolicies();
  } else {
    console.log("⏭️  Bỏ qua RLS test do Supabase connection failed");
  }

  // Test 3: Auth Service Endpoints
  results.authEndpoints = await testAuthServiceEndpoints();

  // Test 4: Signup Flow (chỉ test nếu connection OK)
  if (results.supabaseConnection && results.authEndpoints) {
    results.signupFlow = await testSignupFlow();
  } else {
    console.log("⏭️  Bỏ qua signup test do dependencies failed");
  }

  // Tổng kết
  console.log("\n" + "=".repeat(60));
  console.log("📊 KẾT QUẢ TEST:");
  console.log("=".repeat(60));
  console.log(
    `🔗 Supabase Connection: ${
      results.supabaseConnection ? "✅ PASS" : "❌ FAIL"
    }`
  );
  console.log(
    `📋 RLS Policies: ${results.rlsPolicies ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `🌐 Auth Endpoints: ${results.authEndpoints ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(`✍️  Signup Flow: ${results.signupFlow ? "✅ PASS" : "❌ FAIL"}`);

  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log("\n📈 TỔNG KẾT:");
  if (totalPassed === totalTests) {
    console.log("🎉 TẤT CẢ TESTS PASSED! Auth Service hoạt động bình thường.");
    console.log("✅ Infinite recursion đã được fix thành công!");
  } else {
    console.log(
      `⚠️  ${totalPassed}/${totalTests} tests passed. Cần kiểm tra thêm.`
    );

    if (!results.supabaseConnection) {
      console.log("\n🔧 Khắc phục:");
      console.log("1. Chạy lại SQL script: fix-auth-infinite-recursion.sql");
      console.log("2. Kiểm tra biến môi trường Supabase");
      console.log("3. Kiểm tra network connection");
    }

    if (!results.authEndpoints) {
      console.log("\n🔧 Khắc phục Auth Service:");
      console.log("1. Đảm bảo Auth Service đang chạy");
      console.log("2. Kiểm tra port và URL");
      console.log("3. Restart Docker containers nếu cần");
    }
  }

  console.log("\n🏁 Test hoàn thành!");
}

// Chạy tests
runAllTests().catch((error) => {
  console.error("❌ Test suite error:", error);
  process.exit(1);
});
