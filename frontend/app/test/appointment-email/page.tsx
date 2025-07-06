'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppointmentEmailService, AppointmentEmailData } from '@/lib/services/appointment-email.service';

export default function TestAppointmentEmailPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Test data mẫu
    const testData: AppointmentEmailData = {
        patientName: 'Đặng Hoài Nam',
        patientEmail: 'namprophunong004@gmail.com',
        patientPhone: '0876065614',
        appointmentId: 'APPT-TEST-' + Date.now(),
        doctorName: 'BS. Lê Minh Tuấn',
        specialty: 'Nội Tổng Hợp',
        appointmentDate: '2025-07-06',
        appointmentTime: '09:00 - 09:30',
        symptoms: 'Đau bụng',
        hospitalName: 'Bệnh viện Đa khoa',
        hospitalAddress: '123 Đường ABC, Quận XYZ, TP.HCM',
        hospitalPhone: '(028) 1234 5678'
    };

    const handleSendTestEmail = async () => {
        try {
            setLoading(true);
            setResult(null);

            console.log('🧪 [Email Test] Sending test appointment email with data:', testData);

            const emailResult = await AppointmentEmailService.sendAppointmentConfirmationEmail(testData);
            
            setResult(emailResult);
            
            if (emailResult.success) {
                console.log('✅ Test email sent successfully');
            } else {
                console.error('❌ Test email failed:', emailResult.message);
            }

        } catch (error: any) {
            console.error('❌ Test email error:', error);
            setResult({
                success: false,
                message: 'Lỗi khi gửi email test',
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const checkConfiguration = () => {
        const isConfigured = AppointmentEmailService.checkConfiguration();
        setResult({
            success: isConfigured,
            message: isConfigured 
                ? 'EmailJS đã được cấu hình đầy đủ' 
                : 'EmailJS chưa được cấu hình đầy đủ. Kiểm tra file .env.local',
            config: {
                serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ? '✅ Có' : '❌ Thiếu',
                templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ? '✅ Có' : '❌ Thiếu',
                publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '✅ Có' : '❌ Thiếu'
            }
        });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        🧪 Test Appointment Email Service
                    </CardTitle>
                    <p className="text-center text-gray-600">
                        Test gửi email xác nhận đặt lịch khám
                    </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Configuration Check */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">1. Kiểm tra cấu hình EmailJS</h3>
                        <Button 
                            onClick={checkConfiguration}
                            variant="outline"
                            className="w-full"
                        >
                            Kiểm tra cấu hình
                        </Button>
                    </div>

                    {/* Test Data Display */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">2. Dữ liệu test</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="text-sm overflow-x-auto">
                                {JSON.stringify(testData, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Send Test Email */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">3. Gửi email test</h3>
                        <Button 
                            onClick={handleSendTestEmail}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Đang gửi...' : 'Gửi email test'}
                        </Button>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">4. Kết quả</h3>
                            <div className={`p-4 rounded-lg ${
                                result.success 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-red-50 border border-red-200'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className={`text-lg ${
                                        result.success ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {result.success ? '✅' : '❌'}
                                    </span>
                                    <span className={`font-semibold ${
                                        result.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                        {result.success ? 'Thành công' : 'Thất bại'}
                                    </span>
                                </div>
                                
                                <p className="text-sm mb-2">{result.message}</p>
                                
                                {result.config && (
                                    <div className="mt-3">
                                        <p className="font-medium text-sm mb-1">Cấu hình:</p>
                                        <ul className="text-xs space-y-1">
                                            <li>Service ID: {result.config.serviceId}</li>
                                            <li>Template ID: {result.config.templateId}</li>
                                            <li>Public Key: {result.config.publicKey}</li>
                                        </ul>
                                    </div>
                                )}
                                
                                {result.error && (
                                    <div className="mt-3">
                                        <p className="font-medium text-sm text-red-700">Lỗi chi tiết:</p>
                                        <p className="text-xs text-red-600">{result.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">5. Hướng dẫn</h3>
                        <div className="bg-blue-50 p-4 rounded-lg text-sm">
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Kiểm tra cấu hình EmailJS trong file .env.local</li>
                                <li>Đảm bảo có Service ID, Template ID và Public Key</li>
                                <li>Gửi email test để kiểm tra</li>
                                <li>Kiểm tra hộp thư đến của email test</li>
                                <li>Nếu thành công, email service đã sẵn sàng!</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
