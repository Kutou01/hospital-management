// Payment Recovery Job - Tìm và khôi phục giao dịch bị sót
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PayOSTransaction {
  id: string;
  orderCode: number;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
}

class PaymentRecoveryJob {
  private readonly PAYOS_API_URL = 'https://api-merchant.payos.vn';
  private readonly PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID!;
  private readonly PAYOS_API_KEY = process.env.PAYOS_API_KEY!;

  /**
   * Lấy danh sách giao dịch từ PayOS bằng cách kiểm tra từng order code
   */
  async getPayOSTransactions(fromDate: Date, toDate: Date): Promise<PayOSTransaction[]> {
    try {
      // Lấy danh sách order codes từ database trong khoảng thời gian
      const { data: dbPayments } = await supabase
        .from('payments')
        .select('order_code')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .not('order_code', 'is', null);

      if (!dbPayments || dbPayments.length === 0) {
        console.log('No order codes found in database for the specified period');
        return [];
      }

      const transactions: PayOSTransaction[] = [];

      // Kiểm tra từng order code với PayOS
      for (const payment of dbPayments) {
        if (!payment.order_code) continue;

        try {
          const response = await fetch(`${this.PAYOS_API_URL}/v2/payment-requests/${payment.order_code}`, {
            method: 'GET',
            headers: {
              'x-client-id': this.PAYOS_CLIENT_ID,
              'x-api-key': this.PAYOS_API_KEY,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();

            if (result.error === 0 && result.data) {
              const payosData = result.data;
              transactions.push({
                id: payosData.id,
                orderCode: payosData.orderCode,
                amount: payosData.amount,
                status: payosData.status,
                createdAt: payosData.createdAt,
                paidAt: payosData.paidAt
              });
            }
          }

          // Delay để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Error checking order ${payment.order_code}:`, error);
        }
      }

      console.log(`Found ${transactions.length} PayOS transactions from ${dbPayments.length} order codes`);
      return transactions;

    } catch (error) {
      console.error('Error fetching PayOS transactions:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách thanh toán từ database trong khoảng thời gian
   */
  async getDatabasePayments(fromDate: Date, toDate: Date) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching database payments:', error);
      return [];
    }
  }

  /**
   * So sánh và tìm giao dịch bị sót
   */
  async findMissingTransactions(hours: number = 24) {
    console.log(`🔍 Checking for missing transactions in the last ${hours} hours...`);
    
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - hours * 60 * 60 * 1000);

    try {
      // Lấy dữ liệu từ cả 2 nguồn
      const [payosTransactions, databasePayments] = await Promise.all([
        this.getPayOSTransactions(fromDate, toDate),
        this.getDatabasePayments(fromDate, toDate)
      ]);

      console.log(`📊 Found ${payosTransactions.length} PayOS transactions, ${databasePayments.length} database payments`);

      // Tạo map của database payments theo order_code
      const dbPaymentMap = new Map();
      databasePayments.forEach(payment => {
        if (payment.order_code) {
          dbPaymentMap.set(payment.order_code, payment);
        }
      });

      // Tìm giao dịch PayOS không có trong database
      const missingTransactions = payosTransactions.filter(payosTransaction => {
        return !dbPaymentMap.has(payosTransaction.orderCode.toString());
      });

      // Tìm giao dịch có trạng thái khác nhau
      const statusMismatches = payosTransactions.filter(payosTransaction => {
        const dbPayment = dbPaymentMap.get(payosTransaction.orderCode.toString());
        if (!dbPayment) return false;

        const payosStatus = this.mapPayOSStatus(payosTransaction.status);
        return dbPayment.status !== payosStatus;
      });

      console.log(`🚨 Found ${missingTransactions.length} missing transactions`);
      console.log(`⚠️  Found ${statusMismatches.length} status mismatches`);

      return {
        missing: missingTransactions,
        statusMismatches: statusMismatches,
        summary: {
          payosTotal: payosTransactions.length,
          databaseTotal: databasePayments.length,
          missingCount: missingTransactions.length,
          mismatchCount: statusMismatches.length
        }
      };

    } catch (error) {
      console.error('Error finding missing transactions:', error);
      throw error;
    }
  }

  /**
   * Khôi phục giao dịch bị sót
   */
  async recoverMissingTransactions(hours: number = 24) {
    console.log('🔧 Starting payment recovery process...');
    
    try {
      const analysis = await this.findMissingTransactions(hours);
      let recoveredCount = 0;
      let updatedCount = 0;

      // Khôi phục giao dịch bị sót
      for (const transaction of analysis.missing) {
        try {
          const newPayment = {
            order_code: transaction.orderCode.toString(),
            amount: transaction.amount,
            description: `Khôi phục từ PayOS - ${transaction.orderCode}`,
            status: this.mapPayOSStatus(transaction.status),
            payment_method: 'bank_transfer',
            doctor_id: 'DOC000001',
            doctor_name: 'Bác sĩ hệ thống',
            patient_id: 'PAT000001',
            paid_at: transaction.paidAt || null,
            created_at: transaction.createdAt,
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('payments')
            .insert(newPayment);

          if (error) {
            console.error(`❌ Failed to recover transaction ${transaction.orderCode}:`, error);
          } else {
            console.log(`✅ Recovered transaction ${transaction.orderCode}`);
            recoveredCount++;
          }

          // Delay để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`❌ Error recovering transaction ${transaction.orderCode}:`, error);
        }
      }

      // Cập nhật trạng thái sai lệch
      for (const transaction of analysis.statusMismatches) {
        try {
          const correctStatus = this.mapPayOSStatus(transaction.status);
          const updateData: any = {
            status: correctStatus,
            updated_at: new Date().toISOString()
          };

          if (transaction.paidAt && correctStatus === 'completed') {
            updateData.paid_at = transaction.paidAt;
          }

          const { error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('order_code', transaction.orderCode.toString());

          if (error) {
            console.error(`❌ Failed to update transaction ${transaction.orderCode}:`, error);
          } else {
            console.log(`✅ Updated transaction ${transaction.orderCode} status to ${correctStatus}`);
            updatedCount++;
          }

          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`❌ Error updating transaction ${transaction.orderCode}:`, error);
        }
      }

      const result = {
        success: true,
        summary: analysis.summary,
        recovered: recoveredCount,
        updated: updatedCount,
        total: recoveredCount + updatedCount
      };

      console.log('🎉 Recovery process completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Recovery process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Map PayOS status to our status
   */
  private mapPayOSStatus(payosStatus: string): string {
    switch (payosStatus) {
      case 'PAID':
        return 'completed';
      case 'CANCELLED':
        return 'failed';
      case 'PROCESSING':
        return 'processing';
      default:
        return 'pending';
    }
  }

  /**
   * Chạy kiểm tra định kỳ
   */
  async runPeriodicCheck(hours: number = 6) {
    console.log(`🕐 Running periodic recovery check for last ${hours} hours...`);
    
    try {
      const result = await this.recoverMissingTransactions(hours);
      
      if (result.success && result.total > 0) {
        console.log(`🚨 ALERT: Found and recovered ${result.total} missing/incorrect transactions!`);
        // Có thể gửi email/SMS cảnh báo ở đây
      }
      
      return result;
    } catch (error) {
      console.error('❌ Periodic check failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default PaymentRecoveryJob;
