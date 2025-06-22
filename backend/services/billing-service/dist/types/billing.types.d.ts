export interface Bill {
    bill_id: string;
    patient_id: string;
    appointment_id?: string;
    invoice_number: string;
    bill_date: Date;
    due_date: Date;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    insurance_coverage: number;
    total_amount: number;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    created_by: string;
}
export interface BillItem {
    item_id: string;
    bill_id: string;
    service_type: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'room_charge' | 'other';
    service_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: Date;
}
export interface Payment {
    payment_id: string;
    bill_id: string;
    payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'online';
    amount: number;
    payment_date: Date;
    transaction_id?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    notes?: string;
    processed_by?: string;
    created_at: Date;
}
export interface Insurance {
    insurance_id: string;
    patient_id: string;
    provider_name: string;
    policy_number: string;
    coverage_percentage: number;
    max_coverage_amount?: number;
    deductible_amount?: number;
    expiry_date?: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateBillRequest {
    patient_id: string;
    appointment_id?: string;
    due_date: string;
    items: CreateBillItemRequest[];
    tax_rate?: number;
    discount_amount?: number;
    insurance_coverage?: number;
    notes?: string;
}
export interface CreateBillItemRequest {
    service_type: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'room_charge' | 'other';
    service_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
}
export interface UpdateBillRequest {
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    due_date?: string;
    discount_amount?: number;
    insurance_coverage?: number;
    notes?: string;
}
export interface CreatePaymentRequest {
    bill_id: string;
    payment_method: 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'online';
    amount: number;
    transaction_id?: string;
    notes?: string;
}
export interface CreateInsuranceRequest {
    patient_id: string;
    provider_name: string;
    policy_number: string;
    coverage_percentage: number;
    max_coverage_amount?: number;
    deductible_amount?: number;
    expiry_date?: string;
}
export interface BillWithDetails extends Bill {
    items: BillItem[];
    payments: Payment[];
    patient_name?: string;
    remaining_amount: number;
}
export interface PaymentSummary {
    total_bills: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
}
export interface StripePaymentIntent {
    payment_intent_id: string;
    amount: number;
    currency: string;
    status: string;
    client_secret: string;
}
export interface InvoiceData {
    bill: BillWithDetails;
    patient: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    hospital: {
        name: string;
        address: string;
        phone: string;
        email: string;
    };
}
//# sourceMappingURL=billing.types.d.ts.map