/**
 * Test script for appointment booking functionality
 * This script tests the complete appointment booking workflow
 */

const API_BASE_URL = "http://localhost:3100";

// Test credentials
const TEST_CREDENTIALS = {
  patient: {
    email: "patient@hospital.com",
    password: "Patient123.",
  },
  doctor: {
    email: "doctor@hospital.com",
    password: "Doctor123.",
  },
};

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  console.log(`${options.method || "GET"} ${endpoint}:`, {
    status: response.status,
    success: data.success,
    data: data.data ? "Present" : "None",
    error: data.error || "None",
  });

  return { response, data };
}

// Test authentication
async function testAuthentication() {
  console.log("\n=== Testing Authentication ===");

  try {
    const { response, data } = await makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(TEST_CREDENTIALS.patient),
    });

    console.log("Auth response data:", JSON.stringify(data, null, 2));

    if (data.success) {
      // Try different possible token locations
      const token =
        data.data?.token ||
        data.data?.access_token ||
        data.token ||
        data.access_token;
      if (token) {
        console.log("✅ Patient authentication successful");
        return token;
      } else {
        console.log("❌ Token not found in response, but auth was successful");
        console.log("Available data keys:", Object.keys(data.data || {}));
        return null;
      }
    } else {
      console.log("❌ Patient authentication failed:", data.error);
      return null;
    }
  } catch (error) {
    console.log("❌ Authentication error:", error.message);
    return null;
  }
}

// Test getting departments
async function testGetDepartments(token) {
  console.log("\n=== Testing Get Departments ===");

  try {
    const { response, data } = await makeRequest("/api/departments", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success && data.data?.length > 0) {
      console.log(
        "✅ Departments loaded successfully:",
        data.data.length,
        "departments"
      );
      return data.data[0]; // Return first department for testing
    } else {
      console.log("❌ Failed to load departments:", data.error);
      return null;
    }
  } catch (error) {
    console.log("❌ Departments error:", error.message);
    return null;
  }
}

// Test getting doctors
async function testGetDoctors(token, departmentId) {
  console.log("\n=== Testing Get Doctors ===");

  try {
    const endpoint = departmentId
      ? `/api/doctors?department_id=${departmentId}`
      : "/api/doctors";
    const { response, data } = await makeRequest(endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success && data.data?.length > 0) {
      console.log(
        "✅ Doctors loaded successfully:",
        data.data.length,
        "doctors"
      );
      return data.data[0]; // Return first doctor for testing
    } else {
      console.log("❌ Failed to load doctors:", data.error);
      return null;
    }
  } catch (error) {
    console.log("❌ Doctors error:", error.message);
    return null;
  }
}

// Test getting available slots
async function testGetAvailableSlots(token, doctorId) {
  console.log("\n=== Testing Get Available Slots ===");

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split("T")[0];

    const { response, data } = await makeRequest(
      `/api/appointments/available-slots?doctor_id=${doctorId}&date=${date}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "Available slots response data:",
      JSON.stringify(data, null, 2)
    );

    if (data.success) {
      const slots = data.data || data.slots || [];
      if (slots.length > 0) {
        console.log(
          "✅ Available slots loaded successfully:",
          slots.length,
          "slots"
        );
        return { date, slots };
      } else {
        console.log("⚠️ No available slots for this date");
        return { date, slots: [] };
      }
    } else {
      console.log("❌ Failed to load available slots:", data.error);
      return null;
    }
  } catch (error) {
    console.log("❌ Available slots error:", error.message);
    return null;
  }
}

// Test creating appointment
async function testCreateAppointment(token, doctorId, patientId, date, time) {
  console.log("\n=== Testing Create Appointment ===");

  try {
    const appointmentData = {
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: date,
      appointment_time: time,
      duration_minutes: 30,
      type: "consultation",
      reason: "Test appointment booking",
      notes: "Automated test appointment",
    };

    const { response, data } = await makeRequest("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appointmentData),
    });

    if (data.success && data.data?.appointment_id) {
      console.log(
        "✅ Appointment created successfully:",
        data.data.appointment_id
      );
      return data.data;
    } else {
      console.log("❌ Failed to create appointment:", data.error);
      return null;
    }
  } catch (error) {
    console.log("❌ Create appointment error:", error.message);
    return null;
  }
}

// Test getting patient appointments
async function testGetPatientAppointments(token, patientId) {
  console.log("\n=== Testing Get Patient Appointments ===");

  try {
    const { response, data } = await makeRequest(
      `/api/appointments/patient/${patientId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.success) {
      console.log(
        "✅ Patient appointments loaded successfully:",
        data.data?.length || 0,
        "appointments"
      );
      return data.data;
    } else {
      console.log("❌ Failed to load patient appointments:", data.error);
      return null;
    }
  } catch (error) {
    console.log("❌ Patient appointments error:", error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting Appointment Booking Tests...");

  // Test authentication
  const token = await testAuthentication();
  if (!token) {
    console.log("❌ Cannot proceed without authentication");
    return;
  }

  // Extract patient ID from token (simplified - in real app this would be decoded properly)
  const patientId = "PAT-202506-081"; // Using test patient ID

  // Test departments
  const department = await testGetDepartments(token);

  // Test doctors
  const doctor = await testGetDoctors(token, department?.department_id);
  if (!doctor) {
    console.log("❌ Cannot proceed without doctor data");
    return;
  }

  // Test available slots
  const slotsData = await testGetAvailableSlots(token, doctor.doctor_id);
  if (!slotsData) {
    console.log("❌ Cannot proceed without available slots");
    return;
  }

  // Test create appointment
  const appointment = await testCreateAppointment(
    token,
    doctor.doctor_id,
    patientId,
    slotsData.date,
    slotsData.slots[0]
  );

  // Test get patient appointments
  await testGetPatientAppointments(token, patientId);

  console.log("\n🎉 All tests completed!");
}

// Run tests if this file is executed directly
if (typeof window === "undefined") {
  runTests().catch(console.error);
}

module.exports = { runTests };
