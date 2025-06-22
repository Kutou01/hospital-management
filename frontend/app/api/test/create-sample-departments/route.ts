import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Tạo dữ liệu mẫu cho departments
        const sampleDepartments = [
            {
                department_id: 'DEPT001',
                department_name: 'Khoa Nội Tổng Hợp',
                department_code: 'NOI',
                description: 'Khoa chuyên điều trị các bệnh nội khoa tổng quát',
                head_doctor_id: 'DOC001',
                location: 'Tầng 2, Tòa nhà A',
                phone: '028-1234-5678',
                email: 'noi@hospital.com',
                status: 'active',
                created_at: new Date('2024-01-01').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                department_id: 'DEPT002',
                department_name: 'Khoa Tim Mạch',
                department_code: 'TIM',
                description: 'Khoa chuyên điều trị các bệnh về tim mạch',
                head_doctor_id: 'DOC002',
                location: 'Tầng 3, Tòa nhà A',
                phone: '028-1234-5679',
                email: 'timmach@hospital.com',
                status: 'active',
                created_at: new Date('2024-01-01').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                department_id: 'DEPT003',
                department_name: 'Khoa Nhi',
                department_code: 'NHI',
                description: 'Khoa chuyên điều trị cho trẻ em',
                head_doctor_id: 'DOC004',
                location: 'Tầng 1, Tòa nhà B',
                phone: '028-1234-5680',
                email: 'nhi@hospital.com',
                status: 'active',
                created_at: new Date('2024-01-01').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                department_id: 'DEPT004',
                department_name: 'Khoa Da Liễu',
                department_code: 'DAL',
                description: 'Khoa chuyên điều trị các bệnh về da',
                head_doctor_id: 'DOC005',
                location: 'Tầng 2, Tòa nhà B',
                phone: '028-1234-5681',
                email: 'dalieu@hospital.com',
                status: 'active',
                created_at: new Date('2024-01-01').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                department_id: 'DEPT005',
                department_name: 'Khoa Mắt',
                department_code: 'MAT',
                description: 'Khoa chuyên điều trị các bệnh về mắt',
                head_doctor_id: null,
                location: 'Tầng 3, Tòa nhà B',
                phone: '028-1234-5682',
                email: 'mat@hospital.com',
                status: 'active',
                created_at: new Date('2024-01-01').toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Xóa dữ liệu cũ nếu có
        await supabase
            .from('departments')
            .delete()
            .in('department_id', sampleDepartments.map(d => d.department_id));

        // Thêm dữ liệu mẫu
        const { data, error } = await supabase
            .from('departments')
            .insert(sampleDepartments)
            .select();

        if (error) {
            console.error('Error creating sample departments:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sample departments created successfully',
            data: {
                created: data?.length || 0,
                departments: data
            }
        });

    } catch (error) {
        console.error('Create sample departments error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// DELETE method để xóa dữ liệu test
export async function DELETE(request: NextRequest) {
    try {
        const { error } = await supabase
            .from('departments')
            .delete()
            .like('department_id', 'DEPT00%');

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to delete test data'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Test departments deleted successfully'
        });

    } catch (error) {
        console.error('Delete test departments error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
