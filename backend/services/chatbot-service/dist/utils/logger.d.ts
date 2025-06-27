import winston from 'winston';
declare const logger: winston.Logger;
export declare const logHealthConsultation: (userId: string, input: string, result: any) => void;
export declare const logSymptomAnalysis: (symptoms: string[], detectedSymptoms: any[]) => void;
export declare const logSpecialtyRecommendation: (symptoms: any[], recommendation: any) => void;
export declare const logDatabaseQuery: (operation: string, table: string, duration: number, success: boolean) => void;
export declare const logAPIRequest: (method: string, endpoint: string, userId?: string, duration?: number) => void;
export declare const logError: (error: Error, context?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map