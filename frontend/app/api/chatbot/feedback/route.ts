import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id, user_id, rating, feedback_text, conversation_id } = body;

    // Validate input
    if (!message_id || !rating) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields (message_id, rating)',
        error: 'INVALID_INPUT'
      }, { status: 400 });
    }

    // Map rating to feedback_type for existing database structure
    let feedback_type: string;
    if (rating === 'positive') {
      feedback_type = 'helpful';
    } else if (rating === 'negative') {
      feedback_type = 'not_helpful';
    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid rating value (must be positive or negative)',
        error: 'INVALID_RATING'
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Store feedback in database using existing structure
    const { data, error } = await supabase
      .from('chatbot_feedback')
      .insert([{
        conversation_id: conversation_id || null,
        feedback_type: feedback_type,
        user_comment: feedback_text || null,
        suggested_answer: null
      }]);

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to store feedback');
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback_id: data?.[0]?.id }
    });

  } catch (error: any) {
    console.error('Feedback API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi phản hồi',
      error: error.message || 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

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

    // Get feedback statistics
    const { data: feedbacks, error } = await supabase
      .from('chatbot_feedback')
      .select('*')
      .gte('created_at', timeFilter.toISOString());

    if (error) {
      throw new Error('Failed to fetch feedback data');
    }

    // Calculate statistics using existing database structure
    const total = feedbacks?.length || 0;
    const positive = feedbacks?.filter(f => f.feedback_type === 'helpful').length || 0;
    const negative = feedbacks?.filter(f => f.feedback_type === 'not_helpful').length || 0;
    const satisfactionRate = total > 0 ? (positive / total) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_feedback: total,
        positive_feedback: positive,
        negative_feedback: negative,
        satisfaction_rate: Math.round(satisfactionRate * 100) / 100,
        time_range: timeRange,
        feedbacks: feedbacks?.slice(0, 50) // Return latest 50 feedbacks
      }
    });

  } catch (error: any) {
    console.error('Feedback GET API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy dữ liệu phản hồi',
      error: error.message || 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
