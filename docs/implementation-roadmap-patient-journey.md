# 🚀 Implementation Roadmap - Complete Patient Journey

**Date**: June 29, 2025  
**Target**: Complete patient journey implementation for 10/10 graduation thesis score  
**Timeline**: 6-8 weeks  
**Priority**: Payment Service → Notifications → Queue Management  

---

## 🎯 **ROADMAP OVERVIEW**

This roadmap provides a step-by-step implementation plan to complete the missing components for a full patient journey experience in the hospital management system.

### **Success Criteria**:
- ✅ Complete end-to-end patient journey (6 phases)
- ✅ Vietnamese payment integration (VNPay + Momo)
- ✅ Enhanced notification system (SMS + Push + WhatsApp)
- ✅ Queue management system (Check-in + Tracking)
- ✅ 10/10 graduation thesis score achievement

---

## 📅 **PHASE 1: PAYMENT SERVICE IMPLEMENTATION (4 weeks)**

### **Week 1: VNPay Integration Foundation**

#### **Day 1-2: Setup & Registration**
```bash
# 1. Register VNPay merchant account
# Visit: https://vnpay.vn/dang-ky-merchant
# Required documents: Business license, bank account, ID

# 2. Create Payment Service structure
mkdir backend/services/payment-service
cd backend/services/payment-service
npm init -y

# 3. Install dependencies
npm install express cors helmet morgan
npm install vnpay crypto moment
npm install @hospital/shared dotenv
npm install typescript @types/node ts-node
```

#### **Day 3-4: Basic Service Setup**
```typescript
// src/app.ts - Basic payment service structure
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { vnpayRoutes } from './routes/vnpay.routes';
import { momoRoutes } from './routes/momo.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/payments/vnpay', vnpayRoutes);
app.use('/api/payments/momo', momoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

export default app;
```

#### **Day 5-7: VNPay Core Implementation**
```typescript
// src/services/vnpay.service.ts
export class VNPayService {
  private vnpUrl = process.env.VNP_URL;
  private vnpTmnCode = process.env.VNP_TMN_CODE;
  private vnpHashSecret = process.env.VNP_HASH_SECRET;

  async createPaymentUrl(paymentData: PaymentRequest): Promise<string> {
    // Implementation for VNPay payment URL generation
  }

  async verifyPayment(vnpParams: any): Promise<PaymentResult> {
    // Implementation for payment verification
  }

  async processRefund(refundData: RefundRequest): Promise<RefundResult> {
    // Implementation for refund processing
  }
}
```

### **Week 2: VNPay Integration Completion**

#### **Day 8-10: Payment Flow Implementation**
```typescript
// src/controllers/payment.controller.ts
export class PaymentController {
  async createPayment(req: Request, res: Response) {
    try {
      const { appointmentId, amount, description } = req.body;
      
      // 1. Validate appointment exists
      const appointment = await this.validateAppointment(appointmentId);
      
      // 2. Create payment record
      const payment = await this.createPaymentRecord({
        appointmentId,
        amount,
        status: 'pending'
      });
      
      // 3. Generate VNPay URL
      const paymentUrl = await this.vnpayService.createPaymentUrl({
        orderId: payment.id,
        amount,
        description,
        returnUrl: `${process.env.FRONTEND_URL}/payment/result`
      });
      
      res.json({ success: true, paymentUrl });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

#### **Day 11-14: Testing & Error Handling**
- VNPay sandbox testing
- Payment callback handling
- Error scenario testing
- Database integration testing

### **Week 3: Momo Integration**

#### **Day 15-17: Momo Setup**
```bash
# 1. Register Momo Business account
# Visit: https://business.momo.vn/

# 2. Install Momo SDK
npm install momo-payment-sdk

# 3. Setup Momo configuration
```

#### **Day 18-21: Momo Implementation**
```typescript
// src/services/momo.service.ts
export class MomoService {
  private partnerCode = process.env.MOMO_PARTNER_CODE;
  private accessKey = process.env.MOMO_ACCESS_KEY;
  private secretKey = process.env.MOMO_SECRET_KEY;

