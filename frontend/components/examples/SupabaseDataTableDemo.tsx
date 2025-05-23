'use client';

import React, { useState, useEffect } from 'react';
import { SupabaseSearchableTable } from '@/components/data-display/SupabaseSearchableTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  SupabaseDoctor, 
  SupabasePatient, 
  SupabaseAppointment, 
  SupabaseRoom,
  SupabaseDepartment 
} from '@/lib/types/supabase';

// Mock data based on actual Supabase structure
const mockDoctors: SupabaseDoctor[] = [
  {
    doctor_id: "DOC000001",
    full_name: "Nguyễn Văn A",
    specialty: "Nội tổng hợp",
    qualification: "Tiến sĩ",
    schedule: "Thứ 2-6",
    department_id: "DEP000001",
    license_number: "LN000001",
    gender: "Nam",
    photo_url: "http://example.com/doc1.jpg",
    phone_number: "0912345671",
    email: "doc1@example.com",
    department_name: "Khoa Nội tổng hợp"
  },
  {
    doctor_id: "DOC000002",
    full_name: "Trần Thị B",
    specialty: "Ngoại tổng hợp",
    qualification: "Thạc sĩ",
    schedule: "Thứ 3-7",
    department_id: "DEP000002",
    license_number: "LN000002",
    gender: "Nữ",
    photo_url: "http://example.com/doc2.jpg",
    phone_number: "0912345672",
    email: "doc2@example.com",
    department_name: "Khoa Ngoại tổng hợp"
  },
];

const mockPatients: SupabasePatient[] = [
  {
    patient_id: "PAT000001",
    full_name: "Nguyễn Văn X",
    dateofbirth: "1950-01-01",
    registration_date: "2023-01-01",
    phone_number: "0912345001",
    email: "pat1@example.com",
    blood_type: "A",
    gender: "Nam",
    address: "123 Đường A, TP.HCM",
    allergies: "Không",
    chronic_diseases: "Không",
    insurance_info: "BHXH"
  },
  {
    patient_id: "PAT000002",
    full_name: "Trần Thị Y",
    dateofbirth: "1960-02-02",
    registration_date: "2023-02-01",
    phone_number: "0912345002",
    email: "pat2@example.com",
    blood_type: "B",
    gender: "Nữ",
    address: "456 Đường B, TP.HCM",
    allergies: "Phấn hoa",
    chronic_diseases: "Tiểu đường",
    insurance_info: "BHYT"
  },
];

const mockAppointments: SupabaseAppointment[] = [
  {
    appointment_id: "APT000001",
    patient_id: "PAT000001",
    doctor_id: "DOC000001",
    appointment_date: "2025-05-21",
    appointment_time: "09:00:00",
    treatment_description: "Khám định kỳ",
    status: "Đã xác nhận",
    patient_name: "Nguyễn Văn X",
    doctor_name: "Nguyễn Văn A"
  },
  {
    appointment_id: "APT000002",
    patient_id: "PAT000002",
    doctor_id: "DOC000002",
    appointment_date: "2025-05-22",
    appointment_time: "10:00:00",
    treatment_description: "Phẫu thuật",
    status: "Đã xác nhận",
    patient_name: "Trần Thị Y",
    doctor_name: "Trần Thị B"
  },
];

const mockRooms: SupabaseRoom[] = [
  {
    room_id: "ROOM001",
    room_number: "101",
    department_id: "DEP000001",
    room_type: "Phòng khám",
    capacity: 2,
    status: "Trống",
    department_name: "Khoa Nội tổng hợp"
  },
  {
    room_id: "ROOM002",
    room_number: "102",
    department_id: "DEP000002",
    room_type: "Phòng mổ",
    capacity: 5,
    status: "Đang sử dụng",
    department_name: "Khoa Ngoại tổng hợp"
  },
];

const mockDepartments: SupabaseDepartment[] = [
  { department_id: "DEP000001", department_name: "Khoa Nội tổng hợp" },
  { department_id: "DEP000002", department_name: "Khoa Ngoại tổng hợp" },
  { department_id: "DEP000003", department_name: "Khoa Phụ sản" },
  { department_id: "DEP000004", department_name: "Khoa Nhi" },
];

