"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billing_repository_1 = require("../repositories/billing.repository");
const shared_1 = require("@hospital/shared");
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
class BillingController {
    constructor() {
        this.billingRepository = new billing_repository_1.BillingRepository();
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2023-10-16'
        });
    }
    async getAllBills(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const bills = await this.billingRepository.findAllBills(limit, offset);
            res.json({
                success: true,
                data: bills,
                pagination: {
                    page,
                    limit,
                    total: bills.length
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching bills', { error });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getBillById(req, res) {
        try {
            const { billId } = req.params;
            const bill = await this.billingRepository.findBillById(billId);
            if (!bill) {
                res.status(404).json({
                    success: false,
                    message: 'Bill not found'
                });
                return;
            }
            res.json({
                success: true,
                data: bill
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching bill by ID', { error, billId: req.params.billId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getBillsByPatientId(req, res) {
        try {
            const { patientId } = req.params;
            const bills = await this.billingRepository.findBillsByPatientId(patientId);
            res.json({
                success: true,
                data: bills
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching bills by patient ID', { error, patientId: req.params.patientId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createBill(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const userId = req.user?.id || 'SYSTEM';
            const bill = await this.billingRepository.createBill(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Bill created successfully',
                data: bill
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating bill', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateBill(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { billId } = req.params;
            const bill = await this.billingRepository.updateBill(billId, req.body);
            res.json({
                success: true,
                message: 'Bill updated successfully',
                data: bill
            });
        }
        catch (error) {
            shared_1.logger.error('Error updating bill', { error, billId: req.params.billId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async deleteBill(req, res) {
        try {
            const { billId } = req.params;
            await this.billingRepository.deleteBill(billId);
            res.json({
                success: true,
                message: 'Bill deleted successfully'
            });
        }
        catch (error) {
            shared_1.logger.error('Error deleting bill', { error, billId: req.params.billId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Payment endpoints
    async createPayment(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const userId = req.user?.id || 'SYSTEM';
            const payment = await this.billingRepository.createPayment(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Payment processed successfully',
                data: payment
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating payment', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getPaymentsByBillId(req, res) {
        try {
            const { billId } = req.params;
            const payments = await this.billingRepository.getPaymentsByBillId(billId);
            res.json({
                success: true,
                data: payments
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching payments', { error, billId: req.params.billId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Stripe payment endpoints
    async createPaymentIntent(req, res) {
        try {
            const { billId, amount } = req.body;
            if (!billId || !amount) {
                res.status(400).json({
                    success: false,
                    message: 'Bill ID and amount are required'
                });
                return;
            }
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                metadata: {
                    bill_id: billId
                }
            });
            res.json({
                success: true,
                data: {
                    payment_intent_id: paymentIntent.id,
                    client_secret: paymentIntent.client_secret,
                    amount: amount,
                    currency: 'usd',
                    status: paymentIntent.status
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating Stripe payment intent', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Failed to create payment intent',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async confirmPayment(req, res) {
        try {
            const { paymentIntentId, billId } = req.body;
            if (!paymentIntentId || !billId) {
                res.status(400).json({
                    success: false,
                    message: 'Payment intent ID and bill ID are required'
                });
                return;
            }
            // Retrieve payment intent from Stripe
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status === 'succeeded') {
                // Create payment record
                const userId = req.user?.id || 'SYSTEM';
                const payment = await this.billingRepository.createPayment({
                    bill_id: billId,
                    payment_method: 'card',
                    amount: paymentIntent.amount / 100, // Convert from cents
                    transaction_id: paymentIntentId
                }, userId);
                res.json({
                    success: true,
                    message: 'Payment confirmed successfully',
                    data: payment
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Payment not successful',
                    status: paymentIntent.status
                });
            }
        }
        catch (error) {
            shared_1.logger.error('Error confirming payment', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Failed to confirm payment',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Insurance endpoints
    async createInsurance(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const insurance = await this.billingRepository.createInsurance(req.body);
            res.status(201).json({
                success: true,
                message: 'Insurance created successfully',
                data: insurance
            });
        }
        catch (error) {
            shared_1.logger.error('Error creating insurance', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getInsuranceByPatientId(req, res) {
        try {
            const { patientId } = req.params;
            const insurance = await this.billingRepository.getInsuranceByPatientId(patientId);
            res.json({
                success: true,
                data: insurance
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching insurance', { error, patientId: req.params.patientId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Analytics endpoints
    async getPaymentSummary(req, res) {
        try {
            const summary = await this.billingRepository.getPaymentSummary();
            res.json({
                success: true,
                data: summary
            });
        }
        catch (error) {
            shared_1.logger.error('Error fetching payment summary', { error });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Invoice generation
    async generateInvoice(req, res) {
        try {
            const { billId } = req.params;
            const bill = await this.billingRepository.findBillById(billId);
            if (!bill) {
                res.status(404).json({
                    success: false,
                    message: 'Bill not found'
                });
                return;
            }
            // Here you would generate PDF invoice
            // For now, return bill data
            res.json({
                success: true,
                message: 'Invoice generated successfully',
                data: {
                    bill,
                    download_url: `/api/billing/bills/${billId}/invoice/download`
                }
            });
        }
        catch (error) {
            shared_1.logger.error('Error generating invoice', { error, billId: req.params.billId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.BillingController = BillingController;
//# sourceMappingURL=billing.controller.js.map