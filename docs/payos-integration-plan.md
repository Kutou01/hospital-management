# 💳 PayOS Integration Plan - Hospital Management System

**Date**: June 29, 2025  
**Payment Gateway**: PayOS (thay thế VNPay/Momo)  
**Priority**: Critical for 10/10 graduation thesis score  
**Timeline**: 2-3 weeks implementation  

---

## 🎯 **TẠI SAO CHỌN PAYOS?**

### **✅ Ưu điểm của PayOS:**
- **Dễ tích hợp**: SDK đơn giản, documentation rõ ràng
- **Phí thấp**: Phí giao dịch cạnh tranh so với VNPay/Momo
- **Hỗ trợ đa phương thức**: Thẻ ATM, Internet Banking, QR Code
- **Sandbox miễn phí**: Test không giới hạn
- **Vietnamese-first**: Được thiết kế cho thị trường Việt Nam
- **Không cần giấy phép**: Dễ đăng ký cho sinh viên/startup

### **✅ So sánh với VNPay/Momo:**
| Tiêu chí | PayOS | VNPay | Momo |
|----------|-------|-------|------|
| **Dễ đăng ký** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Phí giao dịch** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Tích hợp** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Documentation** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Sandbox** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚀 **PAYOS INTEGRATION ROADMAP**

### **Week 1: PayOS Setup & Basic Integration (5 days)**

#### **Day 1: PayOS Account Setup**
```bash
# 1. Đăng ký tài khoản PayOS
# Visit: https://payos.vn/
# Chỉ cần email và số điện thoại

# 2. Lấy API credentials
# API Key, Client ID, Checksum Key từ dashboard

# 3. Install PayOS SDK
npm install @payos/node
```

#### **Day 2-3: Payment Service Structure**
```bash
# Create Payment Service với PayOS
mkdir backend/services/payment-service
cd backend/services/payment-service
npm init -y

# Install dependencies
npm install express cors helmet morgan
npm install @payos/node crypto moment
npm install @hospital/shared dotenv
npm install typescript @types/node ts-node
```

#### **Day 4-5: PayOS Core Implementation**
```typescript
// src/services/payos.service.ts
import PayOS from '@payos/node';

export class PayOSService {
  private payOS: PayOS;

  constructor() {
    this.payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID!,
      process.env.PAYOS_API_KEY!,
      process.env.PAYOS_CHECKSUM_KEY!
    );
  }

  async createPaymentLink(paymentData: PaymentRequest): Promise<PayOSResponse> {
    try {
      const order = {
        orderCode: paymentData.orderCode,
        amount: paymentData.amount,
        description: paymentData.description,
        items: [
          {
            name: paymentData.serviceName,
            quantity: 1,
            price: paymentData.amount
          }
        ],
        returnUrl: `${process.env.FRONTEND_URL}/patient/payment/result`,
        cancelUrl: `${process.env.FRONTEND_URL}/patient/payment/cancel`
      };

      const paymentLinkResponse = await this.payOS.createPaymentLink(order);
      return paymentLinkResponse;
    } catch (error) {
      throw new Error(`PayOS payment creation failed: ${error.message}`);
    }
  }

  async verifyPaymentWebhook(webhookData: any): Promise<PaymentResult> {
    try {
      const verifiedData = this.payOS.verifyPaymentWebhookData(webhookData);
      
      return {
        success: verifiedData.code === '00',
        orderCode: verifiedData.orderCode,
        amount: verifiedData.amount,
        transactionId: verifiedData.id,
        status: verifiedData.code === '00' ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`PayOS verification failed: ${error.message}`);
    }
  }

  async getPaymentInfo(orderCode: string): Promise<PaymentInfo> {
    try {
      const paymentInfo = await this.payOS.getPaymentLinkInformation(orderCode);
      return paymentInfo;
    } catch (error) {
      throw new Error(`PayOS get payment info failed: ${error.message}`);
    }
  }
}
```

### **Week 2: Frontend Integration (5 days)**

