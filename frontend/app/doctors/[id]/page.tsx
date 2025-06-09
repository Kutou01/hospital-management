'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Star, Calendar, Award, Clock, Users, Phone, Mail, MapPin,
    GraduationCap, Stethoscope, Heart, Shield, ArrowLeft,
    CheckCircle, Globe, BookOpen, Trophy, FileText, CreditCard, ArrowRight
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { supabaseAuth } from "@/lib/auth/supabase-auth";
import Swal from 'sweetalert2';
import { doctorsApi } from "@/lib/api/doctors";
import { paymentApi } from "@/lib/api/payment";
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context';

interface DoctorDisplay {
    id: number;
    name: string;
    specialty: string;
    title: string;
    experience: string;
    rating: number;
    reviews: number;
    patients: number;
    description: string;
    education: string[];
    languages: string[];
    schedule: string[];
    location: string;
    phone: string;
    email: string;
    achievements: string[];
    specialties: string[];
    consultationFee: string;
    nextAvailable: string;
}

const FALLBACK_DOCTORS: DoctorDisplay[] = [
    {
        id: 1,
        name: 'Dr. Nguyễn Văn An',
        specialty: 'Tim mạch',
        title: 'Trưởng khoa Tim mạch',
        experience: '15 năm',
        rating: 4.9,
        reviews: 285,
        patients: 1200,
        description: 'Bác sĩ chuyên khoa Tim mạch với hơn 15 năm kinh nghiệm trong điều trị các bệnh lý tim mạch phức tạp. Thành thạo các kỹ thuật can thiệp tim mạch hiện đại, phẫu thuật bypass và điều trị rối loạn nhịp tim.',
        education: [
            'Tiến sĩ Y khoa - Đại học Y Hà Nội (2005)',
            'Chứng chỉ Tim mạch can thiệp - Bệnh viện Bachmai (2008)',
            'Fellowship Cardiology - Singapore General Hospital (2010)'
        ],
        languages: ['Tiếng Việt', 'English', '中文'],
        schedule: ['Thứ 2: 8:00-12:00', 'Thứ 4: 14:00-17:00', 'Thứ 6: 8:00-12:00'],
        location: 'Phòng 201 - Tầng 2 - Khoa Tim mạch',
        phone: '+84-123-456-789',
        email: 'dr.an@hospital.vn',
        achievements: ['Giải thưởng Bác sĩ xuất sắc 2023', 'Hơn 500 ca phẫu thuật thành công'],
        specialties: ['Phẫu thuật tim', 'Can thiệp mạch vành', 'Điều trị rối loạn nhịp tim'],
        consultationFee: '500.000 VNĐ',
        nextAvailable: 'Thứ 2, 08:30'
    },
    {
        id: 2,
        name: 'Dr. Trần Thị Bình',
        specialty: 'Nhi khoa',
        title: 'Phó Trưởng khoa Nhi',
        experience: '12 năm',
        rating: 4.8,
        reviews: 420,
        patients: 980,
        description: 'Chuyên gia Nhi khoa với kinh nghiệm phong phú trong chăm sóc sức khỏe trẻ em từ sơ sinh đến 18 tuổi. Đặc biệt giỏi trong điều trị bệnh lý hô hấp, tiêu hóa và phát triển ở trẻ.',
        education: [
            'Thạc sĩ Y khoa - Đại học Y Dược TP.HCM (2008)',
            'Chuyên khoa Nhi cấp I (2010)',
            'Chuyên khoa Nhi cấp II (2015)'
        ],
        languages: ['Tiếng Việt', 'English', 'Français'],
        schedule: ['Thứ 2-6: 7:30-11:30', 'Thứ 7: 8:00-12:00'],
        location: 'Phòng 105 - Tầng 1 - Khoa Nhi',
        phone: '+84-123-456-790',
        email: 'dr.binh@hospital.vn',
        achievements: ['Top 10 Bác sĩ Nhi yêu thích nhất', 'Chứng nhận Lactation Consultant'],
        specialties: ['Nhi hô hấp', 'Nhi tiêu hóa', 'Phát triển trẻ em'],
        consultationFee: '300.000 VNĐ',
        nextAvailable: 'Hôm nay, 14:00'
    },
    {
        id: 3,
        name: 'Dr. Lê Minh Cường',
        specialty: 'Thần kinh',
        title: 'Giám đốc Trung tâm Thần kinh',
        experience: '18 năm',
        rating: 4.9,
        reviews: 195,
        patients: 1500,
        description: 'Bác sĩ đầu ngành về Thần kinh học tại Việt Nam. Chuyên điều trị đột quỵ, động kinh, bệnh Parkinson và các bệnh lý thần kinh phức tạp với tỷ lệ thành công cao.',
        education: [
            'Tiến sĩ Y khoa - Đại học Y Tokyo, Nhật Bản (2002)',
            'Hậu Tiến sĩ Thần kinh học - Harvard Medical School (2005)',
            'Board Certified Neurologist - Japan Neurological Society'
        ],
        languages: ['Tiếng Việt', 'English', '日本語'],
        schedule: ['Thứ 3: 8:00-12:00', 'Thứ 5: 14:00-18:00', 'Thứ 7: 8:00-12:00'],
        location: 'Phòng 301 - Tầng 3 - Trung tâm Thần kinh',
        phone: '+84-123-456-791',
        email: 'dr.cuong@hospital.vn',
        achievements: ['100+ nghiên cứu quốc tế', 'Giải thưởng Excellence in Neurology 2022'],
        specialties: ['Đột quỵ não', 'Động kinh', 'Bệnh Parkinson', 'Đau nửa đầu'],
        consultationFee: '800.000 VNĐ',
        nextAvailable: 'Thứ 3, 09:00'
    },
    {
        id: 4,
        name: 'Dr. Phạm Thị Dung',
        specialty: 'Phụ khoa',
        title: 'Bác sĩ chuyên khoa II',
        experience: '10 năm',
        rating: 4.7,
        reviews: 312,
        patients: 850,
        description: 'Chuyên gia Sản phụ khoa với kinh nghiệm điều trị vô sinh hiếm muộn và các bệnh lý phụ khoa. Đã thực hiện thành công nhiều ca IVF và phẫu thuật nội soi phụ khoa.',
        education: [
            'Bác sĩ Y khoa - Đại học Y Huế (2010)',
            'Thạc sĩ Sản phụ khoa (2013)',
            'Chứng chỉ IVF - Bệnh viện Từ Dũ (2015)'
        ],
        languages: ['Tiếng Việt', 'English'],
        schedule: ['Thứ 2,4,6: 8:00-12:00 & 14:00-17:00'],
        location: 'Phòng 205 - Tầng 2 - Khoa Phụ khoa',
        phone: '+84-123-456-792',
        email: 'dr.dung@hospital.vn',
        achievements: ['Tỷ lệ thành công IVF: 65%', 'Chứng nhận Phụ khoa nội soi quốc tế'],
        specialties: ['IVF', 'Vô sinh hiếm muộn', 'Phẫu thuật nội soi', 'Siêu âm 4D'],
        consultationFee: '400.000 VNĐ',
        nextAvailable: 'Thứ 4, 10:30'
    },
    {
        id: 5,
        name: 'Dr. Hoàng Đức',
        specialty: 'Chấn thương chỉnh hình',
        title: 'Trưởng khoa Chấn thương Chỉnh hình',
        experience: '14 năm',
        rating: 4.8,
        reviews: 278,
        patients: 1100,
        description: 'Bác sĩ chuyên khoa Chấn thương chỉnh hình, thành thạo phẫu thuật xương khớp, thay khớp và điều trị chấn thương thể thao bằng kỹ thuật tối thiểu xâm lấn.',
        education: [
            'Tiến sĩ Y khoa - Đại học Y Cologne, Đức (2006)',
            'Chuyên khoa II Chấn thương Chỉnh hình (2009)',
            'Fellowship Sports Medicine - FIFA Medical Center'
        ],
        languages: ['Tiếng Việt', 'English', 'Deutsch'],
        schedule: ['Thứ 2-6: 7:30-16:30', 'Thứ 7: 8:00-12:00 (khẩn cấp)'],
        location: 'Phòng 401 - Tầng 4 - Khoa Chấn thương',
        phone: '+84-123-456-793',
        email: 'dr.duc@hospital.vn',
        achievements: ['1000+ ca phẫu thuật thành công', 'Bác sĩ của đội tuyển bóng đá quốc gia'],
        specialties: ['Phẫu thuật thay khớp', 'Y học thể thao', 'Nội soi khớp', 'Điều trị gãy xương'],
        consultationFee: '600.000 VNĐ',
        nextAvailable: 'Mai, 08:00'
    },
    {
        id: 6,
        name: 'Dr. Võ Thị Hoa',
        specialty: 'Da liễu',
        title: 'Bác sĩ chuyên khoa I',
        experience: '8 năm',
        rating: 4.6,
        reviews: 156,
        patients: 650,
        description: 'Bác sĩ chuyên khoa Da liễu, chuyên điều trị các bệnh lý về da, thẩm mỹ da và laser điều trị. Có kinh nghiệm trong điều trị mụn, nám, lão hóa da và các bệnh da liễu.',
        education: [
            'Bác sĩ Y khoa - Đại học Y Hà Nội (2012)',
            'Thạc sĩ Da liễu (2015)',
            'Chứng chỉ Laser & Aesthetic Medicine - Seoul'
        ],
        languages: ['Tiếng Việt', 'English', '한국어'],
        schedule: ['Thứ 2,3,5,7: 9:00-12:00 & 14:00-18:00'],
        location: 'Phòng 102 - Tầng 1 - Khoa Da liễu',
        phone: '+84-123-456-794',
        email: 'dr.hoa@hospital.vn',
        achievements: ['Chuyên gia laser hàng đầu', 'Giải thưởng Dermatology Innovation 2023'],
        specialties: ['Điều trị mụn', 'Trị nám', 'Laser thẩm mỹ', 'Điều trị viêm da'],
        consultationFee: '350.000 VNĐ',
        nextAvailable: 'Thứ 5, 15:00'
    }
];

