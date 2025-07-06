'use client';

import { useState } from 'react';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
  timestamp: Date;
}

export default function TestSystemPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentOrderCode, setCurrentOrderCode] = useState('');
  const [currentAppointmentId, setCurrentAppointmentId] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Sẵn sàng để test...');
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    patientName: 'Nguyễn Văn Test',
    patientPhone: '0901234567',
    patientEmail: 'test@example.com',
    doctorId: 'DOC-001',
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    appointmentTime: '10:00',
    symptoms: 'Đau đầu nhẹ, cần khám tổng quát'
  });

  const logResult = (testName: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, data?: any) => {
    const newResult: TestResult = {
      testName,
      status,
      message,
      data,
      timestamp: new Date()
    };
    setTestResults(prev => [...prev, newResult]);
  };

  const updateProgress = (percentage: number, text: string) => {
    setProgress(percentage);
    setProgressText(text);
  };

  const testHealthCheck = async () => {
    setIsLoading(true);
    updateProgress(10, 'Testing health check...');

    try {
      // Test simple endpoint first
      const testResponse = await fetch('/api/test-endpoints');
      const testResult = await testResponse.json();

      if (testResponse.ok && testResult.success) {
        logResult('Health Check', 'PASS', `Database: ${testResult.database}, Patients: ${testResult.patients_count}`);
        updateProgress(25, 'Health check completed ✅');
        return true;
      } else {
        throw new Error(testResult.message || 'Health check failed');
      }
    } catch (error: any) {
      logResult('Health Check', 'FAIL', error.message);
      updateProgress(25, 'Health check failed ❌');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testBooking = async () => {
    setIsLoading(true);
    updateProgress(40, 'Testing booking creation...');

    const bookingData = {
      test_type: 'booking',
      patient_name: formData.patientName,
      patient_phone: formData.patientPhone,
      patient_email: formData.patientEmail,
      doctor_id: formData.doctorId,
      appointment_date: formData.appointmentDate,
      start_time: formData.appointmentTime,
      symptoms: formData.symptoms,
      consultation_fee: 250000
    };

    try {
      const response = await fetch('/api/test-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCurrentOrderCode(result.data.order_code);
        setCurrentAppointmentId(result.data.appointment_id);

        logResult('Booking Creation', 'PASS', `Test appointment ${result.data.appointment_id} created successfully`, result.data);
        updateProgress(60, 'Booking creation completed ✅');
        return true;
      } else {
        throw new Error(result.message || 'Unknown booking error');
      }
    } catch (error: any) {
      logResult('Booking Creation', 'FAIL', error.message);
      updateProgress(60, 'Booking creation failed ❌');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async () => {
    setIsLoading(true);
    updateProgress(75, 'Testing webhook processing...');

    if (!currentOrderCode) {
      logResult('Webhook Processing', 'FAIL', 'No order code available. Please run booking test first.');
      setIsLoading(false);
      return false;
    }

    const webhookPayload = {
      test_type: 'webhook',
      code: '00',
      desc: 'success',
      data: {
        orderCode: currentOrderCode,
        amount: 250000,
        description: 'Test payment for fixed system',
        reference: `TEST-TXN-${Date.now()}`,
        transactionDateTime: new Date().toISOString()
      }
    };

    try {
      const response = await fetch('/api/test-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        logResult('Webhook Processing', 'PASS', 'Test webhook processed successfully', result.data);
        updateProgress(90, 'Webhook processing completed ✅');
        return true;
      } else {
        throw new Error(result.message || 'Unknown webhook error');
      }
    } catch (error: any) {
      logResult('Webhook Processing', 'FAIL', error.message);
      updateProgress(90, 'Webhook processing failed ❌');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testCompleteFlow = async () => {
    setIsLoading(true);
    updateProgress(95, 'Testing complete flow...');

    try {
      // Clear previous results
      setTestResults([]);
      
      // Step 1: Health Check
      const healthOk = await testHealthCheck();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Create Booking
      const bookingOk = await testBooking();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Process Webhook
      const webhookOk = await testWebhook();

      if (healthOk && bookingOk && webhookOk) {
        logResult('Complete Flow', 'PASS', 'All systems working correctly');
        updateProgress(100, 'Complete flow test passed! 🎉');
      } else {
        throw new Error('One or more tests failed');
      }
    } catch (error: any) {
      logResult('Complete Flow', 'FAIL', error.message);
      updateProgress(100, 'Complete flow test failed ❌');
    } finally {
      setIsLoading(false);
    }
  };

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = testResults.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          🧪 Test Fixed Hospital Management System
        </h1>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-600">{progressText}</p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={testHealthCheck}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            🔍 Health Check
          </button>
          <button
            onClick={testBooking}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            📅 Test Booking
          </button>
          <button
            onClick={testWebhook}
            disabled={isLoading || !currentOrderCode}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            💳 Test Webhook
          </button>
          <button
            onClick={testCompleteFlow}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            🔄 Complete Flow
          </button>
        </div>

        {/* Form Data */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">📝 Test Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên bệnh nhân</label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.patientPhone}
                onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.patientEmail}
                onChange={(e) => setFormData({...formData, patientEmail: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
              <input
                type="text"
                value={formData.doctorId}
                onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khám</label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ khám</label>
              <input
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng</label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">📊 Test Results</h3>
            <div className="mb-4">
              <p className="text-lg">
                📈 Total: {total} | ✅ Passed: {passed} | ❌ Failed: {failed} | 
                📊 Success Rate: {total > 0 ? ((passed/total)*100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    result.status === 'PASS' 
                      ? 'bg-green-100 border-green-300' 
                      : 'bg-red-100 border-red-300'
                  } border`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {result.status === 'PASS' ? '✅' : '❌'} {result.testName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{result.message}</p>
                  {result.data && (
                    <pre className="mt-2 text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Test Data */}
        {(currentOrderCode || currentAppointmentId) && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">🔗 Current Test Session</h3>
            {currentAppointmentId && (
              <p><strong>Appointment ID:</strong> {currentAppointmentId}</p>
            )}
            {currentOrderCode && (
              <p><strong>Order Code:</strong> {currentOrderCode}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