export function SupabaseDataTableDemo() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = (type: string) => {
    alert(`Thêm ${type} mới`);
  };

  const handleEdit = (item: any, type: string) => {
    alert(`Chỉnh sửa ${type}: ${item.full_name || item.appointment_id || item.room_number}`);
  };

  const handleDelete = (id: string, type: string) => {
    alert(`Xóa ${type}: ${id}`);
  };

  const handleRowClick = (item: any, type: string) => {
    console.log(`Clicked ${type}:`, item);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supabase DataTable Demo</h1>
          <p className="text-gray-600 mt-2">
            Demonstration of DataTable components with real Supabase data structure
          </p>
        </div>
        <Button onClick={simulateLoading} variant="outline">
          Simulate Loading
        </Button>
      </div>

      <Tabs defaultValue="doctors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="doctors">Bác sĩ</TabsTrigger>
          <TabsTrigger value="patients">Bệnh nhân</TabsTrigger>
          <TabsTrigger value="appointments">Cuộc hẹn</TabsTrigger>
          <TabsTrigger value="rooms">Phòng</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="space-y-4">
          <SupabaseSearchableTable
            type="doctors"
            data={mockDoctors}
            departments={mockDepartments}
            title="Quản lý Bác sĩ"
            description="Danh sách tất cả bác sĩ trong hệ thống"
            isLoading={isLoading}
            onAdd={() => handleAdd('bác sĩ')}
            addButtonLabel="Thêm Bác sĩ"
            onEdit={(doctor) => handleEdit(doctor, 'bác sĩ')}
            onDelete={(id) => handleDelete(id, 'bác sĩ')}
            onRowClick={(doctor) => handleRowClick(doctor, 'bác sĩ')}
            searchPlaceholder="Tìm kiếm bác sĩ..."
            itemsPerPage={5}
          />
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <SupabaseSearchableTable
            type="patients"
            data={mockPatients}
            title="Quản lý Bệnh nhân"
            description="Danh sách tất cả bệnh nhân trong hệ thống"
            isLoading={isLoading}
            onAdd={() => handleAdd('bệnh nhân')}
            addButtonLabel="Thêm Bệnh nhân"
            onEdit={(patient) => handleEdit(patient, 'bệnh nhân')}
            onDelete={(id) => handleDelete(id, 'bệnh nhân')}
            onRowClick={(patient) => handleRowClick(patient, 'bệnh nhân')}
            searchPlaceholder="Tìm kiếm bệnh nhân..."
            itemsPerPage={5}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <SupabaseSearchableTable
            type="appointments"
            data={mockAppointments}
            title="Quản lý Cuộc hẹn"
            description="Danh sách tất cả cuộc hẹn trong hệ thống"
            isLoading={isLoading}
            onAdd={() => handleAdd('cuộc hẹn')}
            addButtonLabel="Thêm Cuộc hẹn"
            onEdit={(appointment) => handleEdit(appointment, 'cuộc hẹn')}
            onDelete={(id) => handleDelete(id, 'cuộc hẹn')}
            onRowClick={(appointment) => handleRowClick(appointment, 'cuộc hẹn')}
            searchPlaceholder="Tìm kiếm cuộc hẹn..."
            itemsPerPage={5}
          />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <SupabaseSearchableTable
            type="rooms"
            data={mockRooms}
            departments={mockDepartments}
            title="Quản lý Phòng"
            description="Danh sách tất cả phòng trong hệ thống"
            isLoading={isLoading}
            onAdd={() => handleAdd('phòng')}
            addButtonLabel="Thêm Phòng"
            onEdit={(room) => handleEdit(room, 'phòng')}
            onDelete={(id) => handleDelete(id, 'phòng')}
            onRowClick={(room) => handleRowClick(room, 'phòng')}
            searchPlaceholder="Tìm kiếm phòng..."
            itemsPerPage={5}
          />
        </TabsContent>
      </Tabs>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tính năng chính:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Tìm kiếm theo nhiều trường dữ liệu</li>
              <li>Lọc theo trạng thái và khoa</li>
              <li>Phân trang tự động</li>
              <li>Responsive design</li>
              <li>Loading states</li>
              <li>Actions cho từng hàng</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Cách sử dụng trong code:</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { SupabaseSearchableTable } from '@/components';

<SupabaseSearchableTable
  type="doctors"
  data={doctors}
  departments={departments}
  title="Quản lý Bác sĩ"
  onAdd={() => setShowAddDialog(true)}
  onEdit={handleEdit}
  onDelete={handleDelete}
  searchPlaceholder="Tìm kiếm bác sĩ..."
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupabaseDataTableDemo;
