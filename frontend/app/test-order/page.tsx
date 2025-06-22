'use client';

import React, { useState, useEffect } from 'react';

export default function TestOrderPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/patient/payment-history?page=1&limit=20');
            const data = await response.json();
            
            if (data.success) {
                setPayments(data.data.payments || []);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🕒 Test Thứ Tự Thời Gian</h1>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Danh sách giao dịch ({payments.length})</h2>
                        <button
                            onClick={fetchPayments}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '⏳ Đang tải...' : '🔄 Refresh'}
                        </button>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                        <p>📋 <strong>Thứ tự mong muốn:</strong> Mới nhất → Cũ nhất (theo paid_at hoặc created_at)</p>
                        <p>🎯 <strong>Kiểm tra:</strong> Giao dịch đầu tiên phải có thời gian mới nhất</p>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tải...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            📭 Không có giao dịch nào
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Mã đơn</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Số tiền</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Trạng thái</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">🕒 Thời gian tạo</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">💰 Thời gian thanh toán</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">🔄 Thời gian cập nhật</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">📊 Thứ tự</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment, index) => {
                                        const createdTime = new Date(payment.created_at).getTime();
                                        const paidTime = payment.paid_at ? new Date(payment.paid_at).getTime() : null;
                                        const updatedTime = new Date(payment.updated_at).getTime();
                                        
                                        // Thời gian để sắp xếp (ưu tiên paid_at)
                                        const sortTime = paidTime || createdTime;
                                        
                                        return (
                                            <tr key={payment.id} className={index === 0 ? "bg-green-50" : "hover:bg-gray-50"}>
                                                <td className="border border-gray-300 px-3 py-2 font-bold">
                                                    {index + 1}
                                                    {index === 0 && <span className="ml-2 text-green-600">👑 MỚI NHẤT</span>}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 font-mono text-xs">
                                                    {payment.order_code}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold text-green-600">
                                                    {new Intl.NumberFormat('vi-VN', { 
                                                        style: 'currency', 
                                                        currency: 'VND' 
                                                    }).format(payment.amount)}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2">
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                                    {formatDateTime(payment.created_at)}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                                    {payment.paid_at ? (
                                                        <span className="text-green-700 font-medium">
                                                            {formatDateTime(payment.paid_at)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">Chưa có</span>
                                                    )}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                                    {formatDateTime(payment.updated_at)}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                                    <div className="space-y-1">
                                                        <div>Sort: {new Date(sortTime).toLocaleString('vi-VN')}</div>
                                                        <div className="text-gray-500">
                                                            {paidTime ? '(paid_at)' : '(created_at)'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Kiểm tra thứ tự */}
                    {payments.length > 1 && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">🔍 Kiểm tra thứ tự:</h3>
                            {(() => {
                                const first = payments[0];
                                const second = payments[1];
                                
                                const firstTime = first.paid_at ? new Date(first.paid_at).getTime() : new Date(first.created_at).getTime();
                                const secondTime = second.paid_at ? new Date(second.paid_at).getTime() : new Date(second.created_at).getTime();
                                
                                const isCorrectOrder = firstTime >= secondTime;
                                
                                return (
                                    <div className={`p-3 rounded ${isCorrectOrder ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {isCorrectOrder ? (
                                            <div>
                                                ✅ <strong>Thứ tự ĐÚNG!</strong> Giao dịch đầu tiên ({first.order_code}) có thời gian mới hơn giao dịch thứ hai ({second.order_code})
                                            </div>
                                        ) : (
                                            <div>
                                                ❌ <strong>Thứ tự SAI!</strong> Giao dịch đầu tiên ({first.order_code}) có thời gian cũ hơn giao dịch thứ hai ({second.order_code})
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="flex gap-4">
                    <a 
                        href="/patient/payment-history" 
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                        📋 Trang Payment History chính
                    </a>
                    <a 
                        href="/test-payment" 
                        className="px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                    >
                        🧪 Trang Test Payment
                    </a>
                </div>
            </div>
        </div>
    );
}
