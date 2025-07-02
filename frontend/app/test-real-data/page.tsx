"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestRealDataPage() {
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // Lấy danh sách chuyên khoa
  const fetchSpecialties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('specialty_id, specialty_name, specialty_code, description')
        .eq('is_active', true)
        .order('specialty_name');

      if (error) throw error;
      setSpecialties(data || []);
      console.log('Specialties:', data);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
    setLoading(false);
  };

  // Lấy danh sách bác sĩ
  const fetchDoctors = async (specialtyName?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('doctors')
        .select(`
          doctor_id,
          specialty,
          specializations,
          qualification,
          experience_years,
          consultation_fee,
          availability_status,
          status,
          profile_id,
          profiles!inner(id, full_name)
        `)
        .eq('status', 'active')
        .eq('availability_status', 'available');

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      
      // Filter by specialty if provided
      if (specialtyName) {
        filteredData = data?.filter(doctor => {
          const specialtyMatch = doctor.specialty && 
            doctor.specialty.toLowerCase().includes(specialtyName.toLowerCase());
          
          const specializationsMatch = doctor.specializations && 
            Array.isArray(doctor.specializations) &&
            doctor.specializations.some((spec: string) => 
              spec.toLowerCase().includes(specialtyName.toLowerCase())
            );
          
          return specialtyMatch || specializationsMatch;
        }) || [];
      }

      setDoctors(filteredData);
      console.log('Doctors:', filteredData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, []);

  const handleSpecialtySelect = (specialtyName: string) => {
    setSelectedSpecialty(specialtyName);
    fetchDoctors(specialtyName);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🔍 Test Dữ liệu Thực tế - Hospital Management
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Specialties */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              📋 Chuyên khoa ({specialties.length})
            </h2>
            
            <button
              onClick={fetchSpecialties}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang tải...' : 'Refresh Specialties'}
            </button>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {specialties.map((specialty) => (
                <div
                  key={specialty.specialty_id}
                  onClick={() => handleSpecialtySelect(specialty.specialty_name)}
                  className={`p-3 border rounded cursor-pointer hover:bg-blue-50 ${
                    selectedSpecialty === specialty.specialty_name ? 'bg-blue-100 border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="font-semibold text-gray-800">
                    {specialty.specialty_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {specialty.specialty_id} | Code: {specialty.specialty_code}
                  </div>
                  {specialty.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {specialty.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Doctors */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              👨‍⚕️ Bác sĩ ({doctors.length})
              {selectedSpecialty && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {selectedSpecialty}
                </span>
              )}
            </h2>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => fetchDoctors()}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'All Doctors'}
              </button>
              
              {selectedSpecialty && (
                <button
                  onClick={() => {
                    setSelectedSpecialty('');
                    fetchDoctors();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-800">
                      {doctor.profiles?.full_name || `BS. ${doctor.doctor_id}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doctor.doctor_id}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>Chuyên khoa:</strong> {doctor.specialty || 'N/A'}
                    </div>
                    
                    {doctor.specializations && Array.isArray(doctor.specializations) && doctor.specializations.length > 0 && (
                      <div>
                        <strong>Specializations:</strong> {doctor.specializations.join(', ')}
                      </div>
                    )}
                    
                    <div>
                      <strong>Trình độ:</strong> {doctor.qualification || 'N/A'}
                    </div>
                    
                    <div className="flex justify-between">
                      <span>
                        <strong>Kinh nghiệm:</strong> {doctor.experience_years || 0} năm
                      </span>
                      <span>
                        <strong>Phí khám:</strong> {doctor.consultation_fee ? `${doctor.consultation_fee.toLocaleString()}đ` : 'N/A'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>Trạng thái:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        doctor.availability_status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.availability_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">📊 Tổng kết</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{specialties.length}</div>
              <div className="text-blue-800">Chuyên khoa</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{doctors.length}</div>
              <div className="text-green-800">Bác sĩ {selectedSpecialty ? `(${selectedSpecialty})` : '(Tất cả)'}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {doctors.filter(d => d.consultation_fee).length}
              </div>
              <div className="text-purple-800">Bác sĩ có phí khám</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
