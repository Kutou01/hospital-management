'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

export default function MockPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [countdown, setCountdown] = useState(5);
    const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');

    const orderCode = searchParams?.get('orderCode') || '';
    const amount = searchParams?.get('amount') || '0';
    const doctorId = searchParams?.get('doctorId') || '';
    const doctorName = searchParams?.get('doctorName') || '';

    useEffect(() => {
        // Simulate payment processing
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Auto succeed for testing
                    setStatus('success');

                    // Redirect to success page after 2 seconds
                    setTimeout(() => {
                        router.push(`/api/payment/success?orderCode=${orderCode}&doctorId=${doctorId}&doctorName=${encodeURIComponent(doctorName)}&amount=${amount}`);
                    }, 2000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [orderCode, amount, router, doctorId, doctorName]);

    const handleManualSuccess = () => {
        router.push(`/api/payment/success?orderCode=${orderCode}&doctorId=${doctorId}&doctorName=${encodeURIComponent(doctorName)}&amount=${amount}`);
    };

    const handleManualFail = () => {
        router.push(`/api/payment/cancel?orderCode=${orderCode}&reason=user_cancelled`);
    };

    const handleRetry = () => {
        setStatus('processing');
        setCountdown(5);
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="p-8 text-center">
                        {status === 'processing' && (
                            <>
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <h2 className="text-xl font-semibold mb-2">Đang xử lý thanh toán</h2>

                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>Mã đơn hàng: <span className="font-mono font-semibold">{orderCode}</span></div>
                                        <div>Bác sĩ: <span className="font-semibold">{doctorName}</span></div>
                                        <div>Số tiền: <span className="font-semibold text-blue-600">{parseInt(amount).toLocaleString('vi-VN')} VNĐ</span></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center space-x-2 mb-4">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <p className="text-sm text-gray-500">
                                        Tự động hoàn thành sau {countdown} giây...
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs text-gray-400">Trang test - Chọn kết quả:</p>
                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            onClick={handleManualSuccess}
                                            className="bg-green-600 hover:bg-green-700 flex-1"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Thành công
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={handleManualFail}
                                            className="flex-1"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Thất bại
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-green-600 mb-2">Thanh toán thành công!</h2>
                                <p className="text-gray-600 mb-4">
                                    Đang chuyển đến trang xác nhận...
                                </p>
                                <div className="w-full bg-green-200 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full animate-pulse w-full"></div>
                                </div>
                            </>
                        )}

                        {status === 'failed' && (
                            <>
                                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-red-600 mb-2">Thanh toán thất bại</h2>
                                <p className="text-gray-600 mb-6">
                                    Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
                                </p>
                                <div className="space-y-2">
                                    <Button onClick={handleRetry} className="w-full">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Thử lại
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.back()}
                                        className="w-full"
                                    >
                                        Quay lại
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}