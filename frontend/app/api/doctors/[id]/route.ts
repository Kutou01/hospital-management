import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorId = params.id;
    console.log('Fetching doctor by ID:', doctorId);

    const { data: doctor, error } = await supabase
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
      .eq('doctor_id', doctorId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching doctor:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: 'Không tìm thấy bác sĩ'
        }, { status: 404 });
      }
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedDoctor = {
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
      patients: Math.floor(Math.random() * 500) + 100,
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
    };

    return NextResponse.json({
      success: true,
      data: transformedDoctor,
      message: 'Doctor retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi lấy thông tin bác sĩ',
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorId = params.id;
    const body = await request.json();
    console.log('Updating doctor:', doctorId, body);

    const updateData = {
      full_name: body.full_name,
      specialty: body.specialty,
      qualification: body.qualification,
      department_id: body.department_id,
      license_number: body.license_number,
      gender: body.gender,
      bio: body.bio,
      experience_years: body.experience_years,
      consultation_fee: body.consultation_fee,
      address: body.address,
      languages_spoken: body.languages_spoken,
      availability_status: body.availability_status,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: updatedDoctor, error } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('doctor_id', doctorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedDoctor,
      message: 'Doctor updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating doctor:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin bác sĩ',
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorId = params.id;
    console.log('Deleting doctor:', doctorId);

    // Soft delete by updating status
    const { data: deletedDoctor, error } = await supabase
      .from('doctors')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('doctor_id', doctorId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: deletedDoctor,
      message: 'Doctor deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi xóa bác sĩ',
      error: error.message
    }, { status: 500 });
  }
}
