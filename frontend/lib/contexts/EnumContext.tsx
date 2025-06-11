'use client';

// =====================================================
// ENUM CONTEXT - VIETNAMESE ONLY VERSION
// =====================================================
// Phiên bản đơn giản chỉ sử dụng tiếng Việt

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  BaseEnum,
  Specialty,
  DepartmentEnum,
  RoomType,
  Diagnosis,
  Medication,
  StatusValue,
  PaymentMethod,
  EnumOption,
  getEnumDisplayName,
  enumToOption
} from '@/lib/types/enum.types';
import { supabaseClient } from '@/lib/supabase-client';

// Context interface
interface EnumContextType {
  loading: boolean;
  error: string | null;

  // Data getters
  specialties: Specialty[];
  departments: DepartmentEnum[];
  roomTypes: RoomType[];
  diagnoses: Diagnosis[];
  medications: Medication[];
  statusValues: StatusValue[];
  paymentMethods: PaymentMethod[];

  // Helper functions
  getSpecialtyOptions: () => EnumOption[];
  getDepartmentOptions: () => EnumOption[];
  getRoomTypeOptions: () => EnumOption[];
  getDiagnosisOptions: () => EnumOption[];
  getMedicationOptions: () => EnumOption[];
  getStatusOptions: (appliesTo?: string) => EnumOption[];
  getPaymentMethodOptions: () => EnumOption[];

  // Utility functions
  getEnumDisplayName: (enumItem: BaseEnum) => string;
  getDefaultEnum: (enumList: BaseEnum[]) => BaseEnum | null;
  refreshData: () => Promise<void>;
}

// Create context
const EnumContext = createContext<EnumContextType | undefined>(undefined);

// Provider props
interface EnumProviderProps {
  children: ReactNode;
}

