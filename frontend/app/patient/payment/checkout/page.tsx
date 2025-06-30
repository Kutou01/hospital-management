"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, Shield, Clock, CheckCircle } from "lucide-react";
import { PatientLayout } from "@/components/layout/UniversalLayout";
import { toast } from "sonner";

interface Invoice {
  id: string;
  appointmentId: string;
  consultationFee: number;
  serviceFee: number;
  vat: number;
  total: number;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  department: string;
}

interface PaymentMethod {
  id: 'payos' | 'cash';
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  bgColor: string;
}

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');
  const [selectedMethod, setSelectedMethod] = useState<'payos' | 'cash'>('payos');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'payos',
      name: 'PayOS',
      description: 'Thẻ ATM, Internet Banking, QR Code',
      icon: <CreditCard className="h-6 w-6" />,
      features: ['Bảo mật cao', 'Thanh toán nhanh', 'Hỗ trợ 24/7'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'cash',
      name: 'Tiền mặt',
      description: 'Thanh toán tại quầy bệnh viện',
      icon: <Banknote className="h-6 w-6" />,
      features: ['Thanh toán trực tiếp', 'Nhận hóa đơn ngay', 'Không phí giao dịch'],
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    }
  ];

  useEffect(() => {
    if (appointmentId) {
      fetchInvoiceData();
    } else {
      toast.error("Không tìm thấy thông tin lịch khám");
      router.push('/patient/appointments');
    }
  }, [appointmentId]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoadingInvoice(true);
      const response = await fetch(`/api/billing/invoice?appointmentId=${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const data = await response.json();
      setInvoice(data.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setIsLoadingInvoice(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handlePayOSPayment = async () => {
    if (!invoice) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/payos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appointmentId: invoice.appointmentId,
          amount: invoice.total,
          description: `Thanh toán khám bệnh - ${invoice.appointmentId}`,
          serviceName: 'Phí khám bệnh',
          patientInfo: {
            doctorName: invoice.doctorName,
            department: invoice.department,
            appointmentDate: invoice.appointmentDate,
            timeSlot: invoice.timeSlot
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to PayOS payment page
        window.location.href = data.data.checkoutUrl;
      } else {
        toast.error('Lỗi tạo thanh toán: ' + data.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!invoice) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/cash/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appointmentId: invoice.appointmentId,
          amount: invoice.total,
          paymentMethod: 'cash'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Đã tạo phiếu thanh toán tiền mặt');
        router.push(`/patient/payment/result?orderCode=${data.data.orderCode}&status=PENDING&method=cash`);
      } else {
        toast.error('Lỗi tạo phiếu thanh toán: ' + data.message);
      }
    } catch (error) {
      console.error('Cash payment error:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'payos') {
      handlePayOSPayment();
    } else {
      handleCashPayment();
    }
  };

  if (isLoadingInvoice) {
    return (
      <PatientLayout title="Thanh toán" activePage="payment">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!invoice) {
    return (
      <PatientLayout title="Thanh toán" activePage="payment">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-500">Không tìm thấy thông tin hóa đơn</p>
          <Button 
            onClick={() => router.push('/patient/appointments')}
            className="mt-4"
          >
            Quay lại lịch khám
          </Button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Thanh toán" activePage="payment">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Chi tiết hóa đơn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Appointment Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Thông tin lịch khám</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700">Bác sĩ:</span>
                  <span className="ml-2 font-medium">{invoice.doctorName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Khoa:</span>
                  <span className="ml-2 font-medium">{invoice.department}</span>
                </div>
                <div>
                  <span className="text-blue-700">Ngày khám:</span>
                  <span className="ml-2 font-medium">{formatDateTime(invoice.appointmentDate)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Giờ khám:</span>
                  <span className="ml-2 font-medium">{invoice.timeSlot}</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí khám bệnh:</span>
                <span className="font-medium">{formatCurrency(invoice.consultationFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí dịch vụ:</span>
                <span className="font-medium">{formatCurrency(invoice.serviceFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">VAT (10%):</span>
                <span className="font-medium">{formatCurrency(invoice.vat)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedMethod === method.id
                    ? `${method.bgColor} border-current shadow-md`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedMethod === method.id ? method.bgColor : 'bg-gray-100'
                  }`}>
                    <div className={selectedMethod === method.id ? method.color : 'text-gray-600'}>
                      {method.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      {selectedMethod === method.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {method.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Card>
          <CardContent className="p-6">
            <Button 
              className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={handlePayment}
              disabled={isLoading || !invoice}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  {selectedMethod === 'payos' ? (
                    <CreditCard className="h-5 w-5 mr-2" />
                  ) : (
                    <Banknote className="h-5 w-5 mr-2" />
                  )}
                  Thanh toán {formatCurrency(invoice.total)}
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Thanh toán được bảo mật bởi PayOS</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Thông tin thanh toán của bạn được mã hóa và bảo vệ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
