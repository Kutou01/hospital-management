// Enhanced Patient Registration Types
export interface PatientRegistrationData {
  // Authentication
  email: string;
  password: string;
  confirmPassword: string;

  // Personal Information
  fullName: string;
  nationalId: string; // CCCD/CMND
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  phoneNumber: string;

  // Address Information
  address: {
    province: string;
    district: string;
    ward: string;
    street: string;
    houseNumber?: string;
  };

  // Medical Information
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  weight?: number; // kg
  height?: number; // cm
  medicalHistory: string[]; // Tiền sử bệnh
  drugAllergies: string[]; // Dị ứng thuốc
  currentMedications?: string; // Thuốc đang sử dụng

  // Insurance Information
  insuranceNumber?: string; // Số thẻ BHYT
  insuranceProvider?: string; // Nơi đăng ký KCB ban đầu
  insuranceValidFrom?: string;
  insuranceValidTo?: string;

  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    address?: string;
  };

  // Additional Information
  occupation?: string;
  notes?: string;
}

// Form validation interface
export interface PatientRegistrationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  nationalId?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  gender?: string;
  address?: {
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };
}

// Form step interface for multi-step registration
export interface RegistrationStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

// Medical history options
export const MEDICAL_CONDITIONS = [
  "Đái tháo đường",
  "Cao huyết áp",
  "Bệnh tim mạch",
  "Hen suyễn",
  "Dị ứng",
  "Bệnh thận",
  "Bệnh gan",
  "Ung thư",
  "Trầm cảm",
  "Loãng xương",
  "Khác",
] as const;

// Drug allergy options
export const COMMON_DRUG_ALLERGIES = [
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Codeine",
  "Morphine",
  "Sulfa drugs",
  "Insulin",
  "Khác",
] as const;

// Relationship options for emergency contact
export const RELATIONSHIP_OPTIONS = [
  "Cha",
  "Mẹ",
  "Vợ/Chồng",
  "Con",
  "Anh/Chị/Em",
  "Bạn bè",
  "Khác",
] as const;

// Blood type options
export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

// Form validation rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Email không hợp lệ",
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message:
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
  },
  nationalId: {
    required: true,
    pattern: /^[0-9]{9,12}$/,
    message: "CCCD/CMND phải có 9-12 chữ số",
  },
  phoneNumber: {
    required: true,
    pattern: /^0[0-9]{9}$/,
    message: "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0",
  },
} as const;
