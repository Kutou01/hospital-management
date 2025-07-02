import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('Fetching doctors with params:', { specialty, department, search, page, limit });

    // Build query
    let query = supabase
      .from('doctors')
      .select(`
        doctor_id,
        specialty,
        specializations,
        qualification,
        department_id,
        license_number,
        gender,
        bio,
        experience_years,
        consultation_fee,
        address,
        languages_spoken,
        availability_status,
        rating,
        total_reviews,
        status,
        created_at,
        updated_at,
        profiles (
          id,
          full_name,
          phone_number,
          email,
          date_of_birth
        ),
        departments (
          department_id,
          department_name,
          description
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (specialty && specialty !== 'all') {
      query = query.eq('specialty', specialty);
    }

    if (department && department !== 'all') {
      query = query.eq('department_id', department);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,specialty.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: doctors, error, count } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedDoctors = doctors?.map(doctor => ({
      doctor_id: doctor.doctor_id,
      id: doctor.doctor_id,
      full_name: doctor.full_name || doctor.profiles?.full_name || 'Unknown Doctor',
      name: doctor.full_name || doctor.profiles?.full_name || 'Unknown Doctor',
      specialty: doctor.specialty || 'General Medicine',
      specialization: doctor.specialty || 'General Medicine',
      qualification: doctor.qualification || 'MD',
      title: doctor.qualification || 'Doctor',
      department_id: doctor.department_id,
      license_number: doctor.license_number,
      gender: doctor.gender,
      bio: doctor.bio,
      description: doctor.bio,
      experience_years: doctor.experience_years || 0,
      experience: doctor.experience_years ? `${doctor.experience_years} năm` : 'N/A',
      consultation_fee: doctor.consultation_fee || 200000,
      address: doctor.address,
      languages_spoken: doctor.languages_spoken || [],
      availability_status: doctor.availability_status || 'available',
      rating: doctor.rating || 4.5,
      average_rating: doctor.rating || 4.5,
      total_reviews: doctor.total_reviews || 0,
      reviews: doctor.total_reviews || 0,
      patients: Math.floor(Math.random() * 500) + 100, // Mock data for patients count
      total_patients: Math.floor(Math.random() * 500) + 100,
      status: doctor.status,
      created_at: doctor.created_at,
      updated_at: doctor.updated_at,
      // Profile information
      phone: doctor.profiles?.phone_number,
      email: doctor.profiles?.email,
      date_of_birth: doctor.profiles?.date_of_birth,
      // Department information
      departments: doctor.departments ? {
        department_id: doctor.departments.department_id,
        name: doctor.departments.department_name,
        description: doctor.departments.description
      } : null,
      // Additional fields for compatibility
      education: doctor.qualification ? [doctor.qualification] : [],
      certifications: [],
      awards: [],
      languages: doctor.languages_spoken || ['Tiếng Việt'],
      workingHours: {
        monday: '08:00-17:00',
        tuesday: '08:00-17:00',
        wednesday: '08:00-17:00',
        thursday: '08:00-17:00',
        friday: '08:00-17:00',
        saturday: '08:00-12:00',
        sunday: 'Closed'
      }
    })) || [];

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    console.log(`Found ${transformedDoctors.length} doctors out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: transformedDoctors,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      message: 'Doctors retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error in doctors API:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ',
      error: error.message,
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating new doctor:', body);

    // Validate required fields
    const requiredFields = ['full_name', 'specialty', 'department_id'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          message: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Generate doctor ID
    const doctorId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const doctorData = {
      doctor_id: doctorId,
      full_name: body.full_name,
      specialty: body.specialty,
      qualification: body.qualification || 'MD',
      department_id: body.department_id,
      license_number: body.license_number || `LIC-${Date.now()}`,
      gender: body.gender || 'other',
      bio: body.bio || '',
      experience_years: body.experience_years || 0,
      consultation_fee: body.consultation_fee || 200000,
      address: body.address || {},
      languages_spoken: body.languages_spoken || ['Tiếng Việt'],
      availability_status: body.availability_status || 'available',
      rating: 4.5,
      total_reviews: 0,
      status: 'active'
    };

    const { data: newDoctor, error } = await supabase
      .from('doctors')
      .insert(doctorData)
      .select()
      .single();

    if (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: newDoctor,
      message: 'Doctor created successfully'
    });

  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi tạo bác sĩ mới',
      error: error.message
    }, { status: 500 });
  }
}
