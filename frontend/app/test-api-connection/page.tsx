"use client"

import React, { useState } from 'react';

export default function TestApiConnectionPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testApiConnection = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_BOOKING_API || 'http://localhost:3016/api';
      console.log('Testing API URL:', apiUrl);

      const response = await fetch(`${apiUrl}/specialties`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  const testHealthCheck = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:3016/health');
      console.log('Health check status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Health check data:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Health Check Error:', err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🔧 Test API Connection
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Environment Info</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>NEXT_PUBLIC_CHATBOT_BOOKING_API:</strong> {process.env.NEXT_PUBLIC_CHATBOT_BOOKING_API || 'Not set'}</p>
            <p><strong>Fallback URL:</strong> http://localhost:3016/api</p>
            <p><strong>Current URL:</strong> {process.env.NEXT_PUBLIC_CHATBOT_BOOKING_API || 'http://localhost:3016/api'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Test Buttons</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={testHealthCheck}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Health Check'}
            </button>
            
            <button
              onClick={testApiConnection}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Specialties API'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Success</h3>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.data && Array.isArray(result.data) && (
              <div className="mt-4">
                <p className="font-semibold text-green-800">
                  Found {result.data.length} specialties:
                </p>
                <ul className="mt-2 space-y-1">
                  {result.data.slice(0, 5).map((item: any, index: number) => (
                    <li key={index} className="text-sm text-green-700">
                      • {item.name_vi || item.name} ({item.specialty_id})
                    </li>
                  ))}
                  {result.data.length > 5 && (
                    <li className="text-sm text-green-600">
                      ... and {result.data.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Troubleshooting</h3>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Make sure chatbot service is running on port 3016</li>
            <li>• Check browser console for CORS errors</li>
            <li>• Verify environment variables are loaded</li>
            <li>• Try refreshing the page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
