'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestDatabasePage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      setLoading(true);

      // Get recent appointments (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          status,
          reason,
          consultation_fee,
          payment_status,
          created_by,
          created_at,
          notes
        `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (!appointmentError) {
        setAppointments(appointmentData || []);
      }

      // Get recent patients
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (!patientError) {
        setPatients(patientData || []);
      }

      // Get recent payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (!paymentError) {
        setPayments(paymentData || []);
      }

    } catch (error) {
      console.error('Error checking database:', error);
    } finally {
      setLoading(false);
    }
  };

  const chatbotAppointments = appointments.filter(apt => apt.created_by === 'CHATBOT_AI');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Checking database...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">🧪 Database Test Results</h1>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">📅 Appointments</h3>
            <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">👤 Patients</h3>
            <p className="text-3xl font-bold text-green-600">{patients.length}</p>
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">💳 Payments</h3>
            <p className="text-3xl font-bold text-purple-600">{payments.length}</p>
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </div>
        </div>

        {/* Chatbot Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🤖 Chatbot Appointment Status</h2>
          
          {chatbotAppointments.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✅ GOOD: Chatbot IS creating appointment records!</p>
              <p className="text-green-600">Found {chatbotAppointments.length} chatbot appointments</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">❌ BAD: Chatbot is NOT creating appointment records!</p>
              <p className="text-red-600">Admin/doctors cannot see patient bookings</p>
            </div>
          )}
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📅 Recent Appointments</h2>
          
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments found in the last 24 hours</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt, index) => (
                <div key={apt.appointment_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{apt.appointment_id}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      apt.created_by === 'CHATBOT_AI' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.created_by}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Patient ID:</strong> {apt.patient_id}</p>
                      <p><strong>Doctor ID:</strong> {apt.doctor_id}</p>
                      <p><strong>Date:</strong> {apt.appointment_date} at {apt.start_time}</p>
                    </div>
                    <div>
                      <p><strong>Fee:</strong> {apt.consultation_fee?.toLocaleString('vi-VN') || 'N/A'} VNĐ</p>
                      <p><strong>Status:</strong> {apt.status} | {apt.payment_status}</p>
                      <p><strong>Reason:</strong> {apt.reason}</p>
                    </div>
                  </div>
                  
                  {apt.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Notes:</strong> {apt.notes}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(apt.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">👤 Recent Patients</h2>
          
          {patients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No patients found in the last 24 hours</p>
          ) : (
            <div className="space-y-4">
              {patients.map((patient, index) => (
                <div key={patient.patient_id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Patient ID:</strong> {patient.patient_id}</p>
                      <p><strong>Gender:</strong> {patient.gender}</p>
                      <p><strong>Status:</strong> {patient.status}</p>
                    </div>
                    <div>
                      <p><strong>Created by:</strong> {patient.created_by || 'N/A'}</p>
                      <p><strong>Created:</strong> {new Date(patient.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={checkDatabase}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">📋 Hướng dẫn xem dữ liệu admin/doctor</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Cách 1: Supabase Dashboard (Tốt nhất)</strong></p>
            <p>• Truy cập: <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">https://supabase.com/dashboard</a></p>
            <p>• Project: cjnmppmblfcibhkahljh</p>
            <p>• Table Editor → appointments → Filter: created_by = 'CHATBOT_AI'</p>
            
            <p className="mt-4"><strong>Cách 2: Admin Dashboard (Nếu auth hoạt động)</strong></p>
            <p>• Truy cập: <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000/admin/appointments</code></p>
            <p>• Cần đăng nhập với tài khoản admin</p>
            
            <p className="mt-4"><strong>Dữ liệu chatbot booking:</strong></p>
            <p>• Appointment ID: CHAT-xxxxxxxx</p>
            <p>• Patient ID: PAT-CHAT-xxxxxx</p>
            <p>• Created by: CHATBOT_AI</p>
            <p>• Notes: "Đặt lịch qua AI Chatbot"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
