import logger from '@hospital/shared/src/utils/logger';

interface ServiceInfo {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceInfo> = new Map();

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  async initialize(): Promise<void> {
    // Register known services
    this.registerService('auth-service', process.env.AUTH_SERVICE_URL || 'http://auth-service:3001');
    this.registerService('doctor-service', process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002');
    this.registerService('patient-service', process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003');
    this.registerService('appointment-service', process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004');
    this.registerService('department-service', process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005');

    // Start health checking
    this.startHealthChecking();

    logger.info('Service registry initialized', {
      services: Array.from(this.services.keys())
    });
  }

  registerService(name: string, url: string): void {
    this.services.set(name, {
      name,
      url,
      status: 'unknown',
      lastCheck: new Date()
    });

    logger.info('Service registered', { name, url });
  }

  getService(name: string): ServiceInfo | undefined {
    return this.services.get(name);
  }

  getRegisteredServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  private startHealthChecking(): void {
    // Check service health every 30 seconds
    setInterval(async () => {
      for (const [name, service] of this.services) {
        try {
          const response = await fetch(`${service.url}/health`, {
            method: 'GET',
            timeout: 5000
          });

          if (response.ok) {
            this.updateServiceStatus(name, 'healthy');
          } else {
            this.updateServiceStatus(name, 'unhealthy');
          }
        } catch (error) {
          this.updateServiceStatus(name, 'unhealthy');
          logger.warn('Service health check failed', {
            service: name,
            url: service.url,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }, 30000);
  }

  private updateServiceStatus(name: string, status: 'healthy' | 'unhealthy'): void {
    const service = this.services.get(name);
    if (service) {
      service.status = status;
      service.lastCheck = new Date();
      this.services.set(name, service);
    }
  }

  async disconnect(): Promise<void> {
    // Cleanup if needed
    logger.info('Service registry disconnected');
  }
}
