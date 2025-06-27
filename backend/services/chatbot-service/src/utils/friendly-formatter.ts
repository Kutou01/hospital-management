// Friendly Response Formatter
// Chuyển đổi phản hồi AI thành format thân thiện và dễ tiếp cận

export interface FriendlyResponse {
  empathy: string;
  safety_warning?: string;
  explanation: string;
  advice: string[];
  medical_recommendation: string;
  follow_up_question: string;
  severity: 'normal' | 'high' | 'emergency';
}

export class FriendlyFormatter {
  
  /**
   * Format AI response thành cấu trúc thân thiện
   */
  static formatResponse(aiResponse: string, severity: 'normal' | 'high' | 'emergency' = 'normal'): string {
    try {
      // Nếu response đã có format thân thiện, return luôn
      if (aiResponse.includes('💙') || aiResponse.includes('🤗')) {
        return aiResponse;
      }

      // Parse và format lại response
      const formatted = this.parseAndFormat(aiResponse, severity);
      return this.buildFriendlyResponse(formatted);
    } catch (error) {
      console.error('Error formatting response:', error);
      return this.addFriendlyWrapper(aiResponse, severity);
    }
  }

  /**
   * Parse AI response thành các phần
   */
  private static parseAndFormat(response: string, severity: 'normal' | 'high' | 'emergency'): FriendlyResponse {
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      empathy: this.generateEmpathy(response, severity),
      safety_warning: severity === 'emergency' ? this.generateSafetyWarning(response) : undefined,
      explanation: this.extractExplanation(lines),
      advice: this.extractAdvice(lines),
      medical_recommendation: this.extractMedicalRecommendation(lines),
      follow_up_question: this.generateFollowUpQuestion(response),
      severity
    };
  }

  /**
   * Tạo lời đồng cảm phù hợp
   */
  private static generateEmpathy(response: string, severity: 'normal' | 'high' | 'emergency'): string {
    const empathyTemplates = {
      normal: [
        "Tôi hiểu bạn đang cảm thấy khó chịu 💙",
        "Tôi thấy bạn đang lo lắng về tình trạng này 🤗",
        "Cảm ơn bạn đã chia sẻ với tôi 💙"
      ],
      high: [
        "Tôi hiểu bạn đang rất khó chịu và lo lắng 💙",
        "Tôi thấy tình trạng này đang làm bạn khó chịu 🤗",
        "Tôi quan tâm đến những gì bạn đang trải qua 💙"
      ],
      emergency: [
        "⚠️ Tôi rất lo lắng về tình trạng của bạn!",
        "⚠️ Tôi nghiêm túc quan tâm đến tình trạng này!",
        "⚠️ Đây là tình huống tôi rất lo ngại!"
      ]
    };

    const templates = empathyTemplates[severity];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Tạo cảnh báo an toàn cho tình huống cấp cứu
   */
  private static generateSafetyWarning(response: string): string {
    if (response.toLowerCase().includes('115') || response.toLowerCase().includes('cấp cứu')) {
      return "🚨 Hãy gọi 115 NGAY hoặc đến cấp cứu gần nhất!";
    }
    return "🚨 Đây có thể là tình huống nghiêm trọng, cần được chú ý ngay lập tức!";
  }

  /**
   * Trích xuất phần giải thích
   */
  private static extractExplanation(lines: string[]): string {
    // Tìm câu giải thích về nguyên nhân
    const explanationLine = lines.find(line => 
      line.includes('do') || line.includes('nguyên nhân') || line.includes('có thể')
    );
    
    if (explanationLine) {
      return explanationLine.trim();
    }
    
    return "Đây là triệu chứng cần được quan tâm và theo dõi.";
  }

  /**
   * Trích xuất lời khuyên
   */
  private static extractAdvice(lines: string[]): string[] {
    const adviceKeywords = ['nên', 'hãy', 'có thể', 'uống', 'nghỉ', 'tránh'];
    const advice: string[] = [];
    
    lines.forEach(line => {
      if (adviceKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        // Thêm emoji phù hợp
        let formattedAdvice = line.trim();
        if (formattedAdvice.includes('uống') || formattedAdvice.includes('nước')) {
          formattedAdvice = '💧 ' + formattedAdvice;
        } else if (formattedAdvice.includes('nghỉ') || formattedAdvice.includes('ngủ')) {
          formattedAdvice = '🛌 ' + formattedAdvice;
        } else if (formattedAdvice.includes('tránh')) {
          formattedAdvice = '🚫 ' + formattedAdvice;
        } else {
          formattedAdvice = '💡 ' + formattedAdvice;
        }
        advice.push(formattedAdvice);
      }
    });

    return advice.length > 0 ? advice : ['💡 Theo dõi triệu chứng và nghỉ ngơi đầy đủ'];
  }

  /**
   * Trích xuất khuyến nghị y tế
   */
  private static extractMedicalRecommendation(lines: string[]): string {
    const medicalLine = lines.find(line => 
      line.includes('bác sĩ') || line.includes('khám') || line.includes('chuyên khoa')
    );
    
    if (medicalLine) {
      return '🏥 ' + medicalLine.trim();
    }
    
    return '🏥 Nếu triệu chứng kéo dài hoặc nặng hơn, hãy đến gặp bác sĩ nhé!';
  }

  /**
   * Tạo câu hỏi theo dõi
   */
  private static generateFollowUpQuestion(response: string): string {
    const questions = [
      "Bạn có triệu chứng nào khác kèm theo không?",
      "Tình trạng này xuất hiện từ khi nào?",
      "Có điều gì làm bạn cảm thấy tốt hơn hoặc tệ hơn không?",
      "Bạn có đang dùng thuốc gì không?"
    ];
    
    return '❓ ' + questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Xây dựng phản hồi thân thiện hoàn chỉnh
   */
  private static buildFriendlyResponse(formatted: FriendlyResponse): string {
    let response = formatted.empathy + '\n\n';
    
    // Thêm cảnh báo an toàn nếu cần
    if (formatted.safety_warning) {
      response += formatted.safety_warning + '\n\n';
    }
    
    // Thêm giải thích
    response += '🤗 **Hiểu về tình trạng này:**\n';
    response += formatted.explanation + '\n\n';
    
    // Thêm lời khuyên
    if (formatted.advice.length > 0) {
      response += '💡 **Những gì bạn có thể làm:**\n';
      formatted.advice.forEach(advice => {
        response += advice + '\n';
      });
      response += '\n';
    }
    
    // Thêm khuyến nghị y tế
    response += formatted.medical_recommendation + '\n\n';
    
    // Thêm câu hỏi theo dõi
    response += formatted.follow_up_question;
    
    return response;
  }

  /**
   * Thêm wrapper thân thiện cho response đơn giản
   */
  private static addFriendlyWrapper(response: string, severity: 'normal' | 'high' | 'emergency'): string {
    const empathy = this.generateEmpathy(response, severity);
    const followUp = this.generateFollowUpQuestion(response);
    
    let wrapped = empathy + '\n\n';
    
    if (severity === 'emergency') {
      wrapped += '🚨 ' + response + '\n\n';
    } else {
      wrapped += '🤗 ' + response + '\n\n';
    }
    
    wrapped += followUp;
    
    return wrapped;
  }

  /**
   * Detect severity từ nội dung
   */
  static detectSeverity(content: string): 'normal' | 'high' | 'emergency' {
    const emergencyKeywords = ['cấp cứu', '115', 'nguy hiểm', 'nghiêm trọng', 'đau ngực', 'khó thở'];
    const highKeywords = ['đau dữ dội', 'sốt cao', 'kéo dài', 'lo lắng'];
    
    const lowerContent = content.toLowerCase();
    
    if (emergencyKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'emergency';
    }
    
    if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'high';
    }
    
    return 'normal';
  }
}
