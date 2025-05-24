'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Clock,
  Zap
} from 'lucide-react';

interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'unknown';
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

export const MicroservicesHealthCheck: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>([
    {
      name: 'API Gateway',
      url: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000',
      status: 'unknown',
    },
    {
      name: 'Medical Records Service',
      url: 'http://localhost:3006',
      status: 'unknown',
    },
    {
      name: 'Prescription Service',
      url: 'http://localhost:3007',
      status: 'unknown',
    },
    {
      name: 'Billing Service',
      url: 'http://localhost:3008',
      status: 'unknown',
    },
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkServiceHealth = async (service: ServiceHealth): Promise<ServiceHealth> => {
    const startTime = Date.now();
    
    try {
      // For API Gateway, check the root endpoint
      const healthEndpoint = service.name === 'API Gateway' 
        ? `${service.url}/` 
        : `${service.url}/health`;
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          ...service,
          status: 'healthy',
          responseTime,
          lastChecked: new Date(),
          error: undefined,
        };
      } else {
        return {
          ...service,
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        ...service,
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    
    // Set all services to checking status
    setServices(prev => prev.map(service => ({ ...service, status: 'checking' as const })));

    try {
      const results = await Promise.all(
        services.map(service => checkServiceHealth(service))
      );
      setServices(results);
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkSingleService = async (index: number) => {
    const service = services[index];
    setServices(prev => prev.map((s, i) => 
      i === index ? { ...s, status: 'checking' as const } : s
    ));

    const result = await checkServiceHealth(service);
    setServices(prev => prev.map((s, i) => i === index ? result : s));
  };

  useEffect(() => {
    // Check services on component mount
    checkAllServices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Server className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Microservices Health Check
            <Badge variant={healthyCount === totalCount ? 'default' : 'destructive'}>
              {healthyCount}/{totalCount} Healthy
            </Badge>
          </CardTitle>
          <Button 
            onClick={checkAllServices} 
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            Check All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthyCount < totalCount && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some services are not responding. Make sure all microservices are running.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {services.map((service, index) => (
            <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.url}</p>
                  {service.error && (
                    <p className="text-sm text-red-600 mt-1">{service.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {service.responseTime && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Zap className="h-3 w-3" />
                    {service.responseTime}ms
                  </div>
                )}
                
                {service.lastChecked && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    {service.lastChecked.toLocaleTimeString()}
                  </div>
                )}
                
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkSingleService(index)}
                  disabled={service.status === 'checking'}
                >
                  Test
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Quick Setup Guide:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Start the API Gateway: <code className="bg-white px-1 rounded">cd backend/api-gateway && npm start</code></li>
            <li>2. Start Medical Records Service: <code className="bg-white px-1 rounded">cd backend/services/medical-records-service && npm start</code></li>
            <li>3. Start Prescription Service: <code className="bg-white px-1 rounded">cd backend/services/prescription-service && npm start</code></li>
            <li>4. Start Billing Service: <code className="bg-white px-1 rounded">cd backend/services/billing-service && npm start</code></li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
