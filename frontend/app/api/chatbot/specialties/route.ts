import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Fetching specialties from public.specialties');
    
    const { data, error } = await supabase
      .from('specialties')
      .select('specialty_id, specialty_name, specialty_code, description')
      .eq('is_active', true)
      .order('specialty_name');

    if (error) {
      console.error('Error fetching specialties:', error);
      throw error;
    }

    // Transform data để có name_vi field cho compatibility với frontend
    const transformedData = data?.map(item => ({
      specialty_id: item.specialty_id,
      name_vi: item.specialty_name,
      name: item.specialty_name,
      description: item.description || `Chuyên khoa ${item.specialty_name}`
    })) || [];

    console.log(`Specialties found: ${transformedData.length}`);

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: 'Specialties retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching specialties:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi lấy danh sách chuyên khoa',
      error: error.message
    }, { status: 500 });
  }
}