  async createPayment(paymentData: PaymentRequest): Promise<MomoPaymentResponse> {
    // Momo payment creation implementation
  }

  async verifyPayment(momoData: any): Promise<PaymentResult> {
    // Momo payment verification
  }
}
```

### **Week 4: Payment UI & Integration**

#### **Day 22-25: Frontend Payment Interface**
```typescript
// frontend/components/payment/PaymentSelection.tsx
export const PaymentSelection = ({ invoice }: { invoice: Invoice }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('vnpay');
  
  const handlePayment = async () => {
    try {
      const response = await paymentApi.createPayment({
        appointmentId: invoice.appointmentId,
        amount: invoice.total,
        method: selectedMethod
      });
      
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      toast.error('Lỗi thanh toán: ' + error.message);
    }
  };

  return (
    <div className="payment-selection">
      <h3>Chọn phương thức thanh toán</h3>
      
      <div className="payment-methods">
        <PaymentMethodCard
          method="vnpay"
          title="VNPay"
          description="Thẻ ATM, Internet Banking"
          selected={selectedMethod === 'vnpay'}
          onSelect={() => setSelectedMethod('vnpay')}
        />
        
        <PaymentMethodCard
          method="momo"
          title="Ví MoMo"
          description="Thanh toán qua ví điện tử MoMo"
          selected={selectedMethod === 'momo'}
          onSelect={() => setSelectedMethod('momo')}
        />
        
        <PaymentMethodCard
          method="cash"
          title="Tiền mặt"
          description="Thanh toán tại quầy bệnh viện"
          selected={selectedMethod === 'cash'}
          onSelect={() => setSelectedMethod('cash')}
        />
      </div>
      
      <Button onClick={handlePayment} className="w-full">
        Thanh toán {formatCurrency(invoice.total)}
      </Button>
    </div>
  );
};
```

#### **Day 26-28: End-to-end Testing**
- Complete payment flow testing
- Error handling verification
- Performance testing
- Security testing

---

## 📅 **PHASE 2: ENHANCED NOTIFICATION SERVICE (2 weeks)**

### **Week 5: SMS Integration**

#### **Day 29-31: Vietnamese SMS Providers**
```typescript
// src/services/sms.service.ts
export class SMSService {
  private providers = {
    viettel: new ViettelSMSProvider(),
    vinaphone: new VinaPhoneSMSProvider(),
    mobifone: new MobiFoneSMSProvider()
  };

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    // Detect carrier from phone number
    const carrier = this.detectCarrier(phoneNumber);
    
    // Send via appropriate provider
    return await this.providers[carrier].send(phoneNumber, message);
  }

  private detectCarrier(phoneNumber: string): string {
    // Vietnamese carrier detection logic
    if (phoneNumber.startsWith('096') || phoneNumber.startsWith('097')) {
      return 'viettel';
    }
    // Add other carrier patterns
  }
}
```

#### **Day 32-35: SMS Templates & Scheduling**
```typescript
// SMS templates for Vietnamese healthcare
const SMS_TEMPLATES = {
  APPOINTMENT_CONFIRMATION: `
Xac nhan lich kham:
- Ma lich: {appointmentId}
- Bac si: {doctorName}
- Thoi gian: {datetime}
- Dia diem: {location}
Hotline: 1900-xxxx
  `,
  
  APPOINTMENT_REMINDER: `
Nhac nho lich kham:
Ban co lich kham vao {datetime} voi BS. {doctorName}
Vui long den som 15 phut.
Check-in online: {checkinUrl}
  `,
  
  PAYMENT_SUCCESS: `
Thanh toan thanh cong!
- So tien: {amount} VND
- Ma GD: {transactionId}
- Lich kham: {appointmentId}
Cam on ban da su dung dich vu!
  `
};
```

### **Week 6: Push Notifications & WhatsApp**

#### **Day 36-38: Firebase Push Notifications**
```typescript
// src/services/push-notification.service.ts
import admin from 'firebase-admin';

