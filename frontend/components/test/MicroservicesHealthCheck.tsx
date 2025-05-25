'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Server,
  Activity
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
      url: 'http://localhost:3100/health',
      status: 'unknown'
    },
    {
      name: 'Medical Records Service',
      url: 'http://localhost:3006/health',
      status: 'unknown'
    },
    {
      name: 'Prescriptions Service',
      url: 'http://localhost:3007/health',
      status: 'unknown'
    },
    {
      name: 'Billing Service',
      url: 'http://localhost:3008/health',
      status: 'unknown'
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkServiceHealth = async (service: ServiceHealth): Promise<ServiceHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          ...service,
          status: 'healthy',
          responseTime,
          lastChecked: new Date(),
          error: undefined
        };
      } else {
        return {
          ...service,
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        ...service,
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    
    // Set all services to checking status
    setServices(prev => prev.map(service => ({ ...service, status: 'checking' as const })));

    try {
      const healthChecks = await Promise.all(
        services.map(service => checkServiceHealth(service))
      );
      
      setServices(healthChecks);
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ServiceHealth['status']) => {
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

  // Auto-check on component mount
  useEffect(() => {
    checkAllServices();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Microservices Health Check
          </CardTitle>
          <Button 
            onClick={checkAllServices} 
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{service.name}</h4>
                {getStatusIcon(service.status)}
              </div>
              
              <div className="space-y-2">
                <Badge className={`text-xs ${getStatusColor(service.status)}`}>
                  {service.status.toUpperCase()}
                </Badge>
                
                {service.responseTime && (
                  <p className="text-xs text-gray-600">
                    Response: {service.responseTime}ms
                  </p>
                )}
                
                {service.lastChecked && (
                  <p className="text-xs text-gray-600">
                    Last checked: {service.lastChecked.toLocaleTimeString()}
                  </p>
                )}
                
                {service.error && (
                  <p className="text-xs text-red-600 truncate" title={service.error}>
                    {service.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Total Services: {services.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Healthy: {services.filter(s => s.status === 'healthy').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Unhealthy: {services.filter(s => s.status === 'unhealthy').length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
