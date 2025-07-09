#!/usr/bin/env node

/**
 * Security Audit Script
 * Hospital Management System
 *
 * This script audits the codebase for security issues
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class SecurityAudit {
  constructor() {
    this.rootDir = path.join(__dirname, "../..");
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  async run() {
    console.log("🔍 Hospital Management System - Security Audit");
    console.log("=".repeat(50));

    try {
      // Check environment files
      this.checkEnvironmentFiles();

      // Check for hardcoded secrets
      this.checkHardcodedSecrets();

      // Check git history
      this.checkGitHistory();

      // Check dependencies
      this.checkDependencies();

      // Check file permissions
      this.checkFilePermissions();

      // Check Docker security
      this.checkDockerSecurity();

      // Generate report
      this.generateReport();
    } catch (error) {
      console.error("❌ Audit failed:", error.message);
      process.exit(1);
    }
  }

  checkEnvironmentFiles() {
    console.log("\n🔍 Checking environment files...");

    const envFiles = [
      "backend/.env",
      "frontend/.env.local",
      "backend/.env.example",
      "frontend/.env.example",
    ];

    envFiles.forEach((file) => {
      const filePath = path.join(this.rootDir, file);

      if (file.includes(".example")) {
        if (fs.existsSync(filePath)) {
          this.passed.push(`✅ ${file} template exists`);
        } else {
          this.issues.push(`❌ Missing ${file} template`);
        }
      } else {
        if (fs.existsSync(filePath)) {
          this.checkEnvFileContent(filePath, file);
        } else {
          this.warnings.push(`⚠️  ${file} not found (may be intentional)`);
        }
      }
    });
  }

  checkEnvFileContent(filePath, fileName) {
    const content = fs.readFileSync(filePath, "utf8");

    // Check for default/weak values
    const weakPatterns = [
      {
        pattern: /password|secret|key/i,
        value: /^(password|secret|key|admin|test|demo|example|your_)/i,
      },
      { pattern: /JWT_SECRET/, value: /^.{0,31}$/ }, // Less than 32 characters
      { pattern: /localhost/, value: /localhost/ },
    ];

    weakPatterns.forEach(({ pattern, value }) => {
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (pattern.test(line) && !line.startsWith("#")) {
          const [key, val] = line.split("=");
          if (val && value.test(val)) {
            this.warnings.push(
              `⚠️  ${fileName}:${index + 1} - Weak value for ${key}`
            );
          }
        }
      });
    });

    this.passed.push(`✅ ${fileName} content checked`);
  }

  checkHardcodedSecrets() {
    console.log("\n🔍 Checking for hardcoded secrets...");

    const searchPatterns = [
      "sk_", // Stripe secret keys
      "pk_", // Public keys that might be misplaced
      "eyJ", // JWT tokens
      "AKIA", // AWS access keys
      "supabase.*\\.",
      "password.*=.*[\"'][^\"']{8,}[\"']",
      "secret.*=.*[\"'][^\"']{8,}[\"']",
    ];

    const excludeDirs = ["node_modules", ".git", "dist", "build", ".next"];
    const includeExts = [".ts", ".js", ".tsx", ".jsx", ".json"];

    try {
      searchPatterns.forEach((pattern) => {
        try {
          const cmd = `grep -r "${pattern}" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=.next --exclude="security-audit.js" --exclude="fix-hardcoded-keys.js" --exclude="securityValidator.ts" ${this.rootDir}`;
          const result = execSync(cmd, { encoding: "utf8", stdio: "pipe" });

          if (result.trim()) {
            this.issues.push(`❌ Potential hardcoded secret found: ${pattern}`);
            console.log(`   ${result.trim().split("\n")[0]}...`);
          }
        } catch (error) {
          // No matches found (grep returns non-zero exit code when no matches)
          if (error.status === 1) {
            this.passed.push(
              `✅ No hardcoded secrets found for pattern: ${pattern}`
            );
          }
        }
      });
    } catch (error) {
      this.warnings.push(
        `⚠️  Could not check for hardcoded secrets: ${error.message}`
      );
    }
  }

  checkGitHistory() {
    console.log("\n🔍 Checking git history for leaked secrets...");

    try {
      // Check for .env files in git history
      const envInHistory = execSync(
        'git log --all --full-history --oneline | grep -i "env\\|secret\\|key" | head -5',
        { encoding: "utf8", stdio: "pipe", cwd: this.rootDir }
      );

      if (envInHistory.trim()) {
        this.warnings.push(
          `⚠️  Found environment-related commits in git history`
        );
        console.log(`   ${envInHistory.trim().split("\n")[0]}...`);
      } else {
        this.passed.push(`✅ No suspicious commits in git history`);
      }
    } catch (error) {
      if (error.status === 1) {
        this.passed.push(`✅ No suspicious commits in git history`);
      } else {
        this.warnings.push(`⚠️  Could not check git history: ${error.message}`);
      }
    }
  }

  checkDependencies() {
    console.log("\n🔍 Checking dependencies for vulnerabilities...");

    const packageJsonPaths = [
      "backend/package.json",
      "frontend/package.json",
      "package.json",
    ];

    packageJsonPaths.forEach((pkgPath) => {
      const fullPath = path.join(this.rootDir, pkgPath);
      if (fs.existsSync(fullPath)) {
        try {
          const dir = path.dirname(fullPath);
          const auditResult = execSync("npm audit --audit-level high --json", {
            encoding: "utf8",
            cwd: dir,
            stdio: "pipe",
          });

          const audit = JSON.parse(auditResult);
          if (audit.metadata && audit.metadata.vulnerabilities) {
            const vulns = audit.metadata.vulnerabilities;
            const total = vulns.high + vulns.critical;

            if (total > 0) {
              this.issues.push(
                `❌ ${total} high/critical vulnerabilities in ${pkgPath}`
              );
            } else {
              this.passed.push(
                `✅ No high/critical vulnerabilities in ${pkgPath}`
              );
            }
          }
        } catch (error) {
          this.warnings.push(
            `⚠️  Could not audit ${pkgPath}: ${error.message}`
          );
        }
      }
    });
  }

  checkFilePermissions() {
    console.log("\n🔍 Checking file permissions...");

    const sensitiveFiles = [
      "backend/.env",
      "frontend/.env.local",
      "backend/docker-compose.override.yml",
    ];

    sensitiveFiles.forEach((file) => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = (stats.mode & parseInt("777", 8)).toString(8);

          if (mode === "600" || mode === "644") {
            this.passed.push(`✅ ${file} has secure permissions (${mode})`);
          } else {
            this.warnings.push(
              `⚠️  ${file} has permissions ${mode} (consider 600 or 644)`
            );
          }
        } catch (error) {
          this.warnings.push(`⚠️  Could not check permissions for ${file}`);
        }
      }
    });
  }

  checkDockerSecurity() {
    console.log("\n🔍 Checking Docker security...");

    const dockerFiles = ["backend/docker-compose.yml", "backend/Dockerfile"];

    dockerFiles.forEach((file) => {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        // Check for security issues
        if (content.includes("--privileged")) {
          this.issues.push(`❌ ${file} uses --privileged flag`);
        }

        if (content.includes("user: root") || content.includes("USER root")) {
          this.warnings.push(`⚠️  ${file} runs as root user`);
        }

        if (!content.includes("USER ") && file.includes("Dockerfile")) {
          this.warnings.push(`⚠️  ${file} doesn't specify non-root user`);
        }

        this.passed.push(`✅ ${file} security checked`);
      }
    });
  }

  generateReport() {
    console.log("\n📊 Security Audit Report");
    console.log("=".repeat(50));

    console.log(`\n✅ PASSED (${this.passed.length}):`);
    this.passed.forEach((item) => console.log(`  ${item}`));

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((item) => console.log(`  ${item}`));
    }

    if (this.issues.length > 0) {
      console.log(`\n❌ ISSUES (${this.issues.length}):`);
      this.issues.forEach((item) => console.log(`  ${item}`));
    }

    // Overall score
    const total =
      this.passed.length + this.warnings.length + this.issues.length;
    const score = Math.round((this.passed.length / total) * 100);

    console.log(`\n🎯 Security Score: ${score}%`);

    if (this.issues.length === 0) {
      console.log("🎉 No critical security issues found!");
    } else {
      console.log(
        "🚨 Please address the issues above before deploying to production."
      );
    }

    // Save report to file
    const reportPath = path.join(this.rootDir, "security-audit-report.txt");
    const reportContent = [
      "Hospital Management System - Security Audit Report",
      "=".repeat(50),
      `Generated: ${new Date().toISOString()}`,
      "",
      `PASSED (${this.passed.length}):`,
      ...this.passed.map((item) => `  ${item}`),
      "",
      `WARNINGS (${this.warnings.length}):`,
      ...this.warnings.map((item) => `  ${item}`),
      "",
      `ISSUES (${this.issues.length}):`,
      ...this.issues.map((item) => `  ${item}`),
      "",
      `Security Score: ${score}%`,
    ].join("\n");

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

// Run the audit
if (require.main === module) {
  const audit = new SecurityAudit();
  audit.run().catch(console.error);
}

module.exports = SecurityAudit;