export class PushNotificationService {
  async sendToDevice(deviceToken: string, notification: NotificationPayload) {
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data,
      android: {
        notification: {
          icon: 'hospital_icon',
          color: '#0891b2' // Teal color
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        }
      }
    };

    return await admin.messaging().send(message);
  }
}
```

#### **Day 39-42: WhatsApp Business Integration**
```typescript
// src/services/whatsapp.service.ts
export class WhatsAppService {
  async sendTemplateMessage(phoneNumber: string, templateName: string, params: any[]) {
    const message = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'vi' },
        components: [
          {
            type: 'body',
            parameters: params.map(param => ({ type: 'text', text: param }))
          }
        ]
      }
    };

    return await this.whatsappClient.send(message);
  }
}
```

---

## 📅 **PHASE 3: QUEUE MANAGEMENT SYSTEM (3 weeks)**

### **Week 7: Online Check-in System**

#### **Day 43-45: QR Code Generation**
```typescript
// src/services/checkin.service.ts
import QRCode from 'qrcode';

export class CheckInService {
  async generateCheckInQR(appointmentId: string): Promise<string> {
    const checkInData = {
      appointmentId,
      timestamp: Date.now(),
      hash: this.generateSecureHash(appointmentId)
    };

    const checkInUrl = `${process.env.FRONTEND_URL}/checkin/${appointmentId}?token=${checkInData.hash}`;
    return await QRCode.toDataURL(checkInUrl);
  }

  async processCheckIn(appointmentId: string, token: string): Promise<CheckInResult> {
    // Verify token and process check-in
    const isValid = this.verifyCheckInToken(appointmentId, token);
    
    if (!isValid) {
      throw new Error('Invalid check-in token');
    }

    // Update appointment status
    await this.updateAppointmentStatus(appointmentId, 'checked-in');
    
    // Assign queue position
    const queuePosition = await this.assignQueuePosition(appointmentId);
    
    return {
      success: true,
      queuePosition,
      estimatedWaitTime: this.calculateWaitTime(queuePosition)
    };
  }
}
```

#### **Day 46-49: Queue Position Tracking**
```typescript
// src/services/queue.service.ts
export class QueueService {
  async getQueueStatus(doctorId: string): Promise<QueueStatus> {
    const queue = await this.redis.get(`queue:${doctorId}`);
    return JSON.parse(queue || '[]');
  }

  async updateQueuePosition(appointmentId: string, newPosition: number) {
    // Update queue position and notify patient
    await this.redis.set(`queue_position:${appointmentId}`, newPosition);
    
    // Send real-time update via WebSocket
    this.websocketService.emit(`appointment:${appointmentId}`, {
      type: 'queue_update',
      position: newPosition,
      estimatedWaitTime: this.calculateWaitTime(newPosition)
    });
  }
}
```

### **Week 8: Real-time Queue Display**

#### **Day 50-52: WebSocket Implementation**
```typescript
// src/websocket/queue.websocket.ts
export class QueueWebSocketHandler {
  handleConnection(socket: Socket) {
    socket.on('join_queue', (appointmentId: string) => {
      socket.join(`appointment:${appointmentId}`);
      
      // Send current queue status
      this.sendQueueUpdate(socket, appointmentId);
    });

    socket.on('doctor_queue', (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
      
      // Send current doctor queue
      this.sendDoctorQueue(socket, doctorId);
    });
  }

