import { Router } from 'express';
import { body, param } from 'express-validator';
import { BillingController } from '../controllers/billing.controller';

const router = Router();
const billingController = new BillingController();

// Validation middleware
const validateCreateBill = [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one bill item is required'),
  body('items.*.service_type').isIn(['consultation', 'procedure', 'medication', 'lab_test', 'room_charge', 'other']).withMessage('Valid service type is required'),
  body('items.*.description').notEmpty().withMessage('Description is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('appointment_id').optional().isString(),
  body('tax_rate').optional().isFloat({ min: 0, max: 1 }),
  body('discount_amount').optional().isFloat({ min: 0 }),
  body('insurance_coverage').optional().isFloat({ min: 0 }),
  body('notes').optional().isString()
];

const validateUpdateBill = [
  body('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled', 'refunded']),
  body('due_date').optional().isISO8601(),
  body('discount_amount').optional().isFloat({ min: 0 }),
  body('insurance_coverage').optional().isFloat({ min: 0 }),
  body('notes').optional().isString()
];

const validateCreatePayment = [
  body('bill_id').notEmpty().withMessage('Bill ID is required'),
  body('payment_method').isIn(['cash', 'card', 'bank_transfer', 'insurance', 'online']).withMessage('Valid payment method is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('transaction_id').optional().isString(),
  body('notes').optional().isString()
];

const validateCreateInsurance = [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('provider_name').notEmpty().withMessage('Provider name is required'),
  body('policy_number').notEmpty().withMessage('Policy number is required'),
  body('coverage_percentage').isFloat({ min: 0, max: 100 }).withMessage('Coverage percentage must be between 0 and 100'),
  body('max_coverage_amount').optional().isFloat({ min: 0 }),
  body('deductible_amount').optional().isFloat({ min: 0 }),
  body('expiry_date').optional().isISO8601()
];

const validateBillId = [
  param('billId').notEmpty().withMessage('Bill ID is required')
];

const validatePatientId = [
  param('patientId').notEmpty().withMessage('Patient ID is required')
];

const validateStripePayment = [
  body('billId').notEmpty().withMessage('Bill ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
];

const validateConfirmPayment = [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('billId').notEmpty().withMessage('Bill ID is required')
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

export default router;
