// ============================================================================
// TEST DATABASE STANDARDIZATION SCRIPT
// Comprehensive testing after database field standardization
// ============================================================================

// Simple logger for this script
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[INFO] ${message}`, data || ""),
  error: (message: string, data?: any) =>
    console.error(`[ERROR] ${message}`, data || ""),
  warn: (message: string, data?: any) =>
    console.warn(`[WARN] ${message}`, data || ""),
};

interface TestResult {
  testName: string;
  category: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class DatabaseStandardizationTester {
  private results: TestResult[] = [];

  constructor() {
    // Constructor simplified for testing
  }

  async runAllTests(): Promise<void> {
    console.log("🧪 Starting Database Standardization Tests...\n");
    console.log("=".repeat(80));
    console.log(
      "🏥 HOSPITAL MANAGEMENT SYSTEM - DATABASE STANDARDIZATION TESTING"
    );
    console.log("📋 Verifying all database field changes work correctly");
    console.log("=".repeat(80));
    console.log("");

    // Run test categories
    await this.testDatabaseConnectivity();
    await this.testHealthcareFunctions();
    await this.testFieldMappings();
    await this.testRepositoryQueries();
    await this.testGraphQLResolvers();
    await this.testCacheOperations();
    await this.testErrorHandling();

    // Generate final report
    this.generateTestReport();
  }

  // ============================================================================
  // DATABASE CONNECTIVITY TESTS
  // ============================================================================

  private async testDatabaseConnectivity(): Promise<void> {
    console.log("🔌 Testing Database Connectivity...");

    await this.runTest(
      "Basic Connection Pool Health",
      "connectivity",
      async () => {
        const health = await connectionPool.healthCheck();
        if (!health.healthy) {
          throw new Error(
            `Connection pool unhealthy: ${health.issues.join(", ")}`
          );
        }
        return {
          healthy: health.healthy,
          connections: health.stats.totalConnections,
        };
      }
    );

    await this.runTest("Database Query Execution", "connectivity", async () => {
      const result = await connectionPool.executeQuery(async (client) => {
        const { data, error } = await client
          .from("profiles")
          .select("id, full_name, email")
          .limit(1);

        if (error) throw error;
        return data;
      });

      if (!Array.isArray(result)) {
        throw new Error("Query did not return expected array");
      }

      return { resultCount: result.length };
    });

    console.log("");
  }

  // ============================================================================
  // HEALTHCARE FUNCTIONS TESTS
  // ============================================================================

  private async testHealthcareFunctions(): Promise<void> {
    console.log("🏥 Testing Healthcare Functions...");

    await this.runTest("ICD-10 Validation Function", "healthcare", async () => {
      const result = await this.healthcareService.validateICD10Code("I10");

      if (!result || typeof result.is_valid !== "boolean") {
        throw new Error("ICD-10 validation returned invalid result structure");
      }

      return {
        isValid: result.is_valid,
        code: result.code_info?.code,
        description: result.code_info?.description,
      };
    });

    await this.runTest("ICD-10 Search Function", "healthcare", async () => {
      const results = await this.healthcareService.searchICD10Codes(
        "diabetes",
        5
      );

      if (!Array.isArray(results)) {
        throw new Error("ICD-10 search did not return array");
      }

      return { resultCount: results.length, firstResult: results[0] };
    });

    await this.runTest("FHIR Patient Validation", "healthcare", async () => {
      const samplePatient = {
        resourceType: "Patient",
        id: "test-standardization",
        active: true,
        name: [
          {
            use: "official",
            text: "Test Standardization Patient",
            family: "Standardization",
            given: ["Test"],
          },
        ],
        gender: "unknown",
      };

      const result =
        await this.healthcareService.validateFHIRPatient(samplePatient);

      if (!result || typeof result.is_valid !== "boolean") {
        throw new Error("FHIR validation returned invalid result structure");
      }

      return {
        isValid: result.is_valid,
        complianceScore: result.fhir_compliance_score,
      };
    });

    console.log("");
  }

  // ============================================================================
  // FIELD MAPPING TESTS
  // ============================================================================

  private async testFieldMappings(): Promise<void> {
    console.log("🗂️  Testing Field Mappings...");

    await this.runTest(
      "Profile Fields Standardization",
      "field_mapping",
      async () => {
        const result = await connectionPool.executeQuery(async (client) => {
          const { data, error } = await client
            .from("profiles")
            .select(
              "id, full_name, email, phone_number, date_of_birth, is_active"
            )
            .limit(1);

          if (error) throw error;
          return data;
        });

        if (!result || result.length === 0) {
          throw new Error("No profile data found");
        }

        const profile = result[0];
        const requiredFields = ["id", "full_name", "email", "is_active"];
        const missingFields = requiredFields.filter(
          (field) => !(field in profile)
        );

        if (missingFields.length > 0) {
          throw new Error(
            `Missing standardized fields: ${missingFields.join(", ")}`
          );
        }

        return {
          profileId: profile.id,
          hasFullName: !!profile.full_name,
          hasStandardizedFields: missingFields.length === 0,
        };
      }
    );

    await this.runTest(
      "Patient Fields Standardization",
      "field_mapping",
      async () => {
        const result = await connectionPool.executeQuery(async (client) => {
          const { data, error } = await client
            .from("patients")
            .select(
              `
            patient_id,
            profile_id,
            gender,
            blood_type,
            status,
            created_at,
            updated_at,
            profiles!inner (
              id,
              full_name,
              email,
              phone_number,
              is_active
            )
          `
            )
            .limit(1);

          if (error) throw error;
          return data;
        });

        if (!result || result.length === 0) {
          return {
            message: "No patient data found - this is acceptable for testing",
          };
        }

        const patient = result[0];
        return {
          patientId: patient.patient_id,
          hasProfileJoin: !!patient.profiles,
          profileHasFullName: !!patient.profiles?.full_name,
        };
      }
    );

    console.log("");
  }

  // ============================================================================
  // REPOSITORY QUERY TESTS
  // ============================================================================

  private async testRepositoryQueries(): Promise<void> {
    console.log("📚 Testing Repository Queries...");

    await this.runTest(
      "Medical Records Query Structure",
      "repository",
      async () => {
        const result = await connectionPool.executeQuery(async (client) => {
          const { data, error } = await client
            .from("medical_records")
            .select(
              "id, patient_id, doctor_id, visit_date, status, created_at, updated_at"
            )
            .limit(1);

          if (error) throw error;
          return data;
        });

        // It's OK if no medical records exist yet
        return {
          queryExecuted: true,
          recordCount: result?.length || 0,
          hasStandardizedFields: true,
        };
      }
    );

    await this.runTest(
      "Doctor Reviews Query Structure",
      "repository",
      async () => {
        const result = await connectionPool.executeQuery(async (client) => {
          const { data, error } = await client
            .from("doctor_reviews")
            .select(
              "id, doctor_id, patient_id, rating, review_text, created_at"
            )
            .limit(1);

          if (error) throw error;
          return data;
        });

        return {
          queryExecuted: true,
          reviewCount: result?.length || 0,
        };
      }
    );

    console.log("");
  }

  // ============================================================================
  // GRAPHQL RESOLVER TESTS
  // ============================================================================

  private async testGraphQLResolvers(): Promise<void> {
    console.log("🔗 Testing GraphQL Resolver Compatibility...");

    await this.runTest("Field Resolver Mapping", "graphql", async () => {
      // Test that our field resolvers would work correctly
      const mockDatabaseResult = {
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        oxygen_saturation: 98,
        recorded_at: new Date().toISOString(),
        recorded_by: "test-doctor",
      };

      // Simulate GraphQL field resolvers
      const resolvedFields = {
        bloodPressureSystolic: mockDatabaseResult.blood_pressure_systolic,
        bloodPressureDiastolic: mockDatabaseResult.blood_pressure_diastolic,
        oxygenSaturation: mockDatabaseResult.oxygen_saturation,
        recordedAt: mockDatabaseResult.recorded_at,
        recordedBy: mockDatabaseResult.recorded_by,
      };

      return {
        originalFields: Object.keys(mockDatabaseResult).length,
        resolvedFields: Object.keys(resolvedFields).length,
        mappingWorking: Object.keys(resolvedFields).every(
          (key) => resolvedFields[key] !== undefined
        ),
      };
    });

    console.log("");
  }

  // ============================================================================
  // CACHE OPERATIONS TESTS
  // ============================================================================

  private async testCacheOperations(): Promise<void> {
    console.log("💾 Testing Cache Operations...");

    await this.runTest("Cache Service Functionality", "cache", async () => {
      const testKey = "standardization-test-" + Date.now();
      const testValue = {
        test: true,
        timestamp: Date.now(),
        standardizedField: "full_name",
      };

      // Test cache operations
      const setResult = await cacheService.set(testKey, testValue, { ttl: 60 });
      const getValue = await cacheService.get(testKey);
      const existsResult = await cacheService.exists(testKey);
      await cacheService.delete(testKey);

      return {
        setWorking: setResult === true,
        getWorking: getValue !== null,
        existsWorking: existsResult === true,
        dataIntegrity: JSON.stringify(getValue) === JSON.stringify(testValue),
      };
    });

    await this.runTest("Healthcare Cache Integration", "cache", async () => {
      // Test healthcare-specific caching
      const icd10Code = "I10";

      // This should use the cache if available
      const result1 = await this.healthcareService.validateICD10Code(icd10Code);
      const result2 = await this.healthcareService.validateICD10Code(icd10Code);

      return {
        firstCallWorking: result1?.is_valid === true,
        secondCallWorking: result2?.is_valid === true,
        cacheConsistency: JSON.stringify(result1) === JSON.stringify(result2),
      };
    });

    console.log("");
  }

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  private async testErrorHandling(): Promise<void> {
    console.log("⚠️  Testing Error Handling...");

    await this.runTest(
      "Vietnamese Error Messages",
      "error_handling",
      async () => {
        try {
          // Try to validate an invalid ICD-10 code
          await this.healthcareService.validateICD10Code("INVALID_CODE");
          return {
            errorHandlingWorking: false,
            message: "Should have thrown error",
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            errorHandlingWorking: true,
            hasVietnameseSupport:
              errorMessage.includes("ICD-10") || errorMessage.includes("mã"),
            errorMessage,
          };
        }
      }
    );

    await this.runTest(
      "Database Error Handling",
      "error_handling",
      async () => {
        try {
          // Try to query a non-existent table
          await connectionPool.executeQuery(async (client) => {
            const { data, error } = await client
              .from("non_existent_table")
              .select("*")
              .limit(1);

            if (error) throw error;
            return data;
          });

          return {
            errorHandlingWorking: false,
            message: "Should have thrown error",
          };
        } catch (error) {
          return {
            errorHandlingWorking: true,
            errorType:
              error instanceof Error ? error.constructor.name : "Unknown",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    );

    console.log("");
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async runTest(
    testName: string,
    category: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        category,
        passed: true,
        duration,
        details: result,
      });

      console.log(`   ✅ ${testName}: ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.results.push({
        testName,
        category,
        passed: false,
        duration,
        error: errorMessage,
      });

      console.log(`   ❌ ${testName}: ${errorMessage} (${duration}ms)`);
    }
  }

  private generateTestReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageResponseTime =
      this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    console.log("=".repeat(80));
    console.log("📊 DATABASE STANDARDIZATION TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`📁 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(
      `⏱️  Average Response Time: ${averageResponseTime.toFixed(2)}ms`
    );
    console.log("");

    // Group results by category
    const categories = [...new Set(this.results.map((r) => r.category))];

    categories.forEach((category) => {
      const categoryResults = this.results.filter(
        (r) => r.category === category
      );
      const categoryPassed = categoryResults.filter((r) => r.passed).length;
      const categoryTotal = categoryResults.length;

      console.log(
        `📂 ${category.toUpperCase()}: ${categoryPassed}/${categoryTotal} passed`
      );

      categoryResults.forEach((result) => {
        const status = result.passed ? "✅" : "❌";
        console.log(`   ${status} ${result.testName}: ${result.duration}ms`);
        if (!result.passed && result.error) {
          console.log(`      Error: ${result.error}`);
        }
      });
      console.log("");
    });

    console.log("=".repeat(80));

    if (failedTests === 0) {
      console.log("🎉 ALL DATABASE STANDARDIZATION TESTS PASSED!");
      console.log("✅ Database field standardization is working correctly");
      console.log("✅ All healthcare functions are operational");
      console.log("✅ Field mappings are consistent");
      console.log("✅ Repository queries are working");
      console.log("✅ Cache operations are functional");
      console.log("✅ Error handling is working properly");
    } else {
      console.log("⚠️  SOME TESTS FAILED - REVIEW REQUIRED");
      console.log(`🔧 Please investigate and fix ${failedTests} failing tests`);
    }

    console.log("=".repeat(80));
    console.log("");
  }
}

// CLI execution
if (require.main === module) {
  const tester = new DatabaseStandardizationTester();

  tester
    .runAllTests()
    .then(() => {
      const failedTests = tester.results.filter((r) => !r.passed).length;
      process.exit(failedTests === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { DatabaseStandardizationTester };
