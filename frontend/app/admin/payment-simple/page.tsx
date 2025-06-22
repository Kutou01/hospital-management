'use client';

import React, { useState } from 'react';

export default function SimpleAdminPaymentPage() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');

    const handleManualSync = async () => {
        setIsSyncing(true);
        setSyncStatus('Đang đồng bộ thanh toán từ PayOS...');
        
        try {
            const response = await fetch('/api/admin/payment-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'manual_sync' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                setSyncStatus(`✅ Đồng bộ thành công: ${result.data.synced} giao dịch`);
            } else {
                setSyncStatus(`❌ Lỗi đồng bộ: ${result.error}`);
            }
        } catch (error) {
            setSyncStatus(`❌ Lỗi kết nối: ${error}`);
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncStatus(''), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🏥 Admin Payment Management
                    </h1>
                    <p className="text-gray-600">
                        Quản lý thanh toán và đồng bộ PayOS
                    </p>
                </div>

                {/* Payment Sync Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">🔄 Đồng bộ thanh toán PayOS</h2>
                    
                    {syncStatus && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            {syncStatus}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className={`px-6 py-3 rounded-lg font-medium ${
                                isSyncing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white transition-colors`}
                        >
                            {isSyncing ? '⏳ Đang đồng bộ...' : '🔄 Đồng bộ ngay'}
                        </button>

                        <div className="text-sm text-gray-600">
                            Đồng bộ dữ liệu thanh toán từ PayOS vào database
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-full">
                                <span className="text-2xl">💰</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Tổng doanh thu</h3>
                                <p className="text-2xl font-bold text-green-600">1,750,000 VNĐ</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <span className="text-2xl">📊</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Giao dịch</h3>
                                <p className="text-2xl font-bold text-blue-600">13</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <span className="text-2xl">🔄</span>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Đã đồng bộ</h3>
                                <p className="text-2xl font-bold text-purple-600">85%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">⚡ Thao tác nhanh</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a 
                            href="/patient/payment-history" 
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📋</span>
                                <div>
                                    <h3 className="font-semibold">Xem lịch sử thanh toán</h3>
                                    <p className="text-sm text-gray-600">Xem tất cả giao dịch của bệnh nhân</p>
                                </div>
                            </div>
                        </a>

                        <a 
                            href="/api/patient/payment-history/export?format=excel" 
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📊</span>
                                <div>
                                    <h3 className="font-semibold">Xuất báo cáo Excel</h3>
                                    <p className="text-sm text-gray-600">Tải xuống báo cáo thanh toán</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>🏥 Hospital Management System - Payment Module</p>
                    <p>Cập nhật cuối: {new Date().toLocaleString('vi-VN')}</p>
                </div>
            </div>
        </div>
    );
}
