"use client";

import OpenStreetMapAddressInput, {
  OSMAddressComponents,
} from "@/components/forms/OpenStreetMapAddressInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import {
  BLOOD_TYPES,
  COMMON_DRUG_ALLERGIES,
  MEDICAL_CONDITIONS,
  PatientRegistrationData,
  PatientRegistrationErrors,
  RELATIONSHIP_OPTIONS,
  RegistrationStep,
  VALIDATION_RULES,
} from "@/lib/types/patient-registration";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const REGISTRATION_STEPS: RegistrationStep[] = [
  {
    id: 1,
    title: "Thông tin cơ bản",
    description: "Email, mật khẩu và thông tin cá nhân",
    isCompleted: false,
    isActive: true,
  },
  {
    id: 2,
    title: "Địa chỉ liên lạc",
    description: "Thông tin địa chỉ và liên hệ",
    isCompleted: false,
    isActive: false,
  },
  {
    id: 3,
    title: "Thông tin y tế",
    description: "Tiền sử bệnh và thông tin sức khỏe",
    isCompleted: false,
    isActive: false,
  },
  {
    id: 4,
    title: "Bảo hiểm & Liên hệ khẩn cấp",
    description: "BHYT và người liên hệ khẩn cấp",
    isCompleted: false,
    isActive: false,
  },
];

