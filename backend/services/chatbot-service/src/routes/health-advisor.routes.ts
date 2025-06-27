import express from 'express';
import { HealthAdvisorController } from '../controllers/health-advisor.controller';
import { validateSymptomAnalysis, validatePostTreatmentRequest, validateQuickConsultation } from '../validators/health-advisor.validators';

const router = express.Router();
const healthAdvisorController = new HealthAdvisorController();

// POST /api/health/analyze-symptoms - Phân tích triệu chứng chi tiết
router.post(
  '/analyze-symptoms',
  validateSymptomAnalysis,
  healthAdvisorController.analyzeSymptoms.bind(healthAdvisorController)
);

// POST /api/health/quick-consultation - Tư vấn nhanh cho chatbot
router.post(
  '/quick-consultation',
  validateQuickConsultation,
  healthAdvisorController.quickConsultation.bind(healthAdvisorController)
);

// GET /api/health/specialties - Lấy danh sách chuyên khoa
router.get(
  '/specialties',
  healthAdvisorController.getAvailableSpecialties.bind(healthAdvisorController)
);

// POST /api/health/post-treatment-advice - Lời khuyên sau điều trị
router.post(
  '/post-treatment-advice',
  validatePostTreatmentRequest,
  healthAdvisorController.getPostTreatmentAdvice.bind(healthAdvisorController)
);

// GET /api/health/emergency-symptoms - Triệu chứng cấp cứu
router.get(
  '/emergency-symptoms',
  healthAdvisorController.getEmergencySymptoms.bind(healthAdvisorController)
);

// POST /api/health/chat - Chat với Gemini AI
router.post(
  '/chat',
  healthAdvisorController.chatWithAI.bind(healthAdvisorController)
);

// GET /api/health/test - Test service
router.get(
  '/test',
  healthAdvisorController.testHealthService.bind(healthAdvisorController)
);

export default router;
