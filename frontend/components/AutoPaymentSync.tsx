'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface AutoSyncResult {
    checked: number;
    updated: number;
    results: Array<{
        order_code: string;
        status: string;
        message: string;
    }>;
}

export default function AutoPaymentSync() {
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncCount, setSyncCount] = useState<number>(0);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [errorCount, setErrorCount] = useState(0);
    const [pauseSync, setPauseSync] = useState(false);
    const [recentPayments, setRecentPayments] = useState<string[]>([]);

    // Đồng bộ thanh toán tự động mỗi 8 giây
    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (pauseSync) {
                console.log('⏸️ [Auto Sync] Paused. Skipping sync cycle.');
                return;
            }

            try {
                setIsSyncing(true);
                console.log('🔄 [Auto Sync] Starting automatic payment synchronization...');

                // Gọi API đồng bộ thanh toán
                const response = await fetch('/api/payment/auto-sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        priorityOrderCodes: recentPayments
                    })
                });

                // Xử lý kết quả
                if (response.ok) {
                    setConnectionStatus('connected');
                    setErrorCount(0);
                    const data = await response.json();

                    if (data.success && data.updated > 0) {
                        // Thông báo cho các components khác về việc đồng bộ thành công
                        window.dispatchEvent(new CustomEvent('paymentSyncUpdate', {
                            detail: {
                                count: data.updated,
                                timestamp: new Date().toISOString(),
                                updatedPayments: data.results || []
                            }
                        }));

                        // Nếu có thanh toán cập nhật thành công, hiển thị thông báo
                        if (data.updated > 0) {
                            console.log(`✅ [Auto Sync] Updated ${data.updated} payments`);
                        }
                    }
                } else {
                    throw new Error(`API returned ${response.status}`);
                }

                // Cập nhật thời gian đồng bộ cuối cùng
                setLastSync(new Date().toISOString());
                setSyncCount(prev => prev + 1);
            } catch (error) {
                console.error('❌ [Auto Sync] Error:', error);
                setConnectionStatus('error');
                setErrorCount(prev => prev + 1);

                // Sau 5 lỗi liên tiếp, tạm dừng đồng bộ
                if (errorCount >= 4) {
                    console.log('⚠️ [Auto Sync] Too many errors, pausing sync temporarily');
                    setPauseSync(true);

                    // Tự động khôi phục sau 30 giây
                    setTimeout(() => {
                        setPauseSync(false);
                        setErrorCount(0);
                        console.log('🔄 [Auto Sync] Resuming after pause');
                    }, 30000);
                }
            } finally {
                setIsSyncing(false);
            }
        };

        // Khởi tạo interval
        const interval = setInterval(checkPaymentStatus, 4000); // 4 giây thay vì 8 giây

        // Chạy lần đầu tiên ngay lập tức 
        checkPaymentStatus();

        return () => clearInterval(interval);
    }, [pauseSync, errorCount, recentPayments]);

    // Lắng nghe sự kiện đồng bộ cho thanh toán cụ thể
    useEffect(() => {
        const handlePaymentSuccess = (event: CustomEvent) => {
            // Thêm order code vào danh sách ưu tiên đồng bộ
            if (event.detail?.orderCode) {
                console.log('🔔 [Auto Sync] Payment success event received:', event.detail.orderCode);
                setRecentPayments(prev => {
                    // Thêm vào đầu danh sách và giữ tối đa 5 thanh toán gần nhất
                    const newList = [event.detail.orderCode, ...prev].slice(0, 5);
                    return newList;
                });

                // Kích hoạt đồng bộ ngay lập tức
                setTimeout(async () => {
                    try {
                        console.log('🔄 [Auto Sync] Immediate sync for new payment:', event.detail.orderCode);
                        const response = await fetch(`/api/payment/check-status?orderCode=${event.detail.orderCode}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            cache: 'no-store',
                            next: { revalidate: 0 }
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log('✅ [Auto Sync] Immediate check result:', data);

                            // Thông báo cập nhật cho payment history page
                            window.dispatchEvent(new CustomEvent('specificPaymentUpdated', {
                                detail: {
                                    orderCode: event.detail.orderCode,
                                    status: data.status || 'updated',
                                    timestamp: new Date().toISOString()
                                }
                            }));
                        }
                    } catch (error) {
                        console.error('❌ [Auto Sync] Error during immediate sync:', error);
                    }
                }, 1000); // Đợi 1 giây sau sự kiện thành công
            }
        };

        window.addEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
        window.addEventListener('specificPaymentUpdated', (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.orderCode) {
                console.log('🔔 [Auto Sync] Payment specific update:', customEvent.detail.orderCode);
                // Kích hoạt đồng bộ cho thanh toán cụ thể
                setRecentPayments(prev => {
                    // Thêm vào đầu danh sách và giữ tối đa 5 thanh toán gần nhất
                    return [...new Set([customEvent.detail.orderCode, ...prev])].slice(0, 5);
                });
            }
        });

        return () => {
            window.removeEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
            window.removeEventListener('specificPaymentUpdated', handlePaymentSuccess as EventListener);
        };
    }, []);

    // Kiểm tra xem có orderCode trong URL không để đồng bộ thanh toán cụ thể
    const checkAndSyncSpecificPayment = () => {
        if (typeof window === 'undefined') return;

        try {
            const url = new URL(window.location.href);
            const orderCode = url.searchParams.get('orderCode') || url.searchParams.get('order_code');

            if (orderCode) {
                console.log(`🔍 [AutoSync] Found order code in URL: ${orderCode}, checking payment status`);
                checkSpecificPayment(orderCode);
            }
        } catch (error) {
            console.error('❌ [AutoSync] Error checking URL for order code:', error);
        }
    };

    // Đồng bộ một thanh toán cụ thể theo orderCode
    const checkSpecificPayment = async (orderCode: string) => {
        try {
            console.log(`🔍 [AutoSync] Checking specific payment: ${orderCode}`);
            const response = await fetch(`/api/payment/check-status?orderCode=${orderCode}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log(`✅ [AutoSync] Payment check result:`, result);

                // Nếu payment đã được cập nhật, trigger một event
                if (result.updated) {
                    console.log(`🔔 [AutoSync] Payment ${orderCode} was updated to status: ${result.data?.status}`);
                    const updateEvent = new CustomEvent('specificPaymentUpdated', {
                        detail: {
                            orderCode,
                            status: result.data?.status,
                            timestamp: new Date().toISOString()
                        }
                    });
                    window.dispatchEvent(updateEvent);
                }
            } else {
                console.error(`❌ [AutoSync] Error checking payment ${orderCode}:`, result.error);
            }
        } catch (error) {
            console.error(`❌ [AutoSync] Error checking payment ${orderCode}:`, error);
        }
    };

    // Chạy recovery process để khôi phục các thanh toán thiếu patient_id
    const runPaymentRecovery = async () => {
        try {
            // Kiểm tra số lượng thanh toán cần khôi phục
            const checkResponse = await fetch('/api/payment/recover-missing');
            const checkData = await checkResponse.json();

            if (checkData.success && checkData.missing_count > 0) {
                console.log(`🔍 [AutoSync] Found ${checkData.missing_count} payments needing recovery`);

                // Chạy quy trình khôi phục
                const recoveryResponse = await fetch('/api/payment/recover-missing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const recoveryData = await recoveryResponse.json();

                if (recoveryData.success) {
                    console.log(`✅ [AutoSync] Recovery completed: ${recoveryData.data?.recovered || 0}/${recoveryData.data?.total || 0} payments recovered`);

                    // Thông báo cho các thành phần khác về việc khôi phục hoàn tất
                    const recoveryEvent = new CustomEvent('paymentRecoveryUpdate', {
                        detail: {
                            timestamp: new Date().toISOString(),
                            total: recoveryData.data?.total || 0,
                            recovered: recoveryData.data?.recovered || 0
                        }
                    });
                    window.dispatchEvent(recoveryEvent);
                } else {
                    console.error('❌ [AutoSync] Recovery process failed:', recoveryData.error);
                }
            } else {
                console.log('✅ [AutoSync] No payments need recovery at this time');
            }
        } catch (error) {
            console.error('❌ [AutoSync] Error during recovery process:', error);
        }
    };

    // Đồng bộ theo lịch trình
    useEffect(() => {
        console.log('🚀 [AutoSync] AutoPaymentSync component mounted');

        // Đồng bộ ngay khi component được mount
        checkAndSyncSpecificPayment();

        // Kiểm tra URL ngay khi component được mount
        checkAndSyncSpecificPayment();

        // Đồng bộ tự động mỗi 8 giây (thay vì 10 giây)
        const interval = setInterval(checkAndSyncSpecificPayment, 8000);

        // Cleanup khi component unmount
        return () => {
            console.log('🛑 [AutoSync] AutoPaymentSync component unmounted');
            clearInterval(interval);
        };
    }, []);

    // Monitor location change to check for order_code parameter
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleLocationChange = () => {
                checkAndSyncSpecificPayment();
            };

            // Listen for popstate event (back/forward navigation)
            window.addEventListener('popstate', handleLocationChange);

            return () => {
                window.removeEventListener('popstate', handleLocationChange);
            };
        }
    }, []);

    // Component tự động đồng bộ này không hiển thị UI
    return null;
}
