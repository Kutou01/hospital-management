'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Play,
  Square,
  Search,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Eye,
  Users,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export default function PaymentSyncAdminPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [autoSync, setAutoSync] = useState(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [recoveryResult, setRecoveryResult] = useState<any>(null);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [userStats, setUserStats] = useState<any>(null);

    // Chạy job đồng bộ thủ công
    const runSyncJob = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('/api/payment/sync-job', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer sync-job-secret-token',
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            setLastResult(result);
            
            if (result.success) {
                alert(`✅ Đồng bộ thành công!\nCập nhật: ${result.data.updated}/${result.data.total} thanh toán`);
                // Refresh thống kê người dùng sau khi đồng bộ
                fetchUserStats();
            } else {
                alert(`❌ Đồng bộ thất bại: ${result.error}`);
            }
        } catch (error) {
            console.error('Error running sync job:', error);
            alert('❌ Lỗi khi chạy job đồng bộ');
        } finally {
            setIsRunning(false);
        }
    };

    // Bật/tắt đồng bộ tự động
    const toggleAutoSync = () => {
        if (autoSync) {
            // Tắt auto sync
            if (intervalId) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
            setAutoSync(false);
            alert('🛑 Đã tắt đồng bộ tự động');
        } else {
            // Bật auto sync (chạy mỗi 1 phút)
            const id = setInterval(() => {
                runSyncJob();
            }, 1 * 60 * 1000); // 1 phút
            
            setIntervalId(id);
            setAutoSync(true);
            alert('🚀 Đã bật đồng bộ tự động (mỗi 1 phút)');
        }
    };

    // Chạy recovery job
    const runRecoveryJob = async (hours: number = 24) => {
        setRecoveryLoading(true);
        try {
            const response = await fetch(`/api/payment/recovery?action=recover&hours=${hours}`);
            const result = await response.json();
            setRecoveryResult(result);

            if (result.success) {
                const { recovered, updated, summary } = result.data;
                alert(`✅ Recovery hoàn thành!\n\n📊 Kết quả:\n- Khôi phục: ${recovered} giao dịch\n- Cập nhật: ${updated} giao dịch\n- PayOS: ${summary.payosTotal} giao dịch\n- Database: ${summary.databaseTotal} giao dịch`);
                // Refresh thống kê người dùng sau khi recovery
                fetchUserStats();
            } else {
                alert(`❌ Recovery thất bại: ${result.error}`);
            }
        } catch (error) {
            console.error('Error running recovery job:', error);
            alert('❌ Lỗi khi chạy recovery job');
        } finally {
            setRecoveryLoading(false);
        }
    };

    // Kiểm tra giao dịch sót (không khôi phục)
    const checkMissingTransactions = async (hours: number = 24) => {
        setRecoveryLoading(true);
        try {
            const response = await fetch(`/api/payment/recovery?action=check&hours=${hours}`);
            const result = await response.json();

            if (result.success) {
                const { missing, statusMismatches, summary } = result.data;
                alert(`🔍 Kiểm tra hoàn thành!\n\n📊 Phát hiện:\n- Giao dịch bị sót: ${missing.length}\n- Trạng thái sai: ${statusMismatches.length}\n- PayOS: ${summary.payosTotal} giao dịch\n- Database: ${summary.databaseTotal} giao dịch\n\n${missing.length > 0 || statusMismatches.length > 0 ? '⚠️ Có giao dịch cần khôi phục!' : '✅ Tất cả giao dịch đều đồng bộ!'}`);
            } else {
                alert(`❌ Kiểm tra thất bại: ${result.error}`);
            }
        } catch (error) {
            console.error('Error checking missing transactions:', error);
            alert('❌ Lỗi khi kiểm tra giao dịch');
        } finally {
            setRecoveryLoading(false);
        }
    };

    // Lấy thống kê lịch sử thanh toán người dùng
    const fetchUserStats = async () => {
        try {
            const response = await fetch('/api/patient/payment-history?page=1&limit=1');
            const data = await response.json();
            if (data.success) {
                setUserStats(data.data.summary);
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    // Cleanup khi component unmount
    useEffect(() => {
        fetchUserStats();
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <RefreshCw className="h-8 w-8 text-blue-600" />
                        Đồng bộ thanh toán PayOS
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Quản lý và đồng bộ trạng thái thanh toán từ PayOS về hệ thống - Cập nhật lịch sử thanh toán người dùng
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={autoSync ? "default" : "secondary"} className="text-sm">
                        {autoSync ? "Đang hoạt động" : "Đã tắt"}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/patient/payment-history">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem lịch sử thanh toán
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/all-payments">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Quản lý tất cả thanh toán
                        </Link>
                    </Button>
                </div>
            </div>

            <Separator />

            {/* User Payment Stats */}
            {userStats && (
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <Users className="h-5 w-5" />
                            Thống kê lịch sử thanh toán người dùng
                        </CardTitle>
                        <CardDescription>
                            Dữ liệu đồng bộ từ PayOS hiển thị cho người dùng
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-green-600">
                                    {userStats.totalPaid?.toLocaleString('vi-VN')}đ
                                </div>
                                <div className="text-sm text-gray-600">Tổng đã thanh toán</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-blue-600">
                                    {userStats.totalTransactions || 0}
                                </div>
                                <div className="text-sm text-gray-600">Số giao dịch</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-emerald-600">
                                    {userStats.syncedPayments || 0}
                                </div>
                                <div className="text-sm text-gray-600">Đã đồng bộ PayOS</div>
                                <div className="text-xs text-emerald-600 mt-1">
                                    {userStats.syncRate?.toFixed(1) || 0}% tổng số
                                </div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                                <div className="text-2xl font-bold text-purple-600">
                                    {userStats.averageAmount?.toLocaleString('vi-VN') || 0}đ
                                </div>
                                <div className="text-sm text-gray-600">Trung bình/giao dịch</div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button asChild variant="outline">
                                <Link href="/patient/payment-history">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Xem chi tiết lịch sử thanh toán
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Điều khiển đồng bộ
                        </CardTitle>
                        <CardDescription>
                            Quản lý quá trình đồng bộ thanh toán tự động và thủ công
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={runSyncJob}
                                disabled={isRunning}
                                className="flex items-center gap-2"
                                size="lg"
                            >
                                {isRunning ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Đang đồng bộ...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Đồng bộ ngay
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={toggleAutoSync}
                                variant={autoSync ? "destructive" : "default"}
                                className="flex items-center gap-2"
                                size="lg"
                            >
                                {autoSync ? (
                                    <>
                                        <Square className="h-4 w-4" />
                                        Tắt tự động
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Bật tự động
                                    </>
                                )}
                            </Button>
                        </div>

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                {autoSync
                                    ? "Đồng bộ tự động đang chạy mỗi 1 phút để kiểm tra thanh toán pending"
                                    : "Đồng bộ tự động đã tắt. Bạn có thể chạy đồng bộ thủ công bất kỳ lúc nào"
                                }
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Kiểm tra giao dịch
                        </CardTitle>
                        <CardDescription>
                            So sánh với PayOS để tìm giao dịch bị sót hoặc trạng thái sai
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button
                                onClick={() => checkMissingTransactions(6)}
                                disabled={recoveryLoading}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                {recoveryLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Kiểm tra 6h
                            </Button>
                            <Button
                                onClick={() => checkMissingTransactions(24)}
                                disabled={recoveryLoading}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                {recoveryLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Kiểm tra 24h
                            </Button>
                            <Button
                                onClick={() => runRecoveryJob(24)}
                                disabled={recoveryLoading}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                {recoveryLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Settings className="h-4 w-4" />
                                )}
                                Khôi phục 24h
                            </Button>
                        </div>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Chức năng kiểm tra sẽ so sánh dữ liệu với PayOS để phát hiện giao dịch bị sót.
                                Khôi phục sẽ tự động cập nhật các giao dịch bị thiếu.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>



            {/* Last Result */}
            {lastResult && (
                <Card className={lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {lastResult.success ? (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    Kết quả lần chạy cuối
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5" />
                                    Lỗi lần chạy cuối
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lastResult.success && lastResult.data ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-white rounded-lg border">
                                    <div className="text-2xl font-bold text-blue-600">{lastResult.data.total}</div>
                                    <div className="text-sm text-muted-foreground">Tổng kiểm tra</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg border">
                                    <div className="text-2xl font-bold text-green-600">{lastResult.data.updated}</div>
                                    <div className="text-sm text-muted-foreground">Đã cập nhật</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg border">
                                    <div className="text-2xl font-bold text-purple-600">{lastResult.data.duration}ms</div>
                                    <div className="text-sm text-muted-foreground">Thời gian</div>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg border">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {lastResult.data.total > 0
                                            ? `${((lastResult.data.updated / lastResult.data.total) * 100).toFixed(1)}%`
                                            : '0%'
                                        }
                                    </div>
                                    <div className="text-sm text-muted-foreground">Tỷ lệ thành công</div>
                                </div>
                            </div>
                        ) : (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {lastResult.error || 'Lỗi không xác định'}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Info className="h-5 w-5" />
                        Hướng dẫn sử dụng
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-blue-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <RefreshCw className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Đồng bộ thủ công</h4>
                                <p className="text-sm text-blue-600">Nhấn "Đồng bộ ngay" để kiểm tra ngay lập tức</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Đồng bộ tự động</h4>
                                <p className="text-sm text-blue-600">Bật để tự động chạy mỗi 1 phút</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Search className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Kiểm tra giao dịch</h4>
                                <p className="text-sm text-blue-600">Tìm và khôi phục giao dịch bị sót</p>
                            </div>
                        </div>
                    </div>

                    <Alert className="bg-blue-100 border-blue-300">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-blue-800">
                            <strong>Lưu ý:</strong> Hệ thống chỉ kiểm tra các thanh toán có trạng thái "pending" hoặc "processing"
                            và có mã đơn hàng (order_code) hợp lệ từ PayOS.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}
