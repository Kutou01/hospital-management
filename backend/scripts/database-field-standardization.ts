// ============================================================================
// DATABASE FIELD STANDARDIZATION SCRIPT
// Comprehensive code migration to standardized database fields
// ============================================================================

import fs from "fs";
import * as glob from "glob";
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

interface FieldMapping {
  oldField: string;
  newField: string;
  context: string;
  description: string;
}

interface FileUpdate {
  filePath: string;
  changes: number;
  mappingsApplied: string[];
  status: "success" | "error" | "skipped";
  error?: string;
}

class DatabaseFieldStandardizer {
  private fieldMappings: FieldMapping[] = [
    // Profile field standardizations
    {
      oldField: "first_name",
      newField: "full_name",
      context: "profiles table",
      description: "Consolidated name field",
    },
    {
      oldField: "last_name",
      newField: "full_name",
      context: "profiles table",
      description: "Consolidated name field",
    },
    {
      oldField: "firstName",
      newField: "full_name",
      context: "GraphQL/API",
      description: "Consolidated name field",
    },
    {
      oldField: "lastName",
      newField: "full_name",
      context: "GraphQL/API",
      description: "Consolidated name field",
    },

    // Medical records field standardizations
    {
      oldField: "blood_pressure_systolic",
      newField: "vital_signs.blood_pressure_systolic",
      context: "vital_signs table",
      description: "Moved to vital_signs structure",
    },
    {
      oldField: "blood_pressure_diastolic",
      newField: "vital_signs.blood_pressure_diastolic",
      context: "vital_signs table",
      description: "Moved to vital_signs structure",
    },
    {
      oldField: "oxygen_saturation",
      newField: "vital_signs.oxygen_saturation",
      context: "vital_signs table",
      description: "Moved to vital_signs structure",
    },

    // ID format standardizations
    {
      oldField: "doctorId",
      newField: "doctor_id",
      context: "API/GraphQL",
      description: "Standardized snake_case ID format",
    },
    {
      oldField: "patientId",
      newField: "patient_id",
      context: "API/GraphQL",
      description: "Standardized snake_case ID format",
    },
    {
      oldField: "appointmentId",
      newField: "appointment_id",
      context: "API/GraphQL",
      description: "Standardized snake_case ID format",
    },

    // Date field standardizations
    {
      oldField: "recordedAt",
      newField: "recorded_at",
      context: "timestamps",
      description: "Standardized snake_case timestamp format",
    },
    {
      oldField: "recordedBy",
      newField: "recorded_by",
      context: "audit fields",
      description: "Standardized snake_case audit format",
    },
    {
      oldField: "createdAt",
      newField: "created_at",
      context: "timestamps",
      description: "Standardized snake_case timestamp format",
    },
    {
      oldField: "updatedAt",
      newField: "updated_at",
      context: "timestamps",
      description: "Standardized snake_case timestamp format",
    },

    // Status field standardizations
    {
      oldField: "isActive",
      newField: "is_active",
      context: "status fields",
      description: "Standardized snake_case boolean format",
    },
    {
      oldField: "emailVerified",
      newField: "email_verified",
      context: "verification fields",
      description: "Standardized snake_case boolean format",
    },
    {
      oldField: "phoneVerified",
      newField: "phone_verified",
      context: "verification fields",
      description: "Standardized snake_case boolean format",
    },
  ];

  private serviceDirectories = [
    "services/doctor-service/src",
    "services/patient-service/src",
    "services/appointment-service/src",
    "services/medical-records-service/src",
    "services/receptionist-service/src",
    "services/graphql-gateway/src",
    "services/shared/src",
  ];

  private fileExtensions = ["*.ts", "*.js", "*.graphql", "*.sql"];
  private results: FileUpdate[] = [];

  async standardizeAllFields(): Promise<void> {
    console.log("🔧 Starting Database Field Standardization...\n");

    // Get all files to process
    const filesToProcess = await this.getAllFilesToProcess();
    console.log(`📁 Found ${filesToProcess.length} files to process\n`);

    // Process each file
    for (const filePath of filesToProcess) {
      await this.processFile(filePath);
    }

    // Generate report
    this.generateStandardizationReport();
  }

