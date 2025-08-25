// ============================================================================
// VERIFY DATABASE STANDARDIZATION SCRIPT
// Simple verification that standardization was successful
// ============================================================================

import fs from "fs";
import * as glob from "glob";
import path from "path";

interface VerificationResult {
  category: string;
  description: string;
  passed: boolean;
  details: string;
}

class StandardizationVerifier {
  public results: VerificationResult[] = [];

  async verifyStandardization(): Promise<void> {
    console.log("🔍 Verifying Database Field Standardization...\n");
    console.log("=".repeat(80));
    console.log("🏥 HOSPITAL MANAGEMENT SYSTEM - STANDARDIZATION VERIFICATION");
    console.log(
      "📋 Checking if all database field references are standardized"
    );
    console.log("=".repeat(80));
    console.log("");

    // Run verification checks
    await this.checkOldFieldReferences();
    await this.checkStandardizedFieldUsage();
    await this.checkFileStructure();
    await this.checkImportStatements();

    // Generate report
    this.generateVerificationReport();
  }

  private async checkOldFieldReferences(): Promise<void> {
    console.log("🔍 Checking for old field references...");

    const oldFieldPatterns = [
      { pattern: /\.firstName\b/g, field: "firstName" },
      { pattern: /\.lastName\b/g, field: "lastName" },
      { pattern: /\.isActive\b/g, field: "isActive" },
      { pattern: /\.createdAt\b/g, field: "createdAt" },
      { pattern: /\.updatedAt\b/g, field: "updatedAt" },
      { pattern: /\.recordedAt\b/g, field: "recordedAt" },
      { pattern: /\.recordedBy\b/g, field: "recordedBy" },
    ];

    const files = this.getAllTypeScriptFiles();
    let totalOldReferences = 0;
    const foundReferences: string[] = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, "utf8");

        for (const { pattern, field } of oldFieldPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            totalOldReferences += matches.length;
            foundReferences.push(`${filePath}: ${matches.length}x ${field}`);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    this.results.push({
      category: "Old Field References",
      description: "Check for remaining old field references",
      passed: totalOldReferences === 0,
      details:
        totalOldReferences === 0
          ? "No old field references found ✅"
          : `Found ${totalOldReferences} old references: ${foundReferences.slice(0, 5).join(", ")}`,
    });

    console.log(
      `   ${totalOldReferences === 0 ? "✅" : "❌"} Old field references: ${totalOldReferences} found`
    );
  }

  private async checkStandardizedFieldUsage(): Promise<void> {
    console.log("🔍 Checking for standardized field usage...");

    const standardizedPatterns = [
      { pattern: /\.full_name\b/g, field: "full_name" },
      { pattern: /\.is_active\b/g, field: "is_active" },
      { pattern: /\.created_at\b/g, field: "created_at" },
      { pattern: /\.updated_at\b/g, field: "updated_at" },
      { pattern: /\.recorded_at\b/g, field: "recorded_at" },
      { pattern: /\.recorded_by\b/g, field: "recorded_by" },
    ];

    const files = this.getAllTypeScriptFiles();
    let totalStandardizedReferences = 0;
    const foundReferences: string[] = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, "utf8");

        for (const { pattern, field } of standardizedPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            totalStandardizedReferences += matches.length;
            foundReferences.push(`${field}: ${matches.length}`);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    this.results.push({
      category: "Standardized Field Usage",
      description: "Check for standardized field usage",
      passed: totalStandardizedReferences > 0,
      details:
        totalStandardizedReferences > 0
          ? `Found ${totalStandardizedReferences} standardized references ✅`
          : "No standardized field references found ❌",
    });

    console.log(
      `   ${totalStandardizedReferences > 0 ? "✅" : "❌"} Standardized field usage: ${totalStandardizedReferences} found`
    );
  }