  async sendQueueUpdate(socket: Socket, appointmentId: string) {
    const queueInfo = await this.queueService.getAppointmentQueueInfo(appointmentId);
    socket.emit('queue_update', queueInfo);
  }
}
```

#### **Day 53-56: Mobile Queue Interface**
```typescript
// frontend/components/queue/QueueStatus.tsx
export const QueueStatus = ({ appointmentId }: { appointmentId: string }) => {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket && appointmentId) {
      socket.emit('join_queue', appointmentId);
      
      socket.on('queue_update', (info: QueueInfo) => {
        setQueueInfo(info);
      });
    }
  }, [socket, appointmentId]);

  if (!queueInfo) {
    return <QueueStatusSkeleton />;
  }

  return (
    <Card className="queue-status">
      <CardHeader>
        <CardTitle>Trạng thái hàng đợi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="queue-info">
          <div className="position">
            <span className="label">Vị trí của bạn:</span>
            <span className="value">{queueInfo.position}</span>
          </div>
          
          <div className="wait-time">
            <span className="label">Thời gian chờ dự kiến:</span>
            <span className="value">{queueInfo.estimatedWaitTime} phút</span>
          </div>
          
          <div className="current-patient">
            <span className="label">Đang khám:</span>
            <span className="value">Bệnh nhân #{queueInfo.currentPatient}</span>
          </div>
        </div>
        
        <Progress 
          value={(queueInfo.totalInQueue - queueInfo.position) / queueInfo.totalInQueue * 100}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
};
```

---

## 🔧 **INTEGRATION WITH EXISTING MICROSERVICES**

### **API Gateway Updates**
```typescript
// backend/services/api-gateway/src/app.ts
// Add new service routes
app.use('/api/payments', createProxyMiddleware({
  target: 'http://payment-service:3008',
  changeOrigin: true
}));

app.use('/api/queue', createProxyMiddleware({
  target: 'http://queue-service:3009',
  changeOrigin: true
}));
```

### **Docker Compose Updates**
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
      - VNP_URL=${VNP_URL}
      - VNP_TMN_CODE=${VNP_TMN_CODE}
      - VNP_HASH_SECRET=${VNP_HASH_SECRET}
      - MOMO_PARTNER_CODE=${MOMO_PARTNER_CODE}
    networks:
      - hospital-network

  queue-service:
    build:
      context: .
      dockerfile: ./services/queue-service/Dockerfile
    ports:
      - "3009:3009"
    depends_on:
      - redis
    networks:
      - hospital-network
```

---

## 📊 **SUCCESS METRICS & TESTING**

### **Payment Service Testing**
```bash
# Test VNPay integration
curl -X POST http://localhost:3008/api/payments/vnpay/create \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"APT-001","amount":200000,"description":"Phí khám bệnh"}'

# Test Momo integration
curl -X POST http://localhost:3008/api/payments/momo/create \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"APT-001","amount":200000,"description":"Phí khám bệnh"}'
```

### **Notification Testing**
```bash
# Test SMS sending
curl -X POST http://localhost:3010/api/notifications/sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0123456789","template":"APPOINTMENT_REMINDER","params":{"datetime":"14:00 01/07/2025","doctorName":"BS. Nguyễn Văn A"}}'
```

### **Queue Management Testing**
```bash
# Test check-in
curl -X POST http://localhost:3009/api/queue/checkin \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"APT-001","token":"secure-token"}'
```

---

## 🎯 **GRADUATION THESIS DEFENSE PREPARATION**

### **Demo Scenarios**
1. **Complete Patient Journey Demo** (15 minutes)
   - Registration → Booking → Payment → Check-in → Consultation → Follow-up

2. **Vietnamese Payment Integration Demo** (10 minutes)
   - VNPay payment flow
   - Momo wallet payment
   - Error handling scenarios

3. **Real-time Features Demo** (5 minutes)
   - Queue position updates
   - Notification delivery
   - WebSocket communication

### **Technical Presentation Points**
- Microservices architecture scalability
- Vietnamese market adaptation
- Security implementation (PCI DSS compliance)
- Real-time communication (WebSocket)
- Mobile-first design approach

This comprehensive implementation roadmap ensures your hospital management system achieves the full 10/10 score with a complete, professional-grade patient journey experience.
