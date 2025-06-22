'use client';

import { useState, useEffect } from 'react';

interface Payment {
    id: string;
    order_code: string;
    amount: number;
    description: string;
    status: string;
    payment_method: string;
    doctor_name: string;
    created_at: string;
    paid_at: string;
}

export default function TestPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/test-payments');
            const result = await response.json();

            if (result.success) {
                setPayments(result.data);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Lỗi kết nối');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">
                            🧪 Test Lịch Sử Thanh Toán
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Kiểm tra kết nối database và hiển thị payments
                        </p>
                    </div>

                    <div className="p-6">
                        {error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="text-red-400">❌</div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Lỗi
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💳</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Chưa có thanh toán nào
                                </h3>
                                <p className="text-gray-500">
                                    Không tìm thấy giao dịch thanh toán nào trong hệ thống.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Tìm thấy {payments.length} giao dịch
                                    </h2>
                                    <button
                                        onClick={fetchPayments}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        🔄 Làm mới
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    {payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-lg font-semibold text-gray-900">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                            ✅ {payment.status}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-gray-700 mb-2">
                                                        <strong>Mô tả:</strong> {payment.description}
                                                    </p>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <strong>Mã đơn:</strong> {payment.order_code}
                                                        </div>
                                                        <div>
                                                            <strong>Bác sĩ:</strong> {payment.doctor_name}
                                                        </div>
                                                        <div>
                                                            <strong>Phương thức:</strong> {payment.payment_method}
                                                        </div>
                                                        <div>
                                                            <strong>Ngày tạo:</strong> {formatDate(payment.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
