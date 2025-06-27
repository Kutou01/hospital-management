"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateHealthAdvice = exports.validateCreateRecommendation = exports.validateCreateSymptom = exports.validatePostTreatmentRequest = exports.validateQuickConsultation = exports.validateSymptomAnalysis = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
// Middleware để xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu đầu vào không hợp lệ',
            errors: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }))
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// Validation cho phân tích triệu chứng
exports.validateSymptomAnalysis = [
    (0, express_validator_1.body)('user_input')
        .notEmpty()
        .withMessage('Vui lòng mô tả triệu chứng của bạn')
        .isString()
        .withMessage('Mô tả triệu chứng phải là chuỗi văn bản')
        .isLength({ min: 5, max: 1000 })
        .withMessage('Mô tả triệu chứng phải từ 5 đến 1000 ký tự'),
    (0, express_validator_1.body)('symptoms')
        .optional()
        .isArray()
        .withMessage('Danh sách triệu chứng phải là mảng'),
    exports.handleValidationErrors
];
// Validation cho tư vấn nhanh
exports.validateQuickConsultation = [
    (0, express_validator_1.body)('symptoms_text')
        .notEmpty()
        .withMessage('Vui lòng mô tả triệu chứng')
        .isString()
        .withMessage('Mô tả triệu chứng phải là chuỗi văn bản')
        .isLength({ min: 3, max: 500 })
        .withMessage('Mô tả triệu chứng phải từ 3 đến 500 ký tự'),
    (0, express_validator_1.body)('age')
        .optional()
        .isInt({ min: 0, max: 150 })
        .withMessage('Tuổi phải là số nguyên từ 0 đến 150'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'nam', 'nữ', 'khác'])
        .withMessage('Giới tính không hợp lệ'),
    exports.handleValidationErrors
];
// Validation cho yêu cầu lời khuyên sau điều trị
exports.validatePostTreatmentRequest = [
    (0, express_validator_1.body)('specialty')
        .notEmpty()
        .withMessage('Vui lòng cung cấp thông tin chuyên khoa')
        .isString()
        .withMessage('Chuyên khoa phải là chuỗi văn bản')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên chuyên khoa phải từ 2 đến 100 ký tự'),
    exports.handleValidationErrors
];
// Validation cho tạo triệu chứng mới (admin)
exports.validateCreateSymptom = [
    (0, express_validator_1.body)('name_vi')
        .notEmpty()
        .withMessage('Tên triệu chứng tiếng Việt là bắt buộc')
        .isString()
        .withMessage('Tên triệu chứng phải là chuỗi văn bản')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên triệu chứng phải từ 2 đến 100 ký tự'),
    (0, express_validator_1.body)('name_en')
        .optional()
        .isString()
        .withMessage('Tên triệu chứng tiếng Anh phải là chuỗi văn bản'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Mô tả triệu chứng là bắt buộc')
        .isString()
        .withMessage('Mô tả phải là chuỗi văn bản')
        .isLength({ min: 10, max: 500 })
        .withMessage('Mô tả phải từ 10 đến 500 ký tự'),
    (0, express_validator_1.body)('severity_level')
        .isInt({ min: 1, max: 5 })
        .withMessage('Mức độ nghiêm trọng phải là số nguyên từ 1 đến 5'),
    (0, express_validator_1.body)('category')
        .notEmpty()
        .withMessage('Danh mục triệu chứng là bắt buộc')
        .isIn(['general', 'pain', 'respiratory', 'digestive', 'cardiovascular', 'neurological', 'dermatological', 'musculoskeletal', 'ent'])
        .withMessage('Danh mục triệu chứng không hợp lệ'),
    (0, express_validator_1.body)('keywords')
        .isArray({ min: 1 })
        .withMessage('Từ khóa phải là mảng có ít nhất 1 phần tử')
        .custom((keywords) => {
        if (!Array.isArray(keywords))
            return false;
        return keywords.every(keyword => typeof keyword === 'string' && keyword.length > 0);
    })
        .withMessage('Tất cả từ khóa phải là chuỗi văn bản không rỗng'),
    exports.handleValidationErrors
];
// Validation cho tạo khuyến nghị chuyên khoa (admin)
exports.validateCreateRecommendation = [
    (0, express_validator_1.body)('symptom_combinations')
        .isArray({ min: 1 })
        .withMessage('Tổ hợp triệu chứng phải là mảng có ít nhất 1 phần tử'),
    (0, express_validator_1.body)('recommended_specialty')
        .notEmpty()
        .withMessage('Chuyên khoa khuyến nghị là bắt buộc')
        .isString()
        .withMessage('Chuyên khoa phải là chuỗi văn bản'),
    (0, express_validator_1.body)('confidence_score')
        .isFloat({ min: 0, max: 1 })
        .withMessage('Điểm tin cậy phải là số thực từ 0 đến 1'),
    (0, express_validator_1.body)('reasoning_vi')
        .notEmpty()
        .withMessage('Lý do khuyến nghị là bắt buộc')
        .isString()
        .withMessage('Lý do phải là chuỗi văn bản')
        .isLength({ min: 10, max: 500 })
        .withMessage('Lý do phải từ 10 đến 500 ký tự'),
    (0, express_validator_1.body)('urgency_level')
        .isIn(['low', 'medium', 'high', 'emergency'])
        .withMessage('Mức độ khẩn cấp không hợp lệ'),
    (0, express_validator_1.body)('preparation_instructions')
        .notEmpty()
        .withMessage('Hướng dẫn chuẩn bị là bắt buộc')
        .isString()
        .withMessage('Hướng dẫn phải là chuỗi văn bản'),
    exports.handleValidationErrors
];
// Validation cho tạo lời khuyên sức khỏe (admin)
exports.validateCreateHealthAdvice = [
    (0, express_validator_1.body)('category')
        .isIn(['preparation', 'post_treatment', 'general'])
        .withMessage('Danh mục lời khuyên không hợp lệ'),
    (0, express_validator_1.body)('title_vi')
        .notEmpty()
        .withMessage('Tiêu đề lời khuyên là bắt buộc')
        .isString()
        .withMessage('Tiêu đề phải là chuỗi văn bản')
        .isLength({ min: 5, max: 200 })
        .withMessage('Tiêu đề phải từ 5 đến 200 ký tự'),
    (0, express_validator_1.body)('content_vi')
        .notEmpty()
        .withMessage('Nội dung lời khuyên là bắt buộc')
        .isString()
        .withMessage('Nội dung phải là chuỗi văn bản')
        .isLength({ min: 20, max: 2000 })
        .withMessage('Nội dung phải từ 20 đến 2000 ký tự'),
    (0, express_validator_1.body)('applicable_specialties')
        .isArray()
        .withMessage('Chuyên khoa áp dụng phải là mảng'),
    (0, express_validator_1.body)('tags')
        .isArray()
        .withMessage('Tags phải là mảng'),
    exports.handleValidationErrors
];
//# sourceMappingURL=health-advisor.validators.js.map