  private async getAllFilesToProcess(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const serviceDir of this.serviceDirectories) {
      if (!fs.existsSync(serviceDir)) {
        console.log(`⚠️  Directory not found: ${serviceDir}`);
        continue;
      }

      for (const extension of this.fileExtensions) {
        const pattern = path.join(serviceDir, "**", extension);
        const files = glob.sync(pattern);
        allFiles.push(...files);
      }
    }

    // Remove duplicates and filter out node_modules, dist, etc.
    return [...new Set(allFiles)].filter(
      (file) =>
        !file.includes("node_modules") &&
        !file.includes("dist") &&
        !file.includes(".git") &&
        !file.includes("coverage")
    );
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const originalContent = fs.readFileSync(filePath, "utf8");
      let updatedContent = originalContent;
      let changes = 0;
      const mappingsApplied: string[] = [];

      // Apply each field mapping
      for (const mapping of this.fieldMappings) {
        const result = this.applyFieldMapping(updatedContent, mapping);
        if (result.changed) {
          updatedContent = result.content;
          changes += result.changeCount;
          mappingsApplied.push(`${mapping.oldField} → ${mapping.newField}`);
        }
      }

      // Write updated content if changes were made
      if (changes > 0) {
        fs.writeFileSync(filePath, updatedContent, "utf8");
        console.log(`✅ Updated ${filePath}: ${changes} changes`);
      }

