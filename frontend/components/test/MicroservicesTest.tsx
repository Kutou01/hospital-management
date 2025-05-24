"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { unifiedApi, checkMicroservicesHealth } from '@/lib/migration-helper';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'testing';
  endpoint: string;
  response?: any;
  error?: string;
}

export function MicroservicesTest() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Gateway', status: 'offline', endpoint: '/health' },
    { name: 'Auth Service', status: 'offline', endpoint: '/api/auth/health' },
    { name: 'Doctor Service', status: 'offline', endpoint: '/api/doctors' },
    { name: 'Patient Service', status: 'offline', endpoint: '/api/patients' },
    { name: 'Appointment Service', status: 'offline', endpoint: '/api/appointments' },
    { name: 'Department Service', status: 'offline', endpoint: '/api/departments' },
  ]);

  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkServiceHealth = async (service: ServiceStatus): Promise<ServiceStatus> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}${service.endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...service,
          status: 'online',
          response: data,
        };
      } else {
        return {
          ...service,
          status: 'offline',
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        ...service,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const checkAllServices = async () => {
    setIsLoading(true);

    const updatedServices = await Promise.all(
      services.map(service => checkServiceHealth(service))
    );

    setServices(updatedServices);
    setIsLoading(false);
  };

  const testApiEndpoints = async () => {
    setIsLoading(true);
    const results: any[] = [];

    try {
      // Test doctors endpoint
      console.log('Testing doctors endpoint...');
      const doctorsResponse = await unifiedApi.doctors.getAll();
      results.push({
        endpoint: 'Doctors',
        success: true,
        data: doctorsResponse,
        count: Array.isArray(doctorsResponse) ? doctorsResponse.length : 0,
      });
    } catch (error) {
      results.push({
        endpoint: 'Doctors',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      // Test patients endpoint
      console.log('Testing patients endpoint...');
      const patientsResponse = await unifiedApi.patients.getAll();
      results.push({
        endpoint: 'Patients',
        success: true,
        data: patientsResponse,
        count: Array.isArray(patientsResponse) ? patientsResponse.length : 0,
      });
    } catch (error) {
      results.push({
        endpoint: 'Patients',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      // Test departments endpoint
      console.log('Testing departments endpoint...');
      const departmentsResponse = await unifiedApi.departments.getAll();
      results.push({
        endpoint: 'Departments',
        success: true,
        data: departmentsResponse,
        count: Array.isArray(departmentsResponse) ? departmentsResponse.length : 0,
      });
    } catch (error) {
      results.push({
        endpoint: 'Departments',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'testing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Microservices Integration Test</h2>
        <div className="space-x-2">
          <Button onClick={checkAllServices} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Check Services'}
          </Button>
          <Button onClick={testApiEndpoints} disabled={isLoading} variant="outline">
            Test APIs
          </Button>
        </div>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Current status of all microservices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-500">{service.endpoint}</div>
                  {service.error && (
                    <div className="text-sm text-red-500">{service.error}</div>
                  )}
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>API Test Results</CardTitle>
            <CardDescription>
              Results from testing API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{result.endpoint}</h4>
                    <Badge className={result.success ? 'bg-green-500' : 'bg-red-500'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>

                  {result.success ? (
                    <div className="text-sm text-gray-600">
                      <p>Records found: {result.count}</p>
                      {result.count > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer">View sample data</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data.slice(0, 2), null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Current microservices configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>API Gateway URL:</strong> {process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'}</div>
            <div><strong>Frontend URL:</strong> http://localhost:3000</div>
            <div><strong>Docs URL:</strong> {process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'}/docs</div>

            <div className="mt-4">
              <strong>Feature Flags:</strong>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>Auth: {process.env.NEXT_PUBLIC_USE_MICROSERVICES_AUTH || 'false'}</div>
                <div>Doctors: {process.env.NEXT_PUBLIC_USE_MICROSERVICES_DOCTORS || 'false'}</div>
                <div>Patients: {process.env.NEXT_PUBLIC_USE_MICROSERVICES_PATIENTS || 'false'}</div>
                <div>Appointments: {process.env.NEXT_PUBLIC_USE_MICROSERVICES_APPOINTMENTS || 'false'}</div>
                <div>Departments: {process.env.NEXT_PUBLIC_USE_MICROSERVICES_DEPARTMENTS || 'false'}</div>
                <div>Rooms: {process.env.NEXT_PUBLIC_USE_MICROSERVICES_ROOMS || 'false'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
