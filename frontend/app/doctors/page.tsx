'use client';

import React, { useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, Calendar, Award, Clock, Users, Filter, MapPin, Phone, Mail, GraduationCap, Stethoscope, Heart, Shield, Video, MessageCircle } from 'lucide-react';

interface Doctor {
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

export default function DoctorsPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const doctors: Doctor[] = [
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
      name: 'Dr. Hoàng Văn Đức',
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

  const specialties = [
    'all',
    'Tim mạch',
    'Nhi khoa', 
    'Thần kinh',
    'Phụ khoa',
    'Chấn thương chỉnh hình',
    'Da liễu'
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <PublicLayout currentPage="doctors">
      {/* Hero Section */}
      <section className="relative bg-[#e6f7ff] py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a3b5d] mb-6">
              Tìm Bác Sĩ{' '}
              <span className="text-[#003087]">Phù Hợp Với Bạn</span>
            </h1>
            <p className="text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Đội ngũ bác sĩ chuyên gia hàng đầu với nhiều năm kinh nghiệm, 
              cam kết mang đến dịch vụ chăm sóc sức khỏe tốt nhất cho bạn và gia đình
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[#003087]">50+</div>
              <div className="text-sm text-gray-600">Bác sĩ chuyên khoa</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[#003087]">15,000+</div>
              <div className="text-sm text-gray-600">Bệnh nhân hài lòng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[#003087]">4.8/5</div>
              <div className="text-sm text-gray-600">Đánh giá trung bình</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[#003087]">24/7</div>
              <div className="text-sm text-gray-600">Hỗ trợ khách hàng</div>
            </div>
          </div>
          
          {/* Background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-16 h-16 rounded-full bg-[#a8e0f7] opacity-30"></div>
            <div className="absolute top-[30%] right-[10%] w-8 h-8 rounded-full bg-[#a8e0f7] opacity-40"></div>
            <div className="absolute bottom-[20%] left-[15%] w-12 h-12 rounded-full bg-[#a8e0f7] opacity-30"></div>
            <div className="absolute top-[40%] right-[25%] text-[#a8e0f7] opacity-20 text-4xl">+</div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm bác sĩ theo tên, chuyên khoa..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003087] focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-gray-600" />
              <select
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003087] focus:border-transparent min-w-[200px] transition-all"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="all">Tất cả chuyên khoa</option>
                {specialties.slice(1).map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Grid */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 md:px-8">
          {filteredDoctors.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredDoctors.map(doctor => (
                <Card key={doctor.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                  <CardContent className="p-0">
                    {/* Doctor Header */}
                    <div className="relative bg-gradient-to-r from-[#003087] to-[#0056b3] text-white p-6 rounded-t-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white/30">
                          <span className="text-2xl font-bold text-white">
                            {doctor.name.split(' ').pop()?.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{doctor.name}</h3>
                          <p className="text-blue-100 font-medium mb-2">{doctor.title}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(doctor.rating) ? 'text-yellow-300 fill-current' : 'text-white/30'}`}
                                />
                              ))}
                              <span className="ml-2 font-semibold">{doctor.rating}</span>
                            </div>
                            <span className="text-blue-100">({doctor.reviews} đánh giá)</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Specialty Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                          {doctor.specialty}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Quick Info */}
                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-[#003087] font-bold text-lg">{doctor.experience}</div>
                          <div className="text-xs text-gray-600">Kinh nghiệm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#003087] font-bold text-lg">{doctor.patients}+</div>
                          <div className="text-xs text-gray-600">Bệnh nhân</div>
                        </div>
                      </div>

                      {/* Specialties */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Chuyên môn:</h4>
                        <div className="flex flex-wrap gap-2">
                          {doctor.specialties.map(spec => (
                            <span key={spec} className="bg-blue-50 text-[#003087] px-2 py-1 rounded-full text-xs font-medium">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Next Available */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">Lịch gần nhất:</span>
                        </div>
                        <span className="text-sm font-bold text-green-700">{doctor.nextAvailable}</span>
                      </div>

                      {/* Consultation Fee */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-sm text-gray-600">Phí tư vấn:</span>
                        <span className="text-lg font-bold text-[#003087]">{doctor.consultationFee}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button className="w-full bg-[#003087] hover:bg-[#002266] text-white py-3 rounded-xl font-semibold transition-all">
                          <Calendar className="mr-2" size={18} />
                          Đặt lịch khám
                        </Button>
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white rounded-lg">
                            <Phone size={16} />
                          </Button>
                          <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white rounded-lg">
                            <Video size={16} />
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white rounded-lg"
                            onClick={() => setSelectedDoctor(doctor)}
                          >
                            <MessageCircle size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Card className="shadow-lg max-w-md mx-auto">
                <CardContent className="p-12">
                  <Stethoscope size={64} className="text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-[#1a3b5d] mb-2">Không tìm thấy bác sĩ</h3>
                  <p className="text-gray-600 mb-4">Không có bác sĩ nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                  <Button 
                    onClick={() => {setSearchTerm(''); setSelectedSpecialty('all')}}
                    variant="outline"
                    className="border-[#003087] text-[#003087]"
                  >
                    Xem tất cả bác sĩ
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Our Doctors */}
      <section className="py-16 bg-[#e6f7ff]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a3b5d] mb-4">Tại Sao Chọn Bác Sĩ Của Chúng Tôi?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Đội ngũ bác sĩ của chúng tôi được lựa chọn kỹ lưỡng với tiêu chuẩn cao nhất
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-[#003087] text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-2">Chuyên Môn Cao</h3>
                <p className="text-gray-600">Được đào tạo tại các trường đại học y khoa hàng đầu trong và ngoài nước</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-[#003087] text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-2">Tận Tâm</h3>
                <p className="text-gray-600">Luôn đặt sức khỏe và sự hài lòng của bệnh nhân lên hàng đầu</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-[#003087] text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-2">An Toàn</h3>
                <p className="text-gray-600">Tuân thủ nghiêm ngặt các quy trình y tế và an toàn bệnh nhân</p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-[#003087] text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-2">Sẵn Sàng 24/7</h3>
                <p className="text-gray-600">Luôn có mặt khi bạn cần, kể cả trong các tình huống khẩn cấp</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <Card className="bg-gradient-to-r from-[#003087] to-[#0056b3] text-white shadow-2xl border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Bắt Đầu Hành Trình Chăm Sóc Sức Khỏe</h2>
              <p className="text-xl mb-8 opacity-90">
                Đặt lịch hẹn ngay hôm nay và nhận được sự chăm sóc y tế tốt nhất từ đội ngũ chuyên gia
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button className="bg-white text-[#003087] hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg min-w-[200px] transition-all">
                  <Calendar className="mr-2" size={20} />
                  Đặt Lịch Ngay
                </Button>
                <Button
  variant="outline"
  className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-4 rounded-xl font-bold text-lg min-w-[200px] transition-all"
>
  <Phone className="mr-2" size={20} />
  Gọi: +1-123-5663582
</Button>

              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">15 phút</div>
                  <div className="text-sm opacity-80">Thời gian phản hồi</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-sm opacity-80">Khách hàng hài lòng</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm opacity-80">Hỗ trợ khẩn cấp</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-0">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-[#003087] to-[#0056b3] text-white p-6">
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                    <span className="text-3xl font-bold">
                      {selectedDoctor.name.split(' ').pop()?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedDoctor.name}</h2>
                    <p className="text-blue-100 text-lg mb-2">{selectedDoctor.title}</p>
                    <p className="text-blue-100 mb-3">{selectedDoctor.specialty}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`w-5 h-5 ${i < Math.floor(selectedDoctor.rating) ? 'text-yellow-300 fill-current' : 'text-white/30'}`}
                          />
                        ))}
                        <span className="ml-2 font-semibold text-lg">{selectedDoctor.rating}</span>
                      </div>
                      <span className="text-blue-100">({selectedDoctor.reviews} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#1a3b5d] mb-3">Giới Thiệu</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedDoctor.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Education */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#1a3b5d] mb-3 flex items-center">
                        <GraduationCap className="mr-2 text-[#003087]" size={20} />
                        Trình Độ Đào Tạo
                      </h4>
                      <ul className="space-y-2">
                        {selectedDoctor.education.map((edu, index) => (
                          <li key={index} className="text-gray-600 flex items-start">
                            <span className="text-[#003087] mr-2">•</span>
                            {edu}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Specialties */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#1a3b5d] mb-3">Chuyên Môn</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.specialties.map(spec => (
                          <span key={spec} className="bg-blue-50 text-[#003087] px-3 py-2 rounded-full text-sm font-medium">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#1a3b5d] mb-3">Ngôn Ngữ</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.languages.map(lang => (
                          <span key={lang} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#1a3b5d] mb-3 flex items-center">
                        <MapPin className="mr-2 text-[#003087]" size={20} />
                        Thông Tin Liên Hệ
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-gray-500" />
                          <span className="text-gray-600">{selectedDoctor.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-600">{selectedDoctor.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-500" />
                          <span className="text-gray-600">{selectedDoctor.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#1a3b5d] mb-3 flex items-center">
                        <Calendar className="mr-2 text-[#003087]" size={20} />
                        Lịch Khám
                      </h4>
                      <ul className="space-y-2">
                        {selectedDoctor.schedule.map((time, index) => (
                          <li key={index} className="text-gray-600 flex items-center">
                            <Clock size={14} className="mr-2 text-[#003087]" />
                            {time}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Achievements */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#1a3b5d] mb-3 flex items-center">
                        <Award className="mr-2 text-[#003087]" size={20} />
                        Thành Tựu
                      </h4>
                      <ul className="space-y-2">
                        {selectedDoctor.achievements.map((achievement, index) => (
                          <li key={index} className="text-gray-600 flex items-start">
                            <span className="text-[#003087] mr-2">•</span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                  <Button className="flex-1 bg-[#003087] hover:bg-[#002266] text-white py-4 rounded-xl font-semibold text-lg">
                    <Calendar className="mr-2" size={20} />
                    Đặt Lịch Khám - {selectedDoctor.consultationFee}
                  </Button>
                  <Button variant="outline" className="px-6 border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white rounded-xl">
                    <Phone size={20} />
                  </Button>
                  <Button variant="outline" className="px-6 border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white rounded-xl">
                    <Video size={20} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PublicLayout>
  );
}