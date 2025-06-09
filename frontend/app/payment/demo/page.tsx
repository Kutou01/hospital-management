'use client';

import React, { useState } from 'react';
import SimplePaymentForm from '@/components/features/billing/SimplePaymentForm';
import PaymentForm from '@/components/features/billing/PaymentForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

export default function PaymentDemoPage() {
    const [paymentResult, setPaymentResult] = useState<{
        status: 'success' | 'error' | null;
        message: string;
        data?: any;
    }>({
        status: null,
        message: '',
    });

    const handlePaymentSuccess = (data: any) => {
        setPaymentResult({
            status: 'success',
            message: 'Đã tạo yêu cầu thanh toán thành công, đang chuyển hướng...',
            data,
        });
    };

    const handlePaymentError = (error: any) => {
        setPaymentResult({
            status: 'error',
            message: typeof error === 'string' ? error : 'Có lỗi xảy ra khi tạo thanh toán',
        });
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-center mb-8">Demo Thanh Toán PayOS</h1>

                    {paymentResult.status && (
                        <Alert
                            className={`mb-6 ${paymentResult.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                                }`}
                        >
                            {paymentResult.status === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription>
                                {paymentResult.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Tabs defaultValue="simple" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="simple">Thanh toán đơn giản</TabsTrigger>
                            <TabsTrigger value="advanced">Thanh toán nâng cao</TabsTrigger>
                        </TabsList>

                        <TabsContent value="simple" className="mt-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-0">
                                    <CardTitle className="text-center">Mẫu thanh toán đơn giản</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center py-8">
                                    <SimplePaymentForm
                                        amount={10000}
                                        description="Thanh toán mì tôm"
                                        buttonText="Mua mì tôm"
                                        imageSrc="/assets/images/mitom.jpeg"
                                        onSuccess={handlePaymentSuccess}
                                        onError={handlePaymentError}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="advanced" className="mt-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-0">
                                    <CardTitle className="text-center">Mẫu thanh toán nâng cao</CardTitle>
                                </CardHeader>
                                <CardContent className="py-8">
                                    <div className="max-w-md mx-auto">
                                        <PaymentForm
                                            doctorId="demo-doctor-123"
                                            doctorName="Nguyễn Văn A"
                                            amount={200000}
                                            description="Thanh toán khám bệnh với bác sĩ Nguyễn Văn A"
                                            appointmentDate="2023-06-15"
                                            appointmentTime="09:30"
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-12 bg-blue-50 p-6 rounded-lg">
                        <h3 className="font-semibold text-xl mb-4">Hướng dẫn tích hợp thanh toán</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>Import component từ <code className="bg-gray-100 px-1 rounded">@/components/features/billing/PaymentForm</code> hoặc <code className="bg-gray-100 px-1 rounded">SimplePaymentForm</code></li>
                            <li>Truyền các props cần thiết như doctorId, amount, description, v.v.</li>
                            <li>Xử lý các events onSuccess và onError</li>
                            <li>Có thể tùy chỉnh giao diện và thông tin thanh toán</li>
                        </ul>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
} 