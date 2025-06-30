"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Home, 
  RefreshCw,
  CreditCard,
  Banknote,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "sonner";

interface PaymentResult {
  id: string;
  orderCode: string;
  amount: number;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  paymentMethod: 'payos' | 'cash';
  transactionId?: string;
  createdAt: string;
  appointmentId: string;
  description: string;
  failureReason?: string;
}

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  color: string;
  bgColor: string;
  actions: string[];
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const orderCode = searchParams.get('orderCode');
  const status = searchParams.get('status');
  const method = searchParams.get('method') as 'payos' | 'cash';

  useEffect(() => {
    if (orderCode) {
      verifyPaymentStatus();
    } else {
      setIsLoading(false);
      toast.error("Không tìm thấy thông tin thanh toán");
    }
  }, [orderCode]);

  const verifyPaymentStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payments/verify?orderCode=${orderCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      setPaymentResult(data.data);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error("Không thể xác minh trạng thái thanh toán");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsVerifying(true);
    await verifyPaymentStatus();
    setIsVerifying(false);
  };

  const downloadReceipt = async () => {
    if (!paymentResult) return;

    try {
      const response = await fetch(`/api/payments/receipt/${paymentResult.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${paymentResult.orderCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải hóa đơn thành công");
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error("Không thể tải hóa đơn");
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusConfig = (): StatusConfig => {
    const currentStatus = paymentResult?.status || status;
    const paymentMethod = paymentResult?.paymentMethod || method;

    switch (currentStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-600" />,
          title: "Thanh toán thành công! 🎉",
          message: paymentMethod === 'cash' 
            ? "Phiếu thanh toán tiền mặt đã được tạo. Vui lòng đến quầy thu ngân để hoàn tất thanh toán."
            : "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Thanh toán đã được xử lý thành công.",
          color: "text-green-600",
          bgColor: "bg-green-50",
          actions: ['receipt', 'home']
        };
      case 'failed':
        return {
          icon: <XCircle className="h-16 w-16 text-red-600" />,
          title: "Thanh toán thất bại",
          message: paymentResult?.failureReason || "Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          actions: ['retry', 'home', 'support']
        };
      case 'pending':
        return {
          icon: <Clock className="h-16 w-16 text-yellow-600" />,
          title: paymentMethod === 'cash' ? "Chờ thanh toán tiền mặt" : "Thanh toán đang xử lý",
          message: paymentMethod === 'cash'
            ? "Vui lòng đến quầy thu ngân tại bệnh viện để hoàn tất thanh toán trong vòng 24 giờ."
            : "Chúng tôi đang xác nhận thanh toán của bạn. Vui lòng chờ trong giây lát.",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          actions: ['refresh', 'home']
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-16 w-16 text-gray-600" />,
          title: "Thanh toán đã bị hủy",
          message: "Bạn đã hủy giao dịch. Vui lòng thử lại nếu muốn tiếp tục thanh toán.",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          actions: ['retry', 'home']
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-gray-400 animate-pulse" />,
          title: "Đang kiểm tra trạng thái...",
          message: "Vui lòng chờ trong giây lát",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          actions: ['refresh']
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-600">
              Đang tải thông tin...
            </h2>
            <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Status Icon */}
          <div className={`w-20 h-20 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {statusConfig.icon}
          </div>
          
          {/* Status Title */}
          <h2 className={`text-2xl font-bold mb-3 ${statusConfig.color}`}>
            {statusConfig.title}
          </h2>
          
          {/* Status Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {statusConfig.message}
          </p>

          {/* Payment Details */}
          {paymentResult && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3 text-gray-800 text-center">Chi tiết giao dịch</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-mono font-medium">{paymentResult.orderCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(paymentResult.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phương thức:</span>
                  <div className="flex items-center gap-1">
                    {paymentResult.paymentMethod === 'payos' ? (
                      <CreditCard className="h-4 w-4" />
                    ) : (
                      <Banknote className="h-4 w-4" />
                    )}
                    <span>{paymentResult.paymentMethod === 'payos' ? 'PayOS' : 'Tiền mặt'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Thời gian:</span>
                  <span>{formatDateTime(paymentResult.createdAt)}</span>
                </div>
                {paymentResult.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mã GD:</span>
                    <span className="font-mono text-xs">{paymentResult.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trạng thái:</span>
                  <Badge variant={
                    paymentResult.status === 'success' ? 'default' :
                    paymentResult.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {paymentResult.status === 'success' ? 'Thành công' :
                     paymentResult.status === 'failed' ? 'Thất bại' :
                     paymentResult.status === 'pending' ? 'Đang xử lý' : 'Đã hủy'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {statusConfig.actions.includes('receipt') && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={downloadReceipt}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải hóa đơn
              </Button>
            )}

            {statusConfig.actions.includes('refresh') && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRefreshStatus}
                disabled={isVerifying}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                {isVerifying ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
              </Button>
            )}
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/patient/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>

            {statusConfig.actions.includes('retry') && (
              <Button 
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => router.back()}
              >
                Thử lại thanh toán
              </Button>
            )}
          </div>

          {/* Support Contact */}
          {statusConfig.actions.includes('support') && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Cần hỗ trợ?</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  1900-xxxx
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@hospital.vn
                </Button>
              </div>
            </div>
          )}

          {/* Additional Info for Cash Payment */}
          {paymentResult?.paymentMethod === 'cash' && paymentResult?.status === 'pending' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Hướng dẫn thanh toán tiền mặt</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• Đến quầy thu ngân tại tầng 1</li>
                <li>• Xuất trình mã đơn hàng: <strong>{paymentResult.orderCode}</strong></li>
                <li>• Thanh toán trong vòng 24 giờ</li>
                <li>• Nhận hóa đơn VAT tại quầy</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
