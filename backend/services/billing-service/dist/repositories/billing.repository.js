"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const shared_1 = require("@hospital/shared");
class BillingRepository {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    // Bill methods
    async findAllBills(limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from('billing')
                .select('*')
                .order('bill_date', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseBillToBill) || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching bills', { error });
            throw error;
        }
    }
    async findBillById(billId) {
        try {
            // Get bill
            const { data: billData, error: billError } = await this.supabase
                .from('billing')
                .select('*')
                .eq('bill_id', billId)
                .single();
            if (billError) {
                if (billError.code === 'PGRST116')
                    return null;
                throw billError;
            }
            // Get bill items
            const { data: itemsData, error: itemsError } = await this.supabase
                .from('billing_items')
                .select('*')
                .eq('bill_id', billId);
            if (itemsError)
                throw itemsError;
            // Get payments
            const { data: paymentsData, error: paymentsError } = await this.supabase
                .from('payments')
                .select('*')
                .eq('bill_id', billId);
            if (paymentsError)
                throw paymentsError;
            const bill = this.mapSupabaseBillToBill(billData);
            const items = itemsData?.map(this.mapSupabaseBillItemToBillItem) || [];
            const payments = paymentsData?.map(this.mapSupabasePaymentToPayment) || [];
            const totalPaid = payments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0);
            return {
                ...bill,
                items,
                payments,
                remaining_amount: bill.total_amount - totalPaid
            };
        }
        catch (error) {
            shared_1.logger.error('Error fetching bill by ID', { error, billId });
            throw error;
        }
    }
    async findBillsByPatientId(patientId) {
        try {
            const { data, error } = await this.supabase
                .from('billing')
                .select('*')
                .eq('patient_id', patientId)
                .order('bill_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseBillToBill) || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching bills by patient ID', { error, patientId });
            throw error;
        }
    }
    async createBill(billData, createdBy) {
        try {
            const billId = await this.generateBillId();
            const invoiceNumber = await this.generateInvoiceNumber();
            // Calculate totals
            const subtotal = billData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            const taxAmount = subtotal * (billData.tax_rate || 0.1); // 10% default tax
            const discountAmount = billData.discount_amount || 0;
            const insuranceCoverage = billData.insurance_coverage || 0;
            const totalAmount = subtotal + taxAmount - discountAmount - insuranceCoverage;
            const supabaseBill = {
                bill_id: billId,
                patient_id: billData.patient_id,
                appointment_id: billData.appointment_id,
                invoice_number: invoiceNumber,
                bill_date: new Date().toISOString(),
                due_date: billData.due_date,
                subtotal,
                tax_amount: taxAmount,
                discount_amount: discountAmount,
                insurance_coverage: insuranceCoverage,
                total_amount: totalAmount,
                notes: billData.notes,
                created_by: createdBy
            };
            // Insert bill
            const { data: billResult, error: billError } = await this.supabase
                .from('billing')
                .insert([supabaseBill])
                .select()
                .single();
            if (billError)
                throw billError;
            // Insert bill items
            const billItems = billData.items.map((item, index) => ({
                item_id: `${billId}_${(index + 1).toString().padStart(3, '0')}`,
                bill_id: billId,
                service_type: item.service_type,
                service_id: item.service_id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.quantity * item.unit_price
            }));
            const { data: itemsResult, error: itemsError } = await this.supabase
                .from('billing_items')
                .insert(billItems)
                .select();
            if (itemsError)
                throw itemsError;
            const bill = this.mapSupabaseBillToBill(billResult);
            const items = itemsResult?.map(this.mapSupabaseBillItemToBillItem) || [];
            return {
                ...bill,
                items,
                payments: [],
                remaining_amount: totalAmount
            };
        }
        catch (error) {
            shared_1.logger.error('Error creating bill', { error, billData });
            throw error;
        }
    }
    async updateBill(billId, billData) {
        try {
            const updateData = {
                ...billData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabase
                .from('billing')
                .update(updateData)
                .eq('bill_id', billId)
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseBillToBill(data);
        }
        catch (error) {
            shared_1.logger.error('Error updating bill', { error, billId, billData });
            throw error;
        }
    }
    async deleteBill(billId) {
        try {
            // Delete bill items first
            const { error: itemsError } = await this.supabase
                .from('billing_items')
                .delete()
                .eq('bill_id', billId);
            if (itemsError)
                throw itemsError;
            // Delete bill
            const { error } = await this.supabase
                .from('billing')
                .delete()
                .eq('bill_id', billId);
            if (error)
                throw error;
        }
        catch (error) {
            shared_1.logger.error('Error deleting bill', { error, billId });
            throw error;
        }
    }
    // Payment methods
    async createPayment(paymentData, processedBy) {
        try {
            const paymentId = await this.generatePaymentId();
            const supabasePayment = {
                payment_id: paymentId,
                bill_id: paymentData.bill_id,
                payment_method: paymentData.payment_method,
                amount: paymentData.amount,
                payment_date: new Date().toISOString(),
                transaction_id: paymentData.transaction_id,
                status: 'completed',
                notes: paymentData.notes,
                processed_by: processedBy
            };
            const { data, error } = await this.supabase
                .from('payments')
                .insert([supabasePayment])
                .select()
                .single();
            if (error)
                throw error;
            // Update bill status if fully paid
            await this.updateBillStatusIfPaid(paymentData.bill_id);
            return this.mapSupabasePaymentToPayment(data);
        }
        catch (error) {
            shared_1.logger.error('Error creating payment', { error, paymentData });
            throw error;
        }
    }
    async getPaymentsByBillId(billId) {
        try {
            const { data, error } = await this.supabase
                .from('payments')
                .select('*')
                .eq('bill_id', billId)
                .order('payment_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabasePaymentToPayment) || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching payments by bill ID', { error, billId });
            throw error;
        }
    }
    // Insurance methods
    async createInsurance(insuranceData) {
        try {
            const insuranceId = await this.generateInsuranceId();
            const supabaseInsurance = {
                insurance_id: insuranceId,
                ...insuranceData
            };
            const { data, error } = await this.supabase
                .from('insurance')
                .insert([supabaseInsurance])
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseInsuranceToInsurance(data);
        }
        catch (error) {
            shared_1.logger.error('Error creating insurance', { error, insuranceData });
            throw error;
        }
    }
    async getInsuranceByPatientId(patientId) {
        try {
            const { data, error } = await this.supabase
                .from('insurance')
                .select('*')
                .eq('patient_id', patientId)
                .eq('is_active', true);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseInsuranceToInsurance) || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching insurance by patient ID', { error, patientId });
            throw error;
        }
    }
    // Analytics methods
    async getPaymentSummary() {
        try {
            const { data, error } = await this.supabase
                .from('billing')
                .select('status, total_amount');
            if (error)
                throw error;
            const summary = data?.reduce((acc, bill) => {
                acc.total_bills++;
                acc.total_amount += bill.total_amount;
                switch (bill.status) {
                    case 'paid':
                        acc.paid_amount += bill.total_amount;
                        break;
                    case 'pending':
                        acc.pending_amount += bill.total_amount;
                        break;
                    case 'overdue':
                        acc.overdue_amount += bill.total_amount;
                        break;
                }
                return acc;
            }, {
                total_bills: 0,
                total_amount: 0,
                paid_amount: 0,
                pending_amount: 0,
                overdue_amount: 0
            }) || {
                total_bills: 0,
                total_amount: 0,
                paid_amount: 0,
                pending_amount: 0,
                overdue_amount: 0
            };
            return summary;
        }
        catch (error) {
            shared_1.logger.error('Error getting payment summary', { error });
            throw error;
        }
    }
    // Helper methods
    async updateBillStatusIfPaid(billId) {
        try {
            const bill = await this.findBillById(billId);
            if (bill && bill.remaining_amount <= 0) {
                await this.updateBill(billId, { status: 'paid' });
            }
        }
        catch (error) {
            shared_1.logger.error('Error updating bill status', { error, billId });
        }
    }
    async generateBillId() {
        const { count } = await this.supabase
            .from('billing')
            .select('*', { count: 'exact', head: true });
        const nextId = ((count || 0) + 1).toString().padStart(6, '0');
        return `BILL${nextId}`;
    }
    async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const { count } = await this.supabase
            .from('billing')
            .select('*', { count: 'exact', head: true });
        const nextId = ((count || 0) + 1).toString().padStart(4, '0');
        return `INV-${year}-${nextId}`;
    }
    async generatePaymentId() {
        const { count } = await this.supabase
            .from('payments')
            .select('*', { count: 'exact', head: true });
        const nextId = ((count || 0) + 1).toString().padStart(6, '0');
        return `PAY${nextId}`;
    }
    async generateInsuranceId() {
        const { count } = await this.supabase
            .from('insurance')
            .select('*', { count: 'exact', head: true });
        const nextId = ((count || 0) + 1).toString().padStart(6, '0');
        return `INS${nextId}`;
    }
    mapSupabaseBillToBill(supabaseBill) {
        return {
            bill_id: supabaseBill.bill_id,
            patient_id: supabaseBill.patient_id,
            appointment_id: supabaseBill.appointment_id,
            invoice_number: supabaseBill.invoice_number,
            bill_date: new Date(supabaseBill.bill_date),
            due_date: new Date(supabaseBill.due_date),
            status: supabaseBill.status,
            subtotal: supabaseBill.subtotal,
            tax_amount: supabaseBill.tax_amount,
            discount_amount: supabaseBill.discount_amount,
            insurance_coverage: supabaseBill.insurance_coverage,
            total_amount: supabaseBill.total_amount,
            notes: supabaseBill.notes,
            created_at: new Date(supabaseBill.created_at),
            updated_at: new Date(supabaseBill.updated_at),
            created_by: supabaseBill.created_by
        };
    }
    mapSupabaseBillItemToBillItem(supabaseItem) {
        return {
            item_id: supabaseItem.item_id,
            bill_id: supabaseItem.bill_id,
            service_type: supabaseItem.service_type,
            service_id: supabaseItem.service_id,
            description: supabaseItem.description,
            quantity: supabaseItem.quantity,
            unit_price: supabaseItem.unit_price,
            total_price: supabaseItem.total_price,
            created_at: new Date(supabaseItem.created_at)
        };
    }
    mapSupabasePaymentToPayment(supabasePayment) {
        return {
            payment_id: supabasePayment.payment_id,
            bill_id: supabasePayment.bill_id,
            payment_method: supabasePayment.payment_method,
            amount: supabasePayment.amount,
            payment_date: new Date(supabasePayment.payment_date),
            transaction_id: supabasePayment.transaction_id,
            status: supabasePayment.status,
            notes: supabasePayment.notes,
            processed_by: supabasePayment.processed_by,
            created_at: new Date(supabasePayment.created_at)
        };
    }
    mapSupabaseInsuranceToInsurance(supabaseInsurance) {
        return {
            insurance_id: supabaseInsurance.insurance_id,
            patient_id: supabaseInsurance.patient_id,
            provider_name: supabaseInsurance.provider_name,
            policy_number: supabaseInsurance.policy_number,
            coverage_percentage: supabaseInsurance.coverage_percentage,
            max_coverage_amount: supabaseInsurance.max_coverage_amount,
            deductible_amount: supabaseInsurance.deductible_amount,
            expiry_date: supabaseInsurance.expiry_date ? new Date(supabaseInsurance.expiry_date) : undefined,
            is_active: supabaseInsurance.is_active,
            created_at: new Date(supabaseInsurance.created_at),
            updated_at: new Date(supabaseInsurance.updated_at)
        };
    }
}
exports.BillingRepository = BillingRepository;
//# sourceMappingURL=billing.repository.js.map