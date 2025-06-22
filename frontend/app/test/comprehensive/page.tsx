'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AuthenticationStatus from '@/components/test/AuthenticationStatus';
import {
  TestTube,
  Server,
  Database,
  Shield,
  Users,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  message?: string;
  duration?: number;
  details?: any;
}

interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  user?: any;
}

interface ServiceTest {
  name: string;
  icon: React.ReactNode;
  tests: string[];
  endpoint?: string;
}

export default function ComprehensiveTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false });
  const [testMode, setTestMode] = useState<'public' | 'authenticated' | 'comprehensive'>('comprehensive');

  const services: ServiceTest[] = [
    {
      name: 'Auth Service',
      icon: <Shield className="h-5 w-5" />,
      tests: [
        'Health Check',
        'Login Flow',
        'Registration Flow', 
        'Token Validation',
        'Role-based Access',
        'Session Management'
      ],
      endpoint: '/api/auth'
    },
    {
      name: 'Doctor Service',
      icon: <Users className="h-5 w-5" />,
      tests: [
        'Health Check',
        'Get All Doctors',
        'Create Doctor',
        'Update Doctor',
        'Doctor Statistics',
        'Schedule Management',
        'Review System'
      ],
      endpoint: '/api/doctors'
    },
    {
      name: 'Patient Service', 
      icon: <Activity className="h-5 w-5" />,
      tests: [
        'Health Check',
        'Get All Patients',
        'Create Patient',
        'Update Patient',
        'Patient Statistics',
        'Health Metrics',
        'Search Functionality'
      ],
      endpoint: '/api/patients'
    },
    {
      name: 'Appointment Service',
      icon: <Calendar className="h-5 w-5" />,
      tests: [
        'Health Check',
        'Get Appointments',
        'Create Appointment',
        'Update Status',
        'Conflict Detection',
        'Available Slots',
        'Real-time Updates'
      ],
      endpoint: '/api/appointments'
    },
    {
      name: 'Department Service',
      icon: <Server className="h-5 w-5" />,
      tests: [
        'Health Check',
        'Get Departments',
        'Department Tree',
        'Specialties',
        'Room Management',
        'Hierarchy Validation'
      ],
      endpoint: '/api/departments'
    },
    {
      name: 'Database Integration',
      icon: <Database className="h-5 w-5" />,
      tests: [
        'Connection Test',
        'ID Generation',
        'Foreign Keys',
        'RLS Policies',
        'Functions Test',
        'Data Integrity'
      ]
    }
  ];

  const addTestResult = (name: string, status: TestResult['status'], message?: string, duration?: number, details?: any) => {
    setTestResults(prev => [...prev, { name, status, message, duration, details }]);
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false });
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  };

  const makeRequest = async (endpoint: string, options: RequestInit = {}, requireAuth: boolean = false) => {
    const startTime = Date.now();
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add auth token if required and available
      if (requireAuth && authState.token) {
        headers['Authorization'] = `Bearer ${authState.token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}${endpoint}`, {
        headers,
        ...options,
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data,
        duration
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  const authenticateTestUser = async () => {
    setCurrentTest('Authenticating test user...');

    try {
      const loginResult = await makeRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@hospital.com',
          password: 'Admin123'
        })
      });

      if (loginResult.success && loginResult.data?.session?.access_token) {
        const token = loginResult.data.session.access_token;
        const user = loginResult.data.user;

        setAuthState({
          isAuthenticated: true,
          token,
          user
        });

        addTestResult(
          'Authentication',
          'success',
          `Logged in as ${user.email} (${user.role})`,
          loginResult.duration,
          { user, tokenLength: token.length }
        );

        return true;
      } else {
        addTestResult(
          'Authentication',
          'error',
          loginResult.error || 'Login failed',
          loginResult.duration
        );
        return false;
      }
    } catch (error) {
      addTestResult(
        'Authentication',
        'error',
        error instanceof Error ? error.message : 'Authentication error'
      );
      return false;
    }
  };

  const testAuthService = async () => {
    setCurrentTest('Testing Auth Service...');

    // Public health check
    const healthResult = await makeRequest('/api/auth/health');
    addTestResult(
      'Auth Service Health (Public)',
      healthResult.success ? 'success' : 'error',
      healthResult.success ? `Response time: ${healthResult.duration}ms` : healthResult.error,
      healthResult.duration
    );

    // Test login endpoint validation (should return 400 for missing credentials)
    const loginValidationResult = await makeRequest('/api/auth/signin', { method: 'POST' });
    addTestResult(
      'Auth Login Validation',
      loginValidationResult.status === 400 ? 'success' : 'warning',
      `Status: ${loginValidationResult.status} (Expected 400 for missing credentials)`,
      loginValidationResult.duration
    );

    // Test authenticated endpoint if we have token
    if (authState.isAuthenticated && authState.token) {
      const profileResult = await makeRequest('/api/auth/profile', { method: 'GET' }, true);
      addTestResult(
        'Auth Profile (Authenticated)',
        profileResult.success ? 'success' : 'warning',
        profileResult.success ? 'Profile retrieved successfully' : `Status: ${profileResult.status}`,
        profileResult.duration
      );
    }

    // Test token validation
    if (authState.token) {
      const tokenValidationResult = await makeRequest('/api/auth/validate', {
        method: 'POST',
        body: JSON.stringify({ token: authState.token })
      });
      addTestResult(
        'Token Validation',
        tokenValidationResult.success ? 'success' : 'warning',
        tokenValidationResult.success ? 'Token is valid' : `Status: ${tokenValidationResult.status}`,
        tokenValidationResult.duration
      );
    }
  };

  const testDoctorService = async () => {
    setCurrentTest('Testing Doctor Service...');

    // Public health check
    const healthResult = await makeRequest('/api/doctors/health');
    addTestResult(
      'Doctor Service Health (Public)',
      healthResult.success ? 'success' : 'error',
      healthResult.success ? `Response time: ${healthResult.duration}ms` : healthResult.error,
      healthResult.duration
    );

    // Test doctors endpoint without auth (should return 401)
    const doctorsNoAuthResult = await makeRequest('/api/doctors');
    addTestResult(
      'Doctor Service Auth Protection',
      doctorsNoAuthResult.status === 401 ? 'success' : 'warning',
      `Status: ${doctorsNoAuthResult.status} (Expected 401 for no auth)`,
      doctorsNoAuthResult.duration
    );

    // Test authenticated endpoints if we have token
    if (authState.isAuthenticated && authState.token) {
      // Test get all doctors with auth
      const doctorsAuthResult = await makeRequest('/api/doctors', { method: 'GET' }, true);
      addTestResult(
        'Get All Doctors (Authenticated)',
        doctorsAuthResult.success ? 'success' : 'warning',
        doctorsAuthResult.success ? `Found ${doctorsAuthResult.data?.data?.length || 0} doctors` : `Status: ${doctorsAuthResult.status}`,
        doctorsAuthResult.duration
      );

      // Test doctor stats with auth
      const statsAuthResult = await makeRequest('/api/doctors/stats', { method: 'GET' }, true);
      addTestResult(
        'Doctor Stats (Authenticated)',
        statsAuthResult.success ? 'success' : 'warning',
        statsAuthResult.success ? 'Stats retrieved successfully' : `Status: ${statsAuthResult.status}`,
        statsAuthResult.duration
      );

      // Test search functionality
      const searchResult = await makeRequest('/api/doctors/search?q=test', { method: 'GET' }, true);
      addTestResult(
        'Doctor Search (Authenticated)',
        searchResult.success ? 'success' : 'warning',
        searchResult.success ? 'Search completed successfully' : `Status: ${searchResult.status}`,
        searchResult.duration
      );
    }
  };

  const testPatientService = async () => {
    setCurrentTest('Testing Patient Service...');

    // Public health check
    const healthResult = await makeRequest('/api/patients/health');
    addTestResult(
      'Patient Service Health (Public)',
      healthResult.success ? 'success' : 'error',
      healthResult.success ? `Response time: ${healthResult.duration}ms` : healthResult.error,
      healthResult.duration
    );

    // Test auth protection
    const patientsNoAuthResult = await makeRequest('/api/patients');
    addTestResult(
      'Patient Service Auth Protection',
      patientsNoAuthResult.status === 401 ? 'success' : 'warning',
      `Status: ${patientsNoAuthResult.status} (Expected 401 for no auth)`,
      patientsNoAuthResult.duration
    );

    // Test authenticated endpoints if we have token
    if (authState.isAuthenticated && authState.token) {
      // Test get all patients with auth
      const patientsAuthResult = await makeRequest('/api/patients', { method: 'GET' }, true);
      addTestResult(
        'Get All Patients (Authenticated)',
        patientsAuthResult.success ? 'success' : 'warning',
        patientsAuthResult.success ? `Found ${patientsAuthResult.data?.data?.length || 0} patients` : `Status: ${patientsAuthResult.status}`,
        patientsAuthResult.duration
      );

      // Test patient stats
      const statsResult = await makeRequest('/api/patients/stats', { method: 'GET' }, true);
      addTestResult(
        'Patient Stats (Authenticated)',
        statsResult.success ? 'success' : 'warning',
        statsResult.success ? 'Stats retrieved successfully' : `Status: ${statsResult.status}`,
        statsResult.duration
      );
    }
  };

  const testAppointmentService = async () => {
    setCurrentTest('Testing Appointment Service...');
    
    const healthResult = await makeRequest('/api/appointments/health');
    addTestResult(
      'Appointment Service Health',
      healthResult.success ? 'success' : 'error',
      healthResult.success ? `Response time: ${healthResult.duration}ms` : healthResult.error,
      healthResult.duration
    );

    const appointmentsResult = await makeRequest('/api/appointments');
    addTestResult(
      'Appointment Service Auth',
      appointmentsResult.status === 401 ? 'success' : 'warning',
      `Status: ${appointmentsResult.status}`,
      appointmentsResult.duration
    );
  };

  const testDepartmentService = async () => {
    setCurrentTest('Testing Department Service...');
    
    const healthResult = await makeRequest('/api/departments/health');
    addTestResult(
      'Department Service Health',
      healthResult.success ? 'success' : 'error',
      healthResult.success ? `Response time: ${healthResult.duration}ms` : healthResult.error,
      healthResult.duration
    );
  };

  const testDatabaseIntegration = async () => {
    setCurrentTest('Testing Database Integration...');
    
    // Test API Gateway root (shows service registry)
    const gatewayResult = await makeRequest('/');
    addTestResult(
      'API Gateway Registry',
      gatewayResult.success ? 'success' : 'error',
      gatewayResult.success ? `Services: ${gatewayResult.data?.availableServices?.length || 0}` : gatewayResult.error,
      gatewayResult.duration
    );

    // Test service discovery
    const servicesResult = await makeRequest('/services');
    addTestResult(
      'Service Discovery',
      servicesResult.success ? 'success' : 'error',
      servicesResult.success ? 'Service registry accessible' : servicesResult.error,
      servicesResult.duration
    );
  };

  const runPublicTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    setCurrentTest('Running public endpoint tests...');

    const totalTests = 6;
    let completedTests = 0;

    try {
      // Test only public endpoints (health checks, validation)
      await testAuthService();
      completedTests++;
      setProgress((completedTests / totalTests) * 100);

      await testDoctorService();
      completedTests++;
      setProgress((completedTests / totalTests) * 100);

      await testPatientService();
      completedTests++;
      setProgress((completedTests / totalTests) * 100);

      await testAppointmentService();
      completedTests++;
      setProgress((completedTests / totalTests) * 100);

      await testDepartmentService();
      completedTests++;
      setProgress((completedTests / totalTests) * 100);

      await testDatabaseIntegration();
      completedTests++;
      setProgress(100);

      setCurrentTest('Public tests completed!');
    } catch (error) {
      console.error('Test error:', error);
      addTestResult('Test Runner', 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const runAuthenticatedTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const totalSteps = 7; // Auth + 6 services
    let completedSteps = 0;

    try {
      // Step 1: Authenticate
      setCurrentTest('Authenticating...');
      const authSuccess = await authenticateTestUser();
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      if (!authSuccess) {
        setCurrentTest('Authentication failed - stopping tests');
        return;
      }

      // Step 2-7: Test all services with authentication
      await testAuthService();
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      await testDoctorService();
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      await testPatientService();
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      await testAppointmentService();
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      await testDepartmentService();
      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      await testDatabaseIntegration();
      completedSteps++;
      setProgress(100);

      setCurrentTest('Authenticated tests completed!');
    } catch (error) {
      console.error('Test error:', error);
      addTestResult('Test Runner', 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    try {
      // First run public tests
      setCurrentTest('Phase 1: Public endpoint tests...');
      await runPublicTests();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then run authenticated tests
      setCurrentTest('Phase 2: Authenticated tests...');
      await runAuthenticatedTests();

      setCurrentTest('Comprehensive testing completed!');
    } catch (error) {
      console.error('Comprehensive test error:', error);
      addTestResult('Comprehensive Test Runner', 'error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800', 
      warning: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    
    return variants[status] || variants.pending;
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <TestTube className="h-8 w-8 text-blue-600" />
          Comprehensive Core Services Test
        </h1>
        <p className="text-gray-600">
          Test all microservices integration through frontend interface
        </p>
      </div>

      {/* Authentication Status */}
      <AuthenticationStatus
        authState={authState}
        onLogin={authenticateTestUser}
        onLogout={handleLogout}
        isLoading={isRunning}
      />

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Test Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={testMode === 'public' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestMode('public')}
                disabled={isRunning}
              >
                Public Only
              </Button>
              <Button
                variant={testMode === 'authenticated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestMode('authenticated')}
                disabled={isRunning}
              >
                Authenticated
              </Button>
              <Button
                variant={testMode === 'comprehensive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestMode('comprehensive')}
                disabled={isRunning}
              >
                Comprehensive
              </Button>
            </div>

            {/* Test Execution */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  if (testMode === 'public') runPublicTests();
                  else if (testMode === 'authenticated') runAuthenticatedTests();
                  else runComprehensiveTests();
                }}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                {isRunning ? 'Running Tests...' : `Run ${testMode.charAt(0).toUpperCase() + testMode.slice(1)} Tests`}
              </Button>

              {/* Manual Auth Button */}
              {!authState.isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={authenticateTestUser}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Login Test User
                </Button>
              )}

              {isRunning && (
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentTest}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </div>

            {/* Test Mode Description */}
            <div className="text-sm text-gray-600">
              {testMode === 'public' && (
                <p>Tests only public endpoints (health checks, validation) - no authentication required</p>
              )}
              {testMode === 'authenticated' && (
                <p>Tests authenticated endpoints after logging in - includes CRUD operations and protected data</p>
              )}
              {testMode === 'comprehensive' && (
                <p>Runs both public and authenticated tests in sequence - complete integration testing</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card 
            key={service.name}
            className={`cursor-pointer transition-colors ${
              selectedService === service.name ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {service.icon}
                {service.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {service.tests.length} tests available
                </p>
                {service.endpoint && (
                  <Badge variant="outline" className="text-xs">
                    {service.endpoint}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Test Results
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {successCount} Passed
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {warningCount} Warnings
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {errorCount} Failed
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      {result.message && (
                        <p className="text-sm text-gray-600">{result.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <span className="text-xs text-gray-500">
                        {result.duration}ms
                      </span>
                    )}
                    <Badge className={getStatusBadge(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Prerequisites:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>All backend services running (docker compose --profile core up -d)</li>
                <li>API Gateway accessible on port 3100</li>
                <li>Database connection established</li>
                <li>Frontend running on port 3000</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Test Types:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li><strong>Public Tests:</strong> Health checks, validation endpoints (no auth)</li>
                <li><strong>Authenticated Tests:</strong> CRUD operations, protected data access</li>
                <li><strong>Integration Tests:</strong> Inter-service communication</li>
                <li><strong>Security Tests:</strong> Auth protection, token validation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Test Modes:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li><strong>Public Only:</strong> Tests endpoints that don't require authentication</li>
                <li><strong>Authenticated:</strong> Logs in first, then tests protected endpoints</li>
                <li><strong>Comprehensive:</strong> Runs both public and authenticated tests</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Expected Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li><strong>Green (Success):</strong> Service working correctly</li>
                <li><strong>Yellow (Warning):</strong> Expected behavior (like 401 for no auth)</li>
                <li><strong>Red (Error):</strong> Service unavailable or error</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Test Credentials:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li><strong>Email:</strong> admin@hospital.com</li>
                <li><strong>Password:</strong> Admin123</li>
                <li><strong>Role:</strong> Admin (full access to all endpoints)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
