import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    const supabase = await createClient();

    // Calculate time filter
    const now = new Date();
    let timeFilter: Date;
    
    switch (timeRange) {
      case '1h':
        timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const timeFilterISO = timeFilter.toISOString();

    // Fetch analytics data
    const [conversationsResult, performanceResult, errorsResult, feedbackResult] = await Promise.all([
      // Conversations analytics
      supabase
        .from('chatbot_analytics')
        .select('*')
        .gte('timestamp', timeFilterISO),

      // Performance metrics
      supabase
        .from('chatbot_performance')
        .select('*')
        .gte('created_at', timeFilterISO),

      // Error tracking
      supabase
        .from('chatbot_errors')
        .select('*')
        .gte('created_at', timeFilterISO),

      // Feedback data
      supabase
        .from('chatbot_feedback')
        .select('*')
        .gte('created_at', timeFilterISO)
    ]);

    // Check for errors
    if (conversationsResult.error) throw conversationsResult.error;
    if (performanceResult.error) throw performanceResult.error;
    if (errorsResult.error) throw errorsResult.error;
    if (feedbackResult.error) throw feedbackResult.error;

    const conversations = conversationsResult.data || [];
    const performance = performanceResult.data || [];
    const errors = errorsResult.data || [];
    const feedback = feedbackResult.data || [];

    // Analyze conversations
    const conversationAnalytics = analyzeConversations(conversations);
    
    // Analyze performance
    const performanceAnalytics = analyzePerformance(performance);
    
    // Analyze errors
    const errorAnalytics = analyzeErrors(errors);
    
    // Analyze feedback
    const feedbackAnalytics = analyzeFeedback(feedback);
    
    // Generate summary
    const summary = generateSummary(conversations, performance, errors, feedback);

    return NextResponse.json({
      success: true,
      data: {
        time_range: timeRange,
        conversations: conversationAnalytics,
        performance: performanceAnalytics,
        errors: errorAnalytics,
        feedback: feedbackAnalytics,
        summary: summary,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy dữ liệu analytics',
      error: error.message || 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

function analyzeConversations(conversations: any[]) {
  const total = conversations.length;
  const avgMessages = total > 0 ? conversations.reduce((sum, c) => sum + (c.message_count || 0), 0) / total : 0;
  const bookingConversions = conversations.filter(c => c.conversion_to_booking).length;
  const conversionRate = total > 0 ? (bookingConversions / total) * 100 : 0;

  const severityBreakdown = conversations.reduce((acc, c) => {
    const severity = c.severity_level || 'unknown';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const avgResponseTime = total > 0 ? conversations.reduce((sum, c) => sum + (c.response_time_avg || 0), 0) / total : 0;

  return {
    total_conversations: total,
    avg_messages_per_conversation: Math.round(avgMessages * 100) / 100,
    booking_conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_response_time: Math.round(avgResponseTime),
    severity_breakdown: severityBreakdown,
    top_symptoms: getTopSymptoms(conversations)
  };
}

function analyzePerformance(performance: any[]) {
  const total = performance.length;
  const avgResponseTime = total > 0 ? performance.reduce((sum, p) => sum + (p.response_time || 0), 0) / total : 0;
  const successfulRequests = performance.filter(p => p.status_code < 400).length;
  const successRate = total > 0 ? (successfulRequests / total) * 100 : 0;

  const endpointStats = performance.reduce((acc, p) => {
    const endpoint = p.endpoint || 'unknown';
    if (!acc[endpoint]) {
      acc[endpoint] = { count: 0, total_time: 0, errors: 0 };
    }
    acc[endpoint].count++;
    acc[endpoint].total_time += p.response_time || 0;
    if (p.status_code >= 400) acc[endpoint].errors++;
    return acc;
  }, {});

  // Calculate average response time per endpoint
  Object.keys(endpointStats).forEach(endpoint => {
    const stats = endpointStats[endpoint];
    stats.avg_response_time = stats.count > 0 ? Math.round(stats.total_time / stats.count) : 0;
    stats.error_rate = stats.count > 0 ? Math.round((stats.errors / stats.count) * 100 * 100) / 100 : 0;
  });

  return {
    total_requests: total,
    avg_response_time: Math.round(avgResponseTime),
    success_rate: Math.round(successRate * 100) / 100,
    error_rate: Math.round((100 - successRate) * 100) / 100,
    endpoint_stats: endpointStats
  };
}

function analyzeErrors(errors: any[]) {
  const total = errors.length;
  
  const errorTypes = errors.reduce((acc, e) => {
    const type = e.error_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const endpointErrors = errors.reduce((acc, e) => {
    const endpoint = e.endpoint || 'unknown';
    acc[endpoint] = (acc[endpoint] || 0) + 1;
    return acc;
  }, {});

  const mostCommonError = Object.keys(errorTypes).reduce((a, b) => 
    errorTypes[a] > errorTypes[b] ? a : b, '') || 'none';

  return {
    total_errors: total,
    error_types: errorTypes,
    endpoint_errors: endpointErrors,
    most_common_error: mostCommonError,
    recent_errors: errors.slice(0, 10) // Latest 10 errors
  };
}

function analyzeFeedback(feedback: any[]) {
  const total = feedback.length;
  const positive = feedback.filter(f => f.feedback_type === 'helpful').length;
  const negative = feedback.filter(f => f.feedback_type === 'not_helpful').length;
  const satisfactionRate = total > 0 ? (positive / total) * 100 : 0;

  return {
    total_feedback: total,
    positive_feedback: positive,
    negative_feedback: negative,
    satisfaction_rate: Math.round(satisfactionRate * 100) / 100,
    recent_feedback: feedback.slice(0, 10) // Latest 10 feedback
  };
}

function generateSummary(conversations: any[], performance: any[], errors: any[], feedback: any[]) {
  const totalInteractions = conversations.length + performance.length;
  const healthScore = calculateHealthScore(conversations, performance, errors, feedback);
  
  let status = 'excellent';
  if (healthScore < 60) status = 'needs_attention';
  else if (healthScore < 80) status = 'good';

  const recommendations = generateRecommendations(conversations, performance, errors, feedback);

  return {
    total_interactions: totalInteractions,
    health_score: healthScore,
    status: status,
    recommendations: recommendations,
    key_metrics: {
      avg_response_time: performance.length > 0 ? Math.round(performance.reduce((sum, p) => sum + (p.response_time || 0), 0) / performance.length) : 0,
      error_rate: performance.length > 0 ? Math.round((errors.length / performance.length) * 100 * 100) / 100 : 0,
      satisfaction_rate: feedback.length > 0 ? Math.round((feedback.filter(f => f.feedback_type === 'helpful').length / feedback.length) * 100 * 100) / 100 : 0
    }
  };
}

function calculateHealthScore(conversations: any[], performance: any[], errors: any[], feedback: any[]): number {
  let score = 100;

  // Deduct for errors
  const errorRate = performance.length > 0 ? errors.length / performance.length : 0;
  score -= errorRate * 50;

  // Deduct for slow response times
  const avgResponseTime = performance.length > 0 ? performance.reduce((sum, p) => sum + (p.response_time || 0), 0) / performance.length : 0;
  if (avgResponseTime > 2000) score -= 20;
  else if (avgResponseTime > 1000) score -= 10;

  // Deduct for low satisfaction
  const satisfactionRate = feedback.length > 0 ? feedback.filter(f => f.feedback_type === 'helpful').length / feedback.length : 1;
  if (satisfactionRate < 0.7) score -= 15;

  // Deduct for low conversion rate
  const conversionRate = conversations.length > 0 ? conversations.filter(c => c.conversion_to_booking).length / conversations.length : 0;
  if (conversionRate < 0.1) score -= 10;

  return Math.max(0, Math.round(score));
}

function generateRecommendations(conversations: any[], performance: any[], errors: any[], feedback: any[]): string[] {
  const recommendations: string[] = [];

  // Performance recommendations
  const avgResponseTime = performance.length > 0 ? performance.reduce((sum, p) => sum + (p.response_time || 0), 0) / performance.length : 0;
  if (avgResponseTime > 2000) {
    recommendations.push('Tối ưu hóa thời gian phản hồi API (hiện tại > 2s)');
  }

  // Error recommendations
  if (errors.length > 0) {
    recommendations.push(`Xem xét và sửa ${errors.length} lỗi hệ thống`);
  }

  // Satisfaction recommendations
  const satisfactionRate = feedback.length > 0 ? feedback.filter(f => f.feedback_type === 'helpful').length / feedback.length : 1;
  if (satisfactionRate < 0.7) {
    recommendations.push('Cải thiện chất lượng phản hồi AI (satisfaction < 70%)');
  }

  // Conversion recommendations
  const conversionRate = conversations.length > 0 ? conversations.filter(c => c.conversion_to_booking).length / conversations.length : 0;
  if (conversionRate < 0.1) {
    recommendations.push('Tối ưu hóa flow đặt lịch để tăng conversion rate');
  }

  if (recommendations.length === 0) {
    recommendations.push('Hệ thống đang hoạt động tốt!');
  }

  return recommendations;
}

function getTopSymptoms(conversations: any[]): any[] {
  const symptomCount: { [key: string]: number } = {};
  
  conversations.forEach(conv => {
    if (conv.symptoms_detected && Array.isArray(conv.symptoms_detected)) {
      conv.symptoms_detected.forEach((symptom: string) => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    }
  });

  return Object.entries(symptomCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([symptom, count]) => ({ symptom, count }));
}