      this.results.push({
        filePath,
        changes,
        mappingsApplied,
        status: "success",
      });
    } catch (error) {
      console.log(`❌ Error processing ${filePath}: ${error}`);
      this.results.push({
        filePath,
        changes: 0,
        mappingsApplied: [],
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private applyFieldMapping(
    content: string,
    mapping: FieldMapping
  ): {
    content: string;
    changed: boolean;
    changeCount: number;
  } {
    let updatedContent = content;
    let changeCount = 0;
    const originalContent = content;

    // Different patterns based on context
    const patterns = this.getPatterns(mapping);

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.search, "g");
      const matches = updatedContent.match(regex);

      if (matches) {
        updatedContent = updatedContent.replace(regex, pattern.replace);
        changeCount += matches.length;
      }
    }

    return {
      content: updatedContent,
      changed: updatedContent !== originalContent,
      changeCount,
    };
  }

  private getPatterns(
    mapping: FieldMapping
  ): Array<{ search: string; replace: string }> {
    const patterns: Array<{ search: string; replace: string }> = [];

    // SQL/Database patterns
    patterns.push({
      search: `\\b${mapping.oldField}\\b(?=\\s*[,\\s\\)])`,
      replace: mapping.newField,
    });

    // Object property patterns
    patterns.push({
      search: `\\.${mapping.oldField}\\b`,
      replace: `.${mapping.newField}`,
    });

    // GraphQL field patterns
    patterns.push({
      search: `${mapping.oldField}:`,
      replace: `${mapping.newField}:`,
    });

    // TypeScript interface patterns
    patterns.push({
      search: `${mapping.oldField}\\?:`,
      replace: `${mapping.newField}?:`,
    });

    // String literal patterns (for select queries)
    patterns.push({
      search: `'${mapping.oldField}'`,
      replace: `'${mapping.newField}'`,
    });
    patterns.push({
      search: `"${mapping.oldField}"`,
      replace: `"${mapping.newField}"`,
    });

    // Template literal patterns
    patterns.push({
      search: `\\$\\{.*${mapping.oldField}.*\\}`,
      replace: `\${${mapping.newField}}`,
    });

    return patterns;
  }

  private generateStandardizationReport(): void {
    const totalFiles = this.results.length;
    const updatedFiles = this.results.filter((r) => r.changes > 0).length;
    const totalChanges = this.results.reduce((sum, r) => sum + r.changes, 0);
    const errorFiles = this.results.filter((r) => r.status === "error").length;

    console.log("\n" + "=".repeat(80));
    console.log("📊 DATABASE FIELD STANDARDIZATION REPORT");
    console.log("=".repeat(80));
    console.log(`📁 Total Files Processed: ${totalFiles}`);
    console.log(`✅ Files Updated: ${updatedFiles}`);
    console.log(`🔄 Total Changes Made: ${totalChanges}`);
    console.log(`❌ Files with Errors: ${errorFiles}`);
    console.log("");

    // Show files with most changes
    const topChangedFiles = this.results
      .filter((r) => r.changes > 0)
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 10);

    if (topChangedFiles.length > 0) {
      console.log("🔝 Files with Most Changes:");
      topChangedFiles.forEach((file) => {
        console.log(`   ${file.changes} changes - ${file.filePath}`);
      });
      console.log("");
    }

    // Show mapping usage statistics
    const mappingStats = new Map<string, number>();
    this.results.forEach((result) => {
      result.mappingsApplied.forEach((mapping) => {
        mappingStats.set(mapping, (mappingStats.get(mapping) || 0) + 1);
      });
    });

    if (mappingStats.size > 0) {
      console.log("📈 Field Mapping Usage:");
      Array.from(mappingStats.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([mapping, count]) => {
          console.log(`   ${count}x - ${mapping}`);
        });
      console.log("");
    }

    // Show errors if any
    const errorResults = this.results.filter((r) => r.status === "error");
    if (errorResults.length > 0) {
      console.log("❌ Files with Errors:");
      errorResults.forEach((result) => {
        console.log(`   ${result.filePath}: ${result.error}`);
      });
      console.log("");
    }

    console.log("=".repeat(80));

    if (errorFiles === 0) {
      console.log("🎉 DATABASE FIELD STANDARDIZATION COMPLETED SUCCESSFULLY!");
      console.log("✅ All database field references have been standardized");
    } else {
      console.log("⚠️  DATABASE FIELD STANDARDIZATION COMPLETED WITH ERRORS");
      console.log(`🔧 Please review and fix ${errorFiles} files with errors`);
    }

    console.log("=".repeat(80));
    console.log("");

    // Save detailed report to file
    this.saveDetailedReport();
  }

  private saveDetailedReport(): void {
    const reportPath =
      "backend/docs/database-field-standardization-report.json";
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.length,
        updatedFiles: this.results.filter((r) => r.changes > 0).length,
        totalChanges: this.results.reduce((sum, r) => sum + r.changes, 0),
        errorFiles: this.results.filter((r) => r.status === "error").length,
      },
      fieldMappings: this.fieldMappings,
      results: this.results,
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
      console.log(`📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`❌ Failed to save detailed report: ${error}`);
    }
  }

  // Validation method to check for remaining inconsistencies
  async validateStandardization(): Promise<void> {
    console.log("🔍 Validating field standardization...\n");

    const filesToCheck = await this.getAllFilesToProcess();
    const inconsistencies: Array<{
      file: string;
      line: number;
      content: string;
      issue: string;
    }> = [];

    for (const filePath of filesToCheck) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          // Check for old field patterns that should have been updated
          this.fieldMappings.forEach((mapping) => {
            if (
              line.includes(mapping.oldField) &&
              !line.includes("//") &&
              !line.includes("*")
            ) {
              inconsistencies.push({
                file: filePath,
                line: index + 1,
                content: line.trim(),
                issue: `Found old field: ${mapping.oldField} (should be: ${mapping.newField})`,
              });
            }
          });
        });
      } catch (error) {
        console.log(`❌ Error validating ${filePath}: ${error}`);
      }
    }

    if (inconsistencies.length === 0) {
      console.log("✅ Validation passed! No field inconsistencies found.");
    } else {
      console.log(
        `⚠️  Found ${inconsistencies.length} potential inconsistencies:`
      );
      inconsistencies.slice(0, 20).forEach((issue) => {
        console.log(`   ${issue.file}:${issue.line} - ${issue.issue}`);
        console.log(`     ${issue.content}`);
      });

      if (inconsistencies.length > 20) {
        console.log(`   ... and ${inconsistencies.length - 20} more`);
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const standardizer = new DatabaseFieldStandardizer();

  const command = process.argv[2];

  if (command === "validate") {
    standardizer
      .validateStandardization()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Validation failed:", error);
        process.exit(1);
      });
  } else {
    standardizer
      .standardizeAllFields()
      .then(() => {
        console.log("Running validation...");
        return standardizer.validateStandardization();
      })
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Standardization failed:", error);
        process.exit(1);
      });
  }
}

export { DatabaseFieldStandardizer };