const mapApiResponseToDisplay = (apiData: any, doctorId: string): DoctorDisplay => {
    return {
        id: parseInt(doctorId),
        name: apiData.full_name ||
            (apiData.first_name && apiData.last_name ? `Dr. ${apiData.first_name} ${apiData.last_name}` : '') ||
            apiData.name ||
            'Bác sĩ',
        specialty: apiData.specialization || apiData.specialty || 'Chưa cập nhật',
        title: apiData.title || apiData.position || apiData.specialization || 'Bác sĩ',
        experience: apiData.experience_years ? `${apiData.experience_years} năm` : 'Chưa cập nhật',
        rating: Number(apiData.rating) || 4.0,
        reviews: Number(apiData.total_reviews) || 0,
        patients: Number(apiData.patients_count) || 0,
        description: apiData.bio || apiData.description || 'Chưa có thông tin chi tiết về bác sĩ này.',
        education: Array.isArray(apiData.education) ? apiData.education :
            Array.isArray(apiData.certifications) ? apiData.certifications :
                apiData.qualifications ? [apiData.qualifications] :
                    ['Chưa cập nhật'],
        languages: Array.isArray(apiData.languages_spoken) ? apiData.languages_spoken :
            Array.isArray(apiData.languages) ? apiData.languages :
                ['Tiếng Việt'],
        schedule: Array.isArray(apiData.available_times) ? apiData.available_times :
            Array.isArray(apiData.schedule) ? apiData.schedule :
                Array.isArray(apiData.working_hours) ? apiData.working_hours :
                    ['Liên hệ để biết thêm'],
        location: apiData.department_name ||
            apiData.location ||
            apiData.office_address ||
            apiData.department ||
            'Chưa cập nhật',
        phone: apiData.phone_number || apiData.phone || apiData.contact_phone || 'Chưa cập nhật',
        email: apiData.email || apiData.contact_email || 'Chưa cập nhật',
        achievements: Array.isArray(apiData.awards) ? apiData.awards :
            Array.isArray(apiData.achievements) ? apiData.achievements :
                apiData.certifications ? [apiData.certifications] :
                    ['Chưa cập nhật'],
        specialties: Array.isArray(apiData.specialties) ? apiData.specialties :
            Array.isArray(apiData.sub_specialties) ? apiData.sub_specialties :
                [apiData.specialization || apiData.specialty || 'Chưa cập nhật'],
        consultationFee: typeof apiData.consultation_fee === 'number' ?
            `${apiData.consultation_fee.toLocaleString('vi-VN')} VNĐ` :
            apiData.fee ? `${apiData.fee.toLocaleString('vi-VN')} VNĐ` :
                'Liên hệ',
        nextAvailable: apiData.next_available ||
            apiData.next_slot ||
            apiData.available_from ||
            'Liên hệ để biết thêm',
    };
};

