'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AuthDebugger() {
    const [authInfo, setAuthInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const checkAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            // Kiểm tra session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                throw new Error(`Lỗi session: ${sessionError.message}`);
            }

            if (!session) {
                setAuthInfo({
                    isLoggedIn: false,
                    message: 'Không có phiên đăng nhập.'
                });
                return;
            }

            // Gọi API kiểm tra auth
            const response = await fetch('/api/patient/check-auth', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            const data = await response.json();
            setAuthInfo({
                ...data,
                session: {
                    userId: session.user.id,
                    email: session.user.email,
                    hasAccessToken: !!session.access_token,
                    accessTokenLength: session.access_token?.length || 0
                }
            });

        } catch (err: any) {
            console.error('Error checking auth:', err);
            setError(err.message || 'Có lỗi xảy ra khi kiểm tra xác thực');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Kiểm tra xác thực người dùng</CardTitle>
                    <CardDescription>
                        Công cụ debug để xác định vấn đề với xác thực và hồ sơ bệnh nhân
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button
                            onClick={checkAuth}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {loading ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
                        </Button>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Lỗi</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {authInfo && (
                            <div className="mt-4 space-y-4">
                                <div className="border rounded-md p-4 bg-muted">
                                    <h3 className="font-medium mb-2">Thông tin đăng nhập</h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-semibold">Trạng thái đăng nhập:</span>{' '}
                                            {authInfo.auth?.isLoggedIn || authInfo.session?.userId ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" /> Đã đăng nhập
                                                </span>
                                            ) : (
                                                <span className="text-red-600">Chưa đăng nhập</span>
                                            )}
                                        </p>
                                        {authInfo.session?.userId && (
                                            <>
                                                <p><span className="font-semibold">User ID:</span> {authInfo.session.userId}</p>
                                                <p><span className="font-semibold">Email:</span> {authInfo.session.email}</p>
                                                <p>
                                                    <span className="font-semibold">Access Token:</span>{' '}
                                                    {authInfo.session.hasAccessToken ? (
                                                        <span className="text-green-600">Có (độ dài: {authInfo.session.accessTokenLength})</span>
                                                    ) : (
                                                        <span className="text-red-600">Không có</span>
                                                    )}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {authInfo.auth && (
                                    <div className="border rounded-md p-4 bg-muted">
                                        <h3 className="font-medium mb-2">Thông tin hồ sơ</h3>
                                        <div className="space-y-2 text-sm">
                                            <p>
                                                <span className="font-semibold">Có hồ sơ người dùng:</span>{' '}
                                                {authInfo.auth.hasProfile ? (
                                                    <span className="text-green-600">Có</span>
                                                ) : (
                                                    <span className="text-red-600">Không</span>
                                                )}
                                            </p>
                                            {authInfo.auth.hasProfile && (
                                                <>
                                                    <p><span className="font-semibold">Họ tên:</span> {authInfo.auth.fullName || 'Chưa cập nhật'}</p>
                                                    <p><span className="font-semibold">Vai trò:</span> {authInfo.auth.role || 'Chưa xác định'}</p>
                                                    <p>
                                                        <span className="font-semibold">Có hồ sơ bệnh nhân:</span>{' '}
                                                        {authInfo.auth.hasPatientProfile ? (
                                                            <span className="text-green-600">Có</span>
                                                        ) : (
                                                            <span className="text-red-600">Không</span>
                                                        )}
                                                    </p>
                                                    {authInfo.auth.hasPatientProfile && (
                                                        <p><span className="font-semibold">Mã bệnh nhân:</span> {authInfo.auth.patientId}</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="border rounded-md p-4 bg-yellow-50">
                                    <h3 className="font-medium mb-2 text-amber-800">Hướng dẫn khắc phục</h3>
                                    <div className="space-y-2 text-sm text-amber-700">
                                        {!authInfo.auth?.isLoggedIn && !authInfo.session?.userId && (
                                            <p>Bạn chưa đăng nhập. Vui lòng đăng nhập để xem lịch sử thanh toán.</p>
                                        )}

                                        {(authInfo.auth?.isLoggedIn || authInfo.session?.userId) && !authInfo.auth?.hasProfile && (
                                            <p>Tài khoản của bạn chưa có hồ sơ người dùng. Vui lòng cập nhật hồ sơ.</p>
                                        )}

                                        {authInfo.auth?.hasProfile && !authInfo.auth?.hasPatientProfile && (
                                            <p>Tài khoản của bạn chưa có hồ sơ bệnh nhân. Vui lòng tạo hồ sơ bệnh nhân.</p>
                                        )}

                                        {authInfo.auth?.hasProfile && authInfo.auth?.hasPatientProfile && (
                                            <p>Tài khoản của bạn đã có đầy đủ thông tin. Nếu vẫn gặp lỗi, vui lòng đăng xuất và đăng nhập lại.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 