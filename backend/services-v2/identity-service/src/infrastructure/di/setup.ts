/**
 * Dependency Injection Setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DIContainer, ServiceLifetime } from '../../../shared/infrastructure/di/container';

export function setupDependencies(container: DIContainer): void {
  // Register repositories
  // container.register(ServiceTokens.SAMPLE_REPOSITORY, SampleRepository, ServiceLifetime.SCOPED);

  // Register use cases
  // container.register(ServiceTokens.SAMPLE_USE_CASE, SampleUseCase, ServiceLifetime.TRANSIENT);

  // Register domain services
  // container.register(ServiceTokens.SAMPLE_DOMAIN_SERVICE, SampleDomainService, ServiceLifetime.SINGLETON);
}
