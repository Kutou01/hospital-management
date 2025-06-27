import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid doctor ID',
      message: 'ID bác sĩ không hợp lệ.'
    });
  }

  if (req.method === 'GET') {
    return handleGetDoctor(req, res, id);
  } else if (req.method === 'PUT') {
    return handleUpdateDoctor(req, res, id);
  } else if (req.method === 'DELETE') {
    return handleDeleteDoctor(req, res, id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetDoctor(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Get doctor with related data
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        profile:profiles!doctors_profile_id_fkey(
          id,
          email,
          full_name,
          phone_number,
          is_active,
          created_at
        ),
        department:departments!doctors_department_id_fkey(
          department_id,
          name,
          description,
          location
        )
      `)
      .eq('doctor_id', id)
      .single();

    if (doctorError) {
      console.error('Doctor fetch error:', doctorError);
      return res.status(404).json({
        error: 'Doctor not found',
        message: `Bác sĩ với ID ${id} không tồn tại.`
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
      message: `Retrieved doctor ${id}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải thông tin bác sĩ.'
    });
  }
}

async function handleUpdateDoctor(req: NextApiRequest, res: NextApiResponse, id: string) {
  const updateData = req.body;

  try {
    // Remove fields that shouldn't be updated directly
    const { doctor_id, profile_id, created_at, ...allowedUpdates } = updateData;

    // Update doctor record
    const { data: updatedDoctor, error: updateError } = await supabaseAdmin
      .from('doctors')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('doctor_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update doctor',
        message: 'Không thể cập nhật thông tin bác sĩ.'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedDoctor,
      message: `Doctor ${id} updated successfully`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi cập nhật thông tin bác sĩ.'
    });
  }
}

async function handleDeleteDoctor(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Soft delete by setting is_active to false
    const { data: deletedDoctor, error: deleteError } = await supabaseAdmin
      .from('doctors')
      .update({
        is_active: false,
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('doctor_id', id)
      .select()
      .single();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete doctor',
        message: 'Không thể xóa bác sĩ.'
      });
    }

    return res.status(200).json({
      success: true,
      data: deletedDoctor,
      message: `Doctor ${id} deactivated successfully`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi xóa bác sĩ.'
    });
  }
}
