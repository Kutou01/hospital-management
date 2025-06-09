import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { paymentApi } from '@/lib/api/payment';
import { Loader2 } from 'lucide-react';

interface SimplePaymentFormProps {
    amount?: number;
    description?: string;
    imageSrc?: string;
    buttonText?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}

export default function SimplePaymentForm({
    amount = 10000,
    description = "Thanh toán mì tôm",
    imageSrc = "/assets/images/mitom.jpeg",
    buttonText = "Mua mì tôm",
    onSuccess,
    onError
}: SimplePaymentFormProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Gọi API thanh toán với thông tin cơ bản
            const response = await paymentApi.createPayment({
                doctorId: 'simple-payment', // ID giả
                doctorName: 'Simple Payment',
                amount,
                description
            });

            // Xử lý kết quả từ API
            if (response.code === '00' && response.data?.checkoutUrl) {
                if (onSuccess) {
                    onSuccess(response.data);
                }
                // Chuyển hướng đến trang thanh toán
                window.location.href = response.data.checkoutUrl;
            } else {
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
        <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="simple-payment-form">
            {imageSrc && (
                <div className="mb-4">
                    <Image
                        src={imageSrc}
                        alt={description}
                        width={200}
                        height={150}
                        className="mx-auto"
                    />
                </div>
            )}

            <Button
                type="submit"
                disabled={loading}
                className="w-full py-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                    </>
                ) : (
                    buttonText
                )}
            </Button>

            <style jsx>{`
        .simple-payment-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 300px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
        }
      `}</style>
        </form>
    );
} 