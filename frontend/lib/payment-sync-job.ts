// Payment Sync Job - Tự động đồng bộ thanh toán từ PayOS
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PayOSPayment {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  transactions: Array<{
    reference: string;
    amount: number;
    accountNumber: string;
    description: string;
    transactionDateTime: string;
    virtualAccountName: string;
    virtualAccountNumber: string;
    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;
  }>;
}

interface PayOSResponse {
  error: number;
  message: string;
  data: PayOSPayment;
}

class PaymentSyncJob {
  private readonly PAYOS_API_URL = 'https://api-merchant.payos.vn';
  private readonly PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID!;
  private readonly PAYOS_API_KEY = process.env.PAYOS_API_KEY!;
  private readonly PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY!;

  /**
   * Lấy danh sách thanh toán pending từ database
   */
  async getPendingPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('status', ['pending', 'processing'])
        .not('order_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50); // Giới hạn 50 records mỗi lần

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return [];
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán từ PayOS
   */
  async checkPayOSStatus(orderCode: string): Promise<PayOSPayment | null> {
    try {
      const response = await fetch(`${this.PAYOS_API_URL}/v2/payment-requests/${orderCode}`, {
        method: 'GET',
        headers: {
          'x-client-id': this.PAYOS_CLIENT_ID,
          'x-api-key': this.PAYOS_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`PayOS API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const result: PayOSResponse = await response.json();

      if (result.error !== 0) {
        console.error('PayOS API returned error:', result.message);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Error checking PayOS status:', error);
      return null;
    }
  }

  /**
   * Cập nhật trạng thái thanh toán trong database
   */
  async updatePaymentStatus(paymentId: string, payosData: PayOSPayment) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map PayOS status to our status
      switch (payosData.status) {
        case 'PAID':
          updateData.status = 'completed';
          updateData.paid_at = new Date().toISOString();
          break;
        case 'CANCELLED':
          updateData.status = 'failed';
          break;
        case 'PROCESSING':
          updateData.status = 'processing';
          break;
        default:
          updateData.status = 'pending';
      }

      // Thêm thông tin transaction nếu có
      if (payosData.transactions && payosData.transactions.length > 0) {
        const transaction = payosData.transactions[0];
        updateData.transaction_id = transaction.reference;
        updateData.paid_at = transaction.transactionDateTime;
      }

      // Get current payment to check if patient_id is missing
      const { data: currentPayment } = await supabase
        .from('payments')
        .select('patient_id, record_id, doctor_id')
        .eq('id', paymentId)
        .single();

      // If patient_id is missing but record_id exists, try to get it from medical_records
      if (currentPayment && !currentPayment.patient_id && currentPayment.record_id) {
        const { data: recordData } = await supabase
          .from('medical_records')
          .select('patient_id, doctor_id')
          .eq('record_id', currentPayment.record_id)
          .single();

        if (recordData) {
          updateData.patient_id = recordData.patient_id;
          console.log(`🔗 Adding patient_id ${recordData.patient_id} to payment ${paymentId}`);

          // Nếu chưa có doctor_id, lấy thêm từ medical_records
          if (!currentPayment.doctor_id && recordData.doctor_id) {
            updateData.doctor_id = recordData.doctor_id;

            // Lấy thêm tên bác sĩ
            try {
              const { data: doctorData } = await supabase
                .from('doctors')
                .select('full_name')
                .eq('doctor_id', recordData.doctor_id)
                .single();

              if (doctorData) {
                updateData.doctor_name = doctorData.full_name;
              }
            } catch (error) {
              console.log(`⚠️ Error fetching doctor name: ${error}`);
            }
          }
        }
      }

      // Kiểm tra thêm từ bảng appointments nếu vẫn chưa có patient_id
      if (currentPayment && !updateData.patient_id && !currentPayment.patient_id) {
        try {
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select('patient_id, doctor_id')
            .eq('payment_id', paymentId)
            .single();

          if (appointmentData && appointmentData.patient_id) {
            updateData.patient_id = appointmentData.patient_id;
            console.log(`🔗 Adding patient_id ${appointmentData.patient_id} from appointment to payment ${paymentId}`);

            if (!currentPayment.doctor_id && appointmentData.doctor_id) {
              updateData.doctor_id = appointmentData.doctor_id;
            }
          }
        } catch (error) {
          console.log(`⚠️ Error checking appointments: ${error}`);
        }
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Updated payment ${paymentId} to status: ${updateData.status}`,
        updateData.patient_id ? `with patient_id: ${updateData.patient_id}` : '');
      return data;
    } catch (error) {
      console.error(`❌ Error updating payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Đồng bộ một thanh toán cụ thể
   */
  async syncSinglePayment(payment: any) {
    try {
      console.log(`🔍 Checking payment ${payment.order_code}...`);

      const payosData = await this.checkPayOSStatus(payment.order_code);
      if (!payosData) {
        console.log(`⚠️  Could not get PayOS data for ${payment.order_code}`);
        return false;
      }

      // Chỉ cập nhật nếu trạng thái khác với database
      if (this.shouldUpdateStatus(payment.status, payosData.status)) {
        await this.updatePaymentStatus(payment.id, payosData);
        return true;
      } else {
        console.log(`ℹ️  Payment ${payment.order_code} status unchanged: ${payment.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error syncing payment ${payment.order_code}:`, error);
      return false;
    }
  }

  /**
   * Kiểm tra có nên cập nhật trạng thái không
   */
  private shouldUpdateStatus(currentStatus: string, payosStatus: string): boolean {
    const statusMap: Record<string, string> = {
      'PAID': 'completed',
      'CANCELLED': 'failed',
      'PROCESSING': 'processing',
      'PENDING': 'pending'
    };

    const newStatus = statusMap[payosStatus] || 'pending';
    return currentStatus !== newStatus;
  }

  /**
   * Chạy job đồng bộ tự động
   */
  async runSyncJob() {
    console.log('🚀 Starting payment sync job...');
    const startTime = Date.now();

    try {
      const pendingPayments = await this.getPendingPayments();
      console.log(`📋 Found ${pendingPayments.length} pending payments to check`);

      if (pendingPayments.length === 0) {
        console.log('✅ No pending payments to sync');
        return { success: true, updated: 0, total: 0 };
      }

      let updatedCount = 0;

      // Đồng bộ từng thanh toán (tuần tự để tránh rate limit)
      for (const payment of pendingPayments) {
        const updated = await this.syncSinglePayment(payment);
        if (updated) updatedCount++;

        // Delay 500ms giữa các request để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Sync job completed in ${duration}ms`);
      console.log(`📊 Updated: ${updatedCount}/${pendingPayments.length} payments`);

      return {
        success: true,
        updated: updatedCount,
        total: pendingPayments.length,
        duration
      };
    } catch (error) {
      console.error('❌ Payment sync job failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default PaymentSyncJob;