#### **Day 6-7: Payment Checkout Page với PayOS**
```typescript
// app/patient/payment/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode, Banknote } from "lucide-react";

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [selectedMethod, setSelectedMethod] = useState<'payos' | 'cash'>('payos');
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayOSPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/payos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          amount: invoice.total,
          description: `Thanh toán khám bệnh - ${appointmentId}`,
          serviceName: 'Phí khám bệnh'
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
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PatientLayout title="Thanh toán" activePage="payment">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết hóa đơn</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Phí khám bệnh:</span>
                  <span>{formatCurrency(invoice.consultationFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dịch vụ:</span>
                  <span>{formatCurrency(invoice.serviceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (10%):</span>
                  <span>{formatCurrency(invoice.vat)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PayOS Option */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMethod === 'payos' 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('payos')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">PayOS</h3>
                  <p className="text-sm text-gray-600">
                    Thẻ ATM, Internet Banking, QR Code
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Bảo mật cao
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Thanh toán nhanh
                    </span>
                  </div>
                </div>
                {selectedMethod === 'payos' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Cash Option */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMethod === 'cash' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('cash')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Tiền mặt</h3>
                  <p className="text-sm text-gray-600">
                    Thanh toán tại quầy bệnh viện
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng đến quầy thu ngân để thanh toán
                  </p>
                </div>
                {selectedMethod === 'cash' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button 
          className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          onClick={selectedMethod === 'payos' ? handlePayOSPayment : handleCashPayment}
          disabled={isLoading || !invoice}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang xử lý...
            </div>
          ) : (
            `Thanh toán ${formatCurrency(invoice?.total || 0)}`
          )}
        </Button>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 Thanh toán được bảo mật bởi PayOS</p>
          <p>Thông tin thẻ của bạn được mã hóa và bảo vệ</p>
        </div>
      </div>
    </PatientLayout>
  );
}
```

