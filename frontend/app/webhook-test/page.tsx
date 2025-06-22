'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, CheckCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function WebhookTestPage() {
    const [webhookStatus, setWebhookStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const checkWebhook = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/webhook/payos');
            const data = await response.json();
            setWebhookStatus(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);

        try {
            // Gọi API đồng bộ thanh toán
            const response = await fetch('/api/payment/auto-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            setSyncResult(result);

            // Gửi sự kiện để thông báo cho các thành phần khác cập nhật
            if (result.success) {
                const syncEvent = new CustomEvent('paymentSyncUpdate', {
                    detail: {
                        timestamp: new Date().toISOString(),
                        updatedCount: result.data?.updated || 0
                    }
                });
                window.dispatchEvent(syncEvent);
            }
        } catch (error) {
            console.error('Sync error:', error);
            setSyncResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setIsSyncing(false);
        }
    };

    const triggerManualSync = () => {
        // Kích hoạt sự kiện để AutoPaymentSync xử lý
        const event = new Event('triggerPaymentSync');
        window.dispatchEvent(event);
    };

    useEffect(() => {
        checkWebhook();
    }, []);

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Webhook & Thanh Toán Test</h1>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Webhook status */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Trạng thái Webhook</h2>

                    {error && (
                        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
                            {error}
                        </div>
                    )}

                    {webhookStatus && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">Trạng thái:</span>
                                {webhookStatus.status === 'OK' ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Hoạt động
                                    </span>
                                ) : (
                                    <span className="text-red-600">Không hoạt động</span>
                                )}
                            </div>

                            <div className="mb-2">
                                <span className="font-semibold">Thông báo:</span>
                                <p className="mt-1">{webhookStatus.message}</p>
                            </div>

                            <div className="mb-2">
                                <span className="font-semibold">Biến môi trường:</span>
                                <p className="mt-1">{webhookStatus.environmentReady ? 'Đã cấu hình đúng ✅' : 'Chưa cấu hình ❌'}</p>
                            </div>

                            <div>
                                <span className="font-semibold">Thời gian kiểm tra:</span>
                                <p className="mt-1">{new Date(webhookStatus.timestamp).toLocaleString('vi-VN')}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={checkWebhook}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Đang kiểm tra...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Kiểm tra Webhook
                            </>
                        )}
                    </Button>
                </Card>

                {/* Payment sync tester */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Đồng bộ thanh toán</h2>

                    <div className="space-y-4 mb-4">
                        <Button
                            onClick={triggerSync}
                            disabled={isSyncing}
                            className="w-full"
                        >
                            {isSyncing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Đang đồng bộ...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Đồng bộ thanh toán (API trực tiếp)
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={triggerManualSync}
                            variant="outline"
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Kích hoạt đồng bộ (Qua AutoPaymentSync)
                        </Button>

                        <Link href="/patient/payment-history">
                            <Button variant="outline" className="w-full">
                                <ArrowUpRight className="h-4 w-4 mr-2" />
                                Xem lịch sử thanh toán
                            </Button>
                        </Link>
                    </div>

                    {syncResult && (
                        <div className={`p-4 rounded-md ${syncResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className="font-semibold mb-2">
                                {syncResult.success ? 'Đồng bộ thành công ✅' : 'Đồng bộ thất bại ❌'}
                            </h3>

                            {syncResult.success ? (
                                <div>
                                    <p>Kiểm tra: {syncResult.data?.checked || 0} giao dịch</p>
                                    <p>Cập nhật: {syncResult.data?.updated || 0} giao dịch</p>
                                    <p>Thời gian: {syncResult.data?.duration || 0}ms</p>
                                </div>
                            ) : (
                                <p>{syncResult.error}</p>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
} 