// Provider component
export function EnumProvider({ children }: EnumProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for each enum table
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [departments, setDepartments] = useState<DepartmentEnum[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [statusValues, setStatusValues] = useState<StatusValue[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Fetch data from Supabase
  const fetchEnumData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting to fetch enum data...');

      // Fetch all enum tables in parallel
      const [
        specialtiesRes,
        departmentsRes,
        roomTypesRes,
        diagnosesRes,
        medicationsRes,
        statusValuesRes,
        paymentMethodsRes
      ] = await Promise.all([
        supabaseClient.from('specialties').select('*').eq('is_active', true).order('specialty_name'),
        supabaseClient.from('departments').select('*').eq('is_active', true).order('department_name'),
        supabaseClient.from('room_types').select('*').eq('is_active', true).order('type_name'),
        supabaseClient.from('diagnosis').select('*').eq('is_active', true).order('created_at'),
        supabaseClient.from('medications').select('*').eq('is_active', true).order('created_at'),
        supabaseClient.from('status_values').select('*').eq('is_active', true).order('created_at'),
        supabaseClient.from('payment_methods').select('*').eq('is_active', true).order('method_name')
      ]);

      console.log('📊 Enum data fetch results:', {
        specialties: { data: specialtiesRes.data, error: specialtiesRes.error },
        departments: { data: departmentsRes.data, error: departmentsRes.error },
        roomTypes: { data: roomTypesRes.data, error: roomTypesRes.error },
        diagnoses: { data: diagnosesRes.data, error: diagnosesRes.error },
        medications: { data: medicationsRes.data, error: medicationsRes.error },
        statusValues: { data: statusValuesRes.data, error: statusValuesRes.error },
        paymentMethods: { data: paymentMethodsRes.data, error: paymentMethodsRes.error }
      });

      // Check for errors
      const errors = [
        specialtiesRes.error,
        departmentsRes.error,
        roomTypesRes.error,
        diagnosesRes.error,
        medicationsRes.error,
        statusValuesRes.error,
        paymentMethodsRes.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('❌ Enum data fetch errors:', errors);
        throw new Error(`Failed to fetch enum data: ${errors.map(e => e?.message).join(', ')}`);
      }

      // Set data
      setSpecialties(specialtiesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setRoomTypes(roomTypesRes.data || []);
      setDiagnoses(diagnosesRes.data || []);
      setMedications(medicationsRes.data || []);
      setStatusValues(statusValuesRes.data || []);
      setPaymentMethods(paymentMethodsRes.data || []);



    } catch (err) {
      console.error('❌ Error fetching enum data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enum data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchEnumData();
  }, []);

  // Helper functions to convert database records to enum format
  const convertSpecialtyToEnum = (specialty: any): EnumOption => ({
    value: specialty.specialty_id,
    label: specialty.specialty_name,
    description: specialty.description,
    color: '#e74c3c', // Red for specialties
    icon: 'stethoscope',
    department_id: specialty.department_id, // Include department_id for mapping
    department_name: specialty.department_name // Include department_name if available
  });

  const convertDepartmentToEnum = (dept: any): EnumOption => ({
    value: dept.department_id,
    label: dept.department_name, // Changed from dept.name to dept.department_name
    description: dept.description,
    color: '#3498db', // Blue for departments
    icon: 'building-2'
  });

  const convertRoomTypeToEnum = (roomType: any): EnumOption => ({
    value: roomType.room_type_id,
    label: roomType.type_name,
    description: roomType.description,
    color: '#9b59b6', // Purple for room types
    icon: 'bed'
  });

  const convertPaymentMethodToEnum = (method: any): EnumOption => ({
    value: method.payment_method_id,
    label: method.method_name,
    description: method.description,
    color: '#27ae60', // Green for payment methods
    icon: 'credit-card'
  });

  // Generic converter for simple enum tables (diagnosis, medications, status_values)
  const convertGenericToEnum = (item: any, idField: string, nameField: string, color: string, icon: string): EnumOption => ({
    value: item[idField],
    label: item[nameField],
    description: item.description || '',
    color,
    icon
  });

  // Helper functions to convert to options
  const getSpecialtyOptions = (): EnumOption[] =>
    specialties.map(item => convertSpecialtyToEnum(item));

  const getDepartmentOptions = (): EnumOption[] =>
    departments.map(item => convertDepartmentToEnum(item));

  const getRoomTypeOptions = (): EnumOption[] =>
    roomTypes.map(item => convertRoomTypeToEnum(item));

  const getDiagnosisOptions = (): EnumOption[] =>
    diagnoses.map(item => convertGenericToEnum(item, 'diagnosis_id', 'diagnosis_name', '#f39c12', 'clipboard-list'));

  const getMedicationOptions = (): EnumOption[] =>
    medications.map(item => convertGenericToEnum(item, 'medication_id', 'medication_name', '#1abc9c', 'pill'));

  const getStatusOptions = (appliesTo?: string): EnumOption[] => {
    let filtered = statusValues;
    if (appliesTo) {
      filtered = statusValues.filter(item =>
        !item.applies_to || item.applies_to === appliesTo
      );
    }
    return filtered.map(item => convertGenericToEnum(item, 'status_id', 'status_name', '#95a5a6', 'info'));
  };

  const getPaymentMethodOptions = (): EnumOption[] =>
    paymentMethods.map(item => convertPaymentMethodToEnum(item));

  // Utility functions
  const getEnumDisplayNameHelper = (enumItem: BaseEnum): string =>
    getEnumDisplayName(enumItem);

  const getDefaultEnum = (enumList: BaseEnum[]): BaseEnum | null => {
    // For now, return the first item or implement default logic
    return enumList.length > 0 ? enumList[0] : null;
  };

  const refreshData = async (): Promise<void> => {
    await fetchEnumData();
  };

  // Context value
  const value: EnumContextType = {
    loading,
    error,

    // Data
    specialties,
    departments,
    roomTypes,
    diagnoses,
    medications,
    statusValues,
    paymentMethods,

    // Option getters
    getSpecialtyOptions,
    getDepartmentOptions,
    getRoomTypeOptions,
    getDiagnosisOptions,
    getMedicationOptions,
    getStatusOptions,
    getPaymentMethodOptions,

    // Utilities
    getEnumDisplayName: getEnumDisplayNameHelper,
    getDefaultEnum,
    refreshData
  };

  return (
    <EnumContext.Provider value={value}>
      {children}
    </EnumContext.Provider>
  );
}

// Hook to use enum context
export function useEnumContext(): EnumContextType {
  const context = useContext(EnumContext);
  if (context === undefined) {
    throw new Error('useEnumContext must be used within an EnumProvider');
  }
  return context;
}

// Specific hooks for each enum type
export function useSpecialties(): Specialty[] {
  const { specialties } = useEnumContext();
  return specialties;
}

export function useDepartments(): DepartmentEnum[] {
  const { departments } = useEnumContext();
  return departments;
}

export function useRoomTypes(): RoomType[] {
  const { roomTypes } = useEnumContext();
  return roomTypes;
}

export function useDiagnoses(): Diagnosis[] {
  const { diagnoses } = useEnumContext();
  return diagnoses;
}

export function useMedications(): Medication[] {
  const { medications } = useEnumContext();
  return medications;
}

export function useStatusValues(): StatusValue[] {
  const { statusValues } = useEnumContext();
  return statusValues;
}

export function usePaymentMethods(): PaymentMethod[] {
  const { paymentMethods } = useEnumContext();
  return paymentMethods;
}

// Option hooks
export function useSpecialtyOptions(): EnumOption[] {
  const { getSpecialtyOptions, specialties, loading, error } = useEnumContext();
  const options = getSpecialtyOptions();



  return options;
}

export function useDepartmentOptions(): EnumOption[] {
  const { getDepartmentOptions } = useEnumContext();
  return getDepartmentOptions();
}

export function useRoomTypeOptions(): EnumOption[] {
  const { getRoomTypeOptions } = useEnumContext();
  return getRoomTypeOptions();
}

// Legacy hooks for compatibility
export function useGenderEnums(): EnumOption[] {
  // Return static gender options since this is not in dynamic tables
  return [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' }
  ];
}

export function useDoctorStatusEnums(): EnumOption[] {
  return useStatusOptions('bac_si');
}

export function useEnumDisplayName() {
  const { getEnumDisplayName } = useEnumContext();
  return getEnumDisplayName;
}

export function useDefaultEnum() {
  const { getDefaultEnum } = useEnumContext();
  return getDefaultEnum;
}
