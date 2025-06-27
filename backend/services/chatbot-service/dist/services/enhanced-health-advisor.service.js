"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedHealthAdvisorService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = __importDefault(require("../utils/logger"));
const friendly_formatter_1 = require("../utils/friendly-formatter");
class EnhancedHealthAdvisorService {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }
        if (!geminiApiKey) {
            throw new Error('Missing Gemini API Key');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        this.genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    /**
     * Main method for comprehensive health consultation
     */
    async getComprehensiveHealthAdvice(userInput, userId, sessionId) {
        try {
            logger_1.default.info('Starting comprehensive health analysis', { userInput, userId });
            // 1. Check if health-related
            if (!this.isHealthRelatedQuestion(userInput)) {
                return this.getOutOfScopeResponse();
            }
            // 2. Get or create conversation context
            const context = await this.getConversationContext(userId, sessionId);
            // 3. Classify intent and extract entities
            const intentResult = await this.classifyIntent(userInput);
            // 4. Search intelligent QA database
            const qaResult = await this.searchIntelligentQA(userInput, context);
            // 5. Analyze symptoms with enhanced detection
            const symptomsDetected = await this.detectSymptoms(userInput);
            // 6. Perform advanced triage assessment
            const triageResult = await this.performAdvancedTriage(symptomsDetected, context);
            // 7. Get disease suggestions
            const diseasesSuggested = await this.suggestDiseases(symptomsDetected);
            // 8. Find recommended doctors and facilities
            const { doctors, facilities } = await this.findHealthcareProviders(triageResult.urgency_level > 2 ? 'emergency' : intentResult.specialty);
            // 9. Get medication and lifestyle advice
            const additionalInfo = await this.getAdditionalHealthInfo(symptomsDetected, diseasesSuggested);
            // 10. Generate intelligent response with Gemini AI
            const intelligentAnswer = await this.generateIntelligentResponse(userInput, symptomsDetected, triageResult, qaResult, context);
            // 11. Update conversation context
            await this.updateConversationContext(userId, sessionId, intentResult, symptomsDetected, triageResult);
            // 12. Compile comprehensive response
            const response = {
                symptoms_detected: symptomsDetected,
                diseases_suggested: diseasesSuggested,
                triage_result: triageResult,
                recommended_specialty: this.determineSpecialty(symptomsDetected, triageResult),
                recommended_doctors: doctors.slice(0, 3),
                recommended_facilities: facilities.slice(0, 3),
                intelligent_answer: intelligentAnswer,
                follow_up_questions: qaResult?.follow_up_questions || this.generateFollowUpQuestions(symptomsDetected),
                context_aware_suggestions: this.generateContextAwareSuggestions(context, symptomsDetected),
                medication_info: additionalInfo.medications,
                prevention_tips: additionalInfo.prevention,
                lifestyle_recommendations: additionalInfo.lifestyle,
                confidence_score: this.calculateOverallConfidence(qaResult, symptomsDetected, triageResult),
                urgency_level: triageResult.urgency_label,
                should_see_doctor: triageResult.urgency_level <= 3,
                estimated_wait_time: triageResult.time_to_see_doctor
            };
            logger_1.default.info('Comprehensive health analysis completed', {
                symptomsCount: symptomsDetected.length,
                urgencyLevel: triageResult.urgency_level,
                confidence: response.confidence_score
            });
            return response;
        }
        catch (error) {
            logger_1.default.error('Error in comprehensive health analysis:', error);
            throw new Error('Không thể phân tích tình trạng sức khỏe. Vui lòng thử lại.');
        }
    }
    /**
     * Enhanced symptom detection using multiple data sources
     */
    async detectSymptoms(userInput) {
        try {
            // Search in symptoms database with keyword matching
            const { data: symptoms, error } = await this.supabase
                .from('symptoms')
                .select('*')
                .or(`keywords.cs.{${userInput.toLowerCase()}},` +
                `name_vi.ilike.%${userInput}%,` +
                `description.ilike.%${userInput}%`);
            if (error) {
                logger_1.default.error('Error detecting symptoms:', error);
                return [];
            }
            // Score and rank symptoms based on relevance
            const scoredSymptoms = symptoms?.map(symptom => ({
                ...symptom,
                relevance_score: this.calculateSymptomRelevance(userInput, symptom)
            })).filter(s => s.relevance_score > 0.3)
                .sort((a, b) => b.relevance_score - a.relevance_score) || [];
            return scoredSymptoms.slice(0, 5); // Return top 5 most relevant symptoms
        }
        catch (error) {
            logger_1.default.error('Error in symptom detection:', error);
            return [];
        }
    }
    /**
     * Advanced triage system using multiple scoring methods
     */
    async performAdvancedTriage(symptoms, context) {
        try {
            if (symptoms.length === 0) {
                return {
                    urgency_level: 5,
                    urgency_label: 'Không khẩn cấp',
                    time_to_see_doctor: 240,
                    recommended_action: 'Tư vấn qua điện thoại hoặc đặt lịch khám',
                    warning_signs: [],
                    triage_score: 0
                };
            }
            // Calculate triage score using multiple factors
            let triageScore = 0;
            const symptomIds = symptoms.map(s => s.symptom_id);
            // Check triage rules
            const { data: triageRules } = await this.supabase
                .from('triage_rules')
                .select('*')
                .overlaps('symptom_combinations', symptomIds)
                .order('urgency_level', { ascending: true });
            if (triageRules && triageRules.length > 0) {
                const mostUrgentRule = triageRules[0];
                return {
                    urgency_level: mostUrgentRule.urgency_level,
                    urgency_label: mostUrgentRule.urgency_label,
                    time_to_see_doctor: mostUrgentRule.time_to_see_doctor,
                    recommended_action: mostUrgentRule.recommended_action,
                    warning_signs: mostUrgentRule.warning_signs,
                    triage_score: this.calculateTriageScore(symptoms, context)
                };
            }
            // Fallback scoring based on symptom severity
            const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity_level, 0) / symptoms.length;
            if (avgSeverity >= 4) {
                return {
                    urgency_level: 2,
                    urgency_label: 'Cấp cứu',
                    time_to_see_doctor: 15,
                    recommended_action: 'Đến cấp cứu ngay lập tức',
                    warning_signs: ['Triệu chứng nghiêm trọng'],
                    triage_score: avgSeverity * 2
                };
            }
            else if (avgSeverity >= 3) {
                return {
                    urgency_level: 3,
                    urgency_label: 'Khẩn cấp',
                    time_to_see_doctor: 60,
                    recommended_action: 'Khám trong 1 giờ',
                    warning_signs: ['Theo dõi triệu chứng'],
                    triage_score: avgSeverity * 1.5
                };
            }
            else {
                return {
                    urgency_level: 4,
                    urgency_label: 'Ít khẩn cấp',
                    time_to_see_doctor: 120,
                    recommended_action: 'Khám trong 2 giờ',
                    warning_signs: [],
                    triage_score: avgSeverity
                };
            }
        }
        catch (error) {
            logger_1.default.error('Error in triage assessment:', error);
            return {
                urgency_level: 4,
                urgency_label: 'Ít khẩn cấp',
                time_to_see_doctor: 120,
                recommended_action: 'Khám bác sĩ để đánh giá',
                warning_signs: [],
                triage_score: 0
            };
        }
    }
    /**
     * Search intelligent QA database for relevant responses
     */
    async searchIntelligentQA(userInput, context) {
        try {
            const { data, error } = await this.supabase
                .rpc('search_intelligent_qa', {
                user_question: userInput,
                context_data: context?.context_data || null
            });
            if (error || !data || data.length === 0) {
                return null;
            }
            return data[0];
        }
        catch (error) {
            logger_1.default.error('Error searching intelligent QA:', error);
            return null;
        }
    }
    /**
     * Classify user intent using pattern matching
     */
    async classifyIntent(userInput) {
        try {
            const { data, error } = await this.supabase
                .rpc('classify_intent', { user_input: userInput });
            if (error || !data || data.length === 0) {
                return { intent: 'general_inquiry', confidence: 0.5, specialty: 'Tổng quát' };
            }
            return {
                intent: data[0].intent_name,
                confidence: data[0].confidence,
                matched_keywords: data[0].matched_keywords,
                specialty: this.mapIntentToSpecialty(data[0].intent_name)
            };
        }
        catch (error) {
            logger_1.default.error('Error classifying intent:', error);
            return { intent: 'general_inquiry', confidence: 0.5, specialty: 'Tổng quát' };
        }
    }
    // Helper methods continue in next part...
    isHealthRelatedQuestion(input) {
        const healthKeywords = [
            'đau', 'nhức', 'sốt', 'ho', 'khó thở', 'buồn nôn', 'chóng mặt', 'mệt mỏi',
            'bệnh', 'thuốc', 'khám', 'bác sĩ', 'bệnh viện', 'triệu chứng', 'điều trị',
            'sức khỏe', 'y tế', 'chuyên khoa', 'cấp cứu', 'phòng ngừa'
        ];
        return healthKeywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()));
    }
    getOutOfScopeResponse() {
        return {
            symptoms_detected: [],
            diseases_suggested: [],
            triage_result: {
                urgency_level: 5,
                urgency_label: 'Không khẩn cấp',
                time_to_see_doctor: 0,
                recommended_action: 'Câu hỏi ngoài phạm vi tư vấn y tế',
                warning_signs: [],
                triage_score: 0
            },
            recommended_specialty: '',
            recommended_doctors: [],
            recommended_facilities: [],
            intelligent_answer: 'Xin lỗi, câu hỏi của bạn không thuộc lĩnh vực tôi có thể trả lời. Vui lòng hỏi câu hỏi khác về sức khỏe. Xin cảm ơn!',
            follow_up_questions: [
                'Bạn có triệu chứng gì cần tư vấn không?',
                'Cần hỗ trợ tìm bác sĩ chuyên khoa nào?',
                'Muốn biết thông tin về phòng ngừa bệnh tật?'
            ],
            context_aware_suggestions: [],
            prevention_tips: [],
            lifestyle_recommendations: [],
            confidence_score: 1.0,
            urgency_level: 'Không khẩn cấp',
            should_see_doctor: false
        };
    }
    // =====================================================
    // HELPER METHODS FOR ENHANCED FUNCTIONALITY
    // =====================================================
    async getConversationContext(userId, sessionId) {
        if (!userId || !sessionId)
            return null;
        try {
            const { data, error } = await this.supabase
                .from('conversation_contexts')
                .select('*')
                .eq('user_id', userId)
                .eq('session_id', sessionId)
                .gt('expires_at', new Date().toISOString())
                .single();
            return error ? null : data;
        }
        catch (error) {
            return null;
        }
    }
    async updateConversationContext(userId, sessionId, intentResult, symptoms, triageResult) {
        if (!userId || !sessionId)
            return;
        try {
            await this.supabase.rpc('update_conversation_context', {
                p_user_id: userId,
                p_session_id: sessionId,
                p_current_topic: intentResult?.intent || 'general',
                p_new_symptoms: symptoms?.map(s => s.name_vi) || [],
                p_new_specialties: [this.determineSpecialty(symptoms || [], triageResult)],
                p_last_intent: intentResult?.intent,
                p_context_data: {
                    urgency_level: triageResult?.urgency_level,
                    confidence: intentResult?.confidence
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error updating conversation context:', error);
        }
    }
    async suggestDiseases(symptoms) {
        if (symptoms.length === 0)
            return [];
        try {
            const symptomNames = symptoms.map(s => s.name_vi);
            const { data: diseases, error } = await this.supabase
                .from('diseases')
                .select('*')
                .overlaps('common_symptoms', symptomNames)
                .order('severity_level', { ascending: false })
                .limit(5);
            return error ? [] : diseases || [];
        }
        catch (error) {
            logger_1.default.error('Error suggesting diseases:', error);
            return [];
        }
    }
    async findHealthcareProviders(specialty) {
        try {
            // Find doctors
            const { data: doctors } = await this.supabase
                .from('doctors')
                .select(`
          *,
          healthcare_facilities!inner(name_vi, address, city, phone)
        `)
                .eq('specialty', specialty)
                .eq('is_active', true)
                .order('rating', { ascending: false })
                .limit(5);
            // Find facilities
            const { data: facilities } = await this.supabase
                .from('healthcare_facilities')
                .select('*')
                .contains('specialties', [specialty])
                .order('rating', { ascending: false })
                .limit(5);
            return {
                doctors: doctors || [],
                facilities: facilities || []
            };
        }
        catch (error) {
            logger_1.default.error('Error finding healthcare providers:', error);
            return { doctors: [], facilities: [] };
        }
    }
    async getAdditionalHealthInfo(symptoms, diseases) {
        try {
            const result = {
                medications: [],
                prevention: [],
                lifestyle: []
            };
            // Get prevention tips from diseases
            diseases.forEach(disease => {
                result.prevention.push(...disease.prevention_tips);
            });
            // Get lifestyle recommendations
            const categories = [...new Set(symptoms.map(s => s.category))];
            const { data: lifestyleData } = await this.supabase
                .from('nutrition_lifestyle')
                .select('recommendations, foods_to_include, foods_to_avoid')
                .in('category', categories)
                .limit(3);
            if (lifestyleData) {
                lifestyleData.forEach(item => {
                    result.lifestyle.push(...item.recommendations);
                });
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Error getting additional health info:', error);
            return { medications: [], prevention: [], lifestyle: [] };
        }
    }
    async generateIntelligentResponse(userInput, symptoms, triageResult, qaResult, context) {
        try {
            // If we have a direct QA match, format it friendly
            if (qaResult && qaResult.confidence_score > 0.8) {
                const severity = friendly_formatter_1.FriendlyFormatter.detectSeverity(qaResult.answer_vi);
                return friendly_formatter_1.FriendlyFormatter.formatResponse(qaResult.answer_vi, severity);
            }
            // Generate contextual response with Gemini AI
            const prompt = this.buildGeminiPrompt(userInput, symptoms, triageResult, context);
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            // Format AI response to be friendly
            const severity = triageResult.urgency_level >= 4 ? 'emergency' :
                triageResult.urgency_level >= 3 ? 'high' : 'normal';
            const friendlyResponse = text ?
                friendly_formatter_1.FriendlyFormatter.formatResponse(text, severity) :
                this.getFallbackResponse(symptoms, triageResult);
            return friendlyResponse;
        }
        catch (error) {
            logger_1.default.error('Error generating intelligent response:', error);
            return this.getFallbackResponse(symptoms, triageResult);
        }
    }
    buildGeminiPrompt(userInput, symptoms, triageResult, context) {
        const urgencyLevel = triageResult.urgency_level;
        const isEmergency = urgencyLevel >= 4;
        return `
Bạn là một trợ lý y tế AI thân thiện, ấm áp và đồng cảm. Hãy trả lời như một người bạn quan tâm chân thành.

Tin nhắn của người dùng: "${userInput}"
Triệu chứng phát hiện: ${symptoms.map(s => s.name_vi).join(', ')}
Mức độ khẩn cấp: ${triageResult.urgency_label}

NGUYÊN TẮC TRẢ LỜI THÂN THIỆN:

${isEmergency ? `
🚨 TÌNH HUỐNG CẤP CỨU - AN TOÀN TRƯỚC TIÊN:
- Bắt đầu: "⚠️ Tôi rất lo lắng về tình trạng của bạn!"
- Yêu cầu gọi 115 hoặc đến cấp cứu NGAY LẬP TỨC
- Hướng dẫn cách xử lý trong khi chờ
- Động viên: "Đừng lo, bác sĩ sẽ chăm sóc bạn tốt nhất!"
` : `
💙 THÂN THIỆN VÀ ĐỒNG CẢM:
- Bắt đầu: "Tôi hiểu bạn đang cảm thấy khó chịu/lo lắng..."
- Thể hiện sự quan tâm chân thành
- Dùng ngôn ngữ ấm áp, dễ hiểu (tránh thuật ngữ y khoa)
- Tạo cảm giác được lắng nghe và quan tâm
`}

📋 CẤU TRÚC PHẢN HỒI:
1. **Lời đồng cảm** (💙): "Tôi hiểu bạn đang..."
2. **${isEmergency ? 'Cảnh báo cấp cứu' : 'Giải thích đơn giản'}** (🤗): Nguyên nhân có thể
3. **Lời khuyên thực tế** (💡): Những gì bạn có thể làm
4. **Khuyến nghị y tế** (🏥): Khi nào cần gặp bác sĩ
5. **Câu hỏi theo dõi** (❓): Để hiểu rõ hơn

🎨 PHONG CÁCH:
- Emoji phù hợp: 💙🤗🩺🏥⚠️💡❓
- Ngôn ngữ: Thân thiện, dễ hiểu, không formal
- Độ dài: 3-4 đoạn ngắn, mỗi đoạn 1-2 câu
- Tone: Như người bạn quan tâm, không phải bác sĩ lạnh lùng

Hãy trả lời theo format trên:`;
    }
    getFallbackResponse(symptoms, triageResult) {
        if (symptoms.length === 0) {
            return 'Tôi hiểu bạn đang có thắc mắc về sức khỏe. Để tư vấn chính xác hơn, bạn có thể chia sẻ cụ thể về triệu chứng đang gặp phải không?';
        }
        const symptomNames = symptoms.map(s => s.name_vi).join(', ');
        if (triageResult.urgency_level <= 2) {
            return `Triệu chứng ${symptomNames} mà bạn mô tả có thể cần được quan tâm nghiêm trọng. Tôi khuyên bạn nên ${triageResult.recommended_action.toLowerCase()}.`;
        }
        else {
            return `Tôi hiểu bạn đang gặp phải ${symptomNames}. Để được tư vấn chính xác, bạn nên đến khám bác sĩ chuyên khoa để được kiểm tra và điều trị phù hợp.`;
        }
    }
    calculateSymptomRelevance(userInput, symptom) {
        let score = 0;
        const input = userInput.toLowerCase();
        // Exact name match
        if (input.includes(symptom.name_vi.toLowerCase())) {
            score += 1.0;
        }
        // Keyword matches
        const matchedKeywords = symptom.keywords.filter((keyword) => input.includes(keyword.toLowerCase()));
        score += matchedKeywords.length * 0.3;
        // Description match
        if (symptom.description && input.includes(symptom.description.toLowerCase())) {
            score += 0.2;
        }
        return Math.min(score, 1.0);
    }
    calculateTriageScore(symptoms, context) {
        let score = 0;
        symptoms.forEach(symptom => {
            score += symptom.severity_level;
        });
        // Context adjustments
        if (context?.user_profile?.age) {
            const age = context.user_profile.age;
            if (age < 5 || age > 65) {
                score += 1; // Higher risk for children and elderly
            }
        }
        return score;
    }
    calculateOverallConfidence(qaResult, symptoms, triageResult) {
        let confidence = 0.5; // Base confidence
        if (qaResult && qaResult.confidence_score > 0.8) {
            confidence = qaResult.confidence_score;
        }
        else if (symptoms.length > 0) {
            confidence = 0.7;
        }
        // Adjust based on triage certainty
        if (triageResult.triage_score > 5) {
            confidence += 0.1;
        }
        return Math.min(confidence, 1.0);
    }
    determineSpecialty(symptoms, triageResult) {
        if (triageResult && triageResult.urgency_level <= 2) {
            return 'Cấp cứu';
        }
        if (symptoms.length === 0) {
            return 'Tổng quát';
        }
        // Map symptom categories to specialties
        const categoryMap = {
            'cardiovascular': 'Tim mạch',
            'respiratory': 'Hô hấp',
            'neurological': 'Thần kinh',
            'digestive': 'Tiêu hóa',
            'dermatological': 'Da liễu',
            'musculoskeletal': 'Cơ xương khớp',
            'ophthalmological': 'Mắt',
            'ent': 'Tai mũi họng',
            'urological': 'Thận - Tiết niệu',
            'gynecological': 'Phụ khoa',
            'pediatric': 'Nhi khoa',
            'geriatric': 'Lão khoa',
            'psychiatric': 'Tâm thần',
            'oncological': 'Ung bướu',
            'endocrine': 'Nội tiết'
        };
        const categories = symptoms.map(s => s.category);
        const mostCommonCategory = categories.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b);
        return categoryMap[mostCommonCategory] || 'Nội khoa';
    }
    mapIntentToSpecialty(intent) {
        const intentMap = {
            'symptom_inquiry': 'Nội khoa',
            'emergency_alert': 'Cấp cứu',
            'specialty_inquiry': 'Tổng quát',
            'medication_info': 'Dược',
            'appointment_booking': 'Hành chính',
            'prevention_advice': 'Phòng ngừa'
        };
        return intentMap[intent] || 'Tổng quát';
    }
    generateFollowUpQuestions(symptoms) {
        if (symptoms.length === 0) {
            return [
                'Bạn có triệu chứng gì cần tư vấn không?',
                'Cần hỗ trợ tìm bác sĩ chuyên khoa nào?',
                'Muốn biết thông tin về phòng ngừa bệnh tật?'
            ];
        }
        const questions = [
            'Triệu chứng này kéo dài bao lâu rồi?',
            'Mức độ nghiêm trọng từ 1-10 là bao nhiêu?',
            'Có yếu tố nào làm triệu chứng tăng hoặc giảm không?'
        ];
        // Add symptom-specific questions
        symptoms.forEach(symptom => {
            if (symptom.category === 'cardiovascular') {
                questions.push('Có đau ngực lan ra tay, cổ, hàm không?');
            }
            else if (symptom.category === 'respiratory') {
                questions.push('Có khó thở khi gắng sức không?');
            }
            else if (symptom.category === 'neurological') {
                questions.push('Có kèm buồn nôn, sợ ánh sáng không?');
            }
        });
        return questions.slice(0, 3);
    }
    generateContextAwareSuggestions(context, symptoms) {
        const suggestions = [];
        if (context?.mentioned_symptoms.length) {
            suggestions.push('Dựa trên triệu chứng đã thảo luận, bạn có thể cần khám chuyên khoa.');
        }
        if (symptoms.some(s => s.severity_level >= 4)) {
            suggestions.push('Triệu chứng này có thể nghiêm trọng, nên đến khám sớm.');
        }
        if (context?.user_profile?.age && context.user_profile.age > 65) {
            suggestions.push('Ở độ tuổi của bạn, nên theo dõi sức khỏe thường xuyên.');
        }
        return suggestions.length > 0 ? suggestions : [
            'Theo dõi triệu chứng và đến khám nếu không cải thiện.',
            'Duy trì lối sống lành mạnh để phòng ngừa bệnh tật.',
            'Đặt lịch khám định kỳ để theo dõi sức khỏe.'
        ];
    }
}
exports.EnhancedHealthAdvisorService = EnhancedHealthAdvisorService;
//# sourceMappingURL=enhanced-health-advisor.service.js.map