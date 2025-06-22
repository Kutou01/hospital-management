'use client';

import React, { useState, useEffect } from 'react';
import { PatientLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Search, Download, Eye, Filter, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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

    try {
        const supabase = createClient();
        const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

    const fetchPaymentHistory = async (autoSync = false) => {
        console.log('🚀 [Payment History] Starting fetch...');
        setLoading(true);

        // Debug: Check if we're actually calling this function
        console.log('🔍 [Payment History] Function called with autoSync:', autoSync);
        try {
            // TỰ ĐỘNG ĐỒNG BỘ TRƯỚC KHI LẤY DỮ LIỆU (nếu cần)
            if (autoSync) {
                console.log('🔄 Auto-syncing payments before fetch...');
                try {
                    const syncResponse = await fetch('/api/admin/payment-sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'manual_sync' })
                    });
                    const syncData = await syncResponse.json();
                    if (syncData.success) {
                        console.log('✅ Auto-sync completed:', syncData.data);
                    }
                } catch (syncError) {
                    console.warn('⚠️ Auto-sync failed, continuing with existing data:', syncError);
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

            console.log('🔐 [Payment History] Full session data:', session);
            console.log('🔐 [Payment History] Session error:', sessionError);
            console.log('🔐 [Payment History] Session type:', typeof session);
            console.log('🔐 [Payment History] Session keys:', session ? Object.keys(session) : 'null');
            console.log('🔐 [Payment History] Session check:', {
                hasSession: !!session,
                hasAccessToken: !!session?.access_token,
                userId: session?.user?.id,
                userEmail: session?.user?.email,
                tokenLength: session?.access_token?.length,
                tokenStart: session?.access_token?.substring(0, 20)
            });

            if (!session?.access_token) {
                console.error('❌ No access token found, session:', session);
                alert('❌ Không tìm thấy session. Vui lòng đăng nhập lại.');
                router.push('/auth/login');
                return;
            }

            const response = await fetch(`/api/patient/payment-history?${params}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });
            const data = await response.json();

            if (data.success) {
                setPayments(data.data.payments);
                setPagination(data.data.pagination);
                setSummary(data.data.summary);
            } else {
                console.error('Failed to fetch payment history:', data.error);
            }
        } catch (error) {
            console.error('Error fetching payment history:', error);
        } finally {
            setLoading(false);
        }
    };



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

        window.addEventListener('paymentSyncUpdate', handlePaymentSyncUpdate as EventListener);

        return () => {
            window.removeEventListener('paymentSyncUpdate', handlePaymentSyncUpdate as EventListener);
        };
    }, []);

    // Auto refresh mỗi 30 giây để cập nhật dữ liệu đồng bộ
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                fetchPaymentHistory(true); // Bật auto-sync mỗi lần refresh
            }
        }, 30000); // 30 giây

        return () => clearInterval(interval);
    }, [loading]);

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
            status: 'all',
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
                        onClick={() => handleExport('excel')}
                        disabled={loading}
                    >
                        <Download className="h-4 w-4" />
                        Xuất Excel
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => handleExport('csv')}
                        disabled={loading}
                    >
                        <Download className="h-4 w-4" />
                        Xuất CSV
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng đã thanh toán</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary.totalPaid)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <CreditCard className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Số giao dịch</p>
                                <p className="text-2xl font-bold text-blue-600">{summary.totalTransactions}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Đã đồng bộ PayOS</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {summary.syncedPayments}
                                </p>
                                <p className="text-xs text-emerald-600 mt-1">
                                    {summary.syncRate.toFixed(1)}% tổng số
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Trung bình/giao dịch</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(summary.averageAmount)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Clock className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Trạng thái</label>
                            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Chỉ hiển thị giao dịch thành công
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Từ ngày</label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Đến ngày</label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Mã đơn hàng</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm mã đơn hàng..."
                                    value={filters.orderCode}
                                    onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Lịch sử thanh toán thành công
                            <Badge variant="secondary" className="bg-green-100 text-green-800">{pagination.total}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                            Tự động cập nhật mỗi 30 giây
                        </div>
                    </CardTitle>
                    <CardDescription>
                        Tự động đồng bộ từ PayOS - Dữ liệu được cập nhật theo thời gian thực
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có giao dịch nào</h3>
                            <p className="text-gray-600">Các giao dịch thanh toán của bạn sẽ hiển thị ở đây.</p>
                        </div>
                    ) : (
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
            </div>

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
        </PatientLayout>
    );
    } catch (error) {
        console.error('❌ [Payment History Page] Component error:', error);
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải trang</h1>
                <p className="text-gray-600 mb-4">Có lỗi xảy ra khi tải trang lịch sử thanh toán.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Tải lại trang
                </button>
            </div>
        );
    }
}
