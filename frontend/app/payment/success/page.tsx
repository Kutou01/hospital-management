'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Calendar, Clock, User, ClipboardList, FileText, ArrowRightCircle, Download, Stethoscope, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PublicLayout from '@/components/layout/PublicLayout';
import { paymentApi } from '@/lib/api/payment';
import { useAppointmentInvoice } from '@/lib/services/appointment-invoice.service';
import { AppointmentEmailService } from '@/lib/services/appointment-email.service';

interface BookingDetails {
    doctorId: string;
    doctorName: string;
    recordId: string;
    amount: number;
    orderCode: string;
    paymentDate: string;
    appointmentDate?: string;
    appointmentTime?: string;
    specialty?: string;
    symptoms?: string;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
}

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { downloadInvoice } = useAppointmentInvoice();

    const orderCode = searchParams.get('orderCode') || '';
    const amount = searchParams.get('amount') || '0';
    const doctorName = searchParams.get('doctorName') || '';
    const patientId = searchParams.get('patientId') || '';
    const appointmentId = searchParams.get('appointmentId') || '';
    const status = searchParams.get('status') || '';

    const [loading, setLoading] = useState(true);
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const [error, setError] = useState('');

    // Load booking details from URL parameters or localStorage
    useEffect(() => {
        // Set a small timeout to allow any redirects to complete
        const timer = setTimeout(() => {
            try {
                console.log('Payment Success Page - URL Params:', {
                    orderCode,
                    amount,
                    doctorName,
                    patientId,
                    appointmentId,
                    status
                });

                // Check if we have payment success status from PayOS
                if (status === 'PAID' && orderCode && amount) {
                    // Get detailed booking data from localStorage
                    const savedBookingData = localStorage.getItem('chatbot_booking_draft');
                    let bookingData = null;

                    if (savedBookingData) {
                        try {
                            bookingData = JSON.parse(savedBookingData);
                        } catch (e) {
                            console.error('Error parsing booking data:', e);
                        }
                    }

                    // Payment was successful, combine URL parameters with localStorage data
                    const bookingDetails = {
                        doctorId: bookingData?.selectedDoctor?.doctor_id || '',
                        doctorName: bookingData?.selectedDoctor?.doctor_name || decodeURIComponent(doctorName) || 'Bác sĩ',
                        recordId: appointmentId || orderCode,
                        amount: parseInt(amount),
                        orderCode: orderCode,
                        paymentDate: new Date().toISOString(),
                        appointmentDate: bookingData?.selectedDate || new Date().toLocaleDateString('vi-VN'),
                        appointmentTime: bookingData?.selectedTime || '09:00',
                        specialty: bookingData?.selectedDoctor?.specialty_name || bookingData?.selectedSpecialty || 'Chuyên khoa',
                        symptoms: bookingData?.symptoms || bookingData?.patientSymptoms || '',
                        patientName: bookingData?.patientName || bookingData?.patientFormData?.name || '',
                        patientEmail: bookingData?.patientEmail || bookingData?.patientFormData?.email || '',
                        patientPhone: bookingData?.patientPhone || bookingData?.patientFormData?.phone || ''
                    };

                    setBookingDetails(bookingDetails);

                    // 🎯 GỬI EMAIL SAU KHI THANH TOÁN THÀNH CÔNG
                    sendPaymentSuccessEmail(bookingDetails);

                    setLoading(false);
                    return;
                }

                // Try to get payment data from localStorage as fallback
                const paymentDataStr = localStorage.getItem('paymentCompleted');
                const savedBookingData = localStorage.getItem('chatbot_booking_draft');
                let bookingData = null;

                if (savedBookingData) {
                    try {
                        bookingData = JSON.parse(savedBookingData);
                    } catch (e) {
                        console.error('Error parsing booking data:', e);
                    }
                }

                if (paymentDataStr) {
                    const paymentData = JSON.parse(paymentDataStr);
                    setBookingDetails({
                        ...paymentData,
                        amount: paymentData.amount || parseInt(amount),
                        orderCode: paymentData.orderCode || orderCode,
                        appointmentDate: paymentData.appointmentDate || bookingData?.selectedDate || '28/06/2023',
                        appointmentTime: paymentData.appointmentTime || bookingData?.selectedTime || '09:30',
                        specialty: bookingData?.selectedDoctor?.specialty_name || bookingData?.selectedSpecialty || '',
                        symptoms: bookingData?.symptoms || bookingData?.patientSymptoms || '',
                        patientName: bookingData?.patientName || bookingData?.patientFormData?.name || '',
                        patientEmail: bookingData?.patientEmail || bookingData?.patientFormData?.email || '',
                        patientPhone: bookingData?.patientPhone || bookingData?.patientFormData?.phone || ''
                    });
                } else if (orderCode) {
                    // Last resort: verify the payment order using API
                    verifyPayment(orderCode);
                } else {
                    throw new Error('Không tìm thấy thông tin thanh toán');
                }
            } catch (err) {
                console.error('Error loading booking details:', err);
                setError('Không thể tải thông tin thanh toán');
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [orderCode, amount, doctorName, patientId, appointmentId, status]);

    // 🎯 Gửi email sau khi thanh toán thành công
    const sendPaymentSuccessEmail = async (details: BookingDetails) => {
        try {
            // Lấy email từ localStorage hoặc session
            const savedBookingData = localStorage.getItem('chatbot_booking_draft');
            console.log('🔍 [DEBUG] localStorage data:', savedBookingData);

            let patientEmail = '';
            let patientName = '';
            let patientPhone = '';

            if (savedBookingData) {
                const bookingData = JSON.parse(savedBookingData);
                console.log('🔍 [DEBUG] Parsed booking data:', bookingData);
                console.log('🔍 [DEBUG] patientFormData:', bookingData.patientFormData);
                console.log('🔍 [DEBUG] All keys in bookingData:', Object.keys(bookingData));

                // Thử nhiều cách lấy email
                patientEmail = bookingData.patientFormData?.email ||
                              bookingData.email ||
                              bookingData.patientEmail || '';

                patientName = bookingData.patientFormData?.name ||
                             bookingData.name ||
                             bookingData.patientName || '';

                patientPhone = bookingData.patientFormData?.phone ||
                              bookingData.phone ||
                              bookingData.patientPhone || '';

                console.log('🔍 [DEBUG] Extracted email:', patientEmail);
                console.log('🔍 [DEBUG] Extracted name:', patientName);
            }

            if (!patientEmail) {
                console.log('📧 No patient email found, skipping email notification');
                console.log('🔍 [DEBUG] Available localStorage keys:', Object.keys(localStorage));
                return;
            }

            const emailData = {
                patientName: patientName || 'Bệnh nhân',
                patientEmail: patientEmail,
                patientPhone: patientPhone || '',
                appointmentId: details.recordId,
                doctorName: details.doctorName,
                specialty: 'Tư vấn',
                appointmentDate: details.appointmentDate,
                appointmentTime: details.appointmentTime,
                symptoms: 'Đã thanh toán thành công',
                hospitalName: 'Bệnh viện Đa khoa',
                hospitalAddress: '123 Đường ABC, Quận XYZ, TP.HCM',
                hospitalPhone: '(028) 1234 5678'
            };

            console.log('📧 Sending payment success email...', emailData);

            const emailResult = await AppointmentEmailService.sendAppointmentConfirmationEmail(emailData);

            if (emailResult.success) {
                console.log('✅ Payment success email sent successfully');
            } else {
                console.error('❌ Payment success email failed:', emailResult.message);
            }
        } catch (emailError) {
            console.error('❌ Payment success email service error:', emailError);
        }
    };

    // Verify payment status
    const verifyPayment = async (orderCode: string) => {
        try {
            const response = await paymentApi.verifyPayment(orderCode);

            if (response.success && response.data) {
                // Get detailed booking data from localStorage
                const savedBookingData = localStorage.getItem('chatbot_booking_draft');
                let bookingData = null;

                if (savedBookingData) {
                    try {
                        bookingData = JSON.parse(savedBookingData);
                    } catch (e) {
                        console.error('Error parsing booking data:', e);
                    }
                }

                // Payment verified successfully
                setBookingDetails({
                    doctorId: response.data.doctorId || bookingData?.selectedDoctor?.doctor_id || '',
                    doctorName: response.data.doctorName || bookingData?.selectedDoctor?.doctor_name || 'Bác sĩ',
                    recordId: response.data.recordId || '',
                    amount: response.data.amount || parseInt(amount),
                    orderCode: orderCode,
                    paymentDate: new Date().toISOString(),
                    appointmentDate: response.data.appointmentDate || bookingData?.selectedDate || '28/06/2023',
                    appointmentTime: response.data.appointmentTime || bookingData?.selectedTime || '09:30',
                    specialty: bookingData?.selectedDoctor?.specialty_name || bookingData?.selectedSpecialty || '',
                    symptoms: bookingData?.symptoms || bookingData?.patientSymptoms || '',
                    patientName: bookingData?.patientName || bookingData?.patientFormData?.name || '',
                    patientEmail: bookingData?.patientEmail || bookingData?.patientFormData?.email || '',
                    patientPhone: bookingData?.patientPhone || bookingData?.patientFormData?.phone || ''
                });
            } else {
                throw new Error(response.error?.message || 'Không thể xác minh thanh toán');
            }
        } catch (err: any) {
            console.error('Payment verification error:', err);
            setError(err.message || 'Không thể xác minh thanh toán');
        } finally {
            setLoading(false);
        }
    };

    // Render loading state
    if (loading) {
        return (
            <PublicLayout currentPage="payment">
                <div className="py-16 bg-gray-50 min-h-screen">
                    <div className="container mx-auto px-4">
                        <div className="max-w-md mx-auto text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#003087] mx-auto mb-6"></div>
                            <h2 className="text-xl font-semibold mb-2">Đang xác nhận thanh toán...</h2>
                            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    // Render error state
    if (error || !bookingDetails) {
        return (
            <PublicLayout currentPage="payment">
                <div className="py-16 bg-gray-50 min-h-screen">
                    <div className="container mx-auto px-4">
                        <div className="max-w-md mx-auto">
                            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full text-red-500 mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-semibold text-gray-800 mb-3">Đã xảy ra lỗi</h1>
                                <p className="text-gray-600 mb-6">{error || 'Không thể xác nhận thông tin đặt lịch'}</p>
                                <div className="flex gap-4 justify-center">
                                    <Button onClick={() => router.push('/')} variant="outline">
                                        Về trang chủ
                                    </Button>
                                    <Button onClick={() => router.push('/doctors')}>
                                        Đặt lịch lại
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout currentPage="payment">
            <div className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        {/* Success Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full text-green-500 mb-6">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Đặt lịch thành công!</h1>
                            <p className="text-lg text-gray-600">
                                Cảm ơn bạn đã đặt lịch khám bệnh
                            </p>
                        </div>

                        {/* Booking Details Card */}
                        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
                            <div className="bg-[#003087] text-white p-6">
                                <h2 className="text-xl font-semibold">Chi tiết lịch khám</h2>
                                <p className="text-blue-100">Mã đơn: {bookingDetails.orderCode}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Doctor Info */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Bác sĩ</h3>
                                        <p className="text-lg font-medium">{bookingDetails.doctorName}</p>
                                        {bookingDetails.specialty && (
                                            <p className="text-sm text-gray-500">Chuyên khoa: {bookingDetails.specialty}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Specialty Info */}
                                {bookingDetails.specialty && (
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <Stethoscope className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Chuyên khoa</h3>
                                            <p className="text-lg font-medium">{bookingDetails.specialty}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Symptoms Info */}
                                {bookingDetails.symptoms && (
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-red-100 rounded-full">
                                            <Heart className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Triệu chứng</h3>
                                            <p className="text-lg font-medium">{bookingDetails.symptoms}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Appointment Date */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Ngày khám</h3>
                                        <p className="text-lg font-medium">{bookingDetails.appointmentDate}</p>
                                    </div>
                                </div>

                                {/* Appointment Time */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Clock className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Giờ khám</h3>
                                        <p className="text-lg font-medium">{bookingDetails.appointmentTime}</p>
                                    </div>
                                </div>

                                {/* Medical Record */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <ClipboardList className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Bệnh án</h3>
                                        <p className="text-lg font-medium">
                                            <Button
                                                variant="link"
                                                className="p-0 text-blue-600 h-auto"
                                                onClick={() => router.push(`/patient/medical-records/${bookingDetails.recordId}`)}
                                            >
                                                Xem chi tiết bệnh án
                                            </Button>
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Thanh toán</h3>
                                        <p className="text-lg font-medium text-green-600">
                                            {parseInt(bookingDetails.amount.toString()).toLocaleString('vi-VN')} VNĐ - Đã thanh toán
                                        </p>
                                    </div>
                                </div>

                                <hr className="my-4" />

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-blue-700 flex items-start">
                                        <FileText className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>
                                            Vui lòng đến khám đúng giờ. Mang theo giấy tờ tùy thân và thẻ BHYT (nếu có).
                                            Bạn có thể xem lại thông tin lịch khám này trong phần "Lịch hẹn của tôi".
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => downloadInvoice(orderCode)}
                                className="flex items-center justify-center"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                Tải hóa đơn PDF
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/patient/appointments')}
                                className="flex items-center justify-center"
                            >
                                <Calendar className="mr-2 h-5 w-5" />
                                Lịch hẹn của tôi
                            </Button>

                            <Button
                                onClick={() => router.push('/patient/dashboard')}
                                className="bg-[#003087] hover:bg-[#002266] flex items-center justify-center"
                            >
                                <ArrowRightCircle className="mr-2 h-5 w-5" />
                                Trang chủ Bệnh nhân
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
} 