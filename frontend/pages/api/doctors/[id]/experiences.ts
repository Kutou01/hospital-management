import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { type } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid doctor ID',
      message: 'ID bác sĩ không hợp lệ.'
    });
  }

  try {
    // Build query for work experiences
    let query = supabaseAdmin
      .from('doctor_work_experiences')
      .select('*')
      .eq('doctor_id', id)
      .order('start_date', { ascending: false });

    // Filter by type if provided
    if (type && typeof type === 'string') {
      query = query.eq('experience_type', type);
    }

    const { data: experiences, error: experiencesError } = await query;

    if (experiencesError) {
      console.error('Experiences fetch error:', experiencesError);
      return res.status(500).json({
        error: 'Failed to fetch experiences',
        message: 'Không thể tải kinh nghiệm làm việc của bác sĩ.'
      });
    }

    // Calculate total experience
    let totalExperienceMonths = 0;
    const currentDate = new Date();
    
    (experiences || []).forEach(exp => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date ? new Date(exp.end_date) : currentDate;
      
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      
      if (monthsDiff > 0) {
        totalExperienceMonths += monthsDiff;
      }
    });

    const totalExperienceYears = totalExperienceMonths / 12;

    // Group experiences by type
    const experiencesByType = (experiences || []).reduce((acc, exp) => {
      const type = exp.experience_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(exp);
      return acc;
    }, {} as Record<string, any[]>);

    // Transform experience data
    const transformedExperiences = (experiences || []).map(exp => ({
      id: exp.id,
      doctor_id: exp.doctor_id,
      institution_name: exp.institution_name,
      position: exp.position,
      department: exp.department,
      start_date: exp.start_date,
      end_date: exp.end_date,
      is_current: exp.is_current,
      description: exp.description,
      experience_type: exp.experience_type,
      location: exp.location,
      achievements: exp.achievements,
      created_at: exp.created_at,
      updated_at: exp.updated_at,
      doctor: exp.doctor
    }));

    const responseData = {
      experiences: transformedExperiences,
      summary: {
        total_experiences: transformedExperiences.length,
        total_experience_years: Math.round(totalExperienceYears * 10) / 10,
        total_experience_months: totalExperienceMonths,
        current_positions: transformedExperiences.filter(exp => exp.is_current).length,
        experience_types: Object.keys(experiencesByType),
        by_type: experiencesByType
      }
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: `Retrieved ${transformedExperiences.length} work experiences for doctor ${id}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải kinh nghiệm làm việc.'
    });
  }
}