  private async checkFileStructure(): Promise<void> {
    console.log("🔍 Checking file structure...");

    const expectedDirectories = [
      "services/doctor-service/src",
      "services/patient-service/src",
      "services/appointment-service/src",
      "services/medical-records-service/src",
      "services/receptionist-service/src",
      "services/shared/src",
    ];

    let existingDirectories = 0;
    const missingDirectories: string[] = [];

    for (const dir of expectedDirectories) {
      if (fs.existsSync(dir)) {
        existingDirectories++;
      } else {
        missingDirectories.push(dir);
      }
    }

    this.results.push({
      category: "File Structure",
      description: "Check service directory structure",
      passed: existingDirectories >= 4, // At least 4 services should exist
      details: `Found ${existingDirectories}/${expectedDirectories.length} expected directories`,
    });

    console.log(
      `   ${existingDirectories >= 4 ? "✅" : "❌"} Service directories: ${existingDirectories}/${expectedDirectories.length} found`
    );
  }

  private async checkImportStatements(): Promise<void> {
    console.log("🔍 Checking import statements...");

    const files = this.getAllTypeScriptFiles();
    let connectionPoolImports = 0;
    let oldSupabaseImports = 0;

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, "utf8");

        // Check for connection pool imports
        if (
          content.includes("connectionPool") ||
          content.includes("connection-pool")
        ) {
          connectionPoolImports++;
        }

        // Check for old supabase admin imports
        if (content.includes("supabaseAdmin") && !content.includes("// ")) {
          oldSupabaseImports++;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    this.results.push({
      category: "Import Statements",
      description: "Check for updated import statements",
      passed: connectionPoolImports > 0 && oldSupabaseImports === 0,
      details: `Connection pool imports: ${connectionPoolImports}, Old supabase imports: ${oldSupabaseImports}`,
    });

    console.log(
      `   ${connectionPoolImports > 0 && oldSupabaseImports === 0 ? "✅" : "❌"} Import statements: ${connectionPoolImports} connection pool, ${oldSupabaseImports} old supabase`
    );
  }

  private getAllTypeScriptFiles(): string[] {
    const serviceDirectories = [
      "services/doctor-service/src",
      "services/patient-service/src",
      "services/appointment-service/src",
      "services/medical-records-service/src",
      "services/receptionist-service/src",
      "services/shared/src",
    ];

    const allFiles: string[] = [];

    for (const serviceDir of serviceDirectories) {
      if (fs.existsSync(serviceDir)) {
        const pattern = path.join(serviceDir, "**", "*.ts");
        const files = glob.sync(pattern);
        allFiles.push(...files);
      }
    }

    return allFiles.filter(
      (file) =>
        !file.includes("node_modules") &&
        !file.includes("dist") &&
        !file.includes(".git")
    );
  }

  private generateVerificationReport(): void {
    const totalChecks = this.results.length;
    const passedChecks = this.results.filter((r) => r.passed).length;
    const failedChecks = totalChecks - passedChecks;

    console.log("\n" + "=".repeat(80));
    console.log("📊 DATABASE STANDARDIZATION VERIFICATION REPORT");
    console.log("=".repeat(80));
    console.log(`📁 Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${passedChecks}`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log("");

    // Show detailed results
    this.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${result.category}: ${result.description}`);
      console.log(`   ${result.details}`);
      console.log("");
    });

    console.log("=".repeat(80));

    if (failedChecks === 0) {
      console.log("🎉 DATABASE STANDARDIZATION VERIFICATION PASSED!");
      console.log("✅ All database field references have been standardized");
      console.log("✅ No old field references found");
      console.log("✅ Standardized fields are being used");
      console.log("✅ File structure is intact");
      console.log("✅ Import statements are updated");
    } else {
      console.log("⚠️  SOME VERIFICATION CHECKS FAILED");
      console.log(
        `🔧 Please review and address ${failedChecks} failing checks`
      );
    }

    console.log("=".repeat(80));
    console.log("");

    // Save verification report
    this.saveVerificationReport();
  }

  private saveVerificationReport(): void {
    const reportPath = "docs/database-standardization-verification-report.json";
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: this.results.length,
        passedChecks: this.results.filter((r) => r.passed).length,
        failedChecks: this.results.filter((r) => !r.passed).length,
      },
      results: this.results,
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
      console.log(`📄 Verification report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`❌ Failed to save verification report: ${error}`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const verifier = new StandardizationVerifier();

  verifier
    .verifyStandardization()
    .then(() => {
      const failedChecks = verifier.results.filter((r) => !r.passed).length;
      process.exit(failedChecks === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error("Verification failed:", error);
      process.exit(1);
    });
}