export default function PatientRegistrationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Email validation functions
  const checkEmailAvailability = async (email: string) => {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        isAvailable: false,
        message: "Không thể kiểm tra email. Vui lòng thử lại.",
      };
    }
  };

  const createDebouncedEmailCheck = (delay: number = 500) => {
    let timeoutId: NodeJS.Timeout;

    return (email: string, callback: (result: any) => void) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        const result = await checkEmailAvailability(email);
        callback(result);
      }, delay);
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<PatientRegistrationErrors>({});
  const [steps, setSteps] = useState<RegistrationStep[]>(REGISTRATION_STEPS);

  // Form data state - moved before useEffect that uses it
  const [formData, setFormData] = useState<PatientRegistrationData>({
    // Authentication
    email: "",
    password: "",
    confirmPassword: "",

    // Personal Information
    fullName: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "male",
    phoneNumber: "",

    // Address Information
    address: {
      province: "",
      district: "",
      ward: "",
      street: "",
      houseNumber: "",
    },

    // Medical Information
    medicalHistory: [],
    drugAllergies: [],

    // Emergency Contact
    emergencyContact: {
      name: "",
      relationship: "",
      phoneNumber: "",
      address: "",
    },
  });

  // Email validation states
  const [emailStatus, setEmailStatus] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
    type: "success" | "warning" | "error" | "info";
  }>({
    isChecking: false,
    isAvailable: null,
    message: "",
    type: "info",
  });

  // Debounced email check
  const debouncedEmailCheck = useCallback(createDebouncedEmailCheck(500), []);

  // Email validation effect
  useEffect(() => {
    if (formData.email && formData.email.length > 3) {
      setEmailStatus((prev) => ({ ...prev, isChecking: true }));

      debouncedEmailCheck(formData.email, (result) => {
        setEmailStatus({
          isChecking: false,
          isAvailable: result.isAvailable,
          message: result.message,
          type: result.isAvailable ? "success" : "error",
        });
      });
    } else {
      setEmailStatus({
        isChecking: false,
        isAvailable: null,
        message: "",
        type: "info",
      });
    }
  }, [formData.email, debouncedEmailCheck]);

  // Calculate progress percentage
  const progressPercentage = (currentStep / REGISTRATION_STEPS.length) * 100;

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user updates it
    if (errors[field as keyof PatientRegistrationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Update nested form data
  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof PatientRegistrationData],
        [field]: value,
      },
    }));

    // Clear error for this nested field when user updates it
    if (errors[parent as keyof PatientRegistrationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PatientRegistrationErrors],
          [field]: undefined,
        },
      }));
    }
  };

  // Handle OpenStreetMap address selection
  const handleAddressSelect = (addressComponents: OSMAddressComponents) => {
    console.log("Address components received:", addressComponents);

    // Parse display_name to extract district and ward info
    const parseDisplayName = (displayName: string) => {
      if (!displayName) return { district: "", ward: "" };

      const parts = displayName.split(", ");
      let district = "";
      let ward = "";

      // Look for district (Quận/Huyện)
      const districtPart = parts.find(
        (part) =>
          part.includes("Quận") ||
          part.includes("Huyện") ||
          part.includes("Thành phố")
      );
      if (districtPart && !districtPart.includes("Thành phố Hồ Chí Minh")) {
        district = districtPart.trim();
      }

      // Look for ward (Phường/Xã) - usually comes before district
      const wardPart = parts.find(
        (part) =>
          part.includes("Phường") ||
          part.includes("Xã") ||
          part.includes("Thị trấn")
      );
      if (wardPart) {
        ward = wardPart.trim();
      }

      return { district, ward };
    };

    const parsedAddress = parseDisplayName(
      addressComponents.display_name || ""
    );

    // Map OpenStreetMap data to our address format with display_name parsing
    const newAddress = {
      province: addressComponents.city || addressComponents.state || "",
      district: addressComponents.city_district || parsedAddress.district || "",
      ward:
        addressComponents.suburb ||
        addressComponents.neighbourhood ||
        parsedAddress.ward ||
        "",
      street: `${addressComponents.house_number || ""} ${
        addressComponents.road || ""
      }`.trim(),
      houseNumber: addressComponents.house_number || "",
    };

    console.log("Mapped address (no fallbacks):", newAddress);
    console.log("Available OSM fields:", {
      city: addressComponents.city,
      state: addressComponents.state,
      city_district: addressComponents.city_district,
      suburb: addressComponents.suburb,
      neighbourhood: addressComponents.neighbourhood,
      house_number: addressComponents.house_number,
      road: addressComponents.road,
    });

    setFormData((prev) => ({
      ...prev,
      address: newAddress,
    }));

    // Clear address validation errors
    setErrors((prev) => ({
      ...prev,
      address: undefined,
    }));
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: PatientRegistrationErrors = {};

    switch (currentStep) {
      case 1:
        // Basic information validation
        if (!formData.email) newErrors.email = "Email là bắt buộc";
        else if (!VALIDATION_RULES.email.pattern.test(formData.email)) {
          newErrors.email = VALIDATION_RULES.email.message;
        }
        // Only block if email is explicitly unavailable (not null or checking)
        else if (emailStatus.isAvailable === false) {
          newErrors.email = "Email này đã được sử dụng";
        }
        // Note: Don't block form submission while checking email
        // The checking state is handled by UI feedback only

        if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc";
        else if (!VALIDATION_RULES.password.pattern.test(formData.password)) {
          newErrors.password = VALIDATION_RULES.password.message;
        }

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        if (!formData.fullName) newErrors.fullName = "Họ tên là bắt buộc";
        if (!formData.nationalId)
          newErrors.nationalId = "CCCD/CMND là bắt buộc";
        else if (
          !VALIDATION_RULES.nationalId.pattern.test(formData.nationalId)
        ) {
          newErrors.nationalId = VALIDATION_RULES.nationalId.message;
        }

        if (!formData.dateOfBirth)
          newErrors.dateOfBirth = "Ngày sinh là bắt buộc";
        if (!formData.phoneNumber)
          newErrors.phoneNumber = "Số điện thoại là bắt buộc";
        else if (
          !VALIDATION_RULES.phoneNumber.pattern.test(formData.phoneNumber)
        ) {
          newErrors.phoneNumber = VALIDATION_RULES.phoneNumber.message;
        }

        if (!formData.gender) newErrors.gender = "Giới tính là bắt buộc";
        break;

      case 2:
        // Address validation - all fields required since user can edit manually
        if (!formData.address.province) {
          newErrors.address = {
            ...newErrors.address,
            province: "Tỉnh/Thành phố là bắt buộc",
          };
        }
        if (!formData.address.district) {
          newErrors.address = {
            ...newErrors.address,
            district: "Quận/Huyện là bắt buộc",
          };
        }
        if (!formData.address.ward) {
          newErrors.address = {
            ...newErrors.address,
            ward: "Phường/Xã là bắt buộc",
          };
        }
        if (!formData.address.street) {
          newErrors.address = {
            ...newErrors.address,
            street: "Địa chỉ cụ thể là bắt buộc",
          };
        }
        break;

      case 4:
        // Emergency contact validation
        if (!formData.emergencyContact.name) {
          newErrors.emergencyContact = {
            ...newErrors.emergencyContact,
            name: "Tên người liên hệ là bắt buộc",
          };
        }
        if (!formData.emergencyContact.relationship) {
          newErrors.emergencyContact = {
            ...newErrors.emergencyContact,
            relationship: "Mối quan hệ là bắt buộc",
          };
        }
        if (!formData.emergencyContact.phoneNumber) {
          newErrors.emergencyContact = {
            ...newErrors.emergencyContact,
            phoneNumber: "Số điện thoại là bắt buộc",
          };
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    console.log("Attempting to go to next step...");
    console.log("Current form data:", formData);
    console.log("Email status:", emailStatus);

    const isValid = validateCurrentStep();
    console.log("Validation result:", isValid);
    console.log("Current errors:", errors);

    if (isValid) {
      if (currentStep < REGISTRATION_STEPS.length) {
        setCurrentStep(currentStep + 1);
        // Update steps state
        setSteps((prev) =>
          prev.map((step) => ({
            ...step,
            isCompleted: step.id < currentStep + 1,
            isActive: step.id === currentStep + 1,
          }))
        );
      }
    } else {
      console.log("Validation failed, staying on current step");
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          isCompleted: step.id < currentStep - 1,
          isActive: step.id === currentStep - 1,
        }))
      );
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);

    try {
      // TODO: Call registration API
      console.log("Patient Registration Data:", formData);

      showToast(
        "🎉 Đăng ký thành công!",
        "Tài khoản bệnh nhân đã được tạo thành công!",
        "success"
      );

      setTimeout(() => {
        router.push(
          "/auth/login?message=" +
            encodeURIComponent(
              "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục."
            )
        );
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      showToast(
        "❌ Đăng ký thất bại",
        "Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#0066CC] p-3 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Đăng ký tài khoản bệnh nhân
          </h1>
          <p className="text-gray-600">
            Tạo tài khoản để đặt lịch khám và quản lý sức khỏe
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Bước {currentStep} / {REGISTRATION_STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% hoàn thành
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                  step.isCompleted
                    ? "bg-green-500 text-white"
                    : step.isActive
                    ? "bg-[#0066CC] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    step.isActive ? "text-[#0066CC]" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-full h-0.5 mt-4 ${
                    step.isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-[#0066CC] text-lg">
              {steps[currentStep - 1]?.title}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1]?.description}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Email & Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          updateFormData("email", e.target.value)
                        }
                        placeholder="example@email.com"
                        className={`pr-10 ${
                          errors.email
                            ? "border-red-500"
                            : emailStatus.isAvailable === true
                            ? "border-green-500"
                            : emailStatus.isAvailable === false
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {/* Email Status Icon */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {emailStatus.isChecking && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!emailStatus.isChecking &&
                          emailStatus.isAvailable === true && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        {!emailStatus.isChecking &&
                          emailStatus.isAvailable === false && (
                            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-white text-xs">✕</span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Email Status Message */}
                    {emailStatus.message && (
                      <p
                        className={`text-xs mt-1 ${
                          emailStatus.type === "success"
                            ? "text-green-600"
                            : emailStatus.type === "error"
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {emailStatus.message}
                      </p>
                    )}

                    {/* Regular Error Message */}
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Số điện thoại *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        updateFormData("phoneNumber", e.target.value)
                      }
                      placeholder="0123456789"
                      className={errors.phoneNumber ? "border-red-500" : ""}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          updateFormData("password", e.target.value)
                        }
                        placeholder="••••••••"
                        className={errors.password ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          updateFormData("confirmPassword", e.target.value)
                        }
                        placeholder="••••••••"
                        className={
                          errors.confirmPassword ? "border-red-500" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <Label htmlFor="fullName">Họ và tên đầy đủ *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="nationalId">CCCD/CMND *</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={(e) =>
                        updateFormData("nationalId", e.target.value)
                      }
                      placeholder="123456789012"
                      className={errors.nationalId ? "border-red-500" : ""}
                    />
                    {errors.nationalId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.nationalId}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        updateFormData("dateOfBirth", e.target.value)
                      }
                      className={errors.dateOfBirth ? "border-red-500" : ""}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Giới tính *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => updateFormData("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* OpenStreetMap Address Input */}
                <OpenStreetMapAddressInput
                  onAddressSelect={handleAddressSelect}
                  placeholder="Nhập địa chỉ của bạn (VD: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
                  required={true}
                  error={errors.address?.street}
                />

                {/* Address Details Display */}
                {(formData.address.province ||
                  formData.address.district ||
                  formData.address.ward) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Thông tin địa chỉ đã chọn:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {formData.address.province && (
                        <div>
                          <span className="font-medium">Tỉnh/TP:</span>
                          <p className="text-gray-700">
                            {formData.address.province}
                          </p>
                        </div>
                      )}
                      {formData.address.district && (
                        <div>
                          <span className="font-medium">Quận/Huyện:</span>
                          <p className="text-gray-700">
                            {formData.address.district}
                          </p>
                        </div>
                      )}
                      {formData.address.ward && (
                        <div>
                          <span className="font-medium">Phường/Xã:</span>
                          <p className="text-gray-700">
                            {formData.address.ward}
                          </p>
                        </div>
                      )}
                    </div>
                    {formData.address.street && (
                      <div>
                        <span className="font-medium">Địa chỉ cụ thể:</span>
                        <p className="text-gray-700">
                          {formData.address.street}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Address Input (Editable) */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Hoặc nhập thủ công / Chỉnh sửa thông tin:
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Bạn có thể chỉnh sửa hoặc bổ sung thông tin địa chỉ bên dưới
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manual-province">Tỉnh/Thành phố *</Label>
                      <Input
                        id="manual-province"
                        value={formData.address.province}
                        onChange={(e) =>
                          updateNestedFormData(
                            "address",
                            "province",
                            e.target.value
                          )
                        }
                        placeholder="VD: Thành phố Hồ Chí Minh"
                        className={
                          errors.address?.province ? "border-red-500" : ""
                        }
                      />
                      {errors.address?.province && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.address.province}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="manual-district">Quận/Huyện *</Label>
                      <Input
                        id="manual-district"
                        value={formData.address.district}
                        onChange={(e) =>
                          updateNestedFormData(
                            "address",
                            "district",
                            e.target.value
                          )
                        }
                        placeholder="VD: Quận 1, Quận Gò Vấp"
                        className={
                          errors.address?.district ? "border-red-500" : ""
                        }
                      />
                      {errors.address?.district && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.address.district}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="manual-ward">Phường/Xã *</Label>
                      <Input
                        id="manual-ward"
                        value={formData.address.ward}
                        onChange={(e) =>
                          updateNestedFormData(
                            "address",
                            "ward",
                            e.target.value
                          )
                        }
                        placeholder="VD: Phường 1, Phường Tân Định"
                        className={errors.address?.ward ? "border-red-500" : ""}
                      />
                      {errors.address?.ward && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.address.ward}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="manual-street">Địa chỉ cụ thể *</Label>
                      <Input
                        id="manual-street"
                        value={formData.address.street}
                        onChange={(e) =>
                          updateNestedFormData(
                            "address",
                            "street",
                            e.target.value
                          )
                        }
                        placeholder="VD: 123 Nguyễn Huệ, Hẻm 205 Phạm Văn Chiêu"
                        className={
                          errors.address?.street ? "border-red-500" : ""
                        }
                      />
                      {errors.address?.street && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.address.street}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Medical Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bloodType">Nhóm máu</Label>
                    <Select
                      value={formData.bloodType || ""}
                      onValueChange={(value) =>
                        updateFormData("bloodType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhóm máu" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="weight">Cân nặng (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight || ""}
                      onChange={(e) =>
                        updateFormData(
                          "weight",
                          parseFloat(e.target.value) || undefined
                        )
                      }
                      placeholder="65"
                      min="1"
                      max="300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="height">Chiều cao (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height || ""}
                      onChange={(e) =>
                        updateFormData(
                          "height",
                          parseFloat(e.target.value) || undefined
                        )
                      }
                      placeholder="170"
                      min="50"
                      max="250"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Tiền sử bệnh</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Chọn các bệnh lý bạn đã từng mắc phải
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MEDICAL_CONDITIONS.map((condition) => (
                      <div
                        key={condition}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`medical-${condition}`}
                          checked={formData.medicalHistory.includes(condition)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFormData("medicalHistory", [
                                ...formData.medicalHistory,
                                condition,
                              ]);
                            } else {
                              updateFormData(
                                "medicalHistory",
                                formData.medicalHistory.filter(
                                  (item) => item !== condition
                                )
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`medical-${condition}`}
                          className="text-sm"
                        >
                          {condition}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Dị ứng thuốc</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Chọn các loại thuốc bạn bị dị ứng
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COMMON_DRUG_ALLERGIES.map((allergy) => (
                      <div
                        key={allergy}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`allergy-${allergy}`}
                          checked={formData.drugAllergies.includes(allergy)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFormData("drugAllergies", [
                                ...formData.drugAllergies,
                                allergy,
                              ]);
                            } else {
                              updateFormData(
                                "drugAllergies",
                                formData.drugAllergies.filter(
                                  (item) => item !== allergy
                                )
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`allergy-${allergy}`}
                          className="text-sm"
                        >
                          {allergy}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentMedications">
                    Thuốc đang sử dụng (tùy chọn)
                  </Label>
                  <Textarea
                    id="currentMedications"
                    value={formData.currentMedications || ""}
                    onChange={(e) =>
                      updateFormData("currentMedications", e.target.value)
                    }
                    placeholder="Liệt kê các loại thuốc bạn đang sử dụng thường xuyên..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Insurance & Emergency Contact */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Insurance Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#0066CC]" />
                    Thông tin bảo hiểm y tế
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insuranceNumber">
                        Số thẻ BHYT (tùy chọn)
                      </Label>
                      <Input
                        id="insuranceNumber"
                        value={formData.insuranceNumber || ""}
                        onChange={(e) =>
                          updateFormData("insuranceNumber", e.target.value)
                        }
                        placeholder="DN1234567890123"
                      />
                    </div>

                    <div>
                      <Label htmlFor="insuranceProvider">
                        Nơi đăng ký KCB ban đầu
                      </Label>
                      <Input
                        id="insuranceProvider"
                        value={formData.insuranceProvider || ""}
                        onChange={(e) =>
                          updateFormData("insuranceProvider", e.target.value)
                        }
                        placeholder="Bệnh viện Đa khoa Thành phố"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insuranceValidFrom">Có hiệu lực từ</Label>
                      <Input
                        id="insuranceValidFrom"
                        type="date"
                        value={formData.insuranceValidFrom || ""}
                        onChange={(e) =>
                          updateFormData("insuranceValidFrom", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="insuranceValidTo">Có hiệu lực đến</Label>
                      <Input
                        id="insuranceValidTo"
                        type="date"
                        value={formData.insuranceValidTo || ""}
                        onChange={(e) =>
                          updateFormData("insuranceValidTo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-red-500" />
                    Người liên hệ khẩn cấp
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyName">Họ và tên *</Label>
                      <Input
                        id="emergencyName"
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          updateNestedFormData(
                            "emergencyContact",
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Nguyễn Văn B"
                        className={
                          errors.emergencyContact?.name ? "border-red-500" : ""
                        }
                      />
                      {errors.emergencyContact?.name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.emergencyContact.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyRelationship">
                        Mối quan hệ *
                      </Label>
                      <Select
                        value={formData.emergencyContact.relationship}
                        onValueChange={(value) =>
                          updateNestedFormData(
                            "emergencyContact",
                            "relationship",
                            value
                          )
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.emergencyContact?.relationship
                              ? "border-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Chọn mối quan hệ" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.emergencyContact?.relationship && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.emergencyContact.relationship}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyPhone">Số điện thoại *</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyContact.phoneNumber}
                        onChange={(e) =>
                          updateNestedFormData(
                            "emergencyContact",
                            "phoneNumber",
                            e.target.value
                          )
                        }
                        placeholder="0987654321"
                        className={
                          errors.emergencyContact?.phoneNumber
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors.emergencyContact?.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.emergencyContact.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyAddress">
                        Địa chỉ (tùy chọn)
                      </Label>
                      <Input
                        id="emergencyAddress"
                        value={formData.emergencyContact.address || ""}
                        onChange={(e) =>
                          updateNestedFormData(
                            "emergencyContact",
                            "address",
                            e.target.value
                          )
                        }
                        placeholder="Địa chỉ người liên hệ"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Thông tin bổ sung
                  </h3>

                  <div>
                    <Label htmlFor="occupation">Nghề nghiệp (tùy chọn)</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation || ""}
                      onChange={(e) =>
                        updateFormData("occupation", e.target.value)
                      }
                      placeholder="Kỹ sư, Giáo viên, Học sinh..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú thêm (tùy chọn)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => updateFormData("notes", e.target.value)}
                      placeholder="Thông tin bổ sung khác..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                  </Button>
                )}
              </div>

              <div>
                {currentStep < REGISTRATION_STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#0066CC] hover:bg-[#0052A3] flex items-center gap-2"
                  >
                    Tiếp theo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang đăng ký...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Hoàn tất đăng ký
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              href="/auth/login"
              className="text-[#0066CC] hover:underline font-medium"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
