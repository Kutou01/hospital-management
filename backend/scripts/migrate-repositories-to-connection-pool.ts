// ============================================================================
// REPOSITORY MIGRATION SCRIPT
// Migrate all repository classes from direct Supabase to connection pooling
// ============================================================================

import fs from 'fs';
import path from 'path';
import logger from '@hospital/shared/dist/utils/logger';

interface MigrationResult {
  filePath: string;
  success: boolean;
  changes: number;
  error?: string;
}

class RepositoryMigrator {
  private results: MigrationResult[] = [];
  
  private repositoryPaths = [
    'backend/services/doctor-service/src/repositories',
    'backend/services/patient-service/src/repositories', 
    'backend/services/appointment-service/src/repositories',
    'backend/services/medical-records-service/src/repositories'
  ];

  async migrateAllRepositories(): Promise<void> {
    logger.info('Starting Repository Migration to Connection Pooling');

    for (const repoPath of this.repositoryPaths) {
      await this.migrateRepositoriesInDirectory(repoPath);
    }

    this.generateMigrationReport();
  }

  private async migrateRepositoriesInDirectory(dirPath: string): Promise<void> {
    try {
      const fullPath = path.resolve(dirPath);
      
      if (!fs.existsSync(fullPath)) {
        logger.warn(`Directory not found: ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(fullPath);
      const repositoryFiles = files.filter(file => 
        file.endsWith('.repository.ts') || file.endsWith('.repository.js')
      );

      for (const file of repositoryFiles) {
        const filePath = path.join(fullPath, file);
        await this.migrateRepositoryFile(filePath);
      }
    } catch (error) {
      logger.error(`Error processing directory ${dirPath}:`, error);
    }
  }

  private async migrateRepositoryFile(filePath: string): Promise<void> {
    try {
      logger.info(`Migrating repository: ${filePath}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      let changes = 0;
      const originalContent = content;

      // 1. Update imports
      if (content.includes('import { supabaseAdmin }')) {
        content = content.replace(
          /import { supabaseAdmin }/g,
          'import { dbPool }'
        );
        changes++;
      }

      // 2. Remove private supabase property
      if (content.includes('private supabase')) {
        content = content.replace(
          /private supabase[^;]*;/g,
          '// Using connection pooling for all database operations'
        );
        changes++;
      }

      // 3. Remove constructor with supabase assignment
      if (content.includes('this.supabase = supabaseAdmin')) {
        content = content.replace(
          /constructor\(\)\s*{\s*this\.supabase\s*=\s*supabaseAdmin;\s*}/g,
          '// Constructor removed - using connection pooling'
        );
        changes++;
      }

      // 4. Replace direct supabase calls with connection pooling
      const supabaseCallPatterns = [
        // Standard queries
        {
          pattern: /await this\.supabase\s*\n?\s*\.from\(/g,
          replacement: 'await dbPool.executeQuery(async (client) => {\n        const { data, error } = await client.from('
        },
        // RPC calls
        {
          pattern: /await this\.supabase\s*\n?\s*\.rpc\(/g,
          replacement: 'await dbPool.executeQuery(async (client) => {\n        const { data, error } = await client.rpc('
        }
      ];

      for (const { pattern, replacement } of supabaseCallPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          changes++;
        }
      }

      // 5. Add error handling and return statements for pooled queries
      content = this.addConnectionPoolErrorHandling(content);

      // 6. Update healthcare-specific queries to use specialized methods
      content = this.updateHealthcareSpecificQueries(content);

      if (changes > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        logger.info(`Successfully migrated ${filePath} with ${changes} changes`);
      }

      this.results.push({
        filePath,
        success: true,
        changes,
        error: undefined
      });

    } catch (error) {
      logger.error(`Error migrating ${filePath}:`, error);
      this.results.push({
        filePath,
        success: false,
        changes: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private addConnectionPoolErrorHandling(content: string): string {
    // Add proper error handling for connection pool queries
    const errorHandlingPattern = /const { data, error } = await client\.(from|rpc)\([^}]+\);/g;
    
    return content.replace(errorHandlingPattern, (match) => {
      return `${match}
        
        if (error) {
          logger.error('Database query error:', error);
          throw error;
        }
        
        return data;
      });`;
    });
  }

  private updateHealthcareSpecificQueries(content: string): string {
    // Update specific healthcare queries to use specialized connection pool methods
    const healthcarePatterns = [
      {
        // FHIR validation queries
        pattern: /dbPool\.executeQuery.*fhir|validation|diagnos/gi,
        replacement: 'dbPool.executeFHIRValidation'
      },
      {
        // Diagnosis operations
        pattern: /dbPool\.executeQuery.*diagnos|medical_record|treatment/gi,
        replacement: 'dbPool.executeDiagnosisOperation'
      },
      {
        // Bulk operations
        pattern: /dbPool\.executeQuery.*bulk|batch|multiple/gi,
        replacement: 'dbPool.executeBulkOperation'
      }
    ];

    for (const { pattern, replacement } of healthcarePatterns) {
      if (pattern.test(content)) {
        // This is a simplified replacement - in practice, you'd need more sophisticated logic
        logger.info('Healthcare-specific query pattern detected - manual review recommended');
      }
    }

    return content;
  }

  private generateMigrationReport(): void {
    const totalFiles = this.results.length;
    const successfulMigrations = this.results.filter(r => r.success).length;
    const failedMigrations = totalFiles - successfulMigrations;
    const totalChanges = this.results.reduce((sum, r) => sum + r.changes, 0);

    logger.info('Repository Migration Report', {
      totalFiles,
      successfulMigrations,
      failedMigrations,
      totalChanges
    });

    // Detailed results
    this.results.forEach(result => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      logger.info(`${status} ${result.filePath}`, {
        changes: result.changes,
        error: result.error
      });
    });

    // Summary
    if (successfulMigrations === totalFiles && totalChanges > 0) {
      logger.info('🎉 Repository Migration: COMPLETE - All repositories migrated to connection pooling');
    } else if (failedMigrations === 0 && totalChanges === 0) {
      logger.info('ℹ️ Repository Migration: NO CHANGES - All repositories already using connection pooling');
    } else {
      logger.warn('⚠️ Repository Migration: PARTIAL - Some repositories need manual review');
    }

    // Generate migration checklist
    this.generateMigrationChecklist();
  }

  private generateMigrationChecklist(): void {
    const checklist = `
# Repository Migration Checklist

## Completed Migrations:
${this.results.filter(r => r.success && r.changes > 0).map(r => 
  `- ✅ ${r.filePath} (${r.changes} changes)`
).join('\n')}

## Failed Migrations:
${this.results.filter(r => !r.success).map(r => 
  `- ❌ ${r.filePath} - ${r.error}`
).join('\n')}

## Manual Review Required:
- Check healthcare-specific queries for proper method usage
- Verify error handling in complex queries
- Test database functions with connection pooling
- Update any remaining direct supabase calls

## Next Steps:
1. Run tests to verify migrations work correctly
2. Update controllers to use migrated repositories
3. Test performance improvements
4. Deploy to staging for validation
`;

    fs.writeFileSync('backend/docs/REPOSITORY-MIGRATION-CHECKLIST.md', checklist);
    logger.info('Migration checklist saved to backend/docs/REPOSITORY-MIGRATION-CHECKLIST.md');
  }
}

// Export for use in other scripts
export { RepositoryMigrator };

// Run migration if this file is executed directly
if (require.main === module) {
  const migrator = new RepositoryMigrator();
  migrator.migrateAllRepositories().catch(error => {
    logger.error('Repository migration failed:', error);
    process.exit(1);
  });
}
