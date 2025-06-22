'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function TestPaymentHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchTestData();
    }, []);

    const fetchTestData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/test-db');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Không thể lấy dữ liệu kiểm tra');
            }

            setTestData(data);
            console.log('Test data:', data);
        } catch (err: any) {
            console.error('Error fetching test data:', err);
            setError(err.message || 'Có lỗi xảy ra khi kiểm tra dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncPayments = async () => {
        try {
            setSyncLoading(true);
            setError(null);
            const response = await fetch('/api/patient/sync-payment-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            setSyncResult(data);

            if (!data.success) {
                throw new Error(data.message || 'Không thể đồng bộ thanh toán');
            }

            // Refresh data after sync
            fetchTestData();
        } catch (err: any) {
            console.error('Error syncing payments:', err);
            setError(err.message || 'Có lỗi xảy ra khi đồng bộ thanh toán');
        } finally {
            setSyncLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 border-solid rounded-full mx-auto mb-4"></div>
                    <p>Đang tải dữ liệu kiểm tra...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-6xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Kiểm tra lịch sử thanh toán</span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={fetchTestData}
                                disabled={loading}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Làm mới
                            </Button>
                            <Button
                                onClick={handleSyncPayments}
                                disabled={syncLoading}
                            >
                                {syncLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Đang đồng bộ...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Đồng bộ thanh toán
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardTitle>
                    <CardDescription>
                        Công cụ kiểm tra lịch sử thanh toán và kết nối cơ sở dữ liệu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Lỗi</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {syncResult && syncResult.success && (
                        <Alert className="mb-6 bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Đồng bộ thành công</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Đã đồng bộ {syncResult.data?.updatedCount || 0} thanh toán từ tìm kiếm và {syncResult.data?.manualSync?.count || 0} thanh toán từ mã bệnh nhân cũ.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Tabs defaultValue="user">
                        <TabsList className="mb-4">
                            <TabsTrigger value="user">Thông tin người dùng</TabsTrigger>
                            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
                            <TabsTrigger value="database">Cơ sở dữ liệu</TabsTrigger>
                        </TabsList>

                        <TabsContent value="user">
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Phiên đăng nhập</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {testData?.session ? (
                                            <div>
                                                <p><strong>User ID:</strong> {testData.session.user_id}</p>
                                                <p><strong>Email:</strong> {testData.session.email}</p>
                                            </div>
                                        ) : (
                                            <p className="text-amber-600">Không có phiên đăng nhập</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Thông tin người dùng</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {testData?.user_info ? (
                                            <div>
                                                <p><strong>ID:</strong> {testData.user_info.id}</p>
                                                <p><strong>Email:</strong> {testData.user_info.email}</p>
                                                <p><strong>Họ tên:</strong> {testData.user_info.full_name}</p>
                                                <p><strong>Vai trò:</strong> {testData.user_info.role}</p>
                                                <p><strong>Số điện thoại:</strong> {testData.user_info.phone || 'N/A'}</p>
                                            </div>
                                        ) : (
                                            <p className="text-amber-600">Không tìm thấy thông tin người dùng</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Thông tin bệnh nhân</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {testData?.patient_info ? (
                                            <div>
                                                <p><strong>Mã bệnh nhân:</strong> {testData.patient_info.patient_id}</p>
                                                <p><strong>Họ tên:</strong> {testData.patient_info.full_name}</p>
                                                <p><strong>Profile ID:</strong> {testData.patient_info.profile_id}</p>
                                            </div>
                                        ) : (
                                            <p className="text-amber-600">Không tìm thấy thông tin bệnh nhân</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="payments">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thanh toán của bệnh nhân</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {testData?.data?.payments && testData.data.payments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Mã</th>
                                                        <th className="text-left p-2">Số tiền</th>
                                                        <th className="text-left p-2">Trạng thái</th>
                                                        <th className="text-left p-2">Mô tả</th>
                                                        <th className="text-left p-2">Ngày tạo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {testData.data.payments.map((payment: any) => (
                                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                            <td className="p-2 font-mono">{payment.order_code}</td>
                                                            <td className="p-2">{formatCurrency(payment.amount)}</td>
                                                            <td className="p-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-2">{payment.description}</td>
                                                            <td className="p-2">{formatDate(payment.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-amber-600">Không tìm thấy thanh toán nào cho bệnh nhân này</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">Thanh toán gần đây trong hệ thống</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {testData?.recent_payments && testData.recent_payments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Mã</th>
                                                        <th className="text-left p-2">Mã bệnh nhân</th>
                                                        <th className="text-left p-2">Số tiền</th>
                                                        <th className="text-left p-2">Trạng thái</th>
                                                        <th className="text-left p-2">Mô tả</th>
                                                        <th className="text-left p-2">Ngày tạo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {testData.recent_payments.map((payment: any) => (
                                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                            <td className="p-2 font-mono">{payment.order_code}</td>
                                                            <td className="p-2 font-mono">{payment.patient_id || 'N/A'}</td>
                                                            <td className="p-2">{formatCurrency(payment.amount)}</td>
                                                            <td className="p-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-2">{payment.description}</td>
                                                            <td className="p-2">{formatDate(payment.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-amber-600">Không tìm thấy thanh toán nào trong hệ thống</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="database">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Kết nối cơ sở dữ liệu</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-green-600 mb-4">
                                        ✓ Kết nối cơ sở dữ liệu thành công
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold">Tổng số bệnh nhân:</h3>
                                            <p>{testData?.patients_count || 0}</p>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold">Tổng số thanh toán gần đây:</h3>
                                            <p>{testData?.recent_payments_count || 0}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push('/patient/payment-history')}>
                        Quay lại lịch sử thanh toán
                    </Button>
                    <Button onClick={handleSyncPayments} disabled={syncLoading}>
                        {syncLoading ? 'Đang đồng bộ...' : 'Đồng bộ thanh toán'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