#### **Day 8-9: Payment Result Page**
```typescript
// app/patient/payment/result/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Download, Home } from "lucide-react";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentResult, setPaymentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderCode = searchParams.get('orderCode');
  const status = searchParams.get('status');

  useEffect(() => {
    if (orderCode) {
      verifyPaymentStatus();
    }
  }, [orderCode]);

  const verifyPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments/payos/verify?orderCode=${orderCode}`);
      const data = await response.json();
      
      setPaymentResult(data.data);
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (isLoading) {
      return {
        icon: <Clock className="h-16 w-16 text-gray-400 animate-pulse" />,
        title: "Đang kiểm tra trạng thái...",
        message: "Vui lòng chờ trong giây lát",
        color: "text-gray-600",
        bgColor: "bg-gray-50"
      };
    }

    if (paymentResult?.status === 'success' || status === 'PAID') {
      return {
        icon: <CheckCircle className="h-16 w-16 text-green-600" />,
        title: "Thanh toán thành công! 🎉",
        message: "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi",
        color: "text-green-600",
        bgColor: "bg-green-50"
      };
    }

    if (paymentResult?.status === 'failed' || status === 'CANCELLED') {
      return {
        icon: <XCircle className="h-16 w-16 text-red-600" />,
        title: "Thanh toán thất bại",
        message: "Vui lòng thử lại hoặc liên hệ hỗ trợ",
        color: "text-red-600",
        bgColor: "bg-red-50"
      };
    }

    return {
      icon: <Clock className="h-16 w-16 text-yellow-600" />,
      title: "Thanh toán đang xử lý",
      message: "Chúng tôi đang xác nhận thanh toán của bạn",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className={`w-20 h-20 ${statusDisplay.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {statusDisplay.icon}
          </div>
          
          <h2 className={`text-2xl font-bold mb-3 ${statusDisplay.color}`}>
            {statusDisplay.title}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {statusDisplay.message}
          </p>

          {paymentResult && !isLoading && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3 text-gray-800">Chi tiết giao dịch</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-mono font-medium">{orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(paymentResult.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span>{formatDateTime(paymentResult.createdAt)}</span>
                </div>
                {paymentResult.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã GD:</span>
                    <span className="font-mono text-xs">{paymentResult.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(paymentResult?.status === 'success' || status === 'PAID') && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => downloadReceipt()}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải hóa đơn
              </Button>
            )}
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/patient/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>

            {(paymentResult?.status === 'failed' || status === 'CANCELLED') && (
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
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Cần hỗ trợ? Liên hệ: <span className="font-medium">1900-xxxx</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **Day 10: Payment History Page**
```typescript
// app/patient/payment/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, Search } from "lucide-react";
import { PatientLayout } from "@/components/layout/UniversalLayout";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payments/history');
      const data = await response.json();
      setPayments(data.data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { label: "Thành công", variant: "success" as const },
      failed: { label: "Thất bại", variant: "destructive" as const },
      pending: { label: "Đang xử lý", variant: "secondary" as const }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredPayments = payments.filter(payment =>
    payment.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PatientLayout title="Lịch sử thanh toán" activePage="payment">
      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc mô tả..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{payment.description}</h3>
                        <p className="text-sm text-gray-600">Mã: {payment.orderCode}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatDateTime(payment.createdAt)}</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        {payment.status === 'success' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Tải
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
```

### **Week 3: Testing & Polish (5 days)**

#### **Day 11-13: Backend API Implementation**
```typescript
// backend/services/payment-service/src/controllers/payos.controller.ts
import { Request, Response } from 'express';
import { PayOSService } from '../services/payos.service';
import { logger } from '@hospital/shared';

export class PayOSController {
  private payOSService: PayOSService;

  constructor() {
    this.payOSService = new PayOSService();
  }

  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId, amount, description, serviceName } = req.body;

      // Generate unique order code
      const orderCode = `HOS${Date.now()}`;

      const paymentData = {
        orderCode,
        amount,
        description,
        serviceName,
        appointmentId
      };

      const paymentLink = await this.payOSService.createPaymentLink(paymentData);

      res.json({
        success: true,
        message: 'Payment link created successfully',
        data: {
          orderCode,
          checkoutUrl: paymentLink.checkoutUrl,
          qrCode: paymentLink.qrCode
        }
      });
    } catch (error) {
      logger.error('Error creating PayOS payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment link',
        error: error.message
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookData = req.body;
      const verificationResult = await this.payOSService.verifyPaymentWebhook(webhookData);

      if (verificationResult.success) {
        // Update payment status in database
        await this.updatePaymentStatus(verificationResult);
        
        // Send confirmation email/SMS
        await this.sendPaymentConfirmation(verificationResult);
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Error handling PayOS webhook:', error);
      res.status(500).json({ success: false });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderCode } = req.query;
      
      const paymentInfo = await this.payOSService.getPaymentInfo(orderCode as string);
      
      res.json({
        success: true,
        data: paymentInfo
      });
    } catch (error) {
      logger.error('Error verifying PayOS payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
  }
}
```

#### **Day 14-15: Final Testing & Documentation**
- End-to-end payment flow testing
- Error scenario testing
- Mobile responsiveness testing
- Documentation update

---

## 🔧 **ENVIRONMENT SETUP**

### **PayOS Environment Variables:**
```bash
# .env
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_ENVIRONMENT=sandbox # hoặc production
```

### **Docker Compose Update:**
```yaml
# backend/docker-compose.yml
services:
  payment-service:
    build:
      context: .
      dockerfile: ./services/payment-service/Dockerfile
    ports:
      - "3008:3008"
    environment:
      - PAYOS_CLIENT_ID=${PAYOS_CLIENT_ID}
      - PAYOS_API_KEY=${PAYOS_API_KEY}
      - PAYOS_CHECKSUM_KEY=${PAYOS_CHECKSUM_KEY}
    networks:
      - hospital-network
```

---

## 📊 **EXPECTED RESULTS**

### **Technical Achievement:**
- ✅ Complete payment workflow với PayOS
- ✅ Vietnamese payment interface
- ✅ Mobile-responsive design
- ✅ Real-time payment verification
- ✅ Error handling cho mọi scenario

### **Graduation Thesis Impact:**
- **+1.0 điểm**: Complete payment integration
- **+0.5 điểm**: Vietnamese market adaptation
- **+0.5 điểm**: Professional user experience

### **Total Score**: 8.0 → 10.0 (Perfect!)

---

## 🎯 **IMMEDIATE NEXT STEPS**

1. **Đăng ký PayOS account** (5 phút)
2. **Lấy API credentials** từ dashboard
3. **Tạo Payment Service structure** 
4. **Implement basic PayOS integration**
5. **Test với sandbox environment**

PayOS sẽ giúp bạn hoàn thành payment integration nhanh chóng và hiệu quả hơn VNPay/Momo, đặc biệt phù hợp cho graduation thesis project!
