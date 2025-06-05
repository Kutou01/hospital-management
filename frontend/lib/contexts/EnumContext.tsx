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
        supabaseClient.from('specialties').select('*').eq('is_active', true).order('sort_order'),
        supabaseClient.from('departments').select('*').eq('is_active', true).order('name'),
        supabaseClient.from('room_types').select('*').eq('is_active', true).order('sort_order'),
        supabaseClient.from('diagnosis').select('*').eq('is_active', true).order('sort_order'),
        supabaseClient.from('medications').select('*').eq('is_active', true).order('sort_order'),
        supabaseClient.from('status_values').select('*').eq('is_active', true).order('sort_order'),
        supabaseClient.from('payment_methods').select('*').eq('is_active', true).order('sort_order')
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

  // Helper function to convert departments to enum format
  // Note: departments table has different structure than enum tables
  const convertDepartmentToEnum = (dept: any): EnumOption => ({
    value: dept.department_id, // departments use department_id as key
    label: dept.name,
    description: dept.description,
    color: '#3498db', // Default color for departments
    icon: 'building-2' // Default icon for departments
  });

  // Helper functions to convert to options
  const getSpecialtyOptions = (): EnumOption[] =>
    specialties.map(item => enumToOption(item));

  const getDepartmentOptions = (): EnumOption[] =>
    departments.map(item => convertDepartmentToEnum(item));

  const getRoomTypeOptions = (): EnumOption[] =>
    roomTypes.map(item => enumToOption(item));

  const getDiagnosisOptions = (): EnumOption[] =>
    diagnoses.map(item => enumToOption(item));

  const getMedicationOptions = (): EnumOption[] =>
    medications.map(item => enumToOption(item));

  const getStatusOptions = (appliesTo?: string): EnumOption[] => {
    let filtered = statusValues;
    if (appliesTo) {
      filtered = statusValues.filter(item =>
        !item.applies_to || item.applies_to === appliesTo
      );
    }
    return filtered.map(item => enumToOption(item));
  };

  const getPaymentMethodOptions = (): EnumOption[] =>
    paymentMethods.map(item => enumToOption(item));

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
