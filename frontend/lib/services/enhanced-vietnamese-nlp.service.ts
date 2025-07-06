/**
 * Enhanced Vietnamese NLP Service for Medical Chatbot
 * Fixes encoding issues, emergency detection, and medical entity recognition
 */

// Vietnamese diacritics mapping for normalization
const VIETNAMESE_DIACRITICS_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  'đ': 'd'
};

// Emergency symptoms with variations and severity levels
const EMERGENCY_SYMPTOMS = {
  'sốt_xuất_huyết': {
    keywords: [
      'sốt xuất huyết', 'sot xuat huyet', 'sốt dhd', 'dengue fever',
      'sốt xuất huyết dengue', 'sot dhd', 'xuất huyết dengue'
    ],
    severity: 'critical',
    specialty: 'nội khoa',
    message: '🚨 KHẨN CẤP: Sốt xuất huyết cần được điều trị ngay lập tức! Vui lòng đến bệnh viện gấp hoặc gọi cấp cứu 115.'
  },
  'đau_ngực_cấp': {
    keywords: [
      'đau ngực', 'dau nguc', 'đau tim', 'dau tim', 'đau ngực trái',
      'đau ngực dữ dội', 'ngực đau', 'tim đau'
    ],
    severity: 'critical',
    specialty: 'tim mạch',
    message: '🚨 KHẨN CẤP: Đau ngực có thể là dấu hiệu của nhồi máu cơ tim! Cần khám ngay.'
  },
  'khó_thở_cấp': {
    keywords: [
      'khó thở', 'kho tho', 'thở khó', 'tho kho', 'không thở được',
      'ngạt thở', 'khó thở cấp tính', 'thở gấp'
    ],
    severity: 'critical',
    specialty: 'hô hấp',
    message: '🚨 KHẨN CẤP: Khó thở cấp tính cần được xử lý ngay! Vui lòng đến cấp cứu.'
  },
  'đột_quỵ': {
    keywords: [
      'đột quỵ', 'dot quy', 'tai biến', 'liệt nửa người', 'méo miệng',
      'meo mieng', 'nói khó', 'noi kho'
    ],
    severity: 'critical',
    specialty: 'thần kinh',
    message: '🚨 KHẨN CẤP: Nghi ngờ đột quỵ! Cần cấp cứu ngay lập tức - gọi 115!'
  },
  'co_giật': {
    keywords: [
      'co giật', 'co giat', 'động kinh', 'dong kinh', 'giật cứng',
      'giat cung', 'co cứng'
    ],
    severity: 'high',
    specialty: 'thần kinh',
    message: '⚠️ NGHIÊM TRỌNG: Co giật cần được khám ngay. Vui lòng đến bệnh viện.'
  },
  'chảy_máu_nhiều': {
    keywords: [
      'chảy máu không cầm', 'chay mau khong cam', 'xuất huyết',
      'xuat huyet', 'máu chảy nhiều', 'mau chay nhieu'
    ],
    severity: 'high',
    specialty: 'cấp cứu',
    message: '⚠️ NGHIÊM TRỌNG: Chảy máu nhiều cần được xử lý ngay!'
  }
};

// Common symptoms with specialty mapping
const COMMON_SYMPTOMS = {
  'đau_đầu': {
    keywords: ['đau đầu', 'dau dau', 'nhức đầu', 'nhuc dau', 'đau nửa đầu'],
    specialty: 'thần kinh',
    severity: 'normal'
  },
  'đau_bụng': {
    keywords: ['đau bụng', 'dau bung', 'đau dạ dày', 'dau da day', 'đau ruột'],
    specialty: 'tiêu hóa',
    severity: 'normal'
  },
  'sốt': {
    keywords: ['sốt', 'sot', 'nóng sốt', 'nong sot', 'bị sốt'],
    specialty: 'nội tổng hợp',
    severity: 'normal'
  },
  'ho': {
    keywords: ['ho', 'ho khan', 'ho có đờm', 'ho co dom', 'ho lâu'],
    specialty: 'hô hấp',
    severity: 'normal'
  },
  'buồn_nôn': {
    keywords: ['buồn nôn', 'buon non', 'nôn', 'non', 'muốn nôn', 'muon non'],
    specialty: 'tiêu hóa',
    severity: 'normal'
  },
  'chóng_mặt': {
    keywords: ['chóng mặt', 'chong mat', 'hoa mắt', 'hoa mat', 'choáng váng'],
    specialty: 'thần kinh',
    severity: 'normal'
  }
};

