'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CreditCard, ArrowLeft, User, Stethoscope, Loader2 } from 'lucide-react';

function PaymentPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Get payment details from URL params
    const amount = parseInt(searchParams.get('amount') || '0');
    const doctorId = searchParams.get('doctorId');
    const doctorName = searchParams.get('doctorName');
    const patientId = searchParams.get('patientId');
    const recordId = searchParams.get('recordId');
    const description = searchParams.get('description') || 'Thanh toán khám bệnh';

    // Manual sync handler
    const handleManualSync = async () => {
        try {
            const response = await fetch('/api/admin/payment-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours: 1 })
            });
            const data = await response.json();
            if (data.success) {
                alert('✅ Đồng bộ thành công! Vui lòng kiểm tra lịch sử thanh toán.');
            } else {
                alert('❌ Lỗi đồng bộ: ' + data.error);
            }
        } catch (error) {
            alert('❌ Lỗi kết nối khi đồng bộ');
        }
    };

    // Payment handler
    const handlePayment = async () => {
        if (!amount || amount <= 0) {
            console.error('❌ Lỗi - Số tiền thanh toán không hợp lệ');
            return;
        }

        setLoading(true);
        try {
            console.log('🚀 Creating payment...', { amount, doctorId, doctorName });

            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    description,
                    doctorId,
                    doctorName,
                    patientId,
                    recordId
                }),
            });

            const data = await response.json();
            console.log('📊 Payment API response:', data);

            if (data.success && data.data?.checkoutUrl) {
                console.log(`✅ Tạo thanh toán thành công! Mã đơn hàng: ${data.data.orderCode}`);
                // Redirect ngay lập tức không có thông báo
                window.location.href = data.data.checkoutUrl;
            } else {
                const errorMessage = data.error?.message || 'Không thể tạo thanh toán';
                alert(`❌ Lỗi thanh toán: ${errorMessage}`);
            }
        } catch (error) {
            console.error('❌ Payment error:', error);
            alert('❌ Lỗi kết nối - Không thể kết nối đến hệ thống thanh toán');
        } finally {
            setLoading(false);
        }
    };

    // Validate required params
    if (!amount || amount <= 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="bg-white rounded-lg shadow-lg border border-red-200 p-6 text-center">
                        <div className="text-red-500 mb-4">
                            <CreditCard className="h-12 w-12 mx-auto" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Thông tin thanh toán không hợp lệ
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Vui lòng quay lại và thử lại
                        </p>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center px-3 py-2 mb-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </button>

                {/* Payment Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-[#003087] text-white p-6">
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            <CreditCard className="h-5 w-5" />
                            Thanh toán khám bệnh
                        </h1>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Số tiền thanh toán</p>
                                    <p className="text-2xl font-bold text-[#003087]">
                                        {amount.toLocaleString('vi-VN')} VNĐ
                                    </p>
                                </div>
                                <CreditCard className="h-8 w-8 text-[#003087]" />
                            </div>
                        </div>

                        {/* Service Details */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Chi tiết dịch vụ</h3>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Stethoscope className="h-5 w-5 text-gray-600" />
                                <div>
                                    <p className="font-medium">{description}</p>
                                    {doctorName && (
                                        <p className="text-sm text-gray-600">
                                            Bác sĩ: {doctorName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {patientId && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <User className="h-5 w-5 text-gray-600" />
                                    <div>
                                        <p className="font-medium">Mã bệnh nhân</p>
                                        <p className="text-sm text-gray-600">{patientId}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Button */}
                        <div className="pt-4 border-t space-y-3">
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full h-12 bg-[#003087] text-white rounded-lg font-semibold text-lg hover:bg-[#002066] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Đang tạo thanh toán...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Thanh toán ngay với PayOS
                                    </>
                                )}
                            </button>

                            {/* Manual Sync Button */}
                            <button
                                onClick={handleManualSync}
                                className="w-full h-10 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                            >
                                🔄 Đồng bộ trạng thái thanh toán
                            </button>
                        </div>

                        {/* Info */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <div className="text-yellow-600 mt-0.5">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                                    <ul className="space-y-1">
                                        <li>• Bạn sẽ được chuyển hướng đến trang thanh toán PayOS</li>
                                        <li>• Vui lòng hoàn tất thanh toán trong vòng 15 phút</li>
                                        <li>• Sau khi thanh toán thành công, bạn sẽ nhận được xác nhận</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
            </div>
        }>
            <PaymentPageContent />
        </Suspense>
    );
}