export default function DoctorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useEnhancedAuth();

    const [doctor, setDoctor] = useState<DoctorDisplay | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [checkingAuth, setCheckingAuth] = useState<boolean>(false);
    const [consultationFee, setConsultationFee] = useState<number>(0);

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const doctorId = params?.id as string;

                if (!doctorId) {
                    throw new Error('Doctor ID is required');
                }

                // Try to get doctor from API first
                try {
                    const apiResponse = await doctorsApi.getDoctorById(doctorId);
                    if (apiResponse.success && apiResponse.data) {
                        const doctorDisplay = mapApiResponseToDisplay(apiResponse.data, doctorId);
                        setDoctor(doctorDisplay);

                        // Extract fee
                        const feeString = doctorDisplay.consultationFee || '0 VNĐ';
                        const feeNumber = parseInt(feeString.replace(/[^\d]/g, ''), 10) || 0;
                        setConsultationFee(feeNumber);

                        return;
                    }
                } catch (apiError) {
                    console.warn('API error, falling back to static data:', apiError);
                }

                // Fall back to static data
                const doctorIdNum = parseInt(doctorId, 10);
                const fallbackDoctor = FALLBACK_DOCTORS.find(d => d.id === doctorIdNum);

                if (fallbackDoctor) {
                    setDoctor(fallbackDoctor);

                    // Extract fee
                    const feeString = fallbackDoctor.consultationFee || '0 VNĐ';
                    const feeNumber = parseInt(feeString.replace(/[^\d]/g, ''), 10) || 0;
                    setConsultationFee(feeNumber);
                } else {
                    throw new Error(`Không tìm thấy thông tin bác sĩ với ID: ${doctorId}`);
                }
            } catch (error: any) {
                console.error('Error fetching doctor details:', error);
                setError(error.message || 'Có lỗi xảy ra khi tải thông tin bác sĩ');
            } finally {
                setLoading(false);
            }
        };

        if (params?.id) {
            fetchDoctorDetails();
        }
    }, [params?.id]);

    const checkAuthAndRedirect = async () => {
        setCheckingAuth(true);

        try {
            const { user, error: authError } = await supabaseAuth.getCurrentUser();

            if (authError) {
                console.error('Auth error:', authError);
                throw new Error('Authentication error');
            }

            // Save doctor ID before redirecting
            localStorage.setItem('selectedDoctorId', params?.id as string);

            if (!user) {
                // User not logged in - redirect to login page
                router.push('/auth/login?redirect=booking');
                return;
            }

            if (user.role === 'patient' && doctor) {
                // Save complete doctor info to localStorage for use in the medical record form
                localStorage.setItem('selectedDoctor', JSON.stringify({
                    id: params?.id,
                    name: doctor.name,
                    fee: consultationFee,
                    specialty: doctor.specialty
                }));

                // Redirect to medical record creation page first
                router.push(`/patient/medical-records/create?doctorId=${params?.id}`);
            } else if (user.role === 'doctor') {
                router.push('/doctors/dashboard');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/patient/dashboard');
            }
        } catch (error: any) {
            console.error('Auth check error:', error);
            // Save doctor ID before redirecting to login
            localStorage.setItem('selectedDoctorId', params?.id as string);

            Swal.fire({
                title: 'Lỗi xác thực',
                text: 'Vui lòng đăng nhập để tiếp tục',
                icon: 'error',
                confirmButtonText: 'Đăng nhập'
            }).then(() => {
                router.push('/auth/login?redirect=booking');
            });
        } finally {
            setCheckingAuth(false);
        }
    };

    // Render booking flow section
    const renderBookingFlow = () => {
        return (
            <Card className="mb-8 overflow-hidden">
                <div className="bg-blue-50 p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <Calendar className="mr-2 h-5 w-5" />
                        Quy trình đặt lịch khám
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg ${user ? 'bg-green-50 border border-green-100' : 'bg-white border border-blue-100'}`}>
                            <div className="flex items-center mb-2">
                                <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2 ${user ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    {user ? <CheckCircle className="h-5 w-5" /> : "1"}
                                </div>
                                <h4 className="font-medium">Đăng nhập/Đăng ký</h4>
                            </div>
                            <p className="text-sm text-gray-600 ml-10">
                                {user ? 'Bạn đã đăng nhập ✓' : 'Đăng nhập hoặc đăng ký tài khoản để đặt lịch'}
                            </p>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center mb-2">
                                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2">
                                    {user ? "1" : "2"}
                                </div>
                                <h4 className="font-medium">Tạo bệnh án</h4>
                            </div>
                            <p className="text-sm text-gray-600 ml-10">Cung cấp thông tin bệnh lý để bác sĩ chuẩn bị trước</p>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center mb-2">
                                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2">
                                    {user ? "2" : "3"}
                                </div>
                                <h4 className="font-medium">Thanh toán</h4>
                            </div>
                            <p className="text-sm text-gray-600 ml-10">
                                {`Phí khám: ${doctor?.consultationFee || '0 VNĐ'}`}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    // Render booking button based on auth state
    const renderBookingButton = () => {
        if (authLoading || checkingAuth) {
            return (
                <Button
                    disabled
                    size="lg"
                    className="w-full bg-gray-300 text-gray-700 cursor-not-allowed"
                >
                    <div className="animate-pulse flex items-center">
                        <div className="h-5 w-5 bg-gray-400 rounded-full mr-2"></div>
                        Đang tải...
                    </div>
                </Button>
            );
        }

        if (user) {
            return (
                <Button
                    size="lg"
                    className="w-full bg-[#003087] hover:bg-[#002266] text-white"
                    onClick={checkAuthAndRedirect}
                >
                    <Calendar className="mr-2 h-5 w-5" />
                    Đặt lịch khám ngay
                </Button>
            );
        }

        return (
            <Button
                size="lg"
                className="w-full bg-[#003087] hover:bg-[#002266] text-white"
                onClick={checkAuthAndRedirect}
            >
                <ArrowRight className="mr-2 h-5 w-5" />
                Đăng nhập để đặt lịch
            </Button>
        );
    };

    if (loading) {
        return (
            <PublicLayout currentPage="doctors">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#003087] mx-auto"></div>
                        <p className="mt-6 text-lg text-gray-600">Đang tải thông tin bác sĩ...</p>
                        <p className="mt-2 text-sm text-gray-500">ID: {params?.id}</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error) {
        return (
            <PublicLayout currentPage="doctors">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto">
                        <div className="text-red-500 text-8xl mb-6">⚠️</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6 text-lg">{error}</p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={() => router.back()}
                                    className="bg-[#003087] text-white hover:bg-[#002266] px-6 py-3"
                                >
                                    <ArrowLeft className="mr-2" size={18} />
                                    Quay lại
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white px-6 py-3"
                                >
                                    Thử lại
                                </Button>
                            </div>

                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="w-full"
                            >
                                Về trang chủ
                            </Button>
                        </div>

                        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left text-sm">
                            <div className="font-semibold mb-2">Debug Info:</div>
                            <div>Doctor ID: {params?.id}</div>
                            <div>Available fallback IDs: 1, 2, 3</div>
                            <div>Suggestion: Try /doctors/1 or /doctors/2</div>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (!doctor) {
        return (
            <PublicLayout currentPage="doctors">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 text-8xl mb-6">👨‍⚕️</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Không tìm thấy bác sĩ</h2>
                        <p className="text-gray-600 mb-6 text-lg">Thông tin bác sĩ này không tồn tại hoặc đã được xóa.</p>
                        <Button
                            onClick={() => router.push('/')}
                            className="bg-[#003087] text-white hover:bg-[#002266] px-8 py-3"
                        >
                            <ArrowLeft className="mr-2" size={20} />
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout currentPage="doctors">
            <section className="py-8 bg-gradient-to-r from-[#003087] to-[#0056b3] text-white">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="border-white text-white hover:bg-white hover:text-[#003087] transition-all"
                        >
                            <ArrowLeft className="mr-2" size={18} />
                            Quay lại
                        </Button>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start gap-8">
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-8 ring-white/30">
                                <span className="text-4xl font-bold text-white">
                                    {doctor.name.split(' ').pop()?.charAt(0) || 'D'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">{doctor.name}</h1>
                                    <p className="text-xl text-blue-100 mb-2">{doctor.title}</p>
                                    <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-lg font-medium mb-4">
                                        {doctor.specialty}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-sm">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < Math.floor(doctor.rating) ? 'text-yellow-300 fill-current' : 'text-white/30'}`}
                                                />
                                            ))}
                                            <span className="ml-2 font-semibold text-lg">{doctor.rating}</span>
                                        </div>
                                        <span className="text-blue-100">({doctor.reviews} đánh giá)</span>
                                        <span className="text-blue-100">{doctor.patients}+ bệnh nhân</span>
                                        <span className="text-blue-100">{doctor.experience} kinh nghiệm</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[250px]">
                                    <Button
                                        className="w-full bg-white text-[#003087] hover:bg-gray-100 px-6 py-4 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                        onClick={checkAuthAndRedirect}
                                        disabled={checkingAuth}
                                    >
                                        {checkingAuth ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#003087] mr-2"></div>
                                                <span className="text-shadow-lg">Đang kiểm tra...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Calendar className="mr-2" size={20} />
                                                <span className="text-shadow-lg font-extrabold">Đặt lịch khám</span>
                                            </>
                                        )}
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="border-white text-white hover:bg-white hover:text-[#003087] px-4 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                            onClick={() => {
                                                if (doctor.phone !== 'Chưa cập nhật') {
                                                    Swal.fire({
                                                        title: 'Gọi điện thoại?',
                                                        text: `Bạn có muốn gọi tới số ${doctor.phone}?`,
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonColor: '#003087',
                                                        cancelButtonColor: '#d33',
                                                        confirmButtonText: 'Gọi ngay',
                                                        cancelButtonText: 'Hủy',
                                                    }).then((result) => {
                                                        if (result.isConfirmed) {
                                                            window.open(`tel:${doctor.phone}`, '_self');
                                                        }
                                                    });
                                                } else {
                                                    Swal.fire('Thông báo', 'Số điện thoại chưa được cập nhật', 'info');
                                                }
                                            }}
                                        >
                                            <Phone size={16} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-white text-white hover:bg-white hover:text-[#003087] px-4 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                            onClick={() => {
                                                if (doctor.email !== 'Chưa cập nhật') {
                                                    window.open(`mailto:${doctor.email}`, '_blank');
                                                } else {
                                                    Swal.fire('Thông báo', 'Email chưa được cập nhật', 'info');
                                                }
                                            }}
                                        >
                                            <Mail size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 bg-gray-50">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            {renderBookingFlow()}

                            <Card className="shadow-lg border-0">
                                <CardContent className="p-8">
                                    <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                                        <Stethoscope className="mr-3 text-[#003087]" size={24} />
                                        Giới thiệu
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed text-lg">{doctor.description}</p>
                                </CardContent>
                            </Card>

                            {doctor.specialties.length > 0 && doctor.specialties[0] !== 'Chưa cập nhật' && (
                                <Card className="shadow-lg border-0">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                                            <Heart className="mr-3 text-[#003087]" size={24} />
                                            Chuyên môn
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {doctor.specialties.map((specialty, index) => (
                                                <div key={index} className="flex items-center bg-blue-50 p-4 rounded-lg">
                                                    <CheckCircle className="text-green-500 mr-3 flex-shrink-0" size={20} />
                                                    <span className="text-gray-800 font-medium">{specialty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {doctor.education.length > 0 && doctor.education[0] !== 'Chưa cập nhật' && (
                                <Card className="shadow-lg border-0">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                                            <GraduationCap className="mr-3 text-[#003087]" size={24} />
                                            Học vấn & Chứng chỉ
                                        </h2>
                                        <div className="space-y-4">
                                            {doctor.education.map((edu, index) => (
                                                <div key={index} className="flex items-start bg-gray-50 p-4 rounded-lg">
                                                    <BookOpen className="text-[#003087] mr-3 mt-1 flex-shrink-0" size={20} />
                                                    <span className="text-gray-800">{edu}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {doctor.achievements.length > 0 && doctor.achievements[0] !== 'Chưa cập nhật' && (
                                <Card className="shadow-lg border-0">
                                    <CardContent className="p-8">
                                        <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                                            <Trophy className="mr-3 text-[#003087]" size={24} />
                                            Thành tích & Giải thưởng
                                        </h2>
                                        <div className="space-y-4">
                                            {doctor.achievements.map((achievement, index) => (
                                                <div key={index} className="flex items-start bg-yellow-50 p-4 rounded-lg">
                                                    <Award className="text-yellow-600 mr-3 mt-1 flex-shrink-0" size={20} />
                                                    <span className="text-gray-800">{achievement}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div>
                            <div className="sticky top-28">
                                <Card className="shadow-lg border-0 overflow-hidden">
                                    <div className="bg-[#003087] text-white p-6">
                                        <h3 className="text-xl font-bold mb-1">Đặt lịch khám</h3>
                                        <p className="text-blue-100">với {doctor.name}</p>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="space-y-5">
                                            <div>
                                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Phí tư vấn</p>
                                                        <p className="text-2xl font-bold text-[#003087]">{doctor.consultationFee}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold text-gray-700 flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                                        Lịch gần nhất
                                                    </h4>
                                                    <span className="text-sm text-gray-500">{doctor.nextAvailable}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Lịch làm việc: {doctor.schedule?.[0]}
                                                </div>
                                            </div>

                                            <div className="pt-3">
                                                {renderBookingButton()}
                                            </div>

                                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                                                <p className="flex items-start">
                                                    <FileText className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                                                    <span>
                                                        Sau khi đặt lịch, bạn sẽ được yêu cầu tạo bệnh án và hoàn tất thanh toán để xác nhận lịch hẹn.
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}