# 📖 **HOSPITAL MANAGEMENT SYSTEM - USER GUIDE**

## 🎯 **Hướng dẫn sử dụng thực tế**

### **Mục đích tài liệu**
Hướng dẫn này mô tả chính xác những gì người dùng có thể làm với hệ thống hiện tại, không phải những gì "sẽ có" trong tương lai.

---

## 🔐 **ĐĂNG NHẬP HỆ THỐNG**

### **Bước 1: Truy cập ứng dụng**
1. Mở trình duyệt web
2. Truy cập: `http://localhost:3000`
3. Click "Đăng nhập" ở góc phải màn hình

### **Bước 2: Đăng nhập**
**Tài khoản bệnh nhân:**
```
Email: patient@hospital.com
Password: Patient123.
```

**Tài khoản bác sĩ:**
```
Email: doctor@hospital.com
Password: Doctor123.
```

### **Bước 3: Xác nhận đăng nhập thành công**
- Hệ thống sẽ chuyển hướng đến dashboard tương ứng
- Tên người dùng hiển thị ở góc phải
- Sidebar menu xuất hiện bên trái

---

## 👤 **PATIENT PORTAL - NHỮNG GÌ HOẠT ĐỘNG**

### **✅ Dashboard Overview**
**Có thể làm:**
- ✅ Xem thông tin cá nhân: "Trần Thị Hương" - PAT-202506-544
- ✅ Xem điểm sức khỏe: 85% (cải thiện 5% từ tháng trước)
- ✅ Xem số lượng lịch hẹn sắp tới: 0 (chính xác)
- ✅ Xem chỉ số sức khỏe: Huyết áp 120/80, Nhiệt độ 36.5°C
- ✅ Xem calendar tháng 8/2025 với navigation

**Không thể làm:**
- ❌ Click vào các nút "Book Appointment" - chỉ là UI
- ❌ Tương tác với calendar để đặt lịch
- ❌ Click "Emergency" button để gọi cấp cứu

### **✅ Appointments Page**
**Có thể làm:**
- ✅ Truy cập trang: Click "Appointments" trong sidebar
- ✅ Xem giao diện đặt lịch hẹn đẹp và professional
- ✅ Thấy message "No appointments found" (chính xác)

**Không thể làm:**
- ❌ Click "Book New Appointment" - button không hoạt động
- ❌ Tìm kiếm bác sĩ
- ❌ Chọn thời gian khám
- ❌ Đặt lịch hẹn thực tế

### **✅ Medical Records**
**Có thể làm:**
- ✅ Truy cập trang: Click "Medical Records" trong sidebar
- ✅ Xem giao diện hồ sơ y tế professional
- ✅ Thấy search và filter options
- ✅ Thấy message "No medical records found" (chính xác)

**Không thể làm:**
- ❌ Download hồ sơ y tế
- ❌ Upload tài liệu
- ❌ Tìm kiếm trong hồ sơ
- ❌ Xem chi tiết bệnh án

### **✅ Messages & Communication**
**Có thể làm:**
- ✅ Thấy "1 message" indicator trong sidebar
- ✅ Truy cập trang Messages
- ✅ Xem giao diện chat đẹp

**Không thể làm:**
- ❌ Gửi tin nhắn cho bác sĩ
- ❌ Xem nội dung tin nhắn
- ❌ Video call với bác sĩ
- ❌ Real-time chat

---

## 👨‍⚕️ **DOCTOR PORTAL - NHỮNG GÌ HOẠT ĐỘNG**

### **✅ Doctor Dashboard**
**Có thể làm:**
- ✅ Xem thông tin bác sĩ: "BS. Nguyễn Văn Đức"
- ✅ Xem statistics: 1,287 invoices, 965 patients, 128 appointments
- ✅ Xem revenue charts với data thực tế
- ✅ Xem patient demographics by age
- ✅ Xem calendar tháng 8/2025
- ✅ Navigate qua các trang khác nhau

**Không thể làm:**
- ❌ Tương tác với charts để drill-down
- ❌ Export reports
- ❌ Modify patient data từ dashboard

### **✅ Patient Management**
**Có thể làm:**
- ✅ Truy cập patient list pages
- ✅ Xem giao diện quản lý bệnh nhân

**Không thể làm:**
- ❌ Search patients
- ❌ View patient details
- ❌ Edit patient information
- ❌ Create new patient records

