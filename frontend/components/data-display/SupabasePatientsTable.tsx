'use client';

import React from 'react';
import { Edit, Trash2, Phone, Mail, Calendar, Heart } from 'lucide-react';
import { DataTable, Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SupabasePatient } from '@/lib/types/supabase';

interface SupabasePatientsTableProps {
  patients: SupabasePatient[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (patient: SupabasePatient) => void;
  onDelete: (patientId: string) => void;
  onRowClick?: (patient: SupabasePatient) => void;
}

// Helper function to calculate age
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

export function SupabasePatientsTable({
  patients,
  isLoading = false,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  onRowClick,
}: SupabasePatientsTableProps) {
  // Define columns for the patients table
  const columns: Column<SupabasePatient>[] = [
    {
      key: 'patient_info',
      header: 'Bệnh nhân',
      accessor: (patient) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage 
              src="/placeholder.svg" 
              alt={patient.full_name} 
            />
            <AvatarFallback>
              {patient.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'BN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
            <div className="text-xs text-gray-500">{patient.patient_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'age_gender',
      header: 'Tuổi/Giới tính',
      accessor: (patient) => (
        <div className="flex flex-col space-y-1">
          <div className="text-sm font-medium">
            {calculateAge(patient.dateofbirth)} tuổi
          </div>
          <StatusBadge 
            status={patient.gender} 
            type="gender"
            variant={patient.gender === 'Nam' ? 'default' : patient.gender === 'Nữ' ? 'secondary' : 'outline'}
          />
        </div>
      ),
    },
    {
      key: 'blood_type',
      header: 'Nhóm máu',
      accessor: (patient) => (
        <Badge variant="outline" className="text-xs">
          <Heart className="h-3 w-3 mr-1" />
          {patient.blood_type}
        </Badge>
      ),
      responsive: 'md',
    },
    {
      key: 'registration_date',
      header: 'Ngày đăng ký',
      accessor: (patient) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(patient.registration_date)}
        </div>
      ),
      responsive: 'lg',
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      accessor: (patient) => (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Phone className="h-3 w-3 mr-1" />
            {patient.phone_number}
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <Mail className="h-3 w-3 mr-1" />
            {patient.email}
          </div>
        </div>
      ),
      responsive: 'xl',
    },
    {
      key: 'insurance',
      header: 'Bảo hiểm',
      accessor: (patient) => (
        <Badge variant="secondary" className="text-xs">
          {patient.insurance_info}
        </Badge>
      ),
      responsive: 'lg',
    },
    {
      key: 'medical_info',
      header: 'Thông tin y tế',
      accessor: (patient) => (
        <div className="text-xs text-gray-600 max-w-32">
          {patient.allergies !== 'Không' && (
            <div className="mb-1">
              <span className="font-medium">Dị ứng:</span> {patient.allergies}
            </div>
          )}
          {patient.chronic_diseases !== 'Không' && (
            <div>
              <span className="font-medium">Bệnh mãn tính:</span> {patient.chronic_diseases}
            </div>
          )}
          {patient.allergies === 'Không' && patient.chronic_diseases === 'Không' && (
            <span className="text-green-600">Khỏe mạnh</span>
          )}
        </div>
      ),
      responsive: 'xl',
    },
  ];

  // Define actions for each row
  const actions = [
    {
      label: '',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
    {
      label: '',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (patient: SupabasePatient) => onDelete(patient.patient_id),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <DataTable
      data={patients}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      loadingMessage="Đang tải danh sách bệnh nhân..."
      emptyTitle="Không tìm thấy bệnh nhân"
      emptyDescription="Hiện tại chưa có bệnh nhân nào trong hệ thống."
      keyExtractor={(patient) => patient.patient_id}
      onRowClick={onRowClick}
      pagination={{
        currentPage,
        totalPages,
        itemsPerPage,
        totalItems,
        onPageChange,
        showInfo: true,
        showControls: true,
      }}
      className="w-full"
    />
  );
}

export default SupabasePatientsTable;
