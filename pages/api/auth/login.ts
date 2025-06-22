import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Sử dụng service role key để bỏ qua RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseServiceKey) {
            return res.status(500).json({ error: 'Service key not configured' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Đăng nhập với service role
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Auth API error:', error);
            return res.status(401).json({ error: error.message });
        }

        // Trả về thông tin người dùng và session
        return res.status(200).json({
            user: data.user,
            session: data.session
        });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message });
    }
} 