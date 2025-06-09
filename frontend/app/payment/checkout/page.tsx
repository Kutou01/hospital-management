'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { useToast } from "@/components/ui/toast-provider";
import PaymentGateway from '@/components/features/payments/PaymentGateway';

export default function PaymentCheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const doctorId = searchParams.get('doctorId');
    const recordId = searchParams.get('recordId');
    const amountParam = searchParams.get('amount');
    const amount = amountParam ? parseInt(amountParam) : 0;

    const [doctorName, setDoctorName] = useState<string>('');
    const [loadingInfo, setLoadingInfo] = useState(true);

    // Load doctor info from localStorage on mount
    useEffect(() => {
        try {
            const doctorInfoStr = localStorage.getItem('selectedDoctor');
            if (doctorInfoStr) {
                const doctorInfo = JSON.parse(doctorInfoStr);
                setDoctorName(doctorInfo.name || '');
            }
        } catch (e) {
            console.error('Error loading doctor info:', e);
        } finally {
            setLoadingInfo(false);
        }
    }, []);

    // Check for required parameters
    if (!doctorId || !recordId || !amount) {
        return (
            <PublicLayout currentPage="payment">
                <div className="py-12 bg-gray-50 min-h-screen">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <div className="bg-red-50 p-6 rounded-lg text-center">
                            <h2 className="text-xl font-semibold text-red-600 mb-4">Thiếu thông tin thanh toán</h2>
                            <p className="text-gray-700 mb-6">Không thể thực hiện thanh toán do thiếu thông tin cần thiết.</p>
                            <Button
                                onClick={() => router.back()}
                                className="bg-[#003087]"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </Button>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    // Loading state
    if (loadingInfo) {
        return (
            <PublicLayout currentPage="payment">
                <div className="py-12 bg-gray-50 min-h-screen">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#003087]"></div>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    // Success handler
    const handlePaymentSuccess = (data: any) => {
        toast({
            title: "Thanh toán thành công",
            description: "Đơn hàng của bạn đã được xác nhận",
            variant: "success"
        });
    };

    // Error handler
    const handlePaymentError = (error: any) => {
        toast({
            title: "Lỗi thanh toán",
            description: error.message || "Không thể hoàn tất thanh toán",
            variant: "destructive"
        });
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="py-12 bg-gray-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl mx-auto">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            size="sm"
                            className="mb-6"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thanh toán</h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Hoàn tất thanh toán để đặt lịch khám bệnh
                        </p>

                        <PaymentGateway
                            amount={amount}
                            doctorId={doctorId}
                            doctorName={doctorName}
                            recordId={recordId}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            redirectUrl="/payment/success"
                            showBackButton={false}
                        />

                        <div className="mt-6 text-sm text-gray-500 bg-blue-50 p-4 rounded-lg">
                            <p className="mb-2">
                                <strong>Lưu ý:</strong> Sau khi thanh toán thành công, bạn sẽ nhận được email xác nhận đặt lịch.
                            </p>
                            <p>
                                Bạn có thể xem và quản lý lịch hẹn trong phần "Lịch hẹn của tôi" trên trang hồ sơ cá nhân.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
} 