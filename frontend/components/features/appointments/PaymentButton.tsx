import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import axios from 'axios';

interface PaymentButtonProps {
    amount: number;
    description?: string;
    appointmentId?: string;
    doctorName?: string;
    className?: string;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function PaymentButton({
    amount,
    description = 'Thanh toán đặt lịch khám bệnh',
    appointmentId,
    doctorName,
    className,
    variant = 'default',
    size = 'default'
}: PaymentButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Gọi API tạo yêu cầu thanh toán
            const response = await axios.post('/api/payments/create', {
                amount,
                description: doctorName ? `Thanh toán khám bệnh với bác sĩ ${doctorName}` : description,
                appointmentId
            });

            // Nếu API trả về thành công, có URL thanh toán
            if (response.data.success && response.data.data?.checkoutUrl) {
                // Lưu thông tin cần thiết để khôi phục sau khi thanh toán
                if (appointmentId) {
                    localStorage.setItem('pendingPaymentAppointmentId', appointmentId);
                }

                // Chuyển hướng đến trang thanh toán
                router.push(response.data.data.checkoutUrl);
            } else {
                // Hiển thị lỗi
                showToast(
                    'Tạo thanh toán thất bại',
                    response.data.message || 'Không thể tạo yêu cầu thanh toán',
                    'error'
                );
            }
        } catch (error: any) {
            console.error('Lỗi khi tạo thanh toán:', error);
            showToast(
                'Lỗi',
                error.response?.data?.message || 'Đã xảy ra lỗi khi xử lý thanh toán',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handlePayment}
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán
                </>
            )}
        </Button>
    );
} 