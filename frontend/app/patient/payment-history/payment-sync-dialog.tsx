import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, RefreshCw, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface SyncDialogProps {
    onSync: () => void;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export function PaymentSyncDialog({ onSync, isOpen, setIsOpen }: SyncDialogProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleSyncManually = async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorDetails(null);
            setResult(null);

            // Gọi API để đồng bộ lịch sử thanh toán
            const response = await fetch('/api/patient/sync-payment-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Xử lý các mã lỗi cụ thể
                if (response.status === 401) {
                    setErrorDetails('Phiên đăng nhập của bạn có thể đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
                } else if (response.status === 404) {
                    setErrorDetails('Bạn cần cập nhật hồ sơ bệnh nhân trước khi đồng bộ thanh toán.');
                } else {
                    setErrorDetails('Vui lòng thử tải lại trang hoặc đăng nhập lại nếu vấn đề vẫn tiếp tục.');
                }

                throw new Error(data.message || 'Không thể đồng bộ thanh toán');
            }

            setResult(data.data);

            const total = (data.data.updatedCount || 0) + (data.data.manualSync?.count || 0);

            // Thông báo thành công
            toast({
                title: 'Đồng bộ thành công',
                description: `Đã tìm thấy và đồng bộ ${total} thanh toán vào tài khoản của bạn.`,
                variant: 'default',
            });

            // Callback để làm mới dữ liệu
            if (onSync) onSync();

            // Đóng dialog sau 2 giây nếu có kết quả
            if (total > 0 && setIsOpen) {
                setTimeout(() => {
                    setIsOpen(false);
                }, 2000);
            }

        } catch (err: any) {
            console.error('Error syncing payments:', err);
            setError(err.message || 'Có lỗi xảy ra khi đồng bộ thanh toán');

            // Thông báo lỗi
            toast({
                title: 'Đồng bộ thất bại',
                description: err.message || 'Có lỗi xảy ra khi đồng bộ thanh toán',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLoginAgain = () => {
        // Đóng dialog
        if (setIsOpen) setIsOpen(false);

        // Chuyển hướng đến trang đăng nhập
        router.push('/auth/login?redirect=/patient/payment-history');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Đồng bộ lịch sử thanh toán
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Đồng bộ lịch sử thanh toán</DialogTitle>
                    <DialogDescription>
                        Đồng bộ các thanh toán cũ vào tài khoản của bạn. Hữu ích khi bạn không thấy thanh toán đã thực hiện.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Lỗi</AlertTitle>
                        <AlertDescription>
                            <p>{error}</p>
                            {errorDetails && (
                                <div className="mt-2 text-sm">
                                    <p><strong>Hướng dẫn khắc phục:</strong></p>
                                    <p>{errorDetails}</p>
                                </div>
                            )}
                            {error.includes('Không tìm thấy thông tin người dùng') && (
                                <Button
                                    variant="outline"
                                    className="mt-2 bg-white text-destructive hover:bg-destructive hover:text-white"
                                    onClick={handleLoginAgain}
                                >
                                    Đăng nhập lại
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {result && (
                    <div className="bg-muted p-4 rounded-md text-sm space-y-2 mt-4">
                        <p><strong>Thông tin đồng bộ:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Mã bệnh nhân: <span className="font-mono">{result.patientId}</span></li>
                            <li>Số thanh toán tự phát hiện: {result.updatedCount}</li>
                            <li>Số thanh toán từ mã bệnh nhân cũ: {result.manualSync?.count || 0}</li>
                            <li>Tổng số thanh toán đã đồng bộ: {(result.updatedCount || 0) + (result.manualSync?.count || 0)}</li>
                        </ul>
                    </div>
                )}

                <div className="border rounded-md p-4 bg-yellow-50">
                    <h3 className="font-medium mb-2 text-amber-800 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Thông tin quan trọng
                    </h3>
                    <p className="text-sm text-amber-700">
                        Hệ thống sẽ tìm các thanh toán từ mã bệnh nhân cũ (PAT-202506-001) và gán cho tài khoản hiện tại của bạn.
                        Quá trình này chỉ mất vài giây và giúp bạn thấy được tất cả các thanh toán đã thực hiện.
                    </p>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between mt-4">
                    <Button variant="outline" onClick={() => setIsOpen?.(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSyncManually}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {loading ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 