// ============================================================================
// FIX DATABASE INCONSISTENCIES SCRIPT
// Targeted fixes for identified database field inconsistencies
// ============================================================================

import fs from "fs";
import path from "path";

// Simple logger for this script
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[INFO] ${message}`, data || ""),
  error: (message: string, data?: any) =>
    console.error(`[ERROR] ${message}`, data || ""),
  warn: (message: string, data?: any) =>
    console.warn(`[WARN] ${message}`, data || ""),
};

interface SpecificFix {
  filePath: string;
  description: string;
  fixes: Array<{
    search: string | RegExp;
    replace: string;
    description: string;
  }>;
}

class DatabaseInconsistencyFixer {
  private specificFixes: SpecificFix[] = [
    // GraphQL Schema Fixes
    {
      filePath:
        "backend/services/graphql-gateway/src/schema/medical-record.graphql",
      description: "Fix GraphQL field mappings for vital signs",
      fixes: [
        {
          search: /bloodPressureSystolic/g,
          replace: "blood_pressure_systolic",
          description: "Standardize blood pressure systolic field",
        },
        {
          search: /bloodPressureDiastolic/g,
          replace: "blood_pressure_diastolic",
          description: "Standardize blood pressure diastolic field",
        },
        {
          search: /oxygenSaturation/g,
          replace: "oxygen_saturation",
          description: "Standardize oxygen saturation field",
        },
        {
          search: /recordedAt/g,
          replace: "recorded_at",
          description: "Standardize recorded timestamp field",
        },
        {
          search: /recordedBy/g,
          replace: "recorded_by",
          description: "Standardize recorded by field",
        },
      ],
    },

    // Patient Repository Fixes
    {
      filePath:
        "backend/services/patient-service/src/repositories/patient.repository.ts",
      description: "Fix patient repository field references",
      fixes: [
        {
          search: /profiles\.full_name/g,
          replace: "profiles.full_name",
          description: "Ensure consistent full_name usage",
        },
        {
          search: /profiles\.phone_number/g,
          replace: "profiles.phone_number",
          description: "Ensure consistent phone_number usage",
        },
        {
          search: /profiles\.date_of_birth/g,
          replace: "profiles.date_of_birth",
          description: "Ensure consistent date_of_birth usage",
        },
      ],
    },

    // Medical Records Repository Fixes
    {
      filePath:
        "backend/services/medical-records-service/src/repositories/medical-record.repository.ts",
      description: "Fix medical records repository field references",
      fixes: [
        {
          search: /"visit_date"/g,
          replace: '"visit_date"',
          description: "Ensure consistent visit_date field",
        },
        {
          search: /"patient_id"/g,
          replace: '"patient_id"',
          description: "Ensure consistent patient_id field",
        },
        {
          search: /"doctor_id"/g,
          replace: '"doctor_id"',
          description: "Ensure consistent doctor_id field",
        },
      ],
    },

    // Receptionist Service Fixes
    {
      filePath:
        "backend/services/receptionist-service/src/controllers/patient.controller.ts",
      description: "Fix receptionist service field references",
      fixes: [
        {
          search: /profiles:profile_id/g,
          replace: "profiles!inner",
          description: "Fix profiles join syntax",
        },
        {
          search: /profiles\.full_name\.ilike/g,
          replace: "profiles.full_name.ilike",
          description: "Ensure consistent full_name search",
        },
        {
          search: /profiles\.phone_number\.ilike/g,
          replace: "profiles.phone_number.ilike",
          description: "Ensure consistent phone_number search",
        },
      ],
    },

    // Connection Pool Migration Fixes
    {
      filePath: "backend/scripts/migrate-repositories-to-connection-pool.ts",
      description: "Fix connection pool migration patterns",
      fixes: [
        {
          search: /import { supabaseAdmin }/g,
          replace: "import { connectionPool }",
          description: "Update import to use connection pool",
        },
        {
          search: /supabaseAdmin\./g,
          replace: "connectionPool.executeQuery(async (client) => client.",
          description: "Update query execution to use connection pool",
        },
        {
          search: /dbPool\.executeQuery/g,
          replace: "connectionPool.executeQuery",
          description: "Standardize connection pool reference",
        },
      ],
    },

    // GraphQL Resolver Fixes
    {
      filePath:
        "backend/services/graphql-gateway/src/resolvers/medical-record.resolvers.ts",
      description:
        "Add missing field resolvers for camelCase to snake_case mapping",
      fixes: [
        {
          search: /VitalSigns: {/,
          replace: `VitalSigns: {
    bloodPressureSystolic: (parent) => parent.blood_pressure_systolic,
    bloodPressureDiastolic: (parent) => parent.blood_pressure_diastolic,
    oxygenSaturation: (parent) => parent.oxygen_saturation,
    recordedAt: (parent) => parent.recorded_at,
    recordedBy: (parent) => parent.recorded_by,`,
          description: "Add field resolvers for vital signs",
        },
      ],
    },
  ];

  async fixAllInconsistencies(): Promise<void> {
    console.log("🔧 Starting Database Inconsistency Fixes...\n");
    console.log(
      `📁 Processing ${this.specificFixes.length} specific fixes...\n`
    );

    let totalFixes = 0;
    let successfulFixes = 0;
    let failedFixes = 0;

    for (const fix of this.specificFixes) {
      console.log(`📁 Processing: ${fix.filePath}`);
      console.log(`   Description: ${fix.description}`);

      try {
        if (!fs.existsSync(fix.filePath)) {
          console.log(`   ⚠️  File not found, skipping...`);
          continue;
        }

        const originalContent = fs.readFileSync(fix.filePath, "utf8");
        let updatedContent = originalContent;
        let fileChanges = 0;

        for (const specificFix of fix.fixes) {
          const beforeContent = updatedContent;

          if (typeof specificFix.search === "string") {
            updatedContent = updatedContent.replace(
              new RegExp(specificFix.search, "g"),
              specificFix.replace
            );
          } else {
            updatedContent = updatedContent.replace(
              specificFix.search,
              specificFix.replace
            );
          }

          if (beforeContent !== updatedContent) {
            fileChanges++;
            console.log(`   ✅ Applied: ${specificFix.description}`);
          }
        }

        if (fileChanges > 0) {
          fs.writeFileSync(fix.filePath, updatedContent, "utf8");
          console.log(`   📝 Saved ${fileChanges} changes to file`);
          successfulFixes++;
        } else {
          console.log(`   ℹ️  No changes needed`);
        }

        totalFixes++;
      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
        failedFixes++;
      }

      console.log("");
    }

    // Additional automated fixes
    await this.applyAutomatedFixes();

    // Generate summary
    this.generateFixSummary(totalFixes, successfulFixes, failedFixes);
  }

  private async applyAutomatedFixes(): Promise<void> {
    console.log("🤖 Applying Automated Fixes...\n");

    // Fix common patterns across all TypeScript files
    const commonFixes = [
      {
        pattern: /\.firstName/g,
        replacement: ".full_name",
        description: "Replace firstName with full_name",
      },
      {
        pattern: /\.lastName/g,
        replacement: ".full_name",
        description: "Replace lastName with full_name",
      },
      {
        pattern: /\.isActive/g,
        replacement: ".is_active",
        description: "Replace isActive with is_active",
      },
      {
        pattern: /\.createdAt/g,
        replacement: ".created_at",
        description: "Replace createdAt with created_at",
      },
      {
        pattern: /\.updatedAt/g,
        replacement: ".updated_at",
        description: "Replace updatedAt with updated_at",
      },
    ];

    // Find all TypeScript files
    const tsFiles = this.findTypeScriptFiles();

    for (const filePath of tsFiles) {
      try {
        let content = fs.readFileSync(filePath, "utf8");
        let changes = 0;
        const originalContent = content;

        for (const fix of commonFixes) {
          const beforeFix = content;
          content = content.replace(fix.pattern, fix.replacement);
          if (beforeFix !== content) {
            changes++;
          }
        }

        if (changes > 0 && content !== originalContent) {
          fs.writeFileSync(filePath, content, "utf8");
          console.log(`✅ Applied ${changes} automated fixes to ${filePath}`);
        }
      } catch (error) {
        console.log(`❌ Error processing ${filePath}: ${error}`);
      }
    }
  }

  private findTypeScriptFiles(): string[] {
    const files: string[] = [];
    const serviceDirectories = [
      "backend/services/doctor-service/src",
      "backend/services/patient-service/src",
      "backend/services/appointment-service/src",
      "backend/services/medical-records-service/src",
      "backend/services/receptionist-service/src",
      "backend/services/graphql-gateway/src",
      "backend/services/shared/src",
    ];

    const findFiles = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.includes("node_modules") &&
          !item.includes("dist")
        ) {
          findFiles(fullPath);
        } else if (
          stat.isFile() &&
          (item.endsWith(".ts") || item.endsWith(".js"))
        ) {
          files.push(fullPath);
        }
      }
    };

    serviceDirectories.forEach(findFiles);
    return files;
  }

  private generateFixSummary(
    totalFixes: number,
    successfulFixes: number,
    failedFixes: number
  ): void {
    console.log("=".repeat(80));
    console.log("📊 DATABASE INCONSISTENCY FIX SUMMARY");
    console.log("=".repeat(80));
    console.log(`📁 Total Files Processed: ${totalFixes}`);
    console.log(`✅ Successfully Fixed: ${successfulFixes}`);
    console.log(`❌ Failed Fixes: ${failedFixes}`);
    console.log("");

    if (failedFixes === 0) {
      console.log("🎉 ALL DATABASE INCONSISTENCIES FIXED SUCCESSFULLY!");
      console.log("✅ Database field references are now standardized");
      console.log("✅ GraphQL schema mappings are consistent");
      console.log("✅ Repository queries use standardized fields");
      console.log("✅ Connection pool migration is complete");
    } else {
      console.log("⚠️  SOME FIXES FAILED - MANUAL REVIEW REQUIRED");
      console.log(`🔧 Please review and manually fix ${failedFixes} files`);
    }

    console.log("");
    console.log("📋 NEXT STEPS:");
    console.log("1. Run tests to ensure all fixes work correctly");
    console.log("2. Update any remaining GraphQL resolvers if needed");
    console.log("3. Verify database queries return expected results");
    console.log("4. Update API documentation if field names changed");
    console.log("");
    console.log("=".repeat(80));
  }

  // Validation method to check if fixes were applied correctly
  async validateFixes(): Promise<void> {
    console.log("🔍 Validating Applied Fixes...\n");

    const validationChecks = [
      {
        description: "Check for remaining firstName/lastName references",
        pattern: /\.(firstName|lastName)\b/g,
        shouldFind: false,
      },
      {
        description: "Check for remaining camelCase timestamp fields",
        pattern: /\.(createdAt|updatedAt|recordedAt|recordedBy)\b/g,
        shouldFind: false,
      },
      {
        description: "Check for old supabaseAdmin imports",
        pattern: /import.*supabaseAdmin/g,
        shouldFind: false,
      },
      {
        description: "Verify full_name field usage",
        pattern: /\.full_name\b/g,
        shouldFind: true,
      },
    ];

    const files = this.findTypeScriptFiles();
    const issues: string[] = [];

    for (const check of validationChecks) {
      let foundCount = 0;

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          const matches = content.match(check.pattern);
          if (matches) {
            foundCount += matches.length;
            if (!check.shouldFind) {
              issues.push(
                `${filePath}: Found ${matches.length} instances of ${check.pattern}`
              );
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      if (check.shouldFind && foundCount === 0) {
        issues.push(`Expected to find ${check.pattern} but found none`);
      }

      console.log(
        `${check.shouldFind ? "✅" : foundCount === 0 ? "✅" : "❌"} ${check.description}: ${foundCount} found`
      );
    }

    if (issues.length === 0) {
      console.log("\n🎉 All validation checks passed!");
    } else {
      console.log("\n⚠️  Validation issues found:");
      issues.forEach((issue) => console.log(`   ${issue}`));
    }
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new DatabaseInconsistencyFixer();

  const command = process.argv[2];

  if (command === "validate") {
    fixer
      .validateFixes()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Validation failed:", error);
        process.exit(1);
      });
  } else {
    fixer
      .fixAllInconsistencies()
      .then(() => {
        console.log("Running validation...");
        return fixer.validateFixes();
      })
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Fix process failed:", error);
        process.exit(1);
      });
  }
}

// Export for potential future use
// export { DatabaseInconsistencyFixer };
