'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailService, PaymentEmailData } from '@/lib/services/email.service';
import { useToast } from '@/components/ui/toast-provider';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailTestPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    
    const [testData, setTestData] = useState<PaymentEmailData>({
        patientName: 'Nguyễn Văn Test',
        patientEmail: 'gpt2k4@gmail.com',
        orderCode: 'TEST-' + Date.now(),
        amount: 300000,
        doctorName: 'Bác sĩ Test Email',
        paymentDate: new Date().toISOString(),
        recordId: 'REC-TEST-001'
    });

    const handleInputChange = (field: keyof PaymentEmailData, value: string | number) => {
        setTestData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSendTestEmail = async () => {
        try {
            setLoading(true);
            setResult(null);

            // Kiểm tra cấu hình EmailJS
            if (!EmailService.checkConfiguration()) {
                setResult({
                    success: false,
                    message: 'Cấu hình EmailJS chưa đầy đủ. Vui lòng kiểm tra file .env.local'
                });
                return;
            }

            console.log('🧪 [Email Test] Sending test email with data:', testData);

            const emailResult = await EmailService.sendPaymentSuccessEmail(testData);
            
            setResult(emailResult);
            
            if (emailResult.success) {
                showToast(
                    "Email test thành công",
                    "Email đã được gửi thành công",
                    "success"
                );
            } else {
                showToast(
                    "Email test thất bại",
                    emailResult.message,
                    "error"
                );
            }

        } catch (error: any) {
            console.error('💥 [Email Test] Error:', error);
            setResult({
                success: false,
                message: `Lỗi không mong muốn: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    const configStatus = EmailService.checkConfiguration();

    return (
        <div className="container max-w-2xl mx-auto my-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Mail className="h-6 w-6" />
                        <span>Test EmailJS - Thông báo thanh toán</span>
                    </CardTitle>
                    <CardDescription>
                        Trang test để kiểm tra tính năng gửi email thông báo thanh toán thành công
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Trạng thái cấu hình */}
                    <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                        configStatus 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                    }`}>
                        {configStatus ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <AlertCircle className="h-5 w-5" />
                        )}
                        <span>
                            {configStatus 
                                ? 'Cấu hình EmailJS đã sẵn sàng'
                                : 'Cấu hình EmailJS chưa đầy đủ - Kiểm tra .env.local'
                            }
                        </span>
                    </div>

                    {/* Form test data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="patientName">Tên bệnh nhân</Label>
                            <Input
                                id="patientName"
                                value={testData.patientName}
                                onChange={(e) => handleInputChange('patientName', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="patientEmail">Email bệnh nhân</Label>
                            <Input
                                id="patientEmail"
                                type="email"
                                value={testData.patientEmail}
                                onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="orderCode">Mã đơn hàng</Label>
                            <Input
                                id="orderCode"
                                value={testData.orderCode}
                                onChange={(e) => handleInputChange('orderCode', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="amount">Số tiền (VNĐ)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={testData.amount}
                                onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="doctorName">Tên bác sĩ</Label>
                            <Input
                                id="doctorName"
                                value={testData.doctorName}
                                onChange={(e) => handleInputChange('doctorName', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="recordId">Mã hồ sơ</Label>
                            <Input
                                id="recordId"
                                value={testData.recordId || ''}
                                onChange={(e) => handleInputChange('recordId', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Nút gửi test */}
                    <Button 
                        onClick={handleSendTestEmail}
                        disabled={loading || !configStatus}
                        className="w-full"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {loading ? 'Đang gửi email...' : 'Gửi email test'}
                    </Button>

                    {/* Kết quả */}
                    {result && (
                        <div className={`p-4 rounded-lg ${
                            result.success 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            <div className="flex items-center space-x-2">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                                <span className="font-medium">
                                    {result.success ? 'Thành công!' : 'Thất bại!'}
                                </span>
                            </div>
                            <p className="mt-2">{result.message}</p>
                        </div>
                    )}

                    {/* Hướng dẫn */}
                    <div className="bg-blue-50 p-4 rounded-lg text-blue-700 text-sm">
                        <h4 className="font-medium mb-2">Hướng dẫn sử dụng:</h4>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Cấu hình EmailJS theo hướng dẫn trong file <code>docs/EMAILJS_SETUP.md</code></li>
                            <li>Cập nhật thông tin trong file <code>.env.local</code></li>
                            <li>Nhập email thật của bạn vào trường "Email bệnh nhân"</li>
                            <li>Nhấn "Gửi email test" để kiểm tra</li>
                            <li>Kiểm tra hộp thư email (bao gồm cả thư mục spam)</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
