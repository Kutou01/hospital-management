"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthAdvisorService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = __importDefault(require("../utils/logger"));
class HealthAdvisorService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration for Health Advisor Service');
        }
        if (!geminiApiKey) {
            throw new Error('Missing Gemini API Key for Health Advisor Service');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        // Initialize Gemini AI
        this.genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    /**
     * Phân tích triệu chứng từ text người dùng nhập với Enhanced Analysis
     */
    async analyzeSymptoms(userInput) {
        try {
            logger_1.default.info('Analyzing symptoms from user input:', { userInput });
            // 0. Kiểm tra xem câu hỏi có thuộc lĩnh vực y tế không
            if (!this.isHealthRelatedQuestion(userInput)) {
                return this.getOutOfScopeResponse();
            }
            // 1. Tìm pattern phân tích chi tiết từ Enhanced Analysis
            const enhancedPattern = await this.findEnhancedAnalysisPattern(userInput);
            if (enhancedPattern) {
                // Sử dụng Enhanced Analysis
                return await this.generateEnhancedResponse(userInput, enhancedPattern);
            }
            // 2. Fallback to traditional method nếu không tìm thấy pattern
            const detectedSymptoms = await this.detectSymptomsFromText(userInput);
            const geminiAnalysis = await this.analyzeWithGemini(userInput, detectedSymptoms);
            if (detectedSymptoms.length === 0 && !geminiAnalysis.hasHealthContent) {
                return this.getGeneralHealthAdvice();
            }
            // 3. Tìm khuyến nghị chuyên khoa
            const recommendation = await this.findSpecialtyRecommendation(detectedSymptoms);
            // 4. Lấy lời khuyên chuẩn bị
            const preparationAdvice = await this.getPreparationAdvice(recommendation?.recommended_specialty);
            // 5. Lấy lời khuyên chung
            const generalAdvice = await this.getGeneralAdviceBySymptoms(detectedSymptoms);
            // 6. Tạo câu trả lời thông minh với Gemini
            const intelligentResponse = await this.generateIntelligentResponse(userInput, detectedSymptoms, recommendation, preparationAdvice, generalAdvice);
            return {
                symptoms_detected: detectedSymptoms,
                recommended_specialty: recommendation?.recommended_specialty || geminiAnalysis.suggestedSpecialty || 'Khám tổng quát',
                confidence_score: recommendation?.confidence_score || 0.5,
                urgency_level: recommendation?.urgency_level || geminiAnalysis.urgencyLevel || 'medium',
                reasoning: intelligentResponse || recommendation?.reasoning_vi || 'Dựa trên triệu chứng bạn mô tả',
                preparation_advice: preparationAdvice,
                general_advice: generalAdvice,
                should_see_doctor: this.shouldSeeDoctorImmediately(detectedSymptoms, recommendation)
            };
        }
        catch (error) {
            logger_1.default.error('Error analyzing symptoms:', error);
            throw new Error('Không thể phân tích triệu chứng. Vui lòng thử lại.');
        }
    }
    /**
     * Lấy câu hỏi follow-up thông minh
     */
    async getIntelligentFollowup(pattern) {
        try {
            // Xác định category dựa trên specialty
            const categoryMap = {
                'Thần kinh': 'neurological',
                'Tiêu hóa': 'gastrointestinal',
                'Hô hấp': 'respiratory',
                'Tim mạch': 'cardiovascular',
                'Nội khoa': 'internal_medicine'
            };
            const category = categoryMap[pattern.recommended_specialty] || 'general';
            const primarySymptom = pattern.symptom_keywords[0] || 'unknown';
            const { data, error } = await this.supabase.rpc('get_intelligent_followup', {
                symptom_cat: category,
                symptom: primarySymptom
            });
            if (error) {
                logger_1.default.error('Error getting followup questions:', error);
                return null;
            }
            return data && data.length > 0 ? data[0] : null;
        }
        catch (error) {
            logger_1.default.error('Exception getting followup questions:', error);
            return null;
        }
    }
    /**
     * Tạo phản hồi theo ngữ cảnh
     */
    async generateContextualResponse(pattern) {
        try {
            const contextType = this.determineContextType(pattern);
            const symptomPattern = pattern.symptom_keywords[0] || 'general';
            const { data, error } = await this.supabase.rpc('generate_contextual_response', {
                ctx_type: contextType,
                symptom_pat: symptomPattern,
                age_group: 'adult'
            });
            if (error) {
                logger_1.default.error('Error generating contextual response:', error);
                return null;
            }
            return data && data.length > 0 ? data[0] : null;
        }
        catch (error) {
            logger_1.default.error('Exception generating contextual response:', error);
            return null;
        }
    }
    /**
     * Xác định loại ngữ cảnh dựa trên pattern
     */
    determineContextType(pattern) {
        if (pattern.urgency_level === 'emergency') {
            return 'emergency';
        }
        else if (pattern.urgency_level === 'urgent') {
            return 'follow_up';
        }
        else {
            return 'first_time';
        }
    }
    /**
     * Xây dựng phản hồi chi tiết
     */
    buildDetailedResponse(pattern, followupQuestions, contextualResponse) {
        let response = '';
        // 1. Phân tích chi tiết
        if (pattern.detailed_analysis) {
            response += `🩺 **Phân tích triệu chứng:**\n${pattern.detailed_analysis}\n\n`;
        }
        // 2. Câu hỏi follow-up
        if (followupQuestions && followupQuestions.questions) {
            response += `❓ **Để tư vấn chính xác hơn, bạn có thể cho tôi biết:**\n`;
            const questions = followupQuestions.questions;
            Object.keys(questions).forEach((key, index) => {
                if (questions[key].question) {
                    response += `${index + 1}. ${questions[key].question}\n`;
                }
            });
            response += '\n';
        }
        else if (pattern.analysis_questions && pattern.analysis_questions.length > 0) {
            response += `❓ **Để tư vấn chính xác hơn, bạn có thể cho tôi biết:**\n`;
            pattern.analysis_questions.slice(0, 3).forEach((question, index) => {
                response += `${index + 1}. ${question}\n`;
            });
            response += '\n';
        }
        // 3. Nguyên nhân có thể
        if (pattern.possible_causes && pattern.possible_causes.length > 0) {
            response += `🔍 **Nguyên nhân có thể:**\n`;
            pattern.possible_causes.slice(0, 4).forEach((cause) => {
                response += `• ${cause}\n`;
            });
            response += '\n';
        }
        // 4. Lời khuyên tự chăm sóc
        if (pattern.self_care_advice && pattern.self_care_advice.length > 0) {
            response += `💡 **Lời khuyên tự chăm sóc:**\n`;
            pattern.self_care_advice.slice(0, 4).forEach((advice) => {
                response += `• ${advice}\n`;
            });
            response += '\n';
        }
        // 5. Dấu hiệu cảnh báo
        if (pattern.red_flags && pattern.red_flags.length > 0) {
            response += `🚨 **Cần đến bệnh viện ngay nếu có:**\n`;
            pattern.red_flags.slice(0, 3).forEach((flag) => {
                response += `• ${flag}\n`;
            });
            response += '\n';
        }
        // 6. Khi nào cần gặp bác sĩ
        if (pattern.when_to_see_doctor) {
            response += `🏥 **Khi nào cần gặp bác sĩ:**\n${pattern.when_to_see_doctor}\n\n`;
        }
        // 7. Khuyến nghị chuyên khoa
        if (pattern.recommended_specialty) {
            response += `👨‍⚕️ **Khuyến nghị khám:** Chuyên khoa **${pattern.recommended_specialty}**`;
        }
        return response.trim();
    }
    /**
     * Lưu lịch sử phân tích
     */
    async saveAnalysisHistory(userInput, pattern, response) {
        try {
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const { error } = await this.supabase
                .from('detailed_analysis_history')
                .insert({
                session_id: sessionId,
                user_input: userInput,
                detected_patterns: [pattern.pattern_name],
                analysis_result: {
                    pattern_name: pattern.pattern_name,
                    confidence: pattern.confidence_score,
                    specialty: pattern.recommended_specialty,
                    urgency: pattern.urgency_level
                },
                followup_questions_asked: pattern.analysis_questions || [],
                final_recommendation: response,
                confidence_score: pattern.confidence_score || 80
            });
            if (error) {
                logger_1.default.error('Error saving analysis history:', error);
            }
        }
        catch (error) {
            logger_1.default.error('Exception saving analysis history:', error);
        }
    }
    /**
     * Tìm pattern phân tích chi tiết từ Enhanced Analysis
     */
    async findEnhancedAnalysisPattern(userInput) {
        try {
            const { data, error } = await this.supabase.rpc('find_symptom_analysis_pattern', {
                user_input: userInput
            });
            if (error) {
                logger_1.default.error('Error finding enhanced pattern:', error);
                return null;
            }
            return data && data.length > 0 ? data[0] : null;
        }
        catch (error) {
            logger_1.default.error('Exception finding enhanced pattern:', error);
            return null;
        }
    }
    /**
     * Tạo phản hồi chi tiết từ Enhanced Analysis
     */
    async generateEnhancedResponse(userInput, pattern) {
        try {
            // 1. Lấy câu hỏi follow-up thông minh
            const followupQuestions = await this.getIntelligentFollowup(pattern);
            // 2. Tạo phản hồi theo ngữ cảnh
            const contextualResponse = await this.generateContextualResponse(pattern);
            // 3. Tạo câu trả lời chi tiết
            const detailedResponse = this.buildDetailedResponse(pattern, followupQuestions, contextualResponse);
            // 4. Lưu lịch sử phân tích
            await this.saveAnalysisHistory(userInput, pattern, detailedResponse);
            return {
                symptoms_detected: [],
                recommended_specialty: pattern.recommended_specialty || 'Khám tổng quát',
                confidence_score: (pattern.confidence_score || 80) / 100,
                urgency_level: pattern.urgency_level || 'routine',
                reasoning: detailedResponse,
                preparation_advice: 'Mang theo giấy tờ tùy thân, thẻ BHYT và kết quả xét nghiệm cũ (nếu có)',
                general_advice: pattern.self_care_advice || [],
                should_see_doctor: pattern.urgency_level === 'emergency' || pattern.urgency_level === 'urgent'
            };
        }
        catch (error) {
            logger_1.default.error('Error generating enhanced response:', error);
            throw error;
        }
    }
    /**
     * Phát hiện triệu chứng từ text
     */
    async detectSymptomsFromText(text) {
        const normalizedText = text.toLowerCase();
        const { data: symptoms, error } = await this.supabase
            .from('symptoms')
            .select('*');
        if (error) {
            logger_1.default.error('Error fetching symptoms:', error);
            return [];
        }
        const detectedSymptoms = [];
        for (const symptom of symptoms) {
            // Kiểm tra keywords
            const hasKeyword = symptom.keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
            // Kiểm tra tên triệu chứng
            const hasName = normalizedText.includes(symptom.name_vi.toLowerCase());
            if (hasKeyword || hasName) {
                detectedSymptoms.push(symptom);
            }
        }
        return detectedSymptoms;
    }
    /**
     * Tìm khuyến nghị chuyên khoa dựa trên triệu chứng
     */
    async findSpecialtyRecommendation(symptoms) {
        if (symptoms.length === 0)
            return null;
        const symptomIds = symptoms.map(s => s.symptom_id);
        const { data: recommendations, error } = await this.supabase
            .from('specialty_recommendations')
            .select('*')
            .order('confidence_score', { ascending: false });
        if (error) {
            logger_1.default.error('Error fetching recommendations:', error);
            return null;
        }
        // Tìm recommendation có độ khớp cao nhất
        let bestMatch = null;
        let bestScore = 0;
        for (const rec of recommendations) {
            const matchCount = rec.symptom_combinations.filter((symptomId) => symptomIds.includes(symptomId)).length;
            const matchScore = matchCount / rec.symptom_combinations.length;
            if (matchScore > bestScore && matchScore > 0.3) { // Ít nhất 30% khớp
                bestScore = matchScore;
                bestMatch = rec;
            }
        }
        return bestMatch;
    }
    /**
     * Lấy lời khuyên chuẩn bị khám bệnh
     */
    async getPreparationAdvice(specialty) {
        const { data: advice, error } = await this.supabase
            .from('health_advice')
            .select('*')
            .eq('category', 'preparation')
            .limit(1);
        if (error || !advice || advice.length === 0) {
            return 'Chuẩn bị đầy đủ giấy tờ tùy thân, thẻ BHYT (nếu có), và danh sách thuốc đang sử dụng.';
        }
        return advice[0].content_vi;
    }
    /**
     * Lấy lời khuyên chung dựa trên triệu chứng
     */
    async getGeneralAdviceBySymptoms(symptoms) {
        const categories = [...new Set(symptoms.map(s => s.category))];
        const { data: advice, error } = await this.supabase
            .from('health_advice')
            .select('*')
            .eq('category', 'general')
            .limit(3);
        if (error || !advice) {
            return [
                'Nghỉ ngơi đầy đủ và uống nhiều nước',
                'Theo dõi triệu chứng và ghi chép lại',
                'Tránh tự ý dùng thuốc không có chỉ định của bác sĩ'
            ];
        }
        return advice.map(a => a.content_vi);
    }
    /**
     * Kiểm tra xem câu hỏi có thuộc lĩnh vực y tế không
     */
    isHealthRelatedQuestion(userInput) {
        const healthKeywords = [
            // Triệu chứng cơ bản
            'đau', 'nhức', 'mệt', 'sốt', 'ho', 'khó thở', 'chóng mặt', 'buồn nôn', 'nôn', 'tiêu chảy',
            'táo bón', 'đau bụng', 'đau đầu', 'đau ngực', 'đau lưng', 'đau khớp', 'sưng', 'viêm',
            'ngứa', 'phát ban', 'dị ứng', 'cảm lạnh', 'cúm', 'ho khan', 'ho có đờm', 'khàn tiếng',
            // Bộ phận cơ thể
            'đầu', 'mắt', 'tai', 'mũi', 'họng', 'cổ', 'vai', 'tay', 'ngực', 'lưng', 'bụng', 'chân',
            'tim', 'phổi', 'gan', 'thận', 'dạ dày', 'ruột', 'xương', 'khớp', 'da', 'tóc', 'móng',
            // Y tế chung
            'bệnh', 'thuốc', 'điều trị', 'khám', 'bác sĩ', 'bệnh viện', 'phòng khám', 'xét nghiệm',
            'chẩn đoán', 'triệu chứng', 'dấu hiệu', 'sức khỏe', 'y tế', 'chữa', 'uống thuốc',
            'tái khám', 'cấp cứu', 'khẩn cấp', 'nguy hiểm', 'nghiêm trọng',
            // Chuyên khoa
            'nội khoa', 'ngoại khoa', 'sản phụ khoa', 'nhi khoa', 'tim mạch', 'thần kinh',
            'tiêu hóa', 'hô hấp', 'da liễu', 'mắt', 'tai mũi họng', 'răng hàm mặt',
            'chấn thương chỉnh hình', 'tâm thần', 'dinh dưỡng'
        ];
        const input = userInput.toLowerCase();
        return healthKeywords.some(keyword => input.includes(keyword));
    }
    /**
     * Trả về response cho câu hỏi ngoài lĩnh vực
     */
    getOutOfScopeResponse() {
        return {
            symptoms_detected: [],
            recommended_specialty: '',
            confidence_score: 0,
            urgency_level: 'low',
            reasoning: 'Xin lỗi, câu hỏi của bạn không thuộc lĩnh vực tôi có thể trả lời. Vui lòng hỏi câu hỏi khác. Xin cảm ơn!',
            preparation_advice: '',
            general_advice: [],
            should_see_doctor: false
        };
    }
    /**
     * Lấy lời khuyên sức khỏe chung
     */
    getGeneralHealthAdvice() {
        return {
            symptoms_detected: [],
            recommended_specialty: 'Khám tổng quát',
            confidence_score: 0.5,
            urgency_level: 'low',
            reasoning: 'Không phát hiện triệu chứng cụ thể từ mô tả của bạn',
            preparation_advice: 'Chuẩn bị đầy đủ giấy tờ và mô tả chi tiết tình trạng sức khỏe với bác sĩ',
            general_advice: [
                'Duy trì lối sống lành mạnh',
                'Tập thể dục đều đặn',
                'Ăn uống cân bằng dinh dưỡng',
                'Khám sức khỏe định kỳ'
            ],
            should_see_doctor: false
        };
    }
    /**
     * Kiểm tra có cần khám bác sĩ ngay lập tức không
     */
    shouldSeeDoctorImmediately(symptoms, recommendation) {
        // CHỈ cảnh báo cấp cứu khi thực sự nghiêm trọng
        // Kiểm tra mức độ nghiêm trọng cực cao (level 5)
        const hasCriticalSeverity = symptoms.some(s => s.severity_level === 5);
        // Kiểm tra mức độ khẩn cấp thực sự (chỉ emergency)
        const isEmergency = recommendation?.urgency_level === 'emergency';
        // Kiểm tra từ khóa cấp cứu trong triệu chứng
        const hasEmergencyKeywords = symptoms.some(s => s.keywords.some(keyword => ['cấp cứu', 'nguy hiểm', 'nghiêm trọng', 'khẩn cấp', 'dữ dội'].includes(keyword.toLowerCase())));
        // CHỈ trả về true khi thực sự cần cấp cứu
        return hasCriticalSeverity || isEmergency || hasEmergencyKeywords;
    }
    /**
     * Lấy danh sách chuyên khoa có sẵn
     */
    async getAvailableSpecialties() {
        try {
            const { data: departments, error } = await this.supabase
                .from('departments')
                .select('name');
            if (error) {
                logger_1.default.error('Error fetching departments:', error);
                return ['Khám tổng quát', 'Tim mạch', 'Tiêu hóa', 'Hô hấp', 'Thần kinh'];
            }
            return departments.map(d => d.name);
        }
        catch (error) {
            logger_1.default.error('Error getting available specialties:', error);
            return ['Khám tổng quát'];
        }
    }
    /**
     * Lấy lời khuyên chăm sóc sau điều trị
     */
    async getPostTreatmentAdvice(specialty) {
        try {
            const { data: advice, error } = await this.supabase
                .from('health_advice')
                .select('*')
                .eq('category', 'post_treatment')
                .contains('applicable_specialties', [specialty]);
            if (error || !advice || advice.length === 0) {
                return [
                    'Tuân thủ đúng chỉ định của bác sĩ',
                    'Uống thuốc đúng liều lượng và thời gian',
                    'Tái khám theo lịch hẹn',
                    'Liên hệ bác sĩ nếu có triệu chứng bất thường'
                ];
            }
            return advice.map(a => a.content_vi);
        }
        catch (error) {
            logger_1.default.error('Error getting post-treatment advice:', error);
            return ['Tuân thủ chỉ định của bác sĩ và tái khám đúng hẹn'];
        }
    }
    /**
     * Phân tích với Gemini AI
     */
    async analyzeWithGemini(userInput, detectedSymptoms) {
        try {
            const prompt = `
Bạn là một trợ lý y tế AI chuyên nghiệp. Hãy phân tích câu hỏi sau của bệnh nhân bằng tiếng Việt:

"${userInput}"

Triệu chứng đã phát hiện từ database: ${detectedSymptoms.map(s => s.name_vi).join(', ')}

Hãy trả lời theo định dạng JSON với các thông tin sau:
{
  "hasHealthContent": true/false,
  "suggestedSpecialty": "tên chuyên khoa nếu có",
  "urgencyLevel": "low/medium/high/emergency",
  "additionalSymptoms": ["triệu chứng bổ sung nếu có"],
  "confidence": 0.0-1.0
}

Lưu ý:
- Chỉ trả lời về các vấn đề y tế
- Không đưa ra chẩn đoán cụ thể
- Khuyến nghị gặp bác sĩ khi cần thiết
- Sử dụng tiếng Việt
`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Parse JSON response
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    return {
                        hasHealthContent: analysis.hasHealthContent || false,
                        suggestedSpecialty: analysis.suggestedSpecialty,
                        urgencyLevel: analysis.urgencyLevel || 'medium',
                        additionalSymptoms: analysis.additionalSymptoms || [],
                        confidence: analysis.confidence || 0.5
                    };
                }
            }
            catch (parseError) {
                logger_1.default.warn('Failed to parse Gemini JSON response:', parseError);
            }
            // Fallback analysis
            return {
                hasHealthContent: this.isHealthRelatedQuestion(userInput),
                confidence: 0.3
            };
        }
        catch (error) {
            logger_1.default.error('Error analyzing with Gemini:', error);
            return {
                hasHealthContent: this.isHealthRelatedQuestion(userInput),
                confidence: 0.2
            };
        }
    }
    /**
     * Tạo câu trả lời thông minh với Gemini AI
     */
    async generateIntelligentResponse(userInput, symptoms, recommendation, preparationAdvice, generalAdvice) {
        try {
            const prompt = `
Bạn là một trợ lý y tế AI chuyên nghiệp tại bệnh viện. Hãy tạo câu trả lời tư vấn cho bệnh nhân dựa trên thông tin sau:

Câu hỏi của bệnh nhân: "${userInput}"

Thông tin phân tích:
- Triệu chứng phát hiện: ${symptoms.map(s => s.name_vi).join(', ')}
- Chuyên khoa đề xuất: ${recommendation?.recommended_specialty || 'Khám tổng quát'}
- Mức độ khẩn cấp: ${recommendation?.urgency_level || 'medium'}
- Lời khuyên chuẩn bị: ${preparationAdvice}
- Lời khuyên chung: ${generalAdvice.join(', ')}

Yêu cầu:
1. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
2. Giải thích ngắn gọn về triệu chứng
3. Đưa ra khuyến nghị chuyên khoa phù hợp
4. Không đưa ra chẩn đoán cụ thể
5. Khuyến khích gặp bác sĩ khi cần thiết
6. Độ dài khoảng 100-150 từ
7. Kết thúc bằng lời động viên

Hãy tạo câu trả lời tư vấn:
`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return text.trim();
        }
        catch (error) {
            logger_1.default.error('Error generating intelligent response:', error);
            return recommendation?.reasoning_vi || 'Dựa trên triệu chứng bạn mô tả, tôi khuyên bạn nên gặp bác sĩ để được tư vấn chính xác nhất.';
        }
    }
    /**
     * Kiểm tra triệu chứng cấp cứu từ database training data
     */
    async checkEmergencySymptoms(userMessage) {
        try {
            const normalizedMessage = userMessage.toLowerCase();
            // Tìm trong database training data cho emergency combinations
            const { data: emergencyData, error } = await this.supabase
                .from('chatbot_training_data')
                .select('*')
                .eq('category', 'emergency_combinations')
                .eq('is_active', true);
            if (error || !emergencyData) {
                return null;
            }
            // Kiểm tra từng pattern cấp cứu
            for (const emergency of emergencyData) {
                const keywords = emergency.keywords || [];
                let matchCount = 0;
                // Đếm số từ khóa khớp
                for (const keyword of keywords) {
                    if (normalizedMessage.includes(keyword.toLowerCase())) {
                        matchCount++;
                    }
                }
                // Nếu khớp >= 2 từ khóa quan trọng → cấp cứu
                if (matchCount >= 2) {
                    logger_1.default.warn('EMERGENCY SYMPTOMS DETECTED:', { userMessage, matchedKeywords: keywords });
                    return emergency.answer;
                }
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Error checking emergency symptoms:', error);
            return null;
        }
    }
    /**
     * Chat conversation với Gemini AI - method chính cho chatbot
     */
    async chatWithAI(userMessage, conversationHistory) {
        try {
            logger_1.default.info('Processing chat message:', { userMessage });
            // Kiểm tra xem có phải câu hỏi y tế không
            if (!this.isHealthRelatedQuestion(userMessage)) {
                return 'Xin lỗi, câu hỏi của bạn không thuộc lĩnh vực tôi có thể trả lời. Vui lòng hỏi câu hỏi khác. Xin cảm ơn!';
            }
            // BƯỚC 1: Kiểm tra tổ hợp triệu chứng cấp cứu TRƯỚC KHI gọi Gemini
            const emergencyResponse = await this.checkEmergencySymptoms(userMessage);
            if (emergencyResponse) {
                return emergencyResponse;
            }
            // Tạo context từ lịch sử hội thoại
            const context = conversationHistory ?
                `Lịch sử hội thoại:\n${conversationHistory.slice(-4).join('\n')}\n\n` : '';
            const prompt = `
Bạn là trợ lý y tế AI thông minh của bệnh viện, chuyên tư vấn sức khỏe bằng tiếng Việt.

${context}Câu hỏi hiện tại: "${userMessage}"

⚠️ **QUAN TRỌNG - PHÁT HIỆN CẤP CỨU:**
Nếu bệnh nhân mô tả TỔ HỢP triệu chứng nghiêm trọng, BẮT BUỘC phải bắt đầu bằng: 🚨 **CẢNH BÁO CẤP CỨU** 🚨

Các tổ hợp cấp cứu:
- "sốt cao + đau đầu dữ dội" → VIÊM MÀNG NÃO → GỌI 115 NGAY!
- "đau đầu + buồn nôn + nhìn mờ" → TĂNG ÁP LỰC NỘI SỌ → GỌI 115 NGAY!
- "đau ngực + khó thở" → NHỒI MÁU CƠ TIM → GỌI 115 NGAY!
- "đau bụng dữ dội + nôn ra máu" → XUẤT HUYẾT TIÊU HÓA → GỌI 115 NGAY!
- "chóng mặt + ngất xỉu" → RỐI LOẠN NHỊP TIM → GỌI 115 NGAY!

Hãy trả lời theo các nguyên tắc sau:
1. **ƯU TIÊN TUYỆT ĐỐI**: Phát hiện và cảnh báo cấp cứu!
2. Sử dụng tiếng Việt thân thiện, chuyên nghiệp
3. Tập trung vào tư vấn sức khỏe cơ bản
4. Phân tích triệu chứng và đề xuất chuyên khoa phù hợp
5. KHÔNG đưa ra chẩn đoán cụ thể
6. Khuyến khích gặp bác sĩ khi cần thiết
7. Đưa ra lời khuyên chăm sóc sức khỏe tổng quát
8. Độ dài câu trả lời: 80-120 từ (ngắn gọn, dễ đọc)
9. Kết thúc bằng câu hỏi hoặc lời động viên

Các chuyên khoa có sẵn: Khám tổng quát, Tim mạch, Tiêu hóa, Hô hấp, Thần kinh, Nội khoa, Ngoại khoa, Sản phụ khoa, Nhi khoa, Da liễu, Mắt, Tai mũi họng, Răng hàm mặt, Chấn thương chỉnh hình.

Trả lời:
`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            // Giới hạn độ dài response để phù hợp với chat interface
            if (text.length > 500) {
                const sentences = text.split('. ');
                text = sentences.slice(0, 3).join('. ') + '.';
            }
            return text;
        }
        catch (error) {
            logger_1.default.error('Error in chat with AI:', error);
            return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với bác sĩ để được tư vấn.';
        }
    }
}
exports.HealthAdvisorService = HealthAdvisorService;
//# sourceMappingURL=health-advisor.service.js.map