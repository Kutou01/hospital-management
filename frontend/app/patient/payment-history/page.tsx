'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PatientLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Calendar, Search, Download, Eye, Filter, CreditCard,
    Clock, CheckCircle, XCircle, RefreshCw, History, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { PaymentSyncDialog } from './payment-sync-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AuthDebugger from './debug';

interface Payment {
    id: string;
    order_code: string;
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    payment_method: string;
    doctor_name: string;
    created_at: string;
    paid_at: string | null;
    updated_at: string;
    transaction_id?: string;
    payment_link_id?: string;
    payos_sync_at?: string;
    payos_status?: string;
    medical_records?: {
        record_id: string;
        visit_date: string;
        diagnosis: string;
        patients?: {
            patient_id: string;
            full_name: string;
        };
    };
}

interface PaymentSummary {
    totalPaid: number;
    totalTransactions: number;
    averageAmount: number;
    syncedPayments: number;
    syncRate: number;
}

export default function PaymentHistoryPage() {
    console.log('🚀 [Payment History Page] Component mounted/rendered');

    // Move hooks to top level - MUST be outside try-catch
    const supabase = createClient();
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);

    const [summary, setSummary] = useState<PaymentSummary>({
        totalPaid: 0,
        totalTransactions: 0,
        averageAmount: 0,
        syncedPayments: 0,
        syncRate: 0
    });

    // Filters - Bỏ status filter vì API chỉ trả về completed payments
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        orderCode: '',
        doctorId: ''
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const [error, setError] = useState<string | null>(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // New state for auto-sync after payment
    const [autoSyncAfterPayment, setAutoSyncAfterPayment] = useState(true);

    // Thêm state hiển thị debug
    const [showDebugger, setShowDebugger] = useState(false);

    // Thêm state để theo dõi quá trình tự động tạo hồ sơ
    const [autoProfileLoading, setAutoProfileLoading] = useState(false);
    const [autoProfileSuccess, setAutoProfileSuccess] = useState(false);

    // Functions and effects
    const fetchPaymentHistory = useCallback(async (autoSync = true) => {
        console.log('🚀 [Payment History] Starting fetch...');
        setLoading(true);
        setError(null);

        // Debug: Check if we're actually calling this function
        console.log('🔍 [Payment History] Function called with autoSync:', autoSync);
        try {
            // TỰ ĐỘNG ĐỒNG BỘ TRƯỚC KHI LẤY DỮ LIỆU - mặc định là true
            if (autoSync) {
                console.log('🔄 [Payment History] Auto-syncing payments before fetch...');
                try {
                    const syncResponse = await fetch('/api/patient/sync-payment-history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const syncData = await syncResponse.json();
                    if (syncData.success) {
                        console.log('✅ [Payment History] Auto-sync completed:', syncData.data);
                        setSyncSuccess(`Đã tự động đồng bộ ${syncData.data?.updatedCount || 0} thanh toán`);
                        setTimeout(() => setSyncSuccess(null), 3000);
                    } else {
                        console.warn('⚠️ [Payment History] Auto-sync partial success or warning:', syncData.message);
                    }
                } catch (syncError) {
                    console.warn('⚠️ [Payment History] Auto-sync failed, continuing with existing data:', syncError);
                }
            }

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value)
                )
            });

            // Get auth token from Supabase client
            console.log('🔍 [Payment History] About to get session...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            console.log('🔐 [Payment History] Session check:', {
                hasSession: !!session,
                hasAccessToken: !!session?.access_token,
                userId: session?.user?.id,
                userEmail: session?.user?.email,
                sessionError: sessionError?.message
            });

            if (sessionError) {
                console.error('❌ Session error:', sessionError);
                alert('❌ Lỗi xác thực. Vui lòng đăng nhập lại.');
                router.push('/auth/login');
                return;
            }

            if (!session) {
                console.warn('⚠️ No session found, redirecting to login...');
                alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                router.push('/auth/login');
                return;
            }

            if (!session.access_token) {
                console.error('❌ No access token in session');
                alert('❌ Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                router.push('/auth/login');
                return;
            }

            // Thử API mới trước (V2 - qua billing service)
            console.log('📡 [Payment History] Trying V2 API (via billing service)...');
            let response;
            let apiVersion = 'v2';

            try {
                response = await fetch(`/api/patient/payment-history-v2?${params}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error(`V2 API failed: ${response.status}`);
                }

                console.log('✅ [Payment History] V2 API successful');
            } catch (v2Error) {
                console.warn('⚠️ [Payment History] V2 API failed, falling back to V1:', v2Error);
                apiVersion = 'v1';

                // Fallback to original API
                response = await fetch(`/api/patient/payment-history?${params}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    }
                });
            }

            console.log('🔍 [Payment History] API Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                apiVersion: apiVersion,
                headers: Object.fromEntries(response.headers.entries())
            });

            const data = await response.json();
            console.log('📦 [Payment History] Response Data:', {
                success: data.success,
                apiVersion: apiVersion,
                source: data.source,
                paymentsCount: data.data?.payments?.length || 0,
                hasmedicalRecords: data.data?.payments?.some((p: any) => p.medical_records) || false
            });

            if (data.success) {
                setPayments(data.data.payments || []);
                setPagination(data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
                setSummary(data.data.summary || {
                    totalPaid: 0,
                    totalTransactions: 0,
                    averageAmount: 0,
                    syncedPayments: 0,
                    syncRate: 0
                });

                // Log thông tin về medical records nếu có
                const paymentsWithRecords = data.data.payments.filter((p: any) => p.medical_records);
                if (paymentsWithRecords.length > 0) {
                    console.log('✅ [Payment History] Found payments with medical records:', paymentsWithRecords.length);
                }
            } else {
                console.error('Failed to fetch payment history:', data.error);
            }
        } catch (error) {
            console.error('Error fetching payment history:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters]);

    useEffect(() => {
        console.log('🔄 [Payment History] useEffect triggered with:', {
            page: pagination.page,
            filters: filters
        });
        fetchPaymentHistory();
    }, [pagination.page, filters]);

    // Listen cho payment sync updates từ AutoPaymentSync component
    useEffect(() => {
        const handlePaymentSyncUpdate = (event: CustomEvent) => {
            console.log('🔔 [Payment History] Received payment sync update:', event.detail);
            // Refresh payment history khi có cập nhật
            fetchPaymentHistory();
        };

        const handleSpecificPaymentUpdate = (event: CustomEvent) => {
            console.log('🔔 [Payment History] Received specific payment update:', event.detail);
            // Refresh payment history khi một thanh toán cụ thể được cập nhật
            fetchPaymentHistory(true);
        };

        const handlePaymentSuccess = (event: CustomEvent) => {
            console.log('🔔 [Payment History] Payment success event received:', event.detail);
            // Nhanh chóng làm mới khi có thanh toán thành công
            fetchPaymentHistory(true);
        };

        window.addEventListener('paymentSyncUpdate', handlePaymentSyncUpdate as EventListener);
        window.addEventListener('specificPaymentUpdated', handleSpecificPaymentUpdate as EventListener);
        window.addEventListener('paymentSuccess', handlePaymentSuccess as EventListener);

        return () => {
            window.removeEventListener('paymentSyncUpdate', handlePaymentSyncUpdate as EventListener);
            window.removeEventListener('specificPaymentUpdated', handleSpecificPaymentUpdate as EventListener);
            window.removeEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
        };
    }, []);

    // Auto refresh mỗi 10 giây để cập nhật dữ liệu đồng bộ
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                console.log('🔄 [Payment History] Auto-refreshing...');
                fetchPaymentHistory(true); // Bật auto-sync mỗi lần refresh
            }
        }, 2000); // Giảm xuống 2 giây để cập nhật nhanh hơn

        return () => clearInterval(interval);
    }, [loading]);

    // Kiểm tra URL params để xem người dùng có được redirect từ trang thanh toán thành công không
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const fromPayment = searchParams.get('from');
        const orderCode = searchParams.get('orderCode');

        if (fromPayment === 'payment-success' && orderCode) {
            console.log('🔍 [Payment History] Detected redirect from payment success page, order:', orderCode);
            // Lấy dữ liệu thanh toán ngay lập tức
            fetchPaymentHistory(true);

            // Xóa query params sau khi đã xử lý
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // Check for pending payments and auto-update them
    useEffect(() => {
        const checkPendingPayments = async () => {
            const pendingPayments = payments.filter(p => p.status === 'pending');

            for (const payment of pendingPayments) {
                try {
                    const response = await fetch(`/api/payment/check-status?orderCode=${payment.order_code}`);
                    const data = await response.json();

                    if (data.success && data.updated) {
                        console.log(`✅ [Payment History] Payment ${payment.order_code} updated to completed`);
                        // Refresh the list to show updated status
                        fetchPaymentHistory();
                        break; // Exit loop after first update to avoid multiple refreshes
                    }
                } catch (error) {
                    console.error(`❌ [Payment History] Error checking payment ${payment.order_code}:`, error);
                }
            }
        };

        if (payments.length > 0) {
            checkPendingPayments();
        }
    }, [payments]);

    // Thêm chức năng làm mới thủ công
    const handleManualRefresh = () => {
        console.log('🔄 [Payment History] Manual refresh triggered');
        fetchPaymentHistory(true);
    };

    // Thêm hàm đồng bộ toàn bộ lịch sử thanh toán cũ
    const handleFullSync = async () => {
        setSyncLoading(true);
        setError(null);

        try {
            console.log('🔄 [Payment History] Starting full sync...');

            // Thử đồng bộ trước
            const syncResponse = await fetch('/api/patient/sync-payment-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const syncResult = await syncResponse.json();

            if (!syncResponse.ok) {
                if (syncResponse.status === 401) {
                    console.error('❌ [Payment History] Auth error during sync:', syncResult.message);
                    setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }

                console.warn('⚠️ [Payment History] Sync warning:', syncResult.message);
                // Tiếp tục tải dữ liệu ngay cả khi sync thất bại
            } else {
                console.log('✅ [Payment History] Sync successful');
                setSyncSuccess(`Đã đồng bộ ${syncResult.data?.updatedCount || 0} thanh toán mới`);
            }

            // Sau đó tải lại dữ liệu
            await fetchPaymentHistory(false);

            // Làm mới key để cập nhật UI
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            console.error('❌ [Payment History] Error during full sync:', error);
            setError(error.message || 'Có lỗi xảy ra khi đồng bộ dữ liệu');
        } finally {
            setSyncLoading(false);
            // Tự động xóa thông báo thành công sau 3 giây
            if (syncSuccess) {
                setTimeout(() => setSyncSuccess(null), 3000);
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            completed: { label: 'Đã thanh toán', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            pending: { label: 'Chờ thanh toán', variant: 'secondary' as const, icon: Clock, color: 'text-orange-600' },
            failed: { label: 'Thất bại', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleExport = async (format: 'excel' | 'csv') => {
        try {
            const params = new URLSearchParams({
                format,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value && value !== 'all')
                )
            });

            const response = await fetch(`/api/patient/payment-history/export?${params}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payment-history-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            orderCode: '',
            doctorId: ''
        });
    };

    const downloadInvoice = async (paymentId: string, orderCode: string) => {
        try {
            console.log('Downloading PDF invoice for payment:', paymentId, 'orderCode:', orderCode);

            // First check if the API can generate PDF
            const response = await fetch(`/api/patient/invoice/${orderCode}?format=pdf`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('PDF generation failed:', errorData);
                alert(`❌ Không thể tạo hóa đơn PDF: ${errorData.error || 'Lỗi không xác định'}`);
                return;
            }

            // If successful, create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hoa-don-${orderCode}.pdf`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(url);

            console.log('PDF invoice download completed successfully');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('❌ Có lỗi xảy ra khi tải hóa đơn PDF. Vui lòng thử lại sau.');
        }
    };

    const viewPaymentDetails = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsDetailModalOpen(true);
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return '✅ Đã thanh toán';
            case 'pending': return '⏳ Chờ thanh toán';
            case 'failed': return '❌ Thất bại';
            default: return status;
        }
    };

    // Format thời gian
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
        } catch (err) {
            return dateString;
        }
    };

    // Phân loại thanh toán
    const completedPayments = payments.filter(payment => payment.status === 'completed');
    const pendingPayments = payments.filter(payment => payment.status !== 'completed');

    // New effect for payment success via URL param
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const paymentSuccess = searchParams.get('payment_success') === 'true';

        if (paymentSuccess) {
            console.log('🔄 [Payment History] Detected successful payment via URL param');
            // Xóa tham số khỏi URL để tránh reload không cần thiết
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            // Tự động đồng bộ và làm mới dữ liệu
            handleFullSync();
        }
    }, []);

    // New handler for payment success event
    useEffect(() => {
        const handlePaymentEvent = (event: any) => {
            if (event.detail && event.detail.success) {
                console.log('🔄 [Payment History] Detected payment event:', event.detail);
                // Đợi 2 giây để thanh toán được xử lý
                setTimeout(() => {
                    if (autoSyncAfterPayment) {
                        handleFullSync();
                    }
                }, 2000);
            }
        };

        window.addEventListener('payment:success', handlePaymentEvent);

        return () => {
            window.removeEventListener('payment:success', handlePaymentEvent);
        };
    }, [autoSyncAfterPayment]);

    // Thêm hàm tự động tạo hồ sơ
    const createAutoProfile = async () => {
        try {
            setAutoProfileLoading(true);
            setError(null);

            console.log('🔄 [Payment History] Attempting to auto-create profile...');

            const response = await fetch('/api/patient/auto-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Không thể tự động tạo hồ sơ');
            }

            console.log('✅ [Payment History] Auto profile created:', data);
            setAutoProfileSuccess(true);

            // Đợi một chút rồi tải lại dữ liệu
            setTimeout(() => {
                fetchPaymentHistory(true);
            }, 1000);

        } catch (err: any) {
            console.error('❌ [Payment History] Auto profile error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tự động tạo hồ sơ');
        } finally {
            setAutoProfileLoading(false);
        }
    };

    // Thêm useEffect để tự động tạo hồ sơ khi gặp lỗi không tìm thấy hồ sơ
    useEffect(() => {
        if (error && (
            error.includes('Không tìm thấy thông tin người dùng') ||
            error.includes('Không tìm thấy hồ sơ bệnh nhân')
        )) {
            console.log('🔄 [Payment History] Detected profile error, attempting auto-fix...');
            createAutoProfile();
        }
    }, [error]);

    // Render with error boundary
    try {
        return (
            <PatientLayout
                title="Lịch sử thanh toán"
                activePage="payment-history"
                subtitle="Xem và quản lý các giao dịch thanh toán của bạn"
                headerActions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={handleManualRefresh}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex items-center gap-2"
                            onClick={() => setIsSyncDialogOpen(true)}
                            disabled={loading}
                        >
                            <History className="h-4 w-4" />
                            Đồng bộ lịch sử cũ
                        </Button>
                        <Button
                            variant="outline"
                            className="ml-2"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Lọc
                        </Button>
                    </div>
                }
            >
                <div className="container mx-auto py-6">
                    <h1 className="text-2xl font-bold mb-6">Lịch sử thanh toán</h1>

                    {/* Thông báo bảo mật */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Riêng tư và bảo mật:</strong> Bạn chỉ thấy các thanh toán của chính mình. Hệ thống đảm bảo rằng bệnh nhân không thể xem thanh toán của người khác.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="flex flex-col gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500 mb-1 block">Mã đơn hàng</label>
                                        <Input
                                            type="text"
                                            placeholder="Nhập mã đơn hàng"
                                            value={filters.orderCode}
                                            onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 mb-1 block">Từ ngày</label>
                                        <Input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 mb-1 block">Đến ngày</label>
                                        <Input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 mb-1 block">Bác sĩ</label>
                                        <Input
                                            type="text"
                                            placeholder="ID bác sĩ"
                                            value={filters.doctorId}
                                            onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="mb-0.5 flex gap-2 items-center"
                                        >
                                            <Filter className="h-4 w-4" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground mb-1">Tổng thanh toán</span>
                                    <span className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</span>
                                    <span className="text-sm text-muted-foreground mt-1">Từ {summary.totalTransactions} giao dịch</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground mb-1">Thanh toán trung bình</span>
                                    <span className="text-2xl font-bold">{formatCurrency(summary.averageAmount)}</span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                        Đồng bộ: {summary.syncedPayments}/{summary.totalTransactions} ({Math.round(summary.syncRate)}%)
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground mb-1">Lần thanh toán gần nhất</span>
                                    <span className="text-2xl font-bold">
                                        {payments[0]?.paid_at ? format(new Date(payments[0].paid_at), 'dd/MM/yyyy') : '--/--/----'}
                                    </span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                        {payments[0]?.paid_at ? format(new Date(payments[0].paid_at), 'HH:mm:ss', { locale: vi }) : '--:--:--'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment List */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Danh sách thanh toán</h3>

                            {loading ? (
                                <div className="flex justify-center items-center p-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="text-gray-500">Đang tải dữ liệu...</span>
                                    </div>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="mb-4">
                                        <CreditCard className="h-12 w-12 mx-auto text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có lịch sử thanh toán</h3>
                                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                                        Bạn chưa có giao dịch thanh toán nào. Khi bạn thanh toán cho dịch vụ, các giao dịch sẽ xuất hiện ở đây.
                                    </p>
                                    <div className="flex justify-center gap-4">
                                        <Button
                                            onClick={() => fetchPaymentHistory(true)}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-lg">🔄</span> Làm mới dữ liệu
                                        </Button>
                                        <Button
                                            onClick={() => router.push('/patient/booking')}
                                            variant="outline"
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-lg">📝</span> Đặt lịch khám
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Display payments when data is available
                                <div className="space-y-4">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-gray-900">#{payment.order_code}</h3>
                                                        {getStatusBadge(payment.status)}
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                            {payment.payment_method}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Bác sĩ:</span>
                                                            <span className="ml-2 font-medium">{payment.doctor_name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Số tiền:</span>
                                                            <span className="ml-2 font-bold text-green-600">
                                                                {formatCurrency(payment.amount)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Phương thức:</span>
                                                            <span className="ml-2 font-medium capitalize">{payment.payment_method}</span>
                                                        </div>
                                                    </div>

                                                    {payment.description && (
                                                        <p className="text-sm text-gray-600 mt-2">{payment.description}</p>
                                                    )}

                                                    {/* Thông tin PayOS - chỉ hiển thị khi đã thanh toán */}
                                                    {payment.status === 'completed' && (
                                                        <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg text-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                <span className="text-green-700 font-semibold">✅ Đã thanh toán</span>
                                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                                    PayOS
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-2">
                                                                {payment.paid_at && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="h-3 w-3 text-green-600" />
                                                                        <span className="text-gray-600 font-medium">Thời gian:</span>
                                                                        <span className="text-green-700 font-medium">
                                                                            {format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-600 font-medium">Mã đơn:</span>
                                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {payment.order_code}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {payment.medical_records && (
                                                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                                            <span className="text-blue-700 font-medium">Khám ngày:</span>
                                                            <span className="ml-2">
                                                                {format(new Date(payment.medical_records.visit_date), 'dd/MM/yyyy', { locale: vi })}
                                                            </span>
                                                            {payment.medical_records.diagnosis && (
                                                                <>
                                                                    <span className="ml-4 text-blue-700 font-medium">Chẩn đoán:</span>
                                                                    <span className="ml-2">{payment.medical_records.diagnosis}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-2"
                                                        onClick={() => viewPaymentDetails(payment)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Xem chi tiết
                                                    </Button>

                                                    {payment.status === 'completed' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2"
                                                            onClick={() => downloadInvoice(payment.id, payment.order_code)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Tải hóa đơn
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                                    <div className="text-sm text-gray-600">
                                        Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
                                        trong tổng số {pagination.total} giao dịch
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page <= 1}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        >
                                            Trang trước
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={pagination.page === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page >= pagination.totalPages}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        >
                                            Trang sau
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Details Modal */}
                    <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Chi tiết thanh toán
                                </DialogTitle>
                                <DialogDescription>
                                    Thông tin chi tiết về giao dịch thanh toán
                                </DialogDescription>
                            </DialogHeader>

                            {selectedPayment && (
                                <div className="space-y-6">
                                    {/* Thông tin cơ bản */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            📋 Thông tin cơ bản
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Mã đơn hàng:</span>
                                                <p className="font-mono font-medium">{selectedPayment.order_code}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Số tiền:</span>
                                                <p className="font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Trạng thái:</span>
                                                <p className="font-medium">{getStatusText(selectedPayment.status)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Phương thức:</span>
                                                <p className="font-medium capitalize">{selectedPayment.payment_method}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-600">Bác sĩ:</span>
                                                <p className="font-medium">{selectedPayment.doctor_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thông tin thời gian */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            ⏰ Thông tin thời gian
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Ngày tạo:</span>
                                                <span className="font-medium">
                                                    {format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Cập nhật cuối:</span>
                                                <span className="font-medium">
                                                    {format(new Date(selectedPayment.updated_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thông tin PayOS */}
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            💳 Thông tin PayOS
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Transaction ID:</span>
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {selectedPayment.transaction_id || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payment Link ID:</span>
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {selectedPayment.payment_link_id || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mô tả */}
                                    {selectedPayment.description && (
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                📝 Mô tả
                                            </h3>
                                            <p className="text-sm text-gray-700">{selectedPayment.description}</p>
                                        </div>
                                    )}

                                    {/* Hồ sơ khám bệnh */}
                                    {selectedPayment.medical_records && (
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                🏥 Hồ sơ khám bệnh
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Mã hồ sơ:</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {selectedPayment.medical_records.record_id}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Ngày khám:</span>
                                                    <span className="font-medium">
                                                        {format(new Date(selectedPayment.medical_records.visit_date), 'dd/MM/yyyy', { locale: vi })}
                                                    </span>
                                                </div>
                                                {selectedPayment.medical_records.diagnosis && (
                                                    <div>
                                                        <span className="text-gray-600">Chẩn đoán:</span>
                                                        <p className="font-medium mt-1">{selectedPayment.medical_records.diagnosis}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-3 pt-4 border-t">
                                        {selectedPayment.status === 'completed' && (
                                            <Button
                                                onClick={() => downloadInvoice(selectedPayment.id, selectedPayment.order_code)}
                                                className="flex items-center gap-2"
                                            >
                                                <Download className="h-4 w-4" />
                                                Tải hóa đơn PDF
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDetailModalOpen(false)}
                                        >
                                            Đóng
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Add the sync dialog */}
                    <PaymentSyncDialog
                        isOpen={isSyncDialogOpen}
                        onClose={() => setIsSyncDialogOpen(false)}
                        onSync={handleFullSync}
                    />

                    {/* Sync status alert */}
                    {syncSuccess && (
                        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Thành công</AlertTitle>
                            <AlertDescription>{syncSuccess}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <div className="mb-8">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Lỗi</AlertTitle>
                                <AlertDescription>
                                    {error}

                                    {autoProfileLoading ? (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Đang tự động tạo hồ sơ bệnh nhân...</span>
                                            </div>
                                        </div>
                                    ) : autoProfileSuccess ? (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Đã tạo hồ sơ bệnh nhân thành công! Đang tải lại dữ liệu...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowDebugger(!showDebugger)}
                                            >
                                                {showDebugger ? 'Ẩn công cụ debug' : 'Hiển thị công cụ debug'}
                                            </Button>

                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={createAutoProfile}
                                                disabled={autoProfileLoading}
                                            >
                                                {autoProfileLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Đang tạo hồ sơ...
                                                    </>
                                                ) : (
                                                    'Tự động tạo hồ sơ'
                                                )}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push('/patient/payment-history/fix-profile')}
                                            >
                                                Cập nhật hồ sơ thủ công
                                            </Button>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>

                            {showDebugger && <AuthDebugger />}
                        </div>
                    )}

                    {/* Tabs for filtering payments */}
                    <Tabs defaultValue="all">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">Tất cả ({payments.length})</TabsTrigger>
                            <TabsTrigger value="completed">Đã hoàn thành ({completedPayments.length})</TabsTrigger>
                            <TabsTrigger value="pending">Đang xử lý ({pendingPayments.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-10">
                                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-muted-foreground">Đang tải lịch sử thanh toán...</p>
                                    </div>
                                ) : payments.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-10 text-center">
                                            <p className="text-muted-foreground">Bạn chưa có giao dịch thanh toán nào.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    payments.map((payment) => (
                                        <Card key={payment.id} className={
                                            payment.status === 'completed'
                                                ? "border-green-200"
                                                : "border-amber-200"
                                        }>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between">
                                                    <CardTitle>{payment.description.substring(0, 100)}</CardTitle>
                                                    <Badge variant={payment.status === 'completed' ? "success" : "warning"}>
                                                        {payment.status === 'completed' ? 'Đã hoàn thành' : 'Đang xử lý'}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    Mã thanh toán: {payment.order_code}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Số tiền:</p>
                                                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Ngày thanh toán:</p>
                                                        <p>{formatDate(payment.created_at)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Phương thức thanh toán:</p>
                                                        <p>{payment.payment_method || 'Chuyển khoản ngân hàng'}</p>
                                                    </div>
                                                    {payment.status === 'completed' && payment.completed_at && (
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Hoàn thành lúc:</p>
                                                            <p>{formatDate(payment.completed_at)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="completed">
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-10">
                                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-muted-foreground">Đang tải lịch sử thanh toán...</p>
                                    </div>
                                ) : completedPayments.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-10 text-center">
                                            <p className="text-muted-foreground">Bạn chưa có giao dịch thanh toán hoàn thành nào.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    completedPayments.map((payment) => (
                                        <Card key={payment.id} className="border-green-200">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between">
                                                    <CardTitle>{payment.description.substring(0, 100)}</CardTitle>
                                                    <Badge variant="success">Đã hoàn thành</Badge>
                                                </div>
                                                <CardDescription>
                                                    Mã thanh toán: {payment.order_code}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Số tiền:</p>
                                                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Ngày thanh toán:</p>
                                                        <p>{formatDate(payment.created_at)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Phương thức thanh toán:</p>
                                                        <p>{payment.payment_method || 'Chuyển khoản ngân hàng'}</p>
                                                    </div>
                                                    {payment.completed_at && (
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Hoàn thành lúc:</p>
                                                            <p>{formatDate(payment.completed_at)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="pending">
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-10">
                                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-muted-foreground">Đang tải lịch sử thanh toán...</p>
                                    </div>
                                ) : pendingPayments.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-10 text-center">
                                            <p className="text-muted-foreground">Bạn không có giao dịch thanh toán đang xử lý nào.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    pendingPayments.map((payment) => (
                                        <Card key={payment.id} className="border-amber-200">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between">
                                                    <CardTitle>{payment.description.substring(0, 100)}</CardTitle>
                                                    <Badge variant="warning">Đang xử lý</Badge>
                                                </div>
                                                <CardDescription>
                                                    Mã thanh toán: {payment.order_code}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Số tiền:</p>
                                                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Ngày thanh toán:</p>
                                                        <p>{formatDate(payment.created_at)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Phương thức thanh toán:</p>
                                                        <p>{payment.payment_method || 'Chuyển khoản ngân hàng'}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </PatientLayout>
        );
    } catch (error) {
        console.error('❌ Render error in PaymentHistoryPage:', error);
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold mb-4">Có lỗi xảy ra</h2>
                <p>Không thể hiển thị lịch sử thanh toán. Vui lòng thử lại sau.</p>
                <Button className="mt-4" onClick={() => router.refresh()}>
                    Làm mới trang
                </Button>
            </div>
        );
    }
}
