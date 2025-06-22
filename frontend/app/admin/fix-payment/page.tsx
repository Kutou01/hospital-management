'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Search, RefreshCw, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

export default function FixPaymentPage() {
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);
    const [patientId, setPatientId] = useState('');
    const [orderCode, setOrderCode] = useState('');
    const [autoAssignAll, setAutoAssignAll] = useState(false);
    const [fixResults, setFixResults] = useState<any>(null);
    const [fixLoading, setFixLoading] = useState(false);
    const [error, setError] = useState('');

    // Xác thực người dùng khi trang được tải
    useEffect(() => {
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth/login');
                return;
            }

            // Kiểm tra xem người dùng có quyền admin không
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/admin/dashboard');
            }
        }

        checkAuth();
    }, [router, supabase]);

    // Hàm debug để kiểm tra các thanh toán
    const handleDebug = async () => {
        try {
            setIsLoading(true);
            setError('');
            setDebugData(null);

            // Lấy token xác thực
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Không tìm thấy phiên đăng nhập');
            }

            // Xây dựng URL với các tham số
            let url = '/api/debug/payments-check';
            const params = new URLSearchParams();
            if (patientId) params.append('patientId', patientId);
            if (orderCode) params.append('orderCode', orderCode);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            // Gọi API debug
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Có lỗi xảy ra khi debug');
            }

            setDebugData(result.data);

        } catch (err: any) {
            console.error('Debug error:', err);
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm sửa các thanh toán không có patient_id
    const handleFixPayments = async () => {
        try {
            setFixLoading(true);
            setError('');
            setFixResults(null);

            // Lấy token xác thực
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Không tìm thấy phiên đăng nhập');
            }

            // Gọi API sửa thanh toán
            const response = await fetch('/api/debug/fix-payment-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    forceAll: false,
                    patientId: patientId || null,
                    autoAssignAll: autoAssignAll
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Có lỗi xảy ra khi sửa thanh toán');
            }

            setFixResults(result.data);

            // Tự động làm mới dữ liệu sau khi sửa
            handleDebug();

        } catch (err: any) {
            console.error('Fix payments error:', err);
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setFixLoading(false);
        }
    };

    // Format tiền tệ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
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

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Kiểm tra và sửa thanh toán</h1>
                <p className="text-muted-foreground">
                    Công cụ này giúp kiểm tra và sửa các vấn đề về thanh toán trong hệ thống
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="debug">
                <TabsList className="mb-4">
                    <TabsTrigger value="debug">Kiểm tra thanh toán</TabsTrigger>
                    <TabsTrigger value="fix">Sửa thanh toán</TabsTrigger>
                </TabsList>

                <TabsContent value="debug">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kiểm tra thanh toán</CardTitle>
                            <CardDescription>
                                Nhập thông tin để tìm và kiểm tra các giao dịch thanh toán
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="patientId" className="text-sm font-medium">
                                            ID bệnh nhân
                                        </label>
                                        <Input
                                            id="patientId"
                                            placeholder="Nhập patient_id (ví dụ: PAT1750182697717)"
                                            value={patientId}
                                            onChange={(e) => setPatientId(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="orderCode" className="text-sm font-medium">
                                            Mã đơn hàng
                                        </label>
                                        <Input
                                            id="orderCode"
                                            placeholder="Nhập order_code (ví dụ: 1750XXXXXXXXXX)"
                                            value={orderCode}
                                            onChange={(e) => setOrderCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleDebug} disabled={isLoading} className="flex items-center gap-2">
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {debugData && (
                        <div className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin người dùng</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-semibold">Email:</p>
                                            <p>{debugData.userInfo?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Quyền:</p>
                                            <p>{debugData.userInfo?.isAdmin ? 'Admin' : 'Người dùng'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {debugData.patients && debugData.patients.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Hồ sơ bệnh nhân</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Họ tên</TableHead>
                                                    <TableHead>Email</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {debugData.patients.map((patient: any) => (
                                                    <TableRow key={patient.patient_id}>
                                                        <TableCell className="font-mono">{patient.patient_id}</TableCell>
                                                        <TableCell>{patient.full_name}</TableCell>
                                                        <TableCell>{patient.profile?.email || 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            {debugData.payments && debugData.payments.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Thanh toán ({debugData.payments.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-96 overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Mã đơn hàng</TableHead>
                                                        <TableHead>Số tiền</TableHead>
                                                        <TableHead>Patient ID</TableHead>
                                                        <TableHead>Trạng thái</TableHead>
                                                        <TableHead>Ngày tạo</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {debugData.payments.map((payment: any) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell className="font-mono">
                                                                {payment.order_code}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatCurrency(payment.amount)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {payment.patient_id || (
                                                                    <span className="text-red-500">Thiếu</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {payment.status === 'completed' ? (
                                                                    <span className="text-green-500">Hoàn thành</span>
                                                                ) : (
                                                                    <span className="text-amber-500">Đang xử lý</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDate(payment.created_at)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {debugData.paymentsWithoutPatientId && debugData.paymentsWithoutPatientId.length > 0 && (
                                <Card className="border-amber-200">
                                    <CardHeader>
                                        <CardTitle className="text-amber-700">
                                            Thanh toán thiếu Patient ID ({debugData.paymentsWithoutPatientId.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-96 overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Mã đơn hàng</TableHead>
                                                        <TableHead>Số tiền</TableHead>
                                                        <TableHead>Mô tả</TableHead>
                                                        <TableHead>Trạng thái</TableHead>
                                                        <TableHead>Ngày tạo</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {debugData.paymentsWithoutPatientId.map((payment: any) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell className="font-mono">
                                                                {payment.order_code}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatCurrency(payment.amount)}
                                                            </TableCell>
                                                            <TableCell className="max-w-xs truncate">
                                                                {payment.description || 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {payment.status === 'completed' ? (
                                                                    <span className="text-green-500">Hoàn thành</span>
                                                                ) : (
                                                                    <span className="text-amber-500">Đang xử lý</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDate(payment.created_at)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {debugData.relatedPayments && debugData.relatedPayments.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Thanh toán liên quan đến người dùng ({debugData.relatedPayments.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-96 overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Mã đơn hàng</TableHead>
                                                        <TableHead>Số tiền</TableHead>
                                                        <TableHead>Patient ID</TableHead>
                                                        <TableHead>Trạng thái</TableHead>
                                                        <TableHead>Ngày tạo</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {debugData.relatedPayments.map((payment: any) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell className="font-mono">
                                                                {payment.order_code}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatCurrency(payment.amount)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {payment.patient_id || (
                                                                    <span className="text-red-500">Thiếu</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {payment.status === 'completed' ? (
                                                                    <span className="text-green-500">Hoàn thành</span>
                                                                ) : (
                                                                    <span className="text-amber-500">Đang xử lý</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDate(payment.created_at)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="fix">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sửa thanh toán</CardTitle>
                            <CardDescription>
                                Sửa các vấn đề liên quan đến thanh toán như thiếu patient_id
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="fixPatientId" className="text-sm font-medium">
                                        ID bệnh nhân để gán
                                    </label>
                                    <Input
                                        id="fixPatientId"
                                        placeholder="Nhập patient_id cho các thanh toán chưa có"
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ID bệnh nhân này sẽ được sử dụng để gán cho các thanh toán không có patient_id
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="autoAssign"
                                        checked={autoAssignAll}
                                        onCheckedChange={(checked) => setAutoAssignAll(checked === true)}
                                    />
                                    <label
                                        htmlFor="autoAssign"
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Tự động gán tất cả thanh toán cho ID bệnh nhân này
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleFixPayments}
                                disabled={fixLoading || !patientId}
                                className="flex items-center gap-2"
                            >
                                {fixLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="h-4 w-4" />
                                )}
                                {fixLoading ? 'Đang sửa...' : 'Sửa thanh toán'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {fixResults && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Kết quả sửa thanh toán</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-muted p-4 rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground">Tổng số</p>
                                            <p className="text-2xl font-bold">{fixResults.total}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-green-600">Đã sửa</p>
                                            <p className="text-2xl font-bold text-green-600">{fixResults.updated}</p>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-amber-600">Bỏ qua</p>
                                            <p className="text-2xl font-bold text-amber-600">{fixResults.skipped}</p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-red-600">Lỗi</p>
                                            <p className="text-2xl font-bold text-red-600">{fixResults.errors}</p>
                                        </div>
                                    </div>

                                    {fixResults.details && fixResults.details.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-lg font-semibold mb-2">Chi tiết</h3>
                                            <div className="max-h-96 overflow-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Mã đơn hàng</TableHead>
                                                            <TableHead>Trạng thái</TableHead>
                                                            <TableHead>Patient ID</TableHead>
                                                            <TableHead>Phương pháp</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {fixResults.details.map((detail: any, index: number) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{detail.order_code}</TableCell>
                                                                <TableCell>
                                                                    {detail.status === 'updated' && (
                                                                        <span className="text-green-500 flex items-center gap-1">
                                                                            <CheckCircle className="h-3 w-3" /> Đã cập nhật
                                                                        </span>
                                                                    )}
                                                                    {detail.status === 'skipped' && (
                                                                        <span className="text-amber-500">Bỏ qua</span>
                                                                    )}
                                                                    {detail.status === 'error' && (
                                                                        <span className="text-red-500">Lỗi</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>{detail.patient_id || '-'}</TableCell>
                                                                <TableCell>
                                                                    {detail.method === 'from_description' && 'Từ mô tả'}
                                                                    {detail.method === 'forced_assignment' && 'Gán thủ công'}
                                                                    {detail.method === 'default_assignment' && 'Gán mặc định'}
                                                                    {!detail.method && '-'}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
