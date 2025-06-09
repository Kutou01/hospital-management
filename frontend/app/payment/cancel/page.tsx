'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Home, ArrowLeft } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

export default function PaymentCancelPage() {
    const router = useRouter();

    // Xử lý khi người dùng muốn thử lại
    const handleTryAgain = () => {
        router.back();
    };

    // Xử lý khi người dùng muốn về trang chủ
    const handleGoHome = () => {
        router.push('/');
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-md mx-auto">
                        <Card className="shadow-lg border-0">
                            <CardContent className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <X className="h-10 w-10 text-red-600" />
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán đã bị hủy</h1>
                                <p className="text-gray-600 mb-8">
                                    Bạn đã hủy quá trình thanh toán hoặc có lỗi xảy ra trong quá trình xử lý.
                                </p>

                                <div className="space-y-4">
                                    <Button
                                        onClick={handleTryAgain}
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Thử lại thanh toán
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleGoHome}
                                        className="w-full py-5"
                                    >
                                        <Home className="mr-2 h-5 w-5" />
                                        Về trang chủ
                                    </Button>
                                </div>

                                <p className="mt-8 text-sm text-gray-500">
                                    Nếu bạn gặp vấn đề khi thanh toán, vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
} 