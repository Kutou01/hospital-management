import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Tạo dữ liệu mẫu cho patients
        const samplePatients = [
            {
                patient_id: 'PAT000001',
                full_name: 'Nguyễn Văn An',
                dateofbirth: '1990-05-15',
                registration_date: '2024-01-15',
                phone_number: '0901234567',
                email: 'nguyenvanan@email.com',
                blood_type: 'O+',
                gender: 'male',
                address: JSON.stringify({
                    street: '123 Đường ABC',
                    city: 'TP.HCM',
                    district: 'Quận 1',
                    zipcode: '70000'
                }),
                allergies: ['Penicillin'],
                chronic_conditions: ['Cao huyết áp'],
                status: 'active',
                created_at: new Date('2024-01-15').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                patient_id: 'PAT000002',
                full_name: 'Trần Thị Bình',
                dateofbirth: '1985-08-22',
                registration_date: '2024-02-10',
                phone_number: '0907654321',
                email: 'tranthibinh@email.com',
                blood_type: 'A+',
                gender: 'female',
                address: JSON.stringify({
                    street: '456 Đường XYZ',
                    city: 'Hà Nội',
                    district: 'Quận Ba Đình',
                    zipcode: '10000'
                }),
                allergies: ['Aspirin'],
                chronic_conditions: ['Tiểu đường'],
                status: 'active',
                created_at: new Date('2024-02-10').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                patient_id: 'PAT000003',
                full_name: 'Lê Văn Cường',
                dateofbirth: '1995-12-03',
                registration_date: '2024-03-05',
                phone_number: '0912345678',
                email: 'levancuong@email.com',
                blood_type: 'B+',
                gender: 'male',
                address: JSON.stringify({
                    street: '789 Đường DEF',
                    city: 'Đà Nẵng',
                    district: 'Quận Hải Châu',
                    zipcode: '50000'
                }),
                allergies: [],
                chronic_conditions: [],
                status: 'active',
                created_at: new Date('2024-03-05').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                patient_id: 'PAT000004',
                full_name: 'Phạm Thị Dung',
                dateofbirth: '1978-04-18',
                registration_date: '2024-01-20',
                phone_number: '0923456789',
                email: 'phamthidung@email.com',
                blood_type: 'AB+',
                gender: 'female',
                address: JSON.stringify({
                    street: '321 Đường GHI',
                    city: 'Cần Thơ',
                    district: 'Quận Ninh Kiều',
                    zipcode: '90000'
                }),
                allergies: ['Ibuprofen'],
                chronic_conditions: ['Hen suyễn'],
                status: 'active',
                created_at: new Date('2024-01-20').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                patient_id: 'PAT000005',
                full_name: 'Hoàng Văn Em',
                dateofbirth: '2000-07-25',
                registration_date: '2024-04-12',
                phone_number: '0934567890',
                email: 'hoangvanem@email.com',
                blood_type: 'O-',
                gender: 'male',
                address: JSON.stringify({
                    street: '654 Đường JKL',
                    city: 'Hải Phòng',
                    district: 'Quận Lê Chân',
                    zipcode: '18000'
                }),
                allergies: [],
                chronic_conditions: [],
                status: 'active',
                created_at: new Date('2024-04-12').toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                patient_id: 'PAT000006',
                full_name: 'Võ Thị Hoa',
                dateofbirth: '1992-11-08',
                registration_date: '2024-05-01',
                phone_number: '0945678901',
                email: 'vothihoa@email.com',
                blood_type: 'A-',
                gender: 'female',
                address: JSON.stringify({
                    street: '987 Đường MNO',
                    city: 'Nha Trang',
                    district: 'Quận Vĩnh Hải',
                    zipcode: '65000'
                }),
                allergies: ['Latex'],
                chronic_conditions: ['Viêm khớp'],
                status: 'active',
                created_at: new Date('2024-05-01').toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Xóa dữ liệu cũ nếu có
        await supabase
            .from('patients')
            .delete()
            .in('patient_id', samplePatients.map(p => p.patient_id));

        // Thêm dữ liệu mẫu
        const { data, error } = await supabase
            .from('patients')
            .insert(samplePatients)
            .select();

        if (error) {
            console.error('Error creating sample patients:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sample patients created successfully',
            data: {
                created: data?.length || 0,
                patients: data
            }
        });

    } catch (error) {
        console.error('Create sample patients error:', error);
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
            .from('patients')
            .delete()
            .like('patient_id', 'PAT0000%');

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to delete test data'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Test patients deleted successfully'
        });

    } catch (error) {
        console.error('Delete test patients error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
