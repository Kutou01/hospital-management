import { Bill, Payment, Insurance, CreateBillRequest, UpdateBillRequest, CreatePaymentRequest, CreateInsuranceRequest, BillWithDetails, PaymentSummary } from '../types/billing.types';
export declare class BillingRepository {
    private supabase;
    constructor();
    findAllBills(limit?: number, offset?: number): Promise<Bill[]>;
    findBillById(billId: string): Promise<BillWithDetails | null>;
    findBillsByPatientId(patientId: string): Promise<Bill[]>;
    createBill(billData: CreateBillRequest, createdBy: string): Promise<BillWithDetails>;
    updateBill(billId: string, billData: UpdateBillRequest): Promise<Bill>;
    deleteBill(billId: string): Promise<void>;
    createPayment(paymentData: CreatePaymentRequest, processedBy: string): Promise<Payment>;
    getPaymentsByBillId(billId: string): Promise<Payment[]>;
    createInsurance(insuranceData: CreateInsuranceRequest): Promise<Insurance>;
    getInsuranceByPatientId(patientId: string): Promise<Insurance[]>;
    getPaymentSummary(): Promise<PaymentSummary>;
    private updateBillStatusIfPaid;
    private generateBillId;
    private generateInvoiceNumber;
    private generatePaymentId;
    private generateInsuranceId;
    private mapSupabaseBillToBill;
    private mapSupabaseBillItemToBillItem;
    private mapSupabasePaymentToPayment;
    private mapSupabaseInsuranceToInsurance;
}
//# sourceMappingURL=billing.repository.d.ts.map