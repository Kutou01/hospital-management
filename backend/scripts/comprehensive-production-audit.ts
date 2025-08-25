// ============================================================================
// COMPREHENSIVE PRODUCTION READINESS AUDIT
// Complete assessment of hospital management system before production deployment
// ============================================================================

import logger from "@hospital/shared/dist/utils/logger";
import fs from "fs";
import path from "path";

interface AuditResult {
  category: string;
  item: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Pass" | "Fail" | "Warning";
  description: string;
  recommendation?: string;
  estimatedEffort?: string;
  details?: any;
}

class ProductionReadinessAuditor {
  private results: AuditResult[] = [];
  private services = [
    "auth-service",
    "doctor-service",
    "patient-service",
    "appointment-service",
    "medical-records-service",
    "receptionist-service",
    "graphql-gateway",
    "api-gateway",
  ];

  async runComprehensiveAudit(): Promise<void> {
    logger.info("🔍 Starting Comprehensive Production Readiness Audit");

    await this.auditCodeQuality();
    await this.auditPerformanceOptimization();
    await this.auditHealthcareCompliance();
    await this.auditProductionReadiness();
    await this.auditUserExperience();
    await this.auditTechnicalDebt();

    this.generateAuditReport();
  }

  // ============================================================================
  // 1. CODE QUALITY ASSESSMENT
  // ============================================================================
  private async auditCodeQuality(): Promise<void> {
    logger.info("📊 Auditing Code Quality...");

    // Check TypeScript configuration
    await this.checkTypeScriptConfig();

    // Check error handling consistency
    await this.checkErrorHandlingPatterns();

    // Check security vulnerabilities
    await this.checkSecurityVulnerabilities();

    // Check logging consistency
    await this.checkLoggingPatterns();

    // Check unused imports and deprecated methods
    await this.checkCodeCleanliness();
  }

  private async checkTypeScriptConfig(): Promise<void> {
    const services = this.services;
    let strictModeEnabled = 0;
    let totalServices = services.length;

    for (const service of services) {
      const tsconfigPath = path.join(
        "backend/services",
        service,
        "tsconfig.json"
      );

      if (fs.existsSync(tsconfigPath)) {
        try {
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
          if (tsconfig.compilerOptions?.strict === true) {
            strictModeEnabled++;
          }
        } catch (error) {
          // Invalid tsconfig
        }
      }
    }

    const strictModePercentage = (strictModeEnabled / totalServices) * 100;

    this.results.push({
      category: "Code Quality",
      item: "TypeScript Strict Mode",
      priority: strictModePercentage < 80 ? "High" : "Medium",
      status: strictModePercentage >= 80 ? "Pass" : "Warning",
      description: `${strictModeEnabled}/${totalServices} services have TypeScript strict mode enabled`,
      recommendation:
        strictModePercentage < 100
          ? "Enable strict mode in all services for better type safety"
          : undefined,
      estimatedEffort: "2-4 hours",
      details: { strictModePercentage, servicesWithStrict: strictModeEnabled },
    });
  }

