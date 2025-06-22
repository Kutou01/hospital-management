'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FixProfilePage() {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
    });

    const supabase = createClient();
    const router = useRouter();

    // Kiểm tra thông tin người dùng khi trang tải
    useEffect(() => {
        checkUserProfile();
    }, []);

    const checkUserProfile = async () => {
        setChecking(true);
        try {
            // Kiểm tra session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                throw new Error(`Lỗi session: ${sessionError.message}`);
            }

            if (!session) {
                router.push('/auth/login?redirect=/patient/payment-history');
                return;
            }

            // Lấy thông tin profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                if (profileError.code === 'PGRST116') {
                    // Profile không tồn tại, tạo mới
                    setUserData({
                        id: session.user.id,
                        email: session.user.email,
                        hasProfile: false,
                        hasPatient: false
                    });

                    setFormData({
                        fullName: session.user.email?.split('@')[0] || '',
                        phone: '',
                    });

                    return;
                }
                throw profileError;
            }

            // Kiểm tra hồ sơ bệnh nhân
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('profile_id', session.user.id)
                .single();

            setUserData({
                id: session.user.id,
                email: session.user.email,
                profile: profile,
                hasProfile: !!profile,
                patient: patient,
                hasPatient: !!patient
            });

            setFormData({
                fullName: profile?.full_name || session.user.email?.split('@')[0] || '',
                phone: profile?.phone_number || '',
            });

        } catch (err: any) {
            console.error('Error checking profile:', err);
            setError(err.message || 'Có lỗi xảy ra khi kiểm tra hồ sơ');
        } finally {
            setChecking(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const createOrUpdateProfile = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (!userData) {
                throw new Error('Không có thông tin người dùng');
            }

            // 1. Tạo hoặc cập nhật profile
            if (!userData.hasProfile) {
                // Tạo mới profile
                const { data: newProfile, error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userData.id,
                        full_name: formData.fullName,
                        phone_number: formData.phone,
                        email: userData.email,
                        role: 'patient'
                    }])
                    .select()
                    .single();

                if (profileError) throw profileError;
                userData.profile = newProfile;
                userData.hasProfile = true;

                setSuccess('Đã tạo hồ sơ người dùng thành công');
            } else {
                // Cập nhật profile
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.fullName,
                        phone_number: formData.phone
                    })
                    .eq('id', userData.id);

                if (updateError) throw updateError;

                setSuccess('Đã cập nhật hồ sơ người dùng thành công');
            }

            // 2. Tạo hồ sơ bệnh nhân nếu chưa có
            if (!userData.hasPatient) {
                // Tạo ID bệnh nhân mới
                const timestamp = Date.now();
                const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const patientId = `PAT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${randomSuffix}`;

                const { data: newPatient, error: patientError } = await supabase
                    .from('patients')
                    .insert([{
                        patient_id: patientId,
                        full_name: formData.fullName,
                        profile_id: userData.id,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (patientError) throw patientError;

                userData.patient = newPatient;
                userData.hasPatient = true;

                setSuccess('Đã tạo hồ sơ bệnh nhân thành công');
            }

            // Đợi 1 giây rồi chuyển hướng
            setTimeout(() => {
                router.push('/patient/payment-history');
            }, 1000);

        } catch (err: any) {
            console.error('Error creating/updating profile:', err);
            setError(err.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Đang kiểm tra thông tin hồ sơ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>Cập nhật hồ sơ bệnh nhân</CardTitle>
                    <CardDescription>
                        Cập nhật thông tin của bạn để xem lịch sử thanh toán
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Lỗi</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Thành công</AlertTitle>
                            <AlertDescription className="text-green-700">{success}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Nhập họ và tên của bạn"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Nhập số điện thoại của bạn"
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h4 className="text-blue-800 font-medium mb-2">Thông tin tài khoản</h4>
                        <p className="text-sm text-blue-700">Email: {userData?.email}</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Trạng thái hồ sơ: {userData?.hasProfile ? 'Đã có hồ sơ người dùng' : 'Chưa có hồ sơ người dùng'}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            Hồ sơ bệnh nhân: {userData?.hasPatient ? `Đã có (${userData.patient.patient_id})` : 'Chưa có hồ sơ bệnh nhân'}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/patient/payment-history')}
                    >
                        Quay lại
                    </Button>
                    <Button
                        onClick={createOrUpdateProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'Cập nhật hồ sơ'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 