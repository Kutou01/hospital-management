'use client';

import React, { createContext, useContext, useState } from 'react';
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

// Mock data for enums
const mockSpecialties: Specialty[] = [
    {
        specialty_id: 'SPEC001',
        specialty_code: 'cardiology',
        specialty_name: 'Tim mạch',
        description: 'Chuyên khoa về tim và mạch máu',
        is_active: true,
        created_at: '',
        updated_at: '',
        color_code: '#e74c3c',
        icon_name: 'heart',
        sort_order: 10
    },
    {
        specialty_id: 'SPEC002',
        specialty_code: 'neurology',
        specialty_name: 'Thần kinh',
        description: 'Chuyên khoa về hệ thần kinh',
        is_active: true,
        created_at: '',
        updated_at: '',
        color_code: '#9b59b6',
        icon_name: 'brain',
        sort_order: 20
    },
    {
        specialty_id: 'SPEC003',
        specialty_code: 'pediatrics',
        specialty_name: 'Nhi khoa',
        description: 'Chuyên khoa về trẻ em',
        is_active: true,
        created_at: '',
        updated_at: '',
        color_code: '#3498db',
        icon_name: 'baby',
        sort_order: 30
    },
];

const mockDepartments: DepartmentEnum[] = [
    { id: 1, code: 'cardiology', name: 'Khoa Tim mạch', description: 'Khoa Tim mạch', color_code: '#e74c3c', icon_name: 'heart', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 2, code: 'neurology', name: 'Khoa Thần kinh', description: 'Khoa Thần kinh', color_code: '#9b59b6', icon_name: 'brain', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
    { id: 3, code: 'pediatrics', name: 'Khoa Nhi', description: 'Khoa Nhi', color_code: '#3498db', icon_name: 'baby', sort_order: 30, is_active: true, created_at: '', updated_at: '' },
];

const mockRoomTypes: RoomType[] = [
    { id: 1, code: 'consultation', name: 'Phòng khám', description: 'Phòng khám bệnh thông thường', color_code: '#3498db', icon_name: 'stethoscope', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 2, code: 'surgery', name: 'Phòng mổ', description: 'Phòng phẫu thuật', color_code: '#e74c3c', icon_name: 'scalpel', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
];

const mockDiagnoses: Diagnosis[] = [
    { id: 1, code: 'hypertension', name: 'Tăng huyết áp', description: 'Huyết áp cao kéo dài', icd_code: 'I10', color_code: '#e74c3c', icon_name: 'heart', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 2, code: 'diabetes', name: 'Đái tháo đường', description: 'Rối loạn chuyển hóa glucose', icd_code: 'E11', color_code: '#9b59b6', icon_name: 'droplet', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
];

const mockMedications: Medication[] = [
    { id: 1, code: 'paracetamol', name: 'Paracetamol', description: 'Thuốc giảm đau, hạ sốt', drug_class: 'Analgesic', dosage_form: 'Tablet', color_code: '#3498db', icon_name: 'pill', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 2, code: 'amoxicillin', name: 'Amoxicillin', description: 'Kháng sinh nhóm beta-lactam', drug_class: 'Antibiotic', dosage_form: 'Capsule', color_code: '#e74c3c', icon_name: 'capsule', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
];

const mockStatusValues: StatusValue[] = [
    { id: 1, code: 'scheduled', name: 'Đã đặt lịch', description: 'Cuộc hẹn đã được đặt lịch', applies_to: 'appointment', color_code: '#3498db', icon_name: 'calendar', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 2, code: 'confirmed', name: 'Đã xác nhận', description: 'Cuộc hẹn đã được xác nhận', applies_to: 'appointment', color_code: '#2ecc71', icon_name: 'check-circle', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
    { id: 3, code: 'pending', name: 'Chờ xử lý', description: 'Thanh toán đang chờ xử lý', applies_to: 'payment', color_code: '#f39c12', icon_name: 'clock', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 4, code: 'paid', name: 'Đã thanh toán', description: 'Thanh toán đã hoàn tất', applies_to: 'payment', color_code: '#2ecc71', icon_name: 'check-circle', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
];

const mockPaymentMethods: PaymentMethod[] = [
    { id: 1, code: 'cash', name: 'Tiền mặt', description: 'Thanh toán bằng tiền mặt tại quầy', requires_verification: false, processing_fee: 0, color_code: '#2ecc71', icon_name: 'cash', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
    { id: 2, code: 'bank_transfer', name: 'Chuyển khoản', description: 'Chuyển khoản ngân hàng', requires_verification: true, processing_fee: 0, color_code: '#3498db', icon_name: 'bank', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
    { id: 3, code: 'vnpay', name: 'VNPay', description: 'Thanh toán qua cổng VNPay', requires_verification: false, processing_fee: 1.5, color_code: '#2980b9', icon_name: 'credit-card', sort_order: 50, is_active: true, created_at: '', updated_at: '' },
];

// Define the context interface
export interface MockEnumContextType {
    // Data
    specialties: Specialty[];
    departments: DepartmentEnum[];
    roomTypes: RoomType[];
    diagnoses: Diagnosis[];
    medications: Medication[];
    statusValues: StatusValue[];
    paymentMethods: PaymentMethod[];
    loading: boolean;
    error: string | null;

    // Option getters
    getSpecialtyOptions: () => EnumOption[];
    getDepartmentOptions: () => EnumOption[];
    getRoomTypeOptions: () => EnumOption[];
    getDiagnosisOptions: () => EnumOption[];
    getMedicationOptions: () => EnumOption[];
    getStatusOptions: (category: string) => EnumOption[];
    getPaymentMethodOptions: () => EnumOption[];

    // Utility functions
    getEnumDisplayName: (enumItem: BaseEnum | Specialty) => string;
    getDefaultEnum: (enumList: BaseEnum[]) => BaseEnum | null;
    refreshData: () => Promise<void>;
}

// Create the context
const MockEnumContext = createContext<MockEnumContextType | undefined>(undefined);

// Create the provider component
export function MockEnumProvider({ children }: { children: React.ReactNode }) {
    // Mock data for specialties
    const [specialties] = useState<Specialty[]>([
        {
            specialty_id: '1',
            specialty_name: 'Nội khoa',
            specialty_code: 'NOI',
            description: 'Chuyên khoa nội',
            department_id: '1',
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            color_code: '#3498db',
            icon_name: 'stethoscope',
            sort_order: 1
        },
        {
            specialty_id: '2',
            specialty_name: 'Ngoại khoa',
            specialty_code: 'NGOAI',
            description: 'Chuyên khoa ngoại',
            department_id: '1',
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            color_code: '#2ecc71',
            icon_name: 'scalpel',
            sort_order: 2
        },
        {
            specialty_id: '3',
            specialty_name: 'Nhi khoa',
            specialty_code: 'NHI',
            description: 'Chuyên khoa nhi',
            department_id: '2',
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            color_code: '#f1c40f',
            icon_name: 'baby',
            sort_order: 3
        },
        {
            specialty_id: '4',
            specialty_name: 'Sản phụ khoa',
            specialty_code: 'SAN',
            description: 'Chuyên khoa sản',
            department_id: '2',
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            color_code: '#e74c3c',
            icon_name: 'female',
            sort_order: 4
        },
        {
            specialty_id: '5',
            specialty_name: 'Da liễu',
            specialty_code: 'DA',
            description: 'Chuyên khoa da liễu',
            department_id: '3',
            is_active: true,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
            color_code: '#9b59b6',
            icon_name: 'allergy',
            sort_order: 5
        }
    ]);

    // Mock data for departments
    const [departments] = useState<DepartmentEnum[]>([
        { id: 1, code: 'cardiology', name: 'Khoa Tim mạch', description: 'Khoa Tim mạch', color_code: '#e74c3c', icon_name: 'heart', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'neurology', name: 'Khoa Thần kinh', description: 'Khoa Thần kinh', color_code: '#9b59b6', icon_name: 'brain', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'pediatrics', name: 'Khoa Nhi', description: 'Khoa Nhi', color_code: '#3498db', icon_name: 'baby', sort_order: 30, is_active: true, created_at: '', updated_at: '' },
    ]);

    // Mock data for room types
    const [roomTypes] = useState<RoomType[]>([
        { id: 1, code: 'consultation', name: 'Phòng khám thường', description: 'Phòng khám thông thường', color_code: '#3498db', icon_name: 'stethoscope', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'surgery', name: 'Phòng khám VIP', description: 'Phòng khám VIP', color_code: '#e74c3c', icon_name: 'scalpel', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
    ]);

    // Mock data for diagnoses
    const [diagnoses] = useState<Diagnosis[]>([
        { id: 1, code: 'hypertension', name: 'Tăng huyết áp', description: 'Huyết áp cao kéo dài', icd_code: 'I10', color_code: '#e74c3c', icon_name: 'heart', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'diabetes', name: 'Đái tháo đường', description: 'Rối loạn chuyển hóa glucose', icd_code: 'E11', color_code: '#9b59b6', icon_name: 'droplet', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
    ]);

    // Mock data for medications
    const [medications] = useState<Medication[]>([
        { id: 1, code: 'paracetamol', name: 'Paracetamol', description: 'Thuốc giảm đau, hạ sốt', drug_class: 'Analgesic', dosage_form: 'Tablet', color_code: '#3498db', icon_name: 'pill', sort_order: 10, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'amoxicillin', name: 'Amoxicillin', description: 'Kháng sinh', drug_class: 'Antibiotic', dosage_form: 'Capsule', color_code: '#e74c3c', icon_name: 'capsule', sort_order: 20, is_active: true, created_at: '', updated_at: '' },
    ]);

    // Mock data for status values
    const [statusValues] = useState<StatusValue[]>([
        { id: '1', name: 'Đang chờ', category: 'appointment', description: 'Đang chờ khám', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 1 },
        { id: '2', name: 'Đã khám', category: 'appointment', description: 'Đã khám xong', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 2 },
        { id: '3', name: 'Đã hủy', category: 'appointment', description: 'Đã hủy lịch khám', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 3 },
        { id: '4', name: 'Đang làm việc', category: 'bac_si', description: 'Bác sĩ đang làm việc', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 1 },
        { id: '5', name: 'Nghỉ phép', category: 'bac_si', description: 'Bác sĩ đang nghỉ phép', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 2 },
    ]);

    // Mock data for payment methods
    const [paymentMethods] = useState<PaymentMethod[]>([
        { id: '1', name: 'Tiền mặt', description: 'Thanh toán bằng tiền mặt', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 1 },
        { id: '2', name: 'Chuyển khoản', description: 'Thanh toán bằng chuyển khoản ngân hàng', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 2 },
        { id: '3', name: 'VNPAY', description: 'Thanh toán qua VNPAY', is_active: true, created_at: '2023-01-01', updated_at: '2023-01-01', sort_order: 3 },
    ]);

    // Mock loading and error states
    const [loading] = useState<boolean>(false);
    const [error] = useState<string | null>(null);

    // Helper functions to convert to options
    const getSpecialtyOptions = (): EnumOption[] =>
        specialties.map(item => ({
            value: item.specialty_code || item.specialty_id,
            label: item.specialty_name,
            description: item.description,
            color: item.color_code,
            icon: item.icon_name
        }));

    const getDepartmentOptions = (): EnumOption[] =>
        departments.map(item => ({
            value: item.id,
            label: item.name,
            description: item.description
        }));

    const getRoomTypeOptions = (): EnumOption[] =>
        roomTypes.map(item => ({
            value: item.id,
            label: item.name,
            description: item.description
        }));

    const getDiagnosisOptions = (): EnumOption[] =>
        diagnoses.map(item => ({
            value: item.id,
            label: item.name,
            description: item.description
        }));

    const getMedicationOptions = (): EnumOption[] =>
        medications.map(item => ({
            value: item.id,
            label: item.name,
            description: item.description
        }));

    const getStatusOptions = (category: string): EnumOption[] =>
        statusValues
            .filter(item => item.category === category)
            .map(item => ({
                value: item.id,
                label: item.name,
                description: item.description
            }));

    const getPaymentMethodOptions = (): EnumOption[] =>
        paymentMethods.map(item => ({
            value: item.id,
            label: item.name,
            description: item.description
        }));

    // Utility functions
    const getEnumDisplayNameHelper = (enumItem: BaseEnum | Specialty): string =>
        getEnumDisplayName(enumItem);

    const getDefaultEnum = (enumList: BaseEnum[]): BaseEnum | null => {
        if (!enumList || enumList.length === 0) return null;
        return enumList[0];
    };

    // Mock refresh data function
    const refreshData = async (): Promise<void> => {
        console.log('Mock refresh data called');
        return Promise.resolve();
    };

    const contextValue: MockEnumContextType = {
        specialties,
        departments,
        roomTypes,
        diagnoses,
        medications,
        statusValues,
        paymentMethods,
        loading,
        error,
        getSpecialtyOptions,
        getDepartmentOptions,
        getRoomTypeOptions,
        getDiagnosisOptions,
        getMedicationOptions,
        getStatusOptions,
        getPaymentMethodOptions,
        getEnumDisplayName: getEnumDisplayNameHelper,
        getDefaultEnum,
        refreshData
    };

    return <MockEnumContext.Provider value={contextValue}>{children}</MockEnumContext.Provider>;
}

// Create a hook for using the enum context
export function useMockEnumContext() {
    const context = useContext(MockEnumContext);
    if (context === undefined) {
        throw new Error('useMockEnumContext must be used within a MockEnumProvider');
    }
    return context;
}

// Export the mock context for use in place of the real EnumContext
export default MockEnumContext; 