// Interfaces
export interface MedicalAnalysis {
  originalText: string;
  normalizedText: string;
  detectedSymptoms: string[];
  emergencyLevel: 'normal' | 'high' | 'critical';
  recommendedSpecialty: string;
  confidence: number;
  isEmergency: boolean;
  emergencyMessage?: string;
  encoding: 'valid' | 'corrupted';
}

export class EnhancedVietnameseNLPService {
  private static instance: EnhancedVietnameseNLPService;

  private constructor() {}

  public static getInstance(): EnhancedVietnameseNLPService {
    if (!EnhancedVietnameseNLPService.instance) {
      EnhancedVietnameseNLPService.instance = new EnhancedVietnameseNLPService();
    }
    return EnhancedVietnameseNLPService.instance;
  }

  /**
   * Check if text has proper Vietnamese encoding
   */
  public checkEncoding(text: string): 'valid' | 'corrupted' {
    // Check for common corruption patterns
    const corruptionPatterns = [
      'Ã¡', 'Ã ', 'Ã¢', 'Ã¤', 'Ã©', 'Ã¨', 'Ã­', 'Ã¬',
      'Ã³', 'Ã²', 'Ãº', 'Ã¹', 'Ã½', 'Ã¿', 'Ä'
    ];

    for (const pattern of corruptionPatterns) {
      if (text.includes(pattern)) {
        return 'corrupted';
      }
    }

    return 'valid';
  }

  /**
   * Fix corrupted Vietnamese text
   */
  public fixEncoding(text: string): string {
    if (this.checkEncoding(text) === 'valid') {
      return text;
    }

    // Common corruption fixes
    const fixes: Record<string, string> = {
      'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã¤': 'ä',
      'Ã©': 'é', 'Ã¨': 'è', 'Ã­': 'í', 'Ã¬': 'ì',
      'Ã³': 'ó', 'Ã²': 'ò', 'Ãº': 'ú', 'Ã¹': 'ù',
      'Ã½': 'ý', 'Ã¿': 'ÿ', 'Ä': 'đ'
    };

    let fixedText = text;
    for (const [corrupted, correct] of Object.entries(fixes)) {
      fixedText = fixedText.replace(new RegExp(corrupted, 'g'), correct);
    }

    return fixedText;
  }

  /**
   * Normalize Vietnamese text for processing
   */
  public normalizeText(text: string): string {
    if (!text) return '';

    // Fix encoding first
    let normalized = this.fixEncoding(text);

    // Convert to lowercase and trim
    normalized = normalized.toLowerCase().trim();

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Handle common typos and variations
    const typoFixes: Record<string, string> = {
      'sot xuat huyet': 'sốt xuất huyết',
      'sot dhd': 'sốt xuất huyết',
      'buon non': 'buồn nôn',
      'chong mat': 'chóng mặt',
      'kho tho': 'khó thở',
      'dau nguc': 'đau ngực',
      'dau dau': 'đau đầu',
      'dau bung': 'đau bụng'
    };

    for (const [typo, correct] of Object.entries(typoFixes)) {
      normalized = normalized.replace(new RegExp(typo, 'g'), correct);
    }

    return normalized;
  }

  /**
   * Remove Vietnamese diacritics for fuzzy matching
   */
  public removeDiacritics(text: string): string {
    let result = '';
    for (const char of text.toLowerCase()) {
      result += VIETNAMESE_DIACRITICS_MAP[char] || char;
    }
    return result;
  }

