import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { paymentApi } from '@/lib/api/payment';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
    doctorId: string;
    doctorName: string;
    amount: number;
    description?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}

export default function PaymentForm({
    doctorId,
    doctorName,
    amount,
    description = `Thanh toán khám bệnh với bác sĩ ${doctorName}`,
    appointmentDate,
    appointmentTime,
    onSuccess,
    onError
}: PaymentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Xử lý khi người dùng nhấn nút thanh toán
    const handlePayment = async () => {
        setLoading(true);

        try {
            // Lưu thông tin đặt lịch vào localStorage để phục hồi sau khi thanh toán
            if (appointmentDate && appointmentTime) {
                localStorage.setItem('pendingBooking', JSON.stringify({
                    doctorId,
                    doctorName,
                    appointmentDate,
                    appointmentTime,
                    amount
                }));
            }

            // Gọi API thanh toán
            const response = await paymentApi.createPayment({
                doctorId,
                doctorName,
                amount,
                description
            });

            // Nếu thanh toán được tạo thành công, chuyển hướng đến trang thanh toán
            if (response.code === '00' && response.data?.checkoutUrl) {
                if (onSuccess) {
                    onSuccess(response.data);
                }
                // Chuyển hướng đến trang thanh toán
                window.location.href = response.data.checkoutUrl;
            } else {
                // Hiển thị lỗi nếu có
                console.error('Lỗi tạo thanh toán:', response.message);
                if (onError) {
                    onError(response.message);
                }
            }
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
            if (onError) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-md border-0 overflow-hidden">
            <CardContent className="p-0">
                <div className="p-6">
                    <div className="mb-4 flex justify-center">
                        <Image
                            src="/assets/images/payment-banner.jpg"
                            alt="Thanh toán"
                            width={300}
                            height={180}
                            className="rounded-md object-cover"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {description}
                            </h2>
                            <p className="text-lg font-bold text-blue-600 mt-2">
                                {amount.toLocaleString('vi-VN')} VNĐ
                            </p>
                        </div>

                        <Button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                "Thanh toán ngay"
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 border-t">
                    <p className="text-sm text-gray-600 text-center">
                        Thanh toán an toàn và bảo mật qua cổng PayOS
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 