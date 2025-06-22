'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Terminal, RefreshCw, ClipboardCheck, FileCheck, FileX, Filter, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Payment {
    id: string;
    order_code: string;
    description: string;
    patient_id: string | null;
    created_at: string;
    status: string;
    amount: number;
}

export default function CheckPaymentDescriptionPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        withPatientId: 0,
        withoutPatientId: 0,
        withPatientIdInDescription: 0,
        percentage: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');
    const [testResult, setTestResult] = useState<null | { success: boolean, message: string }>(null);
    const [testLoading, setTestLoading] = useState(false);

    const supabase = createClient();

    // Fetch payments from database
    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Get most recent 100 payments
            const { data, error } = await supabase
                .from('payments')
                .select('id, order_code, description, patient_id, created_at, status, amount')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            setPayments(data || []);

            // Calculate stats
            if (data) {
                const withPatientId = data.filter((p: Payment) => p.patient_id).length;
                const withoutPatientId = data.length - withPatientId;

                // Count payments that have patient_id in description
                const withPatientIdInDescription = data.filter((p: Payment) => {
                    return p.description && p.description.match(/patient_id:\s*([a-zA-Z0-9-]+)/i);
                }).length;

                setStats({
                    total: data.length,
                    withPatientId,
                    withoutPatientId,
                    withPatientIdInDescription,
                    percentage: data.length > 0 ? Math.round((withPatientIdInDescription / data.length) * 100) : 0
                });
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create test payments
    const createTestPayments = async (withPatientId: boolean) => {
        setTestLoading(true);
        try {
            const response = await fetch('/api/test-payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    withPatientId,
                    count: 3
                })
            });

            const data = await response.json();

            if (data.success) {
                setTestResult({
                    success: true,
                    message: `${data.data.count} test payments created successfully`
                });

                // Reload payments list
                fetchPayments();
            } else {
                setTestResult({
                    success: false,
                    message: data.error || 'Unknown error creating test payments'
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setTestLoading(false);
        }
    };

    // Extract patient ID from description
    const extractPatientId = (description: string) => {
        if (!description) return null;
        const match = description.match(/patient_id:\s*([a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
    };

    // Check if a payment has patient_id in description
    const hasPatientIdInDescription = (description: string) => {
        return !!extractPatientId(description);
    };

    // Filter payments based on selected tab and search term
    const getFilteredPayments = () => {
        let filtered = [...payments];

        if (selectedTab === 'with_patient_id') {
            filtered = filtered.filter(p => p.patient_id);
        } else if (selectedTab === 'without_patient_id') {
            filtered = filtered.filter(p => !p.patient_id);
        } else if (selectedTab === 'with_patient_id_in_description') {
            filtered = filtered.filter(p => hasPatientIdInDescription(p.description));
        } else if (selectedTab === 'missing_patient_id_in_description') {
            filtered = filtered.filter(p => !hasPatientIdInDescription(p.description));
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.order_code?.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term) ||
                p.patient_id?.toLowerCase().includes(term)
            );
        }

        return filtered;
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
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
        } catch (e) {
            return dateString;
        }
    };

    // Load payments on initial render
    useEffect(() => {
        fetchPayments();
    }, []);

    const filteredPayments = getFilteredPayments();

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <h1 className="text-3xl font-bold mb-2">Kiểm tra mô tả thanh toán</h1>
            <p className="text-gray-500 mb-6">
                Kiểm tra các thanh toán và xác nhận mô tả có chứa patient_id
            </p>

            {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{testResult.success ? 'Thành công' : 'Lỗi'}</AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tổng thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Có patient_id</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.withPatientId}</div>
                        <p className="text-xs text-gray-500">
                            {stats.total > 0 ? Math.round((stats.withPatientId / stats.total) * 100) : 0}% của tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Thiếu patient_id</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.withoutPatientId}</div>
                        <p className="text-xs text-gray-500">
                            {stats.total > 0 ? Math.round((stats.withoutPatientId / stats.total) * 100) : 0}% của tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Có patient_id trong mô tả</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.withPatientIdInDescription}</div>
                        <p className="text-xs text-gray-500">
                            {stats.percentage}% của tổng số
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Tìm kiếm theo mã đơn hàng, mô tả hoặc patient_id"
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchPayments}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => createTestPayments(true)}
                        disabled={testLoading}
                    >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Tạo test có patient_id
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => createTestPayments(false)}
                        disabled={testLoading}
                    >
                        <FileX className="h-4 w-4 mr-2" />
                        Tạo test không có patient_id
                    </Button>
                </div>
            </div>

            {/* Tabs and Table */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="all">
                        Tất cả ({payments.length})
                    </TabsTrigger>
                    <TabsTrigger value="with_patient_id">
                        Có patient_id ({stats.withPatientId})
                    </TabsTrigger>
                    <TabsTrigger value="without_patient_id">
                        Thiếu patient_id ({stats.withoutPatientId})
                    </TabsTrigger>
                    <TabsTrigger value="with_patient_id_in_description">
                        Có patient_id trong mô tả ({stats.withPatientIdInDescription})
                    </TabsTrigger>
                    <TabsTrigger value="missing_patient_id_in_description">
                        Thiếu patient_id trong mô tả ({stats.total - stats.withPatientIdInDescription})
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order Code</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Patient ID</TableHead>
                                        <TableHead>Patient ID trong mô tả</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Số tiền</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4">
                                                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                                                <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredPayments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4">
                                                <p className="text-gray-500">Không tìm thấy thanh toán nào</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPayments.map((payment) => {
                                            const patientIdFromDesc = extractPatientId(payment.description);
                                            const hasPatientIdDesc = !!patientIdFromDesc;

                                            return (
                                                <TableRow key={payment.id}>
                                                    <TableCell className="font-medium">{payment.order_code}</TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {payment.description || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.patient_id ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                                {payment.patient_id}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-red-50 text-red-700">
                                                                Không có
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {hasPatientIdDesc ? (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                <Check className="h-3 w-3 mr-1" />
                                                                {patientIdFromDesc}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-red-50 text-red-700">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Không tìm thấy
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }
                                                        >
                                                            {payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
} 