"use client"

import React, { useState } from 'react';

export default function TestChatbotApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testSpecialtiesApi = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing /api/chatbot/specialties');
      
      const response = await fetch('/api/chatbot/specialties', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message);
    }

    setLoading(false);
  };

  const testDoctorsApi = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing /api/chatbot/doctors');
      
      const response = await fetch('/api/chatbot/doctors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message);
    }

    setLoading(false);
  };

  const testSessionApi = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing /api/chatbot/session');
      
      const response = await fetch('/api/chatbot/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: 'TEST-PATIENT-001'
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🧪 Test Chatbot API Endpoints
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Test Buttons</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={testSpecialtiesApi}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Specialties API'}
            </button>
            
            <button
              onClick={testDoctorsApi}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Doctors API'}
            </button>

            <button
              onClick={testSessionApi}
              disabled={loading}
              className="px-6 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Session API'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
            <p className="text-red-700 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Success</h3>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.data && Array.isArray(result.data) && (
              <div className="mt-4">
                <p className="font-semibold text-green-800">
                  Found {result.data.length} items:
                </p>
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {result.data.slice(0, 10).map((item: any, index: number) => (
                    <li key={index} className="text-sm text-green-700">
                      • {item.name_vi || item.doctor_name || item.session_id || JSON.stringify(item).substring(0, 50)}
                    </li>
                  ))}
                  {result.data.length > 10 && (
                    <li className="text-sm text-green-600">
                      ... and {result.data.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 API Endpoints</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• <strong>GET</strong> /api/chatbot/specialties - Lấy danh sách chuyên khoa</li>
            <li>• <strong>GET</strong> /api/chatbot/doctors - Lấy danh sách bác sĩ</li>
            <li>• <strong>POST</strong> /api/chatbot/session - Tạo session đặt lịch</li>
            <li>• <strong>GET</strong> /api/chatbot/slots/[doctorId] - Lấy time slots</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
