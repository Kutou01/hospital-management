"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const health_advisor_controller_1 = require("../controllers/health-advisor.controller");
const health_advisor_validators_1 = require("../validators/health-advisor.validators");
const router = express_1.default.Router();
const healthAdvisorController = new health_advisor_controller_1.HealthAdvisorController();
// POST /api/health/analyze-symptoms - Phân tích triệu chứng chi tiết
router.post('/analyze-symptoms', health_advisor_validators_1.validateSymptomAnalysis, healthAdvisorController.analyzeSymptoms.bind(healthAdvisorController));
// POST /api/health/quick-consultation - Tư vấn nhanh cho chatbot
router.post('/quick-consultation', health_advisor_validators_1.validateQuickConsultation, healthAdvisorController.quickConsultation.bind(healthAdvisorController));
// GET /api/health/specialties - Lấy danh sách chuyên khoa
router.get('/specialties', healthAdvisorController.getAvailableSpecialties.bind(healthAdvisorController));
// POST /api/health/post-treatment-advice - Lời khuyên sau điều trị
router.post('/post-treatment-advice', health_advisor_validators_1.validatePostTreatmentRequest, healthAdvisorController.getPostTreatmentAdvice.bind(healthAdvisorController));
// GET /api/health/emergency-symptoms - Triệu chứng cấp cứu
router.get('/emergency-symptoms', healthAdvisorController.getEmergencySymptoms.bind(healthAdvisorController));
// POST /api/health/chat - Chat với Gemini AI
router.post('/chat', healthAdvisorController.chatWithAI.bind(healthAdvisorController));
// GET /api/health/test - Test service
router.get('/test', healthAdvisorController.testHealthService.bind(healthAdvisorController));
exports.default = router;
//# sourceMappingURL=health-advisor.routes.js.map