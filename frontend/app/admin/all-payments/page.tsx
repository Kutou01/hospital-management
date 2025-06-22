'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, Filter, CreditCard, TrendingUp, AlertCircle, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Payment {
    id: string;
    order_code: string;
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed' | 'processing';
    payment_method: string;
    doctor_name: string;
    doctor_id: string;
    patient_id: string | null;
    transaction_id?: string;
    payment_link_id?: string;
    created_at: string;
    updated_at: string;
    paid_at: string | null;
    record_id?: string;
}

interface PaymentSummary {
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    completedAmount: number;
    pendingPayments: number;
    pendingAmount: number;
    failedPayments: number;
    syncedPayments: number;
    syncRate: number;
    paymentsWithPatientId: number;
    patientIdRate: number;
}

export default function AdminAllPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState<PaymentSummary>({
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        completedAmount: 0,
        pendingPayments: 0,
        pendingAmount: 0,
        failedPayments: 0,
        syncedPayments: 0,
        syncRate: 0,
        paymentsWithPatientId: 0,
        patientIdRate: 0
    });
    
    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
        orderCode: '',
        doctorId: '',
        patientId: ''
    });
    
    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    // Fetch payments
    const fetchPayments = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value && value !== 'all')
                )
            });

            const response = await fetch(`/api/admin/payments?${params}`);
            const data = await response.json();

            if (data.success) {
                setPayments(data.data.payments);
                setPagination(data.data.pagination);
                setSummary(data.data.summary);
            } else {
                console.error('Failed to fetch payments:', data.error);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh payments
    const refreshPayments = async () => {
        setRefreshing(true);
        await fetchPayments();
        setRefreshing(false);
    };

    // Handle filter change
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    useEffect(() => {
        fetchPayments();
    }, [pagination.page, filters]);

    // Status badge component
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            completed: { label: 'Thành công', className: 'bg-green-100 text-green-800' },
            pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
            processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
            failed: { label: 'Thất bại', className: 'bg-red-100 text-red-800' }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                        Quản lý tất cả thanh toán
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Xem và quản lý tất cả giao dịch thanh toán trong hệ thống
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/payment-sync">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Đồng bộ PayOS
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/patient/payment-history">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Xem lịch sử thanh toán
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshPayments}
                        disabled={refreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Đang tải...' : 'Làm mới'}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalPayments}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng giá trị: {formatCurrency(summary.totalAmount)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thành công</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.completedPayments}</div>
                        <p className="text-xs text-muted-foreground">
                            Giá trị: {formatCurrency(summary.completedAmount)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{summary.pendingPayments}</div>
                        <p className="text-xs text-muted-foreground">
                            Giá trị: {formatCurrency(summary.pendingAmount)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ đồng bộ</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.syncRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {summary.syncedPayments}/{summary.totalPayments} giao dịch
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Patient ID Coverage Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Users className="h-5 w-5" />
                        Tỷ lệ liên kết bệnh nhân
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                        Số lượng giao dịch đã được liên kết với thông tin bệnh nhân
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-3xl font-bold text-blue-800">
                                {summary.patientIdRate.toFixed(1)}%
                            </div>
                            <p className="text-sm text-blue-600">
                                {summary.paymentsWithPatientId}/{summary.totalPayments} giao dịch có patient_id
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-blue-600 mb-2">
                                Cần cải thiện: {summary.totalPayments - summary.paymentsWithPatientId} giao dịch
                            </div>
                            {summary.patientIdRate < 100 && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                    Cần đồng bộ thêm
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="completed">Thành công</SelectItem>
                                <SelectItem value="pending">Chờ xử lý</SelectItem>
                                <SelectItem value="processing">Đang xử lý</SelectItem>
                                <SelectItem value="failed">Thất bại</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Mã đơn hàng"
                            value={filters.orderCode}
                            onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                        />

                        <Input
                            placeholder="ID bác sĩ"
                            value={filters.doctorId}
                            onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                        />

                        <Input
                            placeholder="ID bệnh nhân"
                            value={filters.patientId}
                            onChange={(e) => handleFilterChange('patientId', e.target.value)}
                        />

                        <Input
                            type="date"
                            placeholder="Từ ngày"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />

                        <Input
                            type="date"
                            placeholder="Đến ngày"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Danh sách giao dịch
                            <Badge variant="secondary">{pagination.total}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Trang {pagination.page} / {pagination.totalPages}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-4" />
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có giao dịch nào</h3>
                            <p className="text-gray-600">Không tìm thấy giao dịch nào với bộ lọc hiện tại.</p>
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
                                                {payment.patient_id ? (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        Patient: {payment.patient_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                        Chưa liên kết bệnh nhân
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">{payment.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>Bác sĩ: {payment.doctor_name}</span>
                                                <span>Tạo: {formatDate(payment.created_at)}</span>
                                                {payment.paid_at && (
                                                    <span>Thanh toán: {formatDate(payment.paid_at)}</span>
                                                )}
                                                {payment.transaction_id && (
                                                    <span>TX: {payment.transaction_id}</span>
                                                )}
                                                {payment.record_id && (
                                                    <span>Record: {payment.record_id}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {formatCurrency(payment.amount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-600">
                                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
                                trong tổng số {pagination.total} giao dịch
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    Trước
                                </Button>
                                <span className="text-sm">
                                    Trang {pagination.page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