### **✅ Schedule & Appointments**
**Có thể làm:**
- ✅ Xem calendar interface
- ✅ Navigate qua các tháng

**Không thể làm:**
- ❌ Add appointments to calendar
- ❌ Modify existing appointments
- ❌ Set availability hours
- ❌ Block time slots

---

## 🔄 **NAVIGATION & GENERAL FEATURES**

### **✅ Hoạt động tốt**
- ✅ **Login/Logout**: Hoàn toàn functional
- ✅ **Page Navigation**: Tất cả links trong sidebar hoạt động
- ✅ **Responsive Design**: Hoạt động tốt trên mobile và desktop
- ✅ **Real-time Data**: Dashboard data load từ backend
- ✅ **Session Management**: Maintain login state
- ✅ **Role-based Access**: Different dashboards cho different roles

### **❌ Chưa hoạt động**
- ❌ **Action Buttons**: Hầu hết buttons chỉ là UI placeholder
- ❌ **Form Submissions**: Forms không submit được
- ❌ **File Operations**: Upload/download không hoạt động
- ❌ **Search Functions**: Search boxes không functional
- ❌ **Real-time Notifications**: Notification system chưa hoạt động

---

## 🎯 **CÁCH SỬ DỤNG HỆ THỐNG HIỆU QUẢ**

### **Để Demo/Presentation:**
1. **Focus vào UI/UX**: Showcase professional design
2. **Demonstrate Navigation**: Show smooth page transitions
3. **Highlight Data Integration**: Real-time data từ backend
4. **Show Authentication**: Multi-role login system
5. **Explain Architecture**: 11 microservices backend

### **Để Learning/Development:**
1. **Study Code Structure**: Modern Next.js patterns
2. **Understand Microservices**: 11 independent services
3. **Learn API Integration**: GraphQL và REST APIs
4. **Practice UI Development**: Professional component design
5. **Database Integration**: Supabase real-time features

### **Để Portfolio:**
1. **Highlight Technical Skills**: Full-stack development
2. **Show Architecture Knowledge**: Microservices design
3. **Demonstrate Modern Tools**: Next.js, TypeScript, Docker
4. **Present Problem-solving**: Healthcare domain complexity
5. **Explain Design Decisions**: Technology choices

---

## ⚠️ **QUAN TRỌNG - ĐIỀU NGƯỜI DÙNG CẦN BIẾT**

### **Đây KHÔNG phải là sản phẩm hoàn chỉnh**
- Hệ thống hiện tại là **prototype với UI hoàn chỉnh** nhưng **functionality hạn chế**
- Nhiều buttons và forms chỉ là **UI placeholders**
- **Backend architecture hoàn chỉnh** nhưng **frontend interactions chưa đầy đủ**

### **Phù hợp cho:**
- ✅ **Graduation thesis demonstration**
- ✅ **Technical portfolio showcase**
- ✅ **Learning modern web development**
- ✅ **Understanding microservices architecture**

### **KHÔNG phù hợp cho:**
- ❌ **Production hospital use**
- ❌ **Real patient data management**
- ❌ **Actual appointment booking**
- ❌ **Commercial deployment**

---

## 🔮 **ROADMAP PHÁT TRIỂN**

### **Phase 1: Core Functionality (Cần 2-3 tuần)**
1. Implement appointment booking flow
2. Make action buttons functional
3. Complete payment frontend integration
4. Add basic file upload/download

### **Phase 2: Advanced Features (Cần 3-4 tuần)**
1. Real-time messaging system
2. Video consultation features
3. Advanced search và filtering
4. Notification system integration

### **Phase 3: Production Ready (Cần 2-3 tuần)**
1. Security hardening
2. Performance optimization
3. Mobile app development
4. Comprehensive testing

**Tổng thời gian để hoàn thiện: 7-10 tuần development**

---

## 📞 **HỖ TRỢ & LIÊN HỆ**

Đây là graduation thesis project. Để được hỗ trợ hoặc đóng góp ý kiến, vui lòng liên hệ development team.

**Lưu ý**: Tài liệu này phản ánh tình trạng thực tế của hệ thống, không phải marketing material. Mục đích là giúp người dùng hiểu rõ khả năng và hạn chế hiện tại của sản phẩm.
