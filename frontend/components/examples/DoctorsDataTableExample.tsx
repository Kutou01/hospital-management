'use client';

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/data-display/DataTable';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// Example Doctor type (should match your actual Doctor type)
interface Doctor {
  doctor_id: string;
  full_name: string;
  specialty: string;
  qualification: string;
  department_id: string;
  license_number: string;
  gender: string;
  phone_number: string;
  email: string;
  photo_url?: string;
  departments?: {
    department_name: string;
  };
}

interface DoctorsDataTableExampleProps {
  doctors: Doctor[];
  departments: Array<{ department_id: string; department_name: string }>;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
}

export function DoctorsDataTableExample({
  doctors,
  departments,
  isLoading = false,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
}: DoctorsDataTableExampleProps) {
  // Define columns for the DataTable
  const columns: Column<Doctor>[] = [
    {
      key: 'doctor',
      header: 'Doctor',
      accessor: (doctor) => (
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src={doctor.photo_url || "/placeholder.svg"} alt={doctor.full_name} />
            <AvatarFallback>{doctor.full_name?.charAt(0) || 'D'}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium text-gray-900">{doctor.full_name}</div>
        </div>
      ),
    },
    {
      key: 'doctor_id',
      header: 'ID',
      accessor: 'doctor_id',
      className: 'text-sm text-gray-500',
    },
    {
      key: 'specialty',
      header: 'Specialty',
      accessor: 'specialty',
      className: 'text-sm text-gray-500',
    },
    {
      key: 'qualification',
      header: 'Qualification',
      accessor: 'qualification',
      className: 'text-sm text-gray-500',
      responsive: 'md',
    },
    {
      key: 'department',
      header: 'Department',
      accessor: (doctor) => (
        doctor.departments?.department_name ||
        departments.find(dept => dept.department_id === doctor.department_id)?.department_name ||
        'No Department'
      ),
      className: 'text-sm text-gray-500',
      responsive: 'md',
    },
    {
      key: 'gender',
      header: 'Gender',
      accessor: (doctor) => <StatusBadge status={doctor.gender} type="gender" />,
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
      onClick: (doctor: Doctor) => onDelete(doctor.doctor_id),
      variant: 'ghost' as const,
      size: 'sm' as const,
    },
  ];

  return (
    <DataTable
      data={doctors}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      loadingMessage="Loading doctors..."
      emptyTitle="No doctors found"
      emptyDescription="There are no doctors to display."
      emptyAction={
        <Button>
          Add New Doctor
        </Button>
      }
      keyExtractor={(doctor) => doctor.doctor_id}
      pagination={{
        currentPage,
        totalPages,
        itemsPerPage,
        totalItems,
        onPageChange,
        showInfo: true,
        showControls: true,
      }}
    />
  );
}

export default DoctorsDataTableExample;
