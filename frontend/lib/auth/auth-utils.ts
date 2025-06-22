import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export type UserProfile = {
    id: string;
    email?: string;
    full_name?: string;
    phone?: string;
    role?: string;
};

/**
 * Lấy thông tin hồ sơ người dùng từ supabase session
 * @returns UserProfile hoặc null nếu không tìm thấy
 */
export async function getProfile(): Promise<UserProfile | null> {
    try {
        const supabase = await createClient();
        const cookieStore = cookies();

        // Lấy session từ cookie
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('❌ [Auth Utils] No session found');
            return null;
        }

        // Lấy thông tin profile từ bảng profiles
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            console.error('❌ [Auth Utils] Error fetching profile:', error);
            return null;
        }

        return {
            id: profile.id,
            email: profile.email || session.user.email,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role
        };

    } catch (error) {
        console.error('❌ [Auth Utils] Error getting user profile:', error);
        return null;
    }
}

/**
 * Kiểm tra người dùng hiện tại có phải là admin không
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
    const profile = await getProfile();
    return profile?.role === 'admin';
} 