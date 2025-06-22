import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Missing Supabase environment variables');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Tạo client với service role key và header bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            global: {
                headers: {
                    'x-supabase-custom': 'bypass-rls'
                }
            }
        });

        // Đăng nhập với service role key
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('❌ Admin login error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        if (!data.user || !data.session) {
            return NextResponse.json(
                { error: 'Đăng nhập thất bại' },
                { status: 401 }
            );
        }

        // Lấy thông tin profile của người dùng
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile fetch error:', profileError);
            // Không return lỗi, vẫn trả về user và session
        }

        // Trả về thông tin session và user
        return NextResponse.json({
            session: data.session,
            user: profileData || data.user,
        });
    } catch (error: any) {
        console.error('❌ Unexpected error during admin login:', error);
        return NextResponse.json(
            { error: error.message || 'Đã xảy ra lỗi không mong muốn' },
            { status: 500 }
        );
    }
} 