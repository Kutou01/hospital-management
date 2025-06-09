'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Loader2 } from 'lucide-react';

// Form schema with validation
const formSchema = z.object({
    patientName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    patientEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    patientPhone: z.string().min(9, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.string().optional(),
    height: z.string().optional().or(z.literal('')),
    weight: z.string().optional().or(z.literal('')),
    bloodType: z.string().optional(),
    symptoms: z.string().min(10, 'Triệu chứng phải có ít nhất 10 ký tự'),
    allergies: z.string().optional().or(z.literal('')),
    medications: z.string().optional().or(z.literal('')),
    pastIllnesses: z.string().optional().or(z.literal('')),
    familyHistory: z.string().optional().or(z.literal('')),
    additionalNotes: z.string().optional().or(z.literal('')),
    emergencyContact: z.string().optional().or(z.literal('')),
    emergencyPhone: z.string().optional().or(z.literal('')),
    consentToTreatment: z.boolean().refine(val => val === true, {
        message: 'Bạn phải đồng ý với điều khoản điều trị',
    }),
});

export type MedicalRecordFormData = z.infer<typeof formSchema>;

interface MedicalRecordFormProps {
    onSubmit: (data: MedicalRecordFormData) => void;
    loading?: boolean;
    initialValues?: Partial<MedicalRecordFormData>;
    isForAppointment?: boolean;
    actionText?: string;
}

export default function MedicalRecordForm({
    onSubmit,
    loading = false,
    initialValues = {},
    isForAppointment = false,
    actionText = 'Tạo bệnh án'
}: MedicalRecordFormProps) {
    const form = useForm<MedicalRecordFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            patientName: '',
            patientEmail: '',
            patientPhone: '',
            dateOfBirth: '',
            gender: '',
            height: '',
            weight: '',
            bloodType: '',
            symptoms: '',
            allergies: '',
            medications: '',
            pastIllnesses: '',
            familyHistory: '',
            additionalNotes: '',
            emergencyContact: '',
            emergencyPhone: '',
            consentToTreatment: false,
            ...initialValues
        },
    });

    // Update form values when initialValues change
    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            Object.entries(initialValues).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    form.setValue(key as any, value as any);
                }
            });
        }
    }, [initialValues, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Patient Information Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Thông tin bệnh nhân</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="patientName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Họ và tên <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập họ và tên" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Ngày sinh</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Giới tính</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn giới tính" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">Nam</SelectItem>
                                            <SelectItem value="female">Nữ</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="patientPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Số điện thoại</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập số điện thoại" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="patientEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bloodType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Nhóm máu</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn nhóm máu" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="A+">A+</SelectItem>
                                            <SelectItem value="A-">A-</SelectItem>
                                            <SelectItem value="B+">B+</SelectItem>
                                            <SelectItem value="B-">B-</SelectItem>
                                            <SelectItem value="AB+">AB+</SelectItem>
                                            <SelectItem value="AB-">AB-</SelectItem>
                                            <SelectItem value="O+">O+</SelectItem>
                                            <SelectItem value="O-">O-</SelectItem>
                                            <SelectItem value="unknown">Không biết</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="height"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-medium">Chiều cao (cm)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="VD: 170" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-medium">Cân nặng (kg)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="VD: 65" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Information Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Thông tin bệnh lý</h2>
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="symptoms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Triệu chứng <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả chi tiết các triệu chứng bạn đang gặp phải"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allergies"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Dị ứng</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Liệt kê các loại dị ứng (thuốc, thực phẩm, v.v.) nếu có"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="medications"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Thuốc đang sử dụng</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Liệt kê các loại thuốc bạn đang sử dụng (nếu có)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pastIllnesses"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Tiền sử bệnh</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Liệt kê các bệnh đã mắc trước đây"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="familyHistory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Tiền sử gia đình</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Liệt kê các bệnh có tính di truyền trong gia đình (nếu có)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="additionalNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Ghi chú thêm</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Thông tin bổ sung khác mà bạn muốn bác sĩ biết"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Emergency Contact Information */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Thông tin liên hệ khẩn cấp</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Người liên hệ khẩn cấp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Họ tên người liên hệ" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergencyPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Số điện thoại liên hệ khẩn cấp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Số điện thoại liên hệ" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Consent Section */}
                <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                    <FormField
                        control={form.control}
                        name="consentToTreatment"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                        Tôi đồng ý với <span className="text-blue-600">điều khoản điều trị</span> và cho phép bệnh viện sử dụng thông tin y tế của tôi để phục vụ việc chẩn đoán và điều trị <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-8">
                    <Button type="submit" disabled={loading} className="px-8">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                {actionText}
                                {isForAppointment && <ArrowRight className="ml-2 h-4 w-4" />}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 