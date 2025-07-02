'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, MessageCircle, Calendar, User, Stethoscope } from 'lucide-react';
import ChatbotBookingWidget from '@/components/chatbot/ChatbotBookingWidget';

const TestChatbotBookingPage = () => {
  const [apiStatus, setApiStatus] = useState<{[key: string]: 'loading' | 'success' | 'error'}>({});
  const [apiResults, setApiResults] = useState<{[key: string]: any}>({});

  const chatbotApiUrl = '/api/chatbot';

  const testEndpoints = [
    {
      name: 'Get Specialties',
      url: `${chatbotApiUrl}/specialties`,
      method: 'GET',
      description: 'Lấy danh sách chuyên khoa (27 chuyên khoa)'
    },
    {
      name: 'Get Doctors',
      url: `${chatbotApiUrl}/doctors?specialty_id=SPEC040`,
      method: 'GET',
      description: 'Lấy danh sách bác sĩ theo chuyên khoa (5 bác sĩ)'
    },
    {
      name: 'Get Time Slots',
      url: `${chatbotApiUrl}/slots/DOC-TEST-001?date=2025-07-01`,
      method: 'GET',
      description: 'Lấy time slots của bác sĩ (17 slots)'
    },
    {
      name: 'Create Session',
      url: `${chatbotApiUrl}/session`,
      method: 'POST',
      body: { patient_id: 'PAT-TEST-001' },
      description: 'Tạo session booking mới'
    },
    {
      name: 'Create Appointment',
      url: `${chatbotApiUrl}/appointment/CHAT-APPT-TEST-123`,
      method: 'POST',
      body: {},
      description: 'Tạo appointment từ session'
    }
  ];

  const testApi = async (endpoint: any) => {
    const key = endpoint.name;
    setApiStatus(prev => ({ ...prev, [key]: 'loading' }));

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, options);
      const data = await response.json();

      if (response.ok) {
        setApiStatus(prev => ({ ...prev, [key]: 'success' }));
        setApiResults(prev => ({ ...prev, [key]: data }));
      } else {
        setApiStatus(prev => ({ ...prev, [key]: 'error' }));
        setApiResults(prev => ({ ...prev, [key]: data }));
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, [key]: 'error' }));
      setApiResults(prev => ({ ...prev, [key]: { error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const testAllApis = async () => {
    for (const endpoint of testEndpoints) {
      await testApi(endpoint);
      // Delay giữa các request
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Clock className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">Testing...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not tested</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <MessageCircle className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Test Chatbot Booking System</h1>
        </div>
        <p className="text-gray-600">
          Kiểm tra tất cả API endpoints của hệ thống chatbot booking
        </p>
        <Button onClick={testAllApis} className="bg-blue-600 hover:bg-blue-700">
          🧪 Test All APIs
        </Button>
      </div>

      {/* API Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testEndpoints.map((endpoint) => {
          const status = apiStatus[endpoint.name] || 'idle';
          const result = apiResults[endpoint.name];

          return (
            <Card key={endpoint.name} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span>{endpoint.name}</span>
                  </CardTitle>
                  {getStatusBadge(status)}
                </div>
                <p className="text-sm text-gray-600">{endpoint.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{endpoint.method}</Badge>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {endpoint.url}
                    </code>
                  </div>
                </div>

                {endpoint.body && (
                  <div className="text-sm">
                    <span className="font-medium">Body:</span>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(endpoint.body, null, 2)}
                    </pre>
                  </div>
                )}

                <Button
                  onClick={() => testApi(endpoint)}
                  disabled={status === 'loading'}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {status === 'loading' ? 'Testing...' : 'Test This API'}
                </Button>

                {result && (
                  <div className="text-sm">
                    <span className="font-medium">Response:</span>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 max-h-40 overflow-y-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center space-x-2">
            <Stethoscope className="h-5 w-5" />
            <span>Hướng dẫn sử dụng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <div className="flex items-start space-x-2">
            <Calendar className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Chatbot Booking Widget:</p>
              <p className="text-sm">Nhìn góc phải dưới màn hình để thấy chat widget màu xanh nước biển</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Test Flow:</p>
              <p className="text-sm">1. Click chat widget → 2. Chọn chuyên khoa → 3. Chọn bác sĩ → 4. Chọn ngày → 5. Chọn giờ → 6. Xác nhận</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <MessageCircle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Next.js API Routes:</p>
              <p className="text-sm">Sử dụng API routes nội bộ của Next.js. Tất cả APIs phải có status "Success" để widget hoạt động</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium">Database Functions</p>
              <p className="text-sm text-gray-600">6 functions created</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium">API Routes</p>
              <p className="text-sm text-gray-600">Next.js Internal</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="font-medium">Frontend Widget</p>
              <p className="text-sm text-gray-600">React Component</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chatbot Widget for Testing */}
      <ChatbotBookingWidget />
    </div>
  );
};

export default TestChatbotBookingPage;
