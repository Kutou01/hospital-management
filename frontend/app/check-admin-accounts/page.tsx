'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CheckAdminAccountsPage() {
  const [profiles, setProfiles] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccounts();
  }, []);

  const checkAccounts = async () => {
    try {
      setLoading(true);

      // Check profiles table for admin/doctor accounts
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'doctor'])
        .order('created_at', { ascending: false });

      if (!profileError) {
        setProfiles(profileData || []);
      }

      // Check doctors table
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (!doctorError) {
        setDoctors(doctorData || []);
      }

    } catch (error) {
      console.error('Error checking accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestAdmin = async () => {
    try {
      // Create test admin profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: 'admin-test-001',
          email: 'admin@hospital.com',
          full_name: 'Admin Test',
          role: 'admin',
          phone_number: '0123456789',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating admin:', error);
        alert('Lỗi tạo admin: ' + error.message);
      } else {
        alert('Tạo admin thành công! Email: admin@hospital.com');
        checkAccounts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi: ' + error.message);
    }
  };

  const createTestDoctor = async () => {
    try {
      // Create test doctor profile first
      const profileId = 'doctor-test-001';
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          email: 'doctor@hospital.com',
          full_name: 'BS. Nguyễn Văn Test',
          role: 'doctor',
          phone_number: '0987654321',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating doctor profile:', profileError);
        alert('Lỗi tạo profile doctor: ' + profileError.message);
        return;
      }

      // Create doctor record
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          doctor_id: 'DOC-TEST-001',
          profile_id: profileId,
          doctor_name: 'BS. Nguyễn Văn Test',
          specialty: 'Nội Tổng Hợp',
          specialty_id: 'SPEC042',
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (doctorError) {
        console.error('Error creating doctor:', doctorError);
        alert('Lỗi tạo doctor: ' + doctorError.message);
      } else {
        alert('Tạo doctor thành công! Email: doctor@hospital.com');
        checkAccounts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Checking admin accounts...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">🔐 Admin/Doctor Accounts</h1>

        {/* Admin Profiles */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">👨‍💼 Admin Profiles ({profiles.length})</h2>
            <button
              onClick={createTestAdmin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ➕ Create Test Admin
            </button>
          </div>
          
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>❌ No admin accounts found</p>
              <p className="text-sm">Click "Create Test Admin" to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile, index) => (
                <div key={profile.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Name:</strong> {profile.full_name}</p>
                      <p><strong>Email:</strong> {profile.email}</p>
                      <p><strong>Role:</strong> {profile.role}</p>
                    </div>
                    <div>
                      <p><strong>Phone:</strong> {profile.phone_number || 'N/A'}</p>
                      <p><strong>ID:</strong> {profile.id}</p>
                      <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Records */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">👨‍⚕️ Doctor Records ({doctors.length})</h2>
            <button
              onClick={createTestDoctor}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ➕ Create Test Doctor
            </button>
          </div>
          
          {doctors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>❌ No doctor records found</p>
              <p className="text-sm">Click "Create Test Doctor" to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor, index) => (
                <div key={doctor.doctor_id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Name:</strong> {doctor.doctor_name}</p>
                      <p><strong>Specialty:</strong> {doctor.specialty}</p>
                      <p><strong>Status:</strong> {doctor.status}</p>
                    </div>
                    <div>
                      <p><strong>Doctor ID:</strong> {doctor.doctor_id}</p>
                      <p><strong>Profile ID:</strong> {doctor.profile_id}</p>
                      <p><strong>Created:</strong> {new Date(doctor.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Hướng dẫn đăng nhập</h3>
          <div className="space-y-2 text-sm">
            <p><strong>1.</strong> Tạo tài khoản admin/doctor bằng nút ở trên</p>
            <p><strong>2.</strong> Truy cập: <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000/auth/login</code></p>
            <p><strong>3.</strong> Đăng nhập với:</p>
            <ul className="ml-4 space-y-1">
              <li>• <strong>Admin:</strong> admin@hospital.com</li>
              <li>• <strong>Doctor:</strong> doctor@hospital.com</li>
            </ul>
            <p><strong>4.</strong> Sau khi đăng nhập, truy cập:</p>
            <ul className="ml-4 space-y-1">
              <li>• <strong>Admin Dashboard:</strong> /admin/dashboard</li>
              <li>• <strong>Admin Appointments:</strong> /admin/appointments</li>
              <li>• <strong>Doctor Dashboard:</strong> /doctors/dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
