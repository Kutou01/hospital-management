'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PatientLayout from '@/components/layout/PatientLayout';
import MedicalRecordForm from '@/components/features/medical-records/MedicalRecordForm';
import { useToast } from '@/components/ui/toast-provider';
import { medicalRecordsApi as medicalRecordApi } from '@/lib/api/medical-records';
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context';

interface DoctorInfo {
    id: string;
    name: string;
    specialty: string;
    fee: number;
}

export default function CreateMedicalRecordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useEnhancedAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const doctorIdParam = searchParams.get('doctorId');
    const isFromAppointment = Boolean(doctorIdParam);

    // Load doctor info on page load
    useEffect(() => {
        // Try to get doctor info from localStorage
        try {
            const doctorInfoStr = localStorage.getItem('selectedDoctor');
            if (doctorInfoStr) {
                const parsedInfo = JSON.parse(doctorInfoStr);
                setDoctorInfo(parsedInfo);
            } else if (doctorIdParam) {
                // If doctor info not in localStorage but we have doctorId in URL, display error
                setErrorMsg('Không tìm thấy thông tin bác sĩ. Vui lòng quay lại trang bác sĩ.');
            }
        } catch (error) {
            console.error('Error loading doctor info:', error);
            setErrorMsg('Đã xảy ra lỗi khi tải thông tin bác sĩ.');
        }
    }, [doctorIdParam]);

    // Check authentication and redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            toast({
                title: 'Yêu cầu đăng nhập',
                description: 'Vui lòng đăng nhập để tạo bệnh án',
                variant: 'destructive'
            });

            // Save current path for redirect after login
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('authRedirect', currentPath);

            router.push('/auth/login?redirect=create-medical-record');
        }
    }, [user, authLoading, router, toast]);

    // Handle form submission
    const handleSubmit = async (formData: any) => {
        if (!doctorInfo) {
            toast({
                title: 'Thiếu thông tin',
                description: 'Không tìm thấy thông tin bác sĩ',
                variant: 'destructive'
            });
            return;
        }

        setSubmitting(true);

        try {
            // Add doctor info to the form data
            const recordData = {
                ...formData,
                doctorId: doctorInfo.id,
                doctorName: doctorInfo.name,
                appointmentStatus: 'pending',
            };

            // Submit to API
            const response = await medicalRecordApi.createMedicalRecord(recordData);

            if (response.success && response.data) {
                const recordId = response.data.id;

                toast({
                    title: 'Thành công',
                    description: 'Bệnh án đã được tạo',
                    variant: 'success'
                });

                // Store record info in localStorage for payment
                localStorage.setItem('currentMedicalRecord', JSON.stringify({
                    id: recordId,
                    patientName: formData.patientName || user?.name || '',
                    symptoms: formData.symptoms,
                    doctorId: doctorInfo.id,
                    doctorName: doctorInfo.name
                }));

                // Redirect to payment if coming from doctor booking flow
                if (isFromAppointment) {
                    // Using small timeout to ensure localStorage is set before redirect
                    setTimeout(() => {
                        router.push(`/payment/checkout?doctorId=${doctorInfo.id}&recordId=${recordId}&amount=${doctorInfo.fee}`);
                    }, 100);
                } else {
                    // Otherwise, go to medical records list
                    router.push('/patient/medical-records');
                }
            } else {
                throw new Error(response.error?.message || 'Không thể tạo bệnh án');
            }
        } catch (error: any) {
            console.error('Error submitting medical record:', error);
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo bệnh án, vui lòng thử lại',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle cancel/back action
    const handleBack = () => {
        if (doctorIdParam) {
            // If from doctor page, go back to doctor details
            router.push(`/doctors/${doctorIdParam}`);
        } else {
            // Otherwise go to medical records list
            router.push('/patient/medical-records');
        }
    };

    return (
        <PatientLayout currentPage="medical-records">
            <div className="py-8">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isFromAppointment ? 'Thông tin bệnh án cho lịch khám' : 'Tạo bệnh án mới'}
                            </h1>
                            <p className="text-gray-600">
                                {isFromAppointment
                                    ? `Tạo bệnh án để đặt lịch với ${doctorInfo?.name || 'bác sĩ'}`
                                    : 'Vui lòng điền đầy đủ thông tin bệnh án dưới đây'
                                }
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={submitting}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                    </div>

                    {errorMsg ? (
                        <Card className="p-6 bg-red-50 text-center">
                            <p className="text-red-600 mb-4">{errorMsg}</p>
                            <Button onClick={handleBack}>
                                Quay lại trang bác sĩ
                            </Button>
                        </Card>
                    ) : (
                        <Card className="p-6 shadow-md">
                            {doctorInfo && isFromAppointment && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                    <h2 className="text-lg font-semibold text-blue-800 mb-2">Thông tin đặt lịch</h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Bác sĩ:</p>
                                            <p className="font-medium">{doctorInfo.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Chuyên khoa:</p>
                                            <p className="font-medium">{doctorInfo.specialty}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Phí tư vấn:</p>
                                            <p className="font-medium">{doctorInfo.fee?.toLocaleString('vi-VN')} VNĐ</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <MedicalRecordForm
                                onSubmit={handleSubmit}
                                loading={submitting}
                                initialValues={user ? {
                                    patientName: user.name || '',
                                    patientEmail: user.email || '',
                                    patientPhone: user.phone || '',
                                } : undefined}
                                isForAppointment={isFromAppointment}
                                actionText={isFromAppointment ? 'Tiếp tục đến thanh toán' : 'Tạo bệnh án'}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </PatientLayout>
    );
} 