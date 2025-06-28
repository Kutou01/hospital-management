import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetDoctors(req, res);
  } else if (req.method === 'POST') {
    return handleCreateDoctor(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetDoctors(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '20', search, department, specialty, status } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabaseAdmin
      .from('doctors')
      .select(`
        *,
        profile:profiles!doctors_profile_id_fkey(
          id,
          email,
          full_name,
          phone_number,
          is_active
        ),
        department:departments!doctors_department_id_fkey(
          department_id,
          name,
          description
        )
      `, { count: 'exact' });

    // Apply filters
    if (search && typeof search === 'string') {
      query = query.or(`full_name.ilike.%${search}%, specialty.ilike.%${search}%`);
    }

    if (department && typeof department === 'string') {
      query = query.eq('department_id', department);
    }

    if (specialty && typeof specialty === 'string') {
      query = query.eq('specialty', specialty);
    }

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    const { data: doctors, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Doctors fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch doctors',
        message: 'Không thể tải danh sách bác sĩ.'
      });
    }

    const totalDoctors = count || 0;
    const totalPages = Math.ceil(totalDoctors / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        data: doctors || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalDoctors,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      },
      message: `Retrieved ${(doctors || []).length} doctors`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải danh sách bác sĩ.'
    });
  }
}

async function handleCreateDoctor(req: NextApiRequest, res: NextApiResponse) {
  const {
    profile_id,
    full_name,
    date_of_birth,
    specialty,
    qualification,
    department_id,
    license_number,
    gender,
    bio,
    experience_years,
    consultation_fee,
    languages_spoken,
    phone_number,
    email
  } = req.body;

  // Validation
  if (!full_name || !specialty || !department_id || !license_number) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Vui lòng điền đầy đủ thông tin bắt buộc.'
    });
  }

  try {
    // Generate doctor ID
    const currentDate = new Date();
    const yearMonth = currentDate.toISOString().slice(0, 7).replace('-', '');
    
    // Get the next sequence number for this department and month
    const { data: existingDoctors, error: countError } = await supabaseAdmin
      .from('doctors')
      .select('doctor_id')
      .like('doctor_id', `${department_id}-DOC-${yearMonth}-%`)
      .order('doctor_id', { ascending: false })
      .limit(1);

    if (countError) {
      console.error('Count error:', countError);
    }

    let sequence = 1;
    if (existingDoctors && existingDoctors.length > 0) {
      const lastId = existingDoctors[0].doctor_id;
      const lastSequence = parseInt(lastId.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    const doctorId = `${department_id}-DOC-${yearMonth}-${sequence.toString().padStart(3, '0')}`;

    // Create doctor record
    const doctorData = {
      doctor_id: doctorId,
      profile_id: profile_id || null,
      full_name,
      date_of_birth,
      specialty,
      qualification,
      department_id,
      license_number,
      gender: gender || 'other',
      bio: bio || null,
      experience_years: experience_years || 0,
      consultation_fee: consultation_fee || 0,
      languages_spoken: languages_spoken || ['Vietnamese'],
      phone_number: phone_number || null,
      email: email || null,
      status: 'active',
      is_active: true,
      rating: 0,
      total_reviews: 0,
      availability_status: 'available'
    };

    const { data: newDoctor, error: insertError } = await supabaseAdmin
      .from('doctors')
      .insert([doctorData])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({
        error: 'Failed to create doctor',
        message: 'Không thể tạo hồ sơ bác sĩ.'
      });
    }

    return res.status(201).json({
      success: true,
      data: newDoctor,
      message: `Doctor created successfully with ID: ${doctorId}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tạo hồ sơ bác sĩ.'
    });
  }
}
