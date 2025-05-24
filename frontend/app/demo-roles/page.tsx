'use client';

import React, { useState } from 'react';
// import { useAuthProvider } from '@/hooks/useAuthProvider2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Stethoscope,
  Heart,
  User,
  LogIn,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';

// Mock auth provider for testing
const useMockAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);

    // Mock login logic
    setTimeout(() => {
      if (email === 'admin@hospital.com' && password === 'admin123') {
        setUser({
          id: '1',
          email: 'admin@hospital.com',
          role: 'admin',
          full_name: 'Admin User',
          is_active: true
        });
        window.location.href = '/admin/dashboard';
      } else if (email === 'doctor@hospital.com' && password === 'doctor123') {
        setUser({
          id: '2',
          email: 'doctor@hospital.com',
          role: 'doctor',
          full_name: 'Dr. John Smith',
          is_active: true
        });
        window.location.href = '/doctor/dashboard';
      } else if (email === 'patient@hospital.com' && password === 'patient123') {
        setUser({
          id: '3',
          email: 'patient@hospital.com',
          role: 'patient',
          full_name: 'Jane Doe',
          is_active: true
        });
        window.location.href = '/patient/dashboard';
      } else {
        alert('Invalid credentials');
      }
      setLoading(false);
    }, 1000);

    return { success: true };
  };

  const logout = async () => {
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isDoctor = () => user?.role === 'doctor';
  const isPatient = () => user?.role === 'patient';

  return { user, loading, login, logout, isAdmin, isDoctor, isPatient };
};

export default function DemoRolesPage() {
  const { user, loading, login, logout, isAdmin, isDoctor, isPatient } = useMockAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Demo accounts
  const demoAccounts = {
    admin: {
      email: 'admin@hospital.com',
      password: 'admin123',
      name: 'Admin User',
      description: 'Full system access with administrative privileges'
    },
    doctor: {
      email: 'doctor@hospital.com',
      password: 'doctor123',
      name: 'Dr. John Smith',
      description: 'Access to patient care and medical management tools'
    },
    patient: {
      email: 'patient@hospital.com',
      password: 'patient123',
      name: 'Jane Doe',
      description: 'Access to personal health records and appointments'
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'doctor' | 'patient') => {
    const account = demoAccounts[role];
    setLoginLoading(true);

    try {
      const result = await login(account.email, account.password);
      if (result.success) {
        // Redirect based on role
        const redirectUrl = role === 'admin' ? '/admin/dashboard' :
                           role === 'doctor' ? '/doctor/dashboard' :
                           '/patient/dashboard';
        window.location.href = redirectUrl;
      } else {
        alert(`Login failed: ${result.error}`);
      }
    } catch (error) {
      alert('Login error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Will be redirected by role detection
      } else {
        alert(`Login failed: ${result.error}`);
      }
    } catch (error) {
      alert('Login error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-6 w-6 text-red-600" />;
      case 'doctor': return <Stethoscope className="h-6 w-6 text-green-600" />;
      case 'patient': return <Heart className="h-6 w-6 text-blue-600" />;
      default: return <User className="h-6 w-6 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'doctor': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Hospital Management - Role Demo</CardTitle>
            <p className="text-gray-600">
              Test different user roles and their access levels
            </p>
          </CardHeader>
        </Card>

        {/* Current User Status */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRoleIcon(user.role)}
                  <div>
                    <h3 className="font-semibold">{user.full_name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/role-detection'}
                  >
                    Role Detection
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* Role-specific info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Access Level</h4>
                <p className="text-sm text-gray-600">
                  {user.role === 'admin' && 'Full system access with administrative privileges'}
                  {user.role === 'doctor' && 'Access to patient care and medical management tools'}
                  {user.role === 'patient' && 'Access to personal health records and appointments'}
                </p>

                <div className="mt-2 flex gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${isAdmin() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Admin: {isAdmin() ? 'Yes' : 'No'}
                  </span>
                  <span className={`px-2 py-1 rounded ${isDoctor() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Doctor: {isDoctor() ? 'Yes' : 'No'}
                  </span>
                  <span className={`px-2 py-1 rounded ${isPatient() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Patient: {isPatient() ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Login Options */}
        {!user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Demo Logins */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Demo Login</CardTitle>
                <p className="text-sm text-gray-600">
                  Login with pre-configured demo accounts
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(demoAccounts).map(([role, account]) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getRoleIcon(role)}
                      <div className="flex-1">
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-sm text-gray-600">{account.email}</p>
                      </div>
                      <Badge className={getRoleColor(role)}>
                        {role.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {account.description}
                    </p>
                    <Button
                      onClick={() => handleDemoLogin(role as 'admin' | 'doctor' | 'patient')}
                      disabled={loginLoading}
                      className="w-full"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login as {role}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Manual Login */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Login</CardTitle>
                <p className="text-sm text-gray-600">
                  Login with your own credentials
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loginLoading} className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    {loginLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>

                {/* Demo credentials helper */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Admin: admin@hospital.com / admin123</div>
                    <div>Doctor: doctor@hospital.com / doctor123</div>
                    <div>Patient: patient@hospital.com / patient123</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium">Admin</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• Manage all users</li>
                  <li>• System settings</li>
                  <li>• Reports & analytics</li>
                  <li>• Microservices management</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">Doctor</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Patient management</li>
                  <li>• Medical records</li>
                  <li>• Prescriptions</li>
                  <li>• Appointments</li>
                  <li>• Lab results</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium">Patient</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View medical records</li>
                  <li>• Book appointments</li>
                  <li>• View prescriptions</li>
                  <li>• Lab results</li>
                  <li>• Billing information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