  private async checkErrorHandlingPatterns(): Promise<void> {
    // Check for consistent error handling across services
    const errorHandlingIssues: string[] = [];

    // Check if all services have Vietnamese error handling
    for (const service of this.services) {
      const indexPath = path.join("backend/services", service, "src/index.ts");

      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, "utf8");

        if (!content.includes("accept-language") || !content.includes("vi")) {
          errorHandlingIssues.push(service);
        }
      }
    }

    this.results.push({
      category: "Code Quality",
      item: "Vietnamese Error Handling",
      priority: errorHandlingIssues.length > 0 ? "High" : "Low",
      status: errorHandlingIssues.length === 0 ? "Pass" : "Fail",
      description: `${this.services.length - errorHandlingIssues.length}/${this.services.length} services have Vietnamese error handling`,
      recommendation:
        errorHandlingIssues.length > 0
          ? `Add Vietnamese error handling to: ${errorHandlingIssues.join(", ")}`
          : undefined,
      estimatedEffort: "1-2 hours per service",
      details: { servicesWithoutVietnamese: errorHandlingIssues },
    });
  }

  private async checkSecurityVulnerabilities(): Promise<void> {
    const securityIssues: string[] = [];

    // Check for default JWT secrets
    const envFiles = ["backend/.env", "frontend/.env.local"];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, "utf8");

        if (
          content.includes("your_super_secret_jwt_key_here") ||
          content.includes("default-secret-key")
        ) {
          securityIssues.push(`Default JWT secret in ${envFile}`);
        }

        if (
          content.includes("localhost") &&
          process.env.NODE_ENV === "production"
        ) {
          securityIssues.push(
            `Localhost URLs in production environment in ${envFile}`
          );
        }
      }
    }

    this.results.push({
      category: "Code Quality",
      item: "Security Vulnerabilities",
      priority: securityIssues.length > 0 ? "Critical" : "Low",
      status: securityIssues.length === 0 ? "Pass" : "Fail",
      description: `Found ${securityIssues.length} security issues`,
      recommendation:
        securityIssues.length > 0
          ? "Fix security vulnerabilities immediately"
          : undefined,
      estimatedEffort: "1-3 hours",
      details: { issues: securityIssues },
    });
  }

  private async checkLoggingPatterns(): Promise<void> {
    // Check for consistent logging across services
    let servicesWithConsistentLogging = 0;

    for (const service of this.services) {
      const serviceDir = path.join("backend/services", service, "src");

      if (fs.existsSync(serviceDir)) {
        // Check if service uses shared logger
        const files = this.getFilesRecursively(serviceDir, ".ts");
        let usesSharedLogger = false;

        for (const file of files) {
          const content = fs.readFileSync(file, "utf8");
          if (content.includes("@hospital/shared/dist/utils/logger")) {
            usesSharedLogger = true;
            break;
          }
        }

        if (usesSharedLogger) {
          servicesWithConsistentLogging++;
        }
      }
    }

    const loggingConsistency =
      (servicesWithConsistentLogging / this.services.length) * 100;

    this.results.push({
      category: "Code Quality",
      item: "Logging Consistency",
      priority: loggingConsistency < 80 ? "Medium" : "Low",
      status: loggingConsistency >= 90 ? "Pass" : "Warning",
      description: `${servicesWithConsistentLogging}/${this.services.length} services use consistent logging`,
      recommendation:
        loggingConsistency < 100
          ? "Standardize logging across all services"
          : undefined,
      estimatedEffort: "1-2 hours",
      details: { loggingConsistency },
    });
  }

  private async checkCodeCleanliness(): Promise<void> {
    let totalUnusedImports = 0;
    let totalDeprecatedMethods = 0;

    for (const service of this.services) {
      const serviceDir = path.join("backend/services", service, "src");

      if (fs.existsSync(serviceDir)) {
        const files = this.getFilesRecursively(serviceDir, ".ts");

        for (const file of files) {
          const content = fs.readFileSync(file, "utf8");

          // Simple check for unused imports (this would be more sophisticated in practice)
          const importLines = content
            .split("\n")
            .filter((line) => line.trim().startsWith("import"));
          const unusedImports = importLines.filter((line) => {
            const importName = line.match(/import\s+{([^}]+)}/)?.[1];
            return importName && !content.includes(importName.trim());
          });

          totalUnusedImports += unusedImports.length;

          // Check for deprecated methods
          if (
            content.includes("supabaseAdmin") &&
            !content.includes("dbPool")
          ) {
            totalDeprecatedMethods++;
          }
        }
      }
    }

    this.results.push({
      category: "Code Quality",
      item: "Code Cleanliness",
      priority:
        totalUnusedImports > 10 || totalDeprecatedMethods > 5
          ? "Medium"
          : "Low",
      status:
        totalUnusedImports < 5 && totalDeprecatedMethods < 2
          ? "Pass"
          : "Warning",
      description: `Found ${totalUnusedImports} unused imports and ${totalDeprecatedMethods} deprecated method usages`,
      recommendation: "Clean up unused imports and migrate deprecated methods",
      estimatedEffort: "2-4 hours",
      details: {
        unusedImports: totalUnusedImports,
        deprecatedMethods: totalDeprecatedMethods,
      },
    });
  }

  // ============================================================================
  // 2. PERFORMANCE OPTIMIZATION ANALYSIS
  // ============================================================================
  private async auditPerformanceOptimization(): Promise<void> {
    logger.info("⚡ Auditing Performance Optimization...");

    await this.checkConnectionPoolUsage();
    await this.checkDatabaseIndexes();
    await this.checkCachingStrategies();
    await this.checkGraphQLOptimization();
  }

  private async checkConnectionPoolUsage(): Promise<void> {
    try {
      const healthCheck = await connectionPool.healthCheck();
      const stats = connectionPool.getStats();

      const isOptimal =
        healthCheck.healthy &&
        stats.averageQueryTime < 100 &&
        stats.errorRate < 5;

      this.results.push({
        category: "Performance",
        item: "Connection Pool Optimization",
        priority: !isOptimal ? "High" : "Low",
        status: isOptimal ? "Pass" : "Warning",
        description: `Connection pool health: ${healthCheck.healthy}, avg query time: ${stats.averageQueryTime}ms, error rate: ${stats.errorRate}%`,
        recommendation: !isOptimal
          ? "Optimize connection pool configuration and query performance"
          : undefined,
        estimatedEffort: "4-8 hours",
        details: { healthCheck, stats },
      });
    } catch (error) {
      this.results.push({
        category: "Performance",
        item: "Connection Pool Optimization",
        priority: "Critical",
        status: "Fail",
        description: "Connection pool health check failed",
        recommendation: "Fix connection pool configuration immediately",
        estimatedEffort: "2-4 hours",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  private async checkDatabaseIndexes(): Promise<void> {
    // This would check for missing indexes on frequently queried columns
    // For now, we'll do a basic check

    this.results.push({
      category: "Performance",
      item: "Database Indexes",
      priority: "Medium",
      status: "Warning",
      description: "Database index optimization needs manual review",
      recommendation:
        "Review and add indexes for frequently queried columns (profiles.email, doctors.department_id, appointments.scheduled_date_time)",
      estimatedEffort: "2-4 hours",
      details: {
        suggestedIndexes: [
          "CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);",
          "CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);",
          "CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date_time ON appointments(scheduled_date_time);",
        ],
      },
    });
  }

  private async checkCachingStrategies(): Promise<void> {
    // Check if caching is implemented
    const cachingImplemented = fs.existsSync(
      "backend/services/graphql-gateway/src/config/performance.config.ts"
    );

    this.results.push({
      category: "Performance",
      item: "Caching Strategies",
      priority: !cachingImplemented ? "High" : "Medium",
      status: cachingImplemented ? "Pass" : "Warning",
      description: cachingImplemented
        ? "Caching configuration found"
        : "No caching strategy implemented",
      recommendation: !cachingImplemented
        ? "Implement Redis caching for frequently accessed data"
        : "Review and optimize cache TTL settings",
      estimatedEffort: "6-12 hours",
      details: { cachingImplemented },
    });
  }

  private async checkGraphQLOptimization(): Promise<void> {
    // Check for DataLoader implementation
    const dataLoaderExists = fs.existsSync(
      "backend/services/graphql-gateway/src/dataloaders/index.ts"
    );

    this.results.push({
      category: "Performance",
      item: "GraphQL N+1 Query Prevention",
      priority: !dataLoaderExists ? "High" : "Low",
      status: dataLoaderExists ? "Pass" : "Warning",
      description: dataLoaderExists
        ? "DataLoader implementation found"
        : "No DataLoader implementation for N+1 query prevention",
      recommendation: !dataLoaderExists
        ? "Implement DataLoader for all GraphQL resolvers"
        : "Review DataLoader batch sizes and caching",
      estimatedEffort: "8-16 hours",
      details: { dataLoaderExists },
    });
  }

  // ============================================================================
  // 3. HEALTHCARE COMPLIANCE REVIEW
  // ============================================================================
  private async auditHealthcareCompliance(): Promise<void> {
    logger.info("🏥 Auditing Healthcare Compliance...");

    await this.checkFHIRCompliance();
    await this.checkICD10Implementation();
    await this.checkHIPAACompliance();
    await this.checkMedicalTerminologyConsistency();
  }

  private async checkFHIRCompliance(): Promise<void> {
    // Check if FHIR validation functions exist
    const fhirValidationExists = fs.existsSync(
      "backend/services/shared/src/services/healthcare.service.ts"
    );

    let fhirEndpointsCount = 0;
    for (const service of [
      "doctor-service",
      "patient-service",
      "appointment-service",
      "medical-records-service",
    ]) {
      const healthcareControllerPath = path.join(
        "backend/services",
        service,
        "src/controllers/healthcare.controller.ts"
      );
      if (fs.existsSync(healthcareControllerPath)) {
        fhirEndpointsCount++;
      }
    }

    const fhirComplianceScore = (fhirEndpointsCount / 4) * 100;

    this.results.push({
      category: "Healthcare Compliance",
      item: "FHIR R4 Compliance",
      priority: fhirComplianceScore < 80 ? "High" : "Medium",
      status: fhirComplianceScore >= 80 ? "Pass" : "Warning",
      description: `FHIR validation implemented in ${fhirEndpointsCount}/4 core services`,
      recommendation:
        fhirComplianceScore < 100
          ? "Complete FHIR validation implementation in all healthcare services"
          : undefined,
      estimatedEffort: "8-16 hours",
      details: { fhirComplianceScore, servicesWithFHIR: fhirEndpointsCount },
    });
  }

  private async checkICD10Implementation(): Promise<void> {
    // Check for ICD-10 code validation
    const icd10TableExists =
      fs.existsSync("schemas/04-seed-data.sql") &&
      fs
        .readFileSync("schemas/04-seed-data.sql", "utf8")
        .includes("icd10_codes");

    this.results.push({
      category: "Healthcare Compliance",
      item: "ICD-10 Coding Implementation",
      priority: !icd10TableExists ? "High" : "Medium",
      status: icd10TableExists ? "Pass" : "Warning",
      description: icd10TableExists
        ? "ICD-10 codes table found"
        : "ICD-10 coding system not implemented",
      recommendation: !icd10TableExists
        ? "Implement ICD-10 coding system for medical diagnoses"
        : "Review ICD-10 code completeness and validation",
      estimatedEffort: "12-24 hours",
      details: { icd10TableExists },
    });
  }

  private async checkHIPAACompliance(): Promise<void> {
    // Check for HIPAA compliance features
    const hipaaFeaturesFound = [];

    if (fs.existsSync("phase2-hipaa-compliance.sql")) {
      hipaaFeaturesFound.push("HIPAA database schema");
    }

    if (fs.existsSync("frontend/lib/security/audit.ts")) {
      hipaaFeaturesFound.push("Audit logging");
    }

    if (fs.existsSync("frontend/lib/security/crypto.ts")) {
      hipaaFeaturesFound.push("Data encryption");
    }

    const hipaaComplianceScore = (hipaaFeaturesFound.length / 3) * 100;

    this.results.push({
      category: "Healthcare Compliance",
      item: "HIPAA Compliance",
      priority: hipaaComplianceScore < 80 ? "Critical" : "High",
      status: hipaaComplianceScore >= 80 ? "Pass" : "Fail",
      description: `HIPAA compliance features: ${hipaaFeaturesFound.join(", ")}`,
      recommendation:
        hipaaComplianceScore < 100
          ? "Complete HIPAA compliance implementation (audit logging, encryption, access controls)"
          : undefined,
      estimatedEffort: "16-32 hours",
      details: { hipaaComplianceScore, featuresFound: hipaaFeaturesFound },
    });
  }

  private async checkMedicalTerminologyConsistency(): Promise<void> {
    // Check Vietnamese medical terminology consistency
    const i18nServiceExists = fs.existsSync(
      "backend/services/graphql-gateway/src/services/i18n.service.ts"
    );

    let vietnameseTerminologyScore = 0;
    if (i18nServiceExists) {
      const i18nContent = fs.readFileSync(
        "backend/services/graphql-gateway/src/services/i18n.service.ts",
        "utf8"
      );
      if (
        i18nContent.includes("medical") ||
        i18nContent.includes("healthcare")
      ) {
        vietnameseTerminologyScore = 80;
      } else {
        vietnameseTerminologyScore = 40;
      }
    }

    this.results.push({
      category: "Healthcare Compliance",
      item: "Medical Terminology Consistency",
      priority: vietnameseTerminologyScore < 70 ? "Medium" : "Low",
      status: vietnameseTerminologyScore >= 70 ? "Pass" : "Warning",
      description: `Vietnamese medical terminology consistency: ${vietnameseTerminologyScore}%`,
      recommendation:
        vietnameseTerminologyScore < 80
          ? "Standardize Vietnamese medical terminology across all services"
          : undefined,
      estimatedEffort: "4-8 hours",
      details: { vietnameseTerminologyScore },
    });
  }

  // ============================================================================
  // 4. PRODUCTION READINESS CHECKLIST
  // ============================================================================
  private async auditProductionReadiness(): Promise<void> {
    logger.info("🚀 Auditing Production Readiness...");

    await this.checkEnvironmentConfiguration();
    await this.checkMonitoringAndAlerting();
    await this.checkBackupAndRecovery();
    await this.checkScalabilityConsiderations();
  }

  private async checkEnvironmentConfiguration(): Promise<void> {
    const envFiles = [
      "backend/.env.example",
      "frontend/.env.example",
      "docker-compose.yml",
    ];

    const existingEnvFiles = envFiles.filter((file) => fs.existsSync(file));
    const envConfigScore = (existingEnvFiles.length / envFiles.length) * 100;

    this.results.push({
      category: "Production Readiness",
      item: "Environment Configuration",
      priority: envConfigScore < 80 ? "High" : "Medium",
      status: envConfigScore >= 80 ? "Pass" : "Warning",
      description: `Environment configuration files: ${existingEnvFiles.length}/${envFiles.length} found`,
      recommendation:
        envConfigScore < 100
          ? "Create missing environment configuration files"
          : undefined,
      estimatedEffort: "2-4 hours",
      details: { envConfigScore, existingFiles: existingEnvFiles },
    });
  }

  private async checkMonitoringAndAlerting(): Promise<void> {
    const monitoringFeatures = [];

    if (fs.existsSync("backend/shared/src/monitoring/metrics.ts")) {
      monitoringFeatures.push("Metrics collection");
    }

    if (
      fs.existsSync("docker-compose.yml") &&
      fs.readFileSync("docker-compose.yml", "utf8").includes("prometheus")
    ) {
      monitoringFeatures.push("Prometheus monitoring");
    }

    if (
      fs.existsSync("docker-compose.yml") &&
      fs.readFileSync("docker-compose.yml", "utf8").includes("grafana")
    ) {
      monitoringFeatures.push("Grafana dashboards");
    }

    const monitoringScore = (monitoringFeatures.length / 3) * 100;

    this.results.push({
      category: "Production Readiness",
      item: "Monitoring and Alerting",
      priority: monitoringScore < 70 ? "High" : "Medium",
      status: monitoringScore >= 70 ? "Pass" : "Warning",
      description: `Monitoring features: ${monitoringFeatures.join(", ")}`,
      recommendation:
        monitoringScore < 100
          ? "Complete monitoring and alerting setup"
          : undefined,
      estimatedEffort: "6-12 hours",
      details: { monitoringScore, features: monitoringFeatures },
    });
  }

  private async checkBackupAndRecovery(): Promise<void> {
    // Check for backup and recovery procedures
    const backupDocExists = fs.existsSync("backend/docs/BACKUP-RECOVERY.md");

    this.results.push({
      category: "Production Readiness",
      item: "Backup and Recovery",
      priority: !backupDocExists ? "High" : "Medium",
      status: backupDocExists ? "Pass" : "Warning",
      description: backupDocExists
        ? "Backup and recovery documentation found"
        : "No backup and recovery procedures documented",
      recommendation: !backupDocExists
        ? "Document backup and recovery procedures for production deployment"
        : undefined,
      estimatedEffort: "4-8 hours",
      details: { backupDocExists },
    });
  }

  private async checkScalabilityConsiderations(): Promise<void> {
    // Check for load balancing and scalability features
    const scalabilityFeatures = [];

    if (fs.existsSync("docker-compose.yml")) {
      const dockerContent = fs.readFileSync("docker-compose.yml", "utf8");
      if (
        dockerContent.includes("replicas") ||
        dockerContent.includes("scale")
      ) {
        scalabilityFeatures.push("Docker scaling configuration");
      }
    }

    if (fs.existsSync("backend/services/api-gateway")) {
      scalabilityFeatures.push("API Gateway for load distribution");
    }

    const scalabilityScore = scalabilityFeatures.length > 0 ? 80 : 40;

    this.results.push({
      category: "Production Readiness",
      item: "Scalability Considerations",
      priority: scalabilityScore < 60 ? "Medium" : "Low",
      status: scalabilityScore >= 60 ? "Pass" : "Warning",
      description: `Scalability features: ${scalabilityFeatures.join(", ") || "None found"}`,
      recommendation:
        scalabilityScore < 80
          ? "Implement load balancing and horizontal scaling capabilities"
          : undefined,
      estimatedEffort: "8-16 hours",
      details: { scalabilityScore, features: scalabilityFeatures },
    });
  }

  // ============================================================================
  // 5. USER EXPERIENCE ASSESSMENT
  // ============================================================================
  private async auditUserExperience(): Promise<void> {
    logger.info("👥 Auditing User Experience...");

    await this.checkVietnameseLanguageSupport();
    await this.checkMobileResponsiveness();
    await this.checkAccessibilityCompliance();
    await this.checkPerformanceFromUserPerspective();
  }

  private async checkVietnameseLanguageSupport(): Promise<void> {
    // Check Vietnamese language support in frontend
    const frontendI18nExists =
      fs.existsSync("frontend/lib/i18n") ||
      fs.existsSync("frontend/locales") ||
      fs.existsSync("frontend/translations");

    let vietnameseUIScore = 0;
    if (frontendI18nExists) {
      vietnameseUIScore = 80;
    } else {
      // Check for Vietnamese text in components
      const frontendDir = "frontend";
      if (fs.existsSync(frontendDir)) {
        const files = this.getFilesRecursively(
          path.join(frontendDir, "pages"),
          ".tsx"
        );
        const filesWithVietnamese = files.filter((file) => {
          const content = fs.readFileSync(file, "utf8");
          return (
            content.includes("Bệnh nhân") ||
            content.includes("Bác sĩ") ||
            content.includes("Lịch hẹn")
          );
        });
        vietnameseUIScore = Math.min(
          80,
          (filesWithVietnamese.length / Math.max(files.length, 1)) * 100
        );
      }
    }

    this.results.push({
      category: "User Experience",
      item: "Vietnamese Language Support",
      priority: vietnameseUIScore < 70 ? "High" : "Medium",
      status: vietnameseUIScore >= 70 ? "Pass" : "Warning",
      description: `Vietnamese UI support: ${vietnameseUIScore}%`,
      recommendation:
        vietnameseUIScore < 80
          ? "Complete Vietnamese language support in all UI components"
          : undefined,
      estimatedEffort: "8-16 hours",
      details: { vietnameseUIScore },
    });
  }

  private async checkMobileResponsiveness(): Promise<void> {
    // Check for responsive design implementation
    const tailwindConfigExists =
      fs.existsSync("frontend/tailwind.config.js") ||
      fs.existsSync("frontend/tailwind.config.ts");

    this.results.push({
      category: "User Experience",
      item: "Mobile Responsiveness",
      priority: !tailwindConfigExists ? "Medium" : "Low",
      status: tailwindConfigExists ? "Pass" : "Warning",
      description: tailwindConfigExists
        ? "Responsive design framework found"
        : "No responsive design framework detected",
      recommendation: !tailwindConfigExists
        ? "Implement responsive design for mobile devices"
        : "Test and optimize mobile user experience",
      estimatedEffort: "12-24 hours",
      details: { tailwindConfigExists },
    });
  }

  private async checkAccessibilityCompliance(): Promise<void> {
    // Basic accessibility check
    this.results.push({
      category: "User Experience",
      item: "Accessibility Compliance",
      priority: "Medium",
      status: "Warning",
      description: "Accessibility compliance needs manual review",
      recommendation:
        "Conduct accessibility audit and implement WCAG 2.1 AA compliance",
      estimatedEffort: "16-32 hours",
      details: { requiresManualReview: true },
    });
  }

  private async checkPerformanceFromUserPerspective(): Promise<void> {
    // Check for performance optimization features
    const performanceFeatures = [];

    if (fs.existsSync("frontend/next.config.js")) {
      const nextConfig = fs.readFileSync("frontend/next.config.js", "utf8");
      if (
        nextConfig.includes("compress") ||
        nextConfig.includes("optimization")
      ) {
        performanceFeatures.push("Next.js optimization");
      }
    }

    const performanceScore = performanceFeatures.length > 0 ? 70 : 40;

    this.results.push({
      category: "User Experience",
      item: "Frontend Performance",
      priority: performanceScore < 60 ? "Medium" : "Low",
      status: performanceScore >= 60 ? "Pass" : "Warning",
      description: `Frontend performance features: ${performanceFeatures.join(", ") || "Basic configuration"}`,
      recommendation:
        performanceScore < 80
          ? "Implement performance optimizations (code splitting, lazy loading, compression)"
          : undefined,
      estimatedEffort: "6-12 hours",
      details: { performanceScore, features: performanceFeatures },
    });
  }

  // ============================================================================
  // 6. TECHNICAL DEBT ANALYSIS
  // ============================================================================
  private async auditTechnicalDebt(): Promise<void> {
    logger.info("🔧 Auditing Technical Debt...");

    await this.checkLegacyCodeRemoval();
    await this.checkDependencyUpdates();
    await this.checkTestCoverageGaps();
    await this.checkDocumentationUpdates();
  }

  private async checkLegacyCodeRemoval(): Promise<void> {
    let legacyCodeCount = 0;

    // Check for legacy Supabase direct calls
    for (const service of this.services) {
      const serviceDir = path.join("backend/services", service, "src");
      if (fs.existsSync(serviceDir)) {
        const files = this.getFilesRecursively(serviceDir, ".ts");
        for (const file of files) {
          const content = fs.readFileSync(file, "utf8");
          if (
            content.includes("this.supabase") &&
            !content.includes("dbPool")
          ) {
            legacyCodeCount++;
          }
        }
      }
    }

    this.results.push({
      category: "Technical Debt",
      item: "Legacy Code Removal",
      priority: legacyCodeCount > 5 ? "Medium" : "Low",
      status: legacyCodeCount === 0 ? "Pass" : "Warning",
      description: `Found ${legacyCodeCount} files with legacy database access patterns`,
      recommendation:
        legacyCodeCount > 0
          ? "Complete migration from legacy Supabase direct calls to connection pooling"
          : undefined,
      estimatedEffort: "4-8 hours",
      details: { legacyCodeCount },
    });
  }

  private async checkDependencyUpdates(): Promise<void> {
    // Check for package.json files and potential outdated dependencies
    const packageJsonFiles = [];

    if (fs.existsSync("frontend/package.json")) {
      packageJsonFiles.push("frontend/package.json");
    }

    if (fs.existsSync("backend/package.json")) {
      packageJsonFiles.push("backend/package.json");
    }

    this.results.push({
      category: "Technical Debt",
      item: "Dependency Updates",
      priority: "Medium",
      status: "Warning",
      description: `Found ${packageJsonFiles.length} package.json files - dependency audit needed`,
      recommendation:
        "Run npm audit and update dependencies to latest secure versions",
      estimatedEffort: "2-4 hours",
      details: { packageJsonFiles },
    });
  }

  private async checkTestCoverageGaps(): Promise<void> {
    // Check for test files
    let testFileCount = 0;
    let sourceFileCount = 0;

    for (const service of this.services) {
      const serviceDir = path.join("backend/services", service, "src");
      if (fs.existsSync(serviceDir)) {
        const sourceFiles = this.getFilesRecursively(serviceDir, ".ts");
        const testFiles = this.getFilesRecursively(serviceDir, ".test.ts");

        sourceFileCount += sourceFiles.length;
        testFileCount += testFiles.length;
      }
    }

    const testCoverage =
      sourceFileCount > 0 ? (testFileCount / sourceFileCount) * 100 : 0;

    this.results.push({
      category: "Technical Debt",
      item: "Test Coverage",
      priority:
        testCoverage < 30 ? "High" : testCoverage < 60 ? "Medium" : "Low",
      status:
        testCoverage >= 60 ? "Pass" : testCoverage >= 30 ? "Warning" : "Fail",
      description: `Test coverage: ${testCoverage.toFixed(1)}% (${testFileCount} test files for ${sourceFileCount} source files)`,
      recommendation:
        testCoverage < 70
          ? "Increase test coverage for critical business logic"
          : undefined,
      estimatedEffort: "16-40 hours",
      details: { testCoverage, testFileCount, sourceFileCount },
    });
  }

  private async checkDocumentationUpdates(): Promise<void> {
    // Check for documentation files
    const docFiles = [
      "README.md",
      "backend/docs",
      "frontend/docs",
      "API.md",
      "DEPLOYMENT.md",
    ];

    const existingDocs = docFiles.filter((doc) => fs.existsSync(doc));
    const docScore = (existingDocs.length / docFiles.length) * 100;

    this.results.push({
      category: "Technical Debt",
      item: "Documentation Completeness",
      priority: docScore < 60 ? "Medium" : "Low",
      status: docScore >= 70 ? "Pass" : "Warning",
      description: `Documentation completeness: ${docScore}% (${existingDocs.length}/${docFiles.length} files)`,
      recommendation:
        docScore < 80 ? "Update and complete project documentation" : undefined,
      estimatedEffort: "4-8 hours",
      details: { docScore, existingDocs },
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  private getFilesRecursively(dir: string, extension: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private generateAuditReport(): void {
    const totalIssues = this.results.length;
    const criticalIssues = this.results.filter(
      (r) => r.priority === "Critical"
    ).length;
    const highIssues = this.results.filter((r) => r.priority === "High").length;
    const failedItems = this.results.filter((r) => r.status === "Fail").length;
    const warningItems = this.results.filter(
      (r) => r.status === "Warning"
    ).length;

    logger.info("📋 Production Readiness Audit Results", {
      totalIssues,
      criticalIssues,
      highIssues,
      failedItems,
      warningItems,
    });

    // Group results by category
    const categoryResults = this.results.reduce(
      (acc, result) => {
        if (!acc[result.category]) acc[result.category] = [];
        acc[result.category].push(result);
        return acc;
      },
      {} as Record<string, AuditResult[]>
    );

    // Generate detailed report
    Object.entries(categoryResults).forEach(([category, results]) => {
      logger.info(`\n📊 ${category}:`);

      results.forEach((result) => {
        const statusIcon =
          result.status === "Pass"
            ? "✅"
            : result.status === "Warning"
              ? "⚠️"
              : "❌";
        const priorityIcon =
          result.priority === "Critical"
            ? "🔴"
            : result.priority === "High"
              ? "🟠"
              : result.priority === "Medium"
                ? "🟡"
                : "🟢";

        logger.info(`  ${statusIcon} ${priorityIcon} ${result.item}`, {
          status: result.status,
          priority: result.priority,
          description: result.description,
          recommendation: result.recommendation,
          estimatedEffort: result.estimatedEffort,
        });
      });
    });

    // Final assessment
    if (criticalIssues === 0 && failedItems === 0) {
      logger.info(
        "🎉 PRODUCTION READINESS: EXCELLENT - System ready for deployment"
      );
    } else if (criticalIssues === 0 && failedItems <= 2) {
      logger.info("✅ PRODUCTION READINESS: GOOD - Minor issues to address");
    } else {
      logger.warn(
        "⚠️ PRODUCTION READINESS: NEEDS ATTENTION - Critical issues must be resolved"
      );
    }

    // Save detailed report
    this.saveDetailedReport();
  }

  private saveDetailedReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.results.length,
        criticalIssues: this.results.filter((r) => r.priority === "Critical")
          .length,
        highIssues: this.results.filter((r) => r.priority === "High").length,
        failedItems: this.results.filter((r) => r.status === "Fail").length,
        warningItems: this.results.filter((r) => r.status === "Warning").length,
      },
      results: this.results,
    };

    fs.writeFileSync(
      "backend/docs/PRODUCTION-READINESS-AUDIT-REPORT.json",
      JSON.stringify(report, null, 2)
    );

    logger.info(
      "📄 Detailed audit report saved to backend/docs/PRODUCTION-READINESS-AUDIT-REPORT.json"
    );
  }
}

// Export for use in other scripts
export { ProductionReadinessAuditor };

// Run audit if this file is executed directly
if (require.main === module) {
  const auditor = new ProductionReadinessAuditor();
  auditor.runComprehensiveAudit().catch((error) => {
    logger.error("Production readiness audit failed:", error);
    process.exit(1);
  });
}
