'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context";
import { Calendar, Clock, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { paymentApi } from "@/lib/api/payment";
import { appointmentsApi } from "@/lib/api/appointments";
import { doctorsApi } from "@/lib/api/doctors";
import Swal from "sweetalert2";

export default function BookingPage() {
    const { user } = useEnhancedAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string, startTime: string, endTime: string } | null>(null);

    useEffect(() => {
        // Kiểm tra thông tin thanh toán trong localStorage
        const isCompleted = localStorage.getItem('paymentCompleted') === 'true';
        const storedPaymentId = localStorage.getItem('paymentId');
        const doctorId = localStorage.getItem('selectedDoctorId');

        if (isCompleted && storedPaymentId) {
            setPaymentStatus('completed');
            setPaymentId(storedPaymentId);
        }

        // Lấy thông tin bác sĩ
        const fetchDoctorInfo = async () => {
            try {
                if (doctorId) {
                    // Gọi API để lấy thông tin bác sĩ từ ID
                    const response = await doctorsApi.getById(doctorId);
                    if (response.success && response.data) {
                        setSelectedDoctor(response.data);
                    } else {
                        // Tạm thời dùng dữ liệu mẫu nếu API không thành công
                        const mockDoctor = {
                            id: doctorId,
                            name: 'Dr. Nguyễn Văn An',
                            specialty: 'Tim mạch',
                            consultationFee: '500.000 VNĐ',
                        };
                        setSelectedDoctor(mockDoctor);
                    }
                }
            } catch (error) {
                console.error("Error fetching doctor details:", error);
                // Tạm thời dùng dữ liệu mẫu
                const mockDoctor = {
                    id: doctorId,
                    name: 'Dr. Nguyễn Văn An',
                    specialty: 'Tim mạch',
                    consultationFee: '500.000 VNĐ',
                };
                setSelectedDoctor(mockDoctor);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorInfo();
    }, []);

    // Xử lý khi người dùng chọn thời gian
    const handleSelectTimeSlot = (date: string, startTime: string, endTime: string) => {
        setSelectedTimeSlot({ date, startTime, endTime });
    };

    // Xử lý khi người dùng chọn thời gian và xác nhận đặt lịch
    const handleConfirmBooking = async () => {
        if (!user || !selectedDoctor || !selectedTimeSlot) {
            Swal.fire('Lỗi', 'Vui lòng chọn thời gian khám', 'error');
            return;
        }

        try {
            // Chuẩn bị dữ liệu đặt lịch
            const appointmentData = {
                patient_id: user.id,
                doctor_id: selectedDoctor.id,
                appointment_date: selectedTimeSlot.date,
                appointment_time: `${selectedTimeSlot.startTime}-${selectedTimeSlot.endTime}`,
                duration_minutes: 30, // Assuming 30 minute appointments
                type: 'consultation' as const,
                notes: `Đặt lịch khám với ${selectedDoctor.name} - Mã thanh toán: ${paymentId}`,
                symptoms: 'Khám tư vấn'
            };

            // Gọi API để lưu thông tin đặt lịch vào hệ thống
            const response = await appointmentsApi.create(appointmentData);

            if (!response.success) {
                throw new Error(response.error?.message || 'Không thể đặt lịch');
            }

            // Sau khi lưu thành công, hiển thị thông báo
            Swal.fire({
                title: 'Đặt lịch thành công!',
                text: 'Lịch khám của bạn đã được xác nhận',
                icon: 'success',
                confirmButtonText: 'Xem lịch khám'
            }).then(() => {
                // Xóa thông tin thanh toán đã lưu
                localStorage.removeItem('paymentCompleted');
                localStorage.removeItem('paymentId');
                localStorage.removeItem('selectedDoctorId');

                // Chuyển đến trang quản lý lịch hẹn
                router.push('/patient/appointments');
            });
        } catch (error) {
            console.error("Error saving appointment:", error);
            Swal.fire('Lỗi', 'Không thể đặt lịch. Vui lòng thử lại', 'error');
        }
    };

    const stepContent = () => {
        if (paymentStatus === 'completed') {
            return (
                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center mb-6">
                                <div className="rounded-full bg-green-100 p-3">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-center mb-6">Thanh toán thành công!</h2>

                            <div className="bg-gray-50 p-6 rounded-lg mb-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bác sĩ:</span>
                                        <span className="font-medium">{selectedDoctor?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Chuyên khoa:</span>
                                        <span className="font-medium">{selectedDoctor?.specialty}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Phí tư vấn:</span>
                                        <span className="font-medium">{selectedDoctor?.consultationFee}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mã thanh toán:</span>
                                        <span className="font-medium">{paymentId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-6">
                                <p className="text-gray-600">Vui lòng chọn thời gian khám phù hợp với bạn để hoàn tất đặt lịch</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div
                                        className={`border rounded-md p-4 cursor-pointer ${selectedTimeSlot?.date === '2024-06-10' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500'}`}
                                        onClick={() => handleSelectTimeSlot('2024-06-10', '15:30', '16:00')}
                                    >
                                        <div className="flex items-center mb-2">
                                            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                                            <span className="font-medium">Thứ 2, 10/06/2024</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>15:30 - 16:00</span>
                                        </div>
                                    </div>

                                    <div
                                        className={`border rounded-md p-4 cursor-pointer ${selectedTimeSlot?.date === '2024-06-11' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500'}`}
                                        onClick={() => handleSelectTimeSlot('2024-06-11', '09:00', '09:30')}
                                    >
                                        <div className="flex items-center mb-2">
                                            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                                            <span className="font-medium">Thứ 3, 11/06/2024</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>09:00 - 09:30</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleConfirmBooking}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg"
                                    disabled={!selectedTimeSlot}
                                >
                                    Xác nhận đặt lịch
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto text-center">
                <Card className="shadow-lg">
                    <CardContent className="p-8">
                        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4">Bạn chưa hoàn tất thanh toán</h2>
                        <p className="text-gray-600 mb-6">
                            Vui lòng thanh toán phí tư vấn để tiếp tục đặt lịch khám với bác sĩ
                        </p>
                        <Button
                            onClick={() => router.push(`/doctors/${localStorage.getItem('selectedDoctorId')}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                        >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Quay lại thanh toán
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <RoleBasedLayout title="Đặt lịch khám" activePage="booking">
            <div className="py-8">
                <h1 className="text-2xl font-bold mb-6">Đặt lịch khám</h1>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : stepContent()}
            </div>
        </RoleBasedLayout>
    );
}