  /**
   * Detect emergency symptoms
   */
  public detectEmergency(text: string): {
    isEmergency: boolean;
    severity: 'normal' | 'high' | 'critical';
    detectedEmergencies: string[];
    message?: string;
  } {
    const normalizedText = this.normalizeText(text);
    const noDiacritics = this.removeDiacritics(normalizedText);
    
    const detectedEmergencies: string[] = [];
    let maxSeverity: 'normal' | 'high' | 'critical' = 'normal';
    let emergencyMessage = '';

    // Check each emergency pattern
    for (const [emergencyType, config] of Object.entries(EMERGENCY_SYMPTOMS)) {
      for (const keyword of config.keywords) {
        const keywordNormalized = this.normalizeText(keyword);
        const keywordNoDiacritics = this.removeDiacritics(keywordNormalized);

        // Check with diacritics
        if (normalizedText.includes(keywordNormalized)) {
          detectedEmergencies.push(emergencyType);
          if (config.severity === 'critical' || (config.severity === 'high' && maxSeverity === 'normal')) {
            maxSeverity = config.severity;
            emergencyMessage = config.message;
          }
          break;
        }

        // Check without diacritics for typos
        if (noDiacritics.includes(keywordNoDiacritics)) {
          detectedEmergencies.push(emergencyType);
          if (config.severity === 'critical' || (config.severity === 'high' && maxSeverity === 'normal')) {
            maxSeverity = config.severity;
            emergencyMessage = config.message;
          }
          break;
        }
      }
    }

    return {
      isEmergency: detectedEmergencies.length > 0,
      severity: maxSeverity,
      detectedEmergencies: [...new Set(detectedEmergencies)], // Remove duplicates
      message: emergencyMessage || undefined
    };
  }

  /**
   * Detect common symptoms and suggest specialty
   */
  public detectSymptoms(text: string): {
    symptoms: string[];
    recommendedSpecialty: string;
    confidence: number;
  } {
    const normalizedText = this.normalizeText(text);
    const noDiacritics = this.removeDiacritics(normalizedText);
    
    const detectedSymptoms: string[] = [];
    const specialtyScores: Record<string, number> = {};

    // Check each symptom pattern
    for (const [symptomType, config] of Object.entries(COMMON_SYMPTOMS)) {
      for (const keyword of config.keywords) {
        const keywordNormalized = this.normalizeText(keyword);
        const keywordNoDiacritics = this.removeDiacritics(keywordNormalized);

        if (normalizedText.includes(keywordNormalized) || noDiacritics.includes(keywordNoDiacritics)) {
          detectedSymptoms.push(symptomType);
          specialtyScores[config.specialty] = (specialtyScores[config.specialty] || 0) + 1;
          break;
        }
      }
    }

    // Find recommended specialty
    let recommendedSpecialty = 'nội tổng hợp'; // Default
    let maxScore = 0;
    
    for (const [specialty, score] of Object.entries(specialtyScores)) {
      if (score > maxScore) {
        maxScore = score;
        recommendedSpecialty = specialty;
      }
    }

    // Calculate confidence
    const confidence = Math.min(detectedSymptoms.length * 0.3, 1.0);

    return {
      symptoms: [...new Set(detectedSymptoms)],
      recommendedSpecialty,
      confidence
    };
  }

  /**
   * Comprehensive medical text analysis
   */
  public analyzeMedicalText(text: string): MedicalAnalysis {
    console.log('🔍 [Vietnamese NLP] Analyzing text:', text);

    // Check encoding
    const encoding = this.checkEncoding(text);
    
    // Normalize text
    const normalizedText = this.normalizeText(text);
    
    // Detect emergency
    const emergencyResult = this.detectEmergency(normalizedText);
    
    // Detect symptoms
    const symptomResult = this.detectSymptoms(normalizedText);
    
    // Override specialty if emergency detected
    let recommendedSpecialty = symptomResult.recommendedSpecialty;
    if (emergencyResult.isEmergency) {
      const emergencyType = emergencyResult.detectedEmergencies[0];
      const emergencyConfig = EMERGENCY_SYMPTOMS[emergencyType as keyof typeof EMERGENCY_SYMPTOMS];
      if (emergencyConfig) {
        recommendedSpecialty = emergencyConfig.specialty;
      }
    }

    const analysis: MedicalAnalysis = {
      originalText: text,
      normalizedText,
      detectedSymptoms: symptomResult.symptoms,
      emergencyLevel: emergencyResult.severity,
      recommendedSpecialty,
      confidence: Math.max(symptomResult.confidence, emergencyResult.isEmergency ? 0.9 : 0),
      isEmergency: emergencyResult.isEmergency,
      emergencyMessage: emergencyResult.message,
      encoding
    };

    console.log('📊 [Vietnamese NLP] Analysis result:', {
      symptoms: analysis.detectedSymptoms,
      emergency: analysis.isEmergency,
      severity: analysis.emergencyLevel,
      specialty: analysis.recommendedSpecialty,
      encoding: analysis.encoding
    });

    return analysis;
  }
}

// Export singleton instance
export const vietnameseNLPService = EnhancedVietnameseNLPService.getInstance();
