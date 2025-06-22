"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('=== BẮT ĐẦU app.ts (billing-service) ===');
const express_1 = __importDefault(require("express"));
console.log('Import express done');
const cors_1 = __importDefault(require("cors"));
console.log('Import cors done');
const helmet_1 = __importDefault(require("helmet"));
console.log('Import helmet done');
const morgan_1 = __importDefault(require("morgan"));
console.log('Import morgan done');
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
console.log('Import rateLimit done');
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
console.log('Import swaggerJsdoc done');
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
console.log('Import swaggerUi done');
const shared_1 = require("@hospital/shared");
console.log('Import logger from @hospital/shared done');
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
console.log('Import billingRoutes done');
const app = (0, express_1.default)();
console.log('Express app initialized');
// Security middleware
app.use((0, helmet_1.default)());
console.log('Helmet middleware added');
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
console.log('CORS middleware added');
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
console.log('Rate limit middleware added');
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
console.log('Body parsing middleware added');
// Logging middleware
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => shared_1.logger.info(message.trim())
    }
}));
console.log('Morgan logging middleware added');
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Billing Service API',
            version: '1.0.0',
            description: 'API for managing billing, payments, and insurance',
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.hospital.com/billing'
                    : 'http://localhost:3008',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            schemas: {
                Bill: {
                    type: 'object',
                    properties: {
                        bill_id: { type: 'string' },
                        patient_id: { type: 'string' },
                        appointment_id: { type: 'string' },
                        invoice_number: { type: 'string' },
                        bill_date: { type: 'string', format: 'date-time' },
                        due_date: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'] },
                        subtotal: { type: 'number' },
                        tax_amount: { type: 'number' },
                        discount_amount: { type: 'number' },
                        insurance_coverage: { type: 'number' },
                        total_amount: { type: 'number' },
                        notes: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        created_by: { type: 'string' }
                    }
                },
                BillItem: {
                    type: 'object',
                    properties: {
                        item_id: { type: 'string' },
                        bill_id: { type: 'string' },
                        service_type: { type: 'string', enum: ['consultation', 'procedure', 'medication', 'lab_test', 'room_charge', 'other'] },
                        service_id: { type: 'string' },
                        description: { type: 'string' },
                        quantity: { type: 'integer' },
                        unit_price: { type: 'number' },
                        total_price: { type: 'number' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Payment: {
                    type: 'object',
                    properties: {
                        payment_id: { type: 'string' },
                        bill_id: { type: 'string' },
                        payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer', 'insurance', 'online'] },
                        amount: { type: 'number' },
                        payment_date: { type: 'string', format: 'date-time' },
                        transaction_id: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
                        notes: { type: 'string' },
                        processed_by: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Insurance: {
                    type: 'object',
                    properties: {
                        insurance_id: { type: 'string' },
                        patient_id: { type: 'string' },
                        provider_name: { type: 'string' },
                        policy_number: { type: 'string' },
                        coverage_percentage: { type: 'number' },
                        max_coverage_amount: { type: 'number' },
                        deductible_amount: { type: 'number' },
                        expiry_date: { type: 'string', format: 'date' },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateBillRequest: {
                    type: 'object',
                    required: ['patient_id', 'due_date', 'items'],
                    properties: {
                        patient_id: { type: 'string' },
                        appointment_id: { type: 'string' },
                        due_date: { type: 'string', format: 'date-time' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['service_type', 'description', 'quantity', 'unit_price'],
                                properties: {
                                    service_type: { type: 'string', enum: ['consultation', 'procedure', 'medication', 'lab_test', 'room_charge', 'other'] },
                                    service_id: { type: 'string' },
                                    description: { type: 'string' },
                                    quantity: { type: 'integer' },
                                    unit_price: { type: 'number' }
                                }
                            }
                        },
                        tax_rate: { type: 'number' },
                        discount_amount: { type: 'number' },
                        insurance_coverage: { type: 'number' },
                        notes: { type: 'string' }
                    }
                },
                UpdateBillRequest: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'] },
                        due_date: { type: 'string', format: 'date-time' },
                        discount_amount: { type: 'number' },
                        insurance_coverage: { type: 'number' },
                        notes: { type: 'string' }
                    }
                },
                CreatePaymentRequest: {
                    type: 'object',
                    required: ['bill_id', 'payment_method', 'amount'],
                    properties: {
                        bill_id: { type: 'string' },
                        payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer', 'insurance', 'online'] },
                        amount: { type: 'number' },
                        transaction_id: { type: 'string' },
                        notes: { type: 'string' }
                    }
                },
                CreateInsuranceRequest: {
                    type: 'object',
                    required: ['patient_id', 'provider_name', 'policy_number', 'coverage_percentage'],
                    properties: {
                        patient_id: { type: 'string' },
                        provider_name: { type: 'string' },
                        policy_number: { type: 'string' },
                        coverage_percentage: { type: 'number' },
                        max_coverage_amount: { type: 'number' },
                        deductible_amount: { type: 'number' },
                        expiry_date: { type: 'string', format: 'date' }
                    }
                },
                PaymentSummary: {
                    type: 'object',
                    properties: {
                        total_bills: { type: 'integer' },
                        total_amount: { type: 'number' },
                        paid_amount: { type: 'number' },
                        pending_amount: { type: 'number' },
                        overdue_amount: { type: 'number' }
                    }
                },
                StripePaymentIntent: {
                    type: 'object',
                    properties: {
                        payment_intent_id: { type: 'string' },
                        amount: { type: 'number' },
                        currency: { type: 'string' },
                        status: { type: 'string' },
                        client_secret: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts'],
};
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
console.log('Swagger documentation setup');
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'billing-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
console.log('Health check endpoint setup');
// API routes
app.use('/api/billing', billing_routes_1.default);
console.log('Billing routes added');
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
console.log('404 handler added');
// Global error handler
app.use((error, req, res, next) => {
    shared_1.logger.error('Unhandled error', { error: error.message, stack: error.stack });
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});
console.log('Global error handler added');
exports.default = app;
//# sourceMappingURL=app.js.map