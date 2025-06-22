"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const billing_controller_1 = require("../controllers/billing.controller");
const router = (0, express_1.Router)();
const billingController = new billing_controller_1.BillingController();
// Validation middleware
const validateCreateBill = [
    (0, express_validator_1.body)('patient_id').notEmpty().withMessage('Patient ID is required'),
    (0, express_validator_1.body)('due_date').isISO8601().withMessage('Valid due date is required'),
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('At least one bill item is required'),
    (0, express_validator_1.body)('items.*.service_type').isIn(['consultation', 'procedure', 'medication', 'lab_test', 'room_charge', 'other']).withMessage('Valid service type is required'),
    (0, express_validator_1.body)('items.*.description').notEmpty().withMessage('Description is required for each item'),
    (0, express_validator_1.body)('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    (0, express_validator_1.body)('appointment_id').optional().isString(),
    (0, express_validator_1.body)('tax_rate').optional().isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.body)('discount_amount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('insurance_coverage').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateUpdateBill = [
    (0, express_validator_1.body)('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled', 'refunded']),
    (0, express_validator_1.body)('due_date').optional().isISO8601(),
    (0, express_validator_1.body)('discount_amount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('insurance_coverage').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateCreatePayment = [
    (0, express_validator_1.body)('bill_id').notEmpty().withMessage('Bill ID is required'),
    (0, express_validator_1.body)('payment_method').isIn(['cash', 'card', 'bank_transfer', 'insurance', 'online']).withMessage('Valid payment method is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('transaction_id').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateCreateInsurance = [
    (0, express_validator_1.body)('patient_id').notEmpty().withMessage('Patient ID is required'),
    (0, express_validator_1.body)('provider_name').notEmpty().withMessage('Provider name is required'),
    (0, express_validator_1.body)('policy_number').notEmpty().withMessage('Policy number is required'),
    (0, express_validator_1.body)('coverage_percentage').isFloat({ min: 0, max: 100 }).withMessage('Coverage percentage must be between 0 and 100'),
    (0, express_validator_1.body)('max_coverage_amount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('deductible_amount').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('expiry_date').optional().isISO8601()
];
const validateBillId = [
    (0, express_validator_1.param)('billId').notEmpty().withMessage('Bill ID is required')
];
const validatePatientId = [
    (0, express_validator_1.param)('patientId').notEmpty().withMessage('Patient ID is required')
];
const validateStripePayment = [
    (0, express_validator_1.body)('billId').notEmpty().withMessage('Bill ID is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
];
const validateConfirmPayment = [
    (0, express_validator_1.body)('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    (0, express_validator_1.body)('billId').notEmpty().withMessage('Bill ID is required')
];
// Bill routes
/**
 * @swagger
 * /api/billing/bills:
 *   get:
 *     summary: Get all bills
 *     tags: [Bills]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of bills
 */
router.get('/bills', billingController.getAllBills.bind(billingController));
/**
 * @swagger
 * /api/billing/bills/{billId}:
 *   get:
 *     summary: Get bill by ID
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details with items and payments
 *       404:
 *         description: Bill not found
 */
router.get('/bills/:billId', validateBillId, billingController.getBillById.bind(billingController));
/**
 * @swagger
 * /api/billing/bills/patient/{patientId}:
 *   get:
 *     summary: Get bills by patient ID
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patient bills
 */
router.get('/bills/patient/:patientId', validatePatientId, billingController.getBillsByPatientId.bind(billingController));
/**
 * @swagger
 * /api/billing/bills:
 *   post:
 *     summary: Create new bill
 *     tags: [Bills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBillRequest'
 *     responses:
 *       201:
 *         description: Bill created successfully
 *       400:
 *         description: Validation error
 */
router.post('/bills', validateCreateBill, billingController.createBill.bind(billingController));
/**
 * @swagger
 * /api/billing/bills/{billId}:
 *   put:
 *     summary: Update bill
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBillRequest'
 *     responses:
 *       200:
 *         description: Bill updated successfully
 *       404:
 *         description: Bill not found
 */
router.put('/bills/:billId', validateBillId, validateUpdateBill, billingController.updateBill.bind(billingController));
/**
 * @swagger
 * /api/billing/bills/{billId}:
 *   delete:
 *     summary: Delete bill
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill deleted successfully
 *       404:
 *         description: Bill not found
 */
router.delete('/bills/:billId', validateBillId, billingController.deleteBill.bind(billingController));
// Payment routes
/**
 * @swagger
 * /api/billing/payments:
 *   post:
 *     summary: Create payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       201:
 *         description: Payment processed successfully
 */
router.post('/payments', validateCreatePayment, billingController.createPayment.bind(billingController));
/**
 * @swagger
 * /api/billing/payments/bill/{billId}:
 *   get:
 *     summary: Get payments by bill ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments for the bill
 */
router.get('/payments/bill/:billId', validateBillId, billingController.getPaymentsByBillId.bind(billingController));
// Stripe payment routes
/**
 * @swagger
 * /api/billing/stripe/payment-intent:
 *   post:
 *     summary: Create Stripe payment intent
 *     tags: [Stripe Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 */
router.post('/stripe/payment-intent', validateStripePayment, billingController.createPaymentIntent.bind(billingController));
/**
 * @swagger
 * /api/billing/stripe/confirm-payment:
 *   post:
 *     summary: Confirm Stripe payment
 *     tags: [Stripe Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               billId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 */
router.post('/stripe/confirm-payment', validateConfirmPayment, billingController.confirmPayment.bind(billingController));
// Insurance routes
/**
 * @swagger
 * /api/billing/insurance:
 *   post:
 *     summary: Create insurance record
 *     tags: [Insurance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInsuranceRequest'
 *     responses:
 *       201:
 *         description: Insurance created successfully
 */
router.post('/insurance', validateCreateInsurance, billingController.createInsurance.bind(billingController));
/**
 * @swagger
 * /api/billing/insurance/patient/{patientId}:
 *   get:
 *     summary: Get insurance by patient ID
 *     tags: [Insurance]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patient insurance records
 */
router.get('/insurance/patient/:patientId', validatePatientId, billingController.getInsuranceByPatientId.bind(billingController));
// Analytics routes
/**
 * @swagger
 * /api/billing/analytics/summary:
 *   get:
 *     summary: Get payment summary analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Payment summary statistics
 */
router.get('/analytics/summary', billingController.getPaymentSummary.bind(billingController));
// Invoice routes
/**
 * @swagger
 * /api/billing/bills/{billId}/invoice:
 *   get:
 *     summary: Generate invoice for bill
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice generated successfully
 */
router.get('/bills/:billId/invoice', validateBillId, billingController.generateInvoice.bind(billingController));
exports.default = router;
//# sourceMappingURL=billing.routes.js.map