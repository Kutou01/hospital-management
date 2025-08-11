# 🔄 Appointment Status Workflow - Specification

## Tổng quan
Tài liệu này định nghĩa đầy đủ appointment status workflow cho hệ thống quản lý bệnh viện, bao gồm các trạng thái, transitions, business rules và implementation requirements.

## 📊 Status Definitions

### **1. scheduled** (Đã lên lịch)
- **Mô tả**: Lịch hẹn vừa được tạo, chờ xác nhận
- **Người tạo**: Patient hoặc Receptionist
- **Thời gian**: Khi appointment được book
- **Permissions**: Patient có thể cancel/reschedule

### **2. confirmed** (Đã xác nhận)
- **Mô tả**: Doctor hoặc Receptionist đã xác nhận lịch hẹn
- **Người xác nhận**: Doctor hoặc Receptionist
- **Thời gian**: Trước appointment date
- **Permissions**: Có thể cancel/reschedule với restrictions

### **3. checked_in** (Đã check-in)
- **Mô tả**: Patient đã check-in tại reception
- **Người thực hiện**: Receptionist
- **Thời gian**: Trong ngày appointment, trước appointment time
- **Business Rules**: 
  - Chỉ có thể check-in trong ngày appointment
  - Phải verify insurance và documents

### **4. in_progress** (Đang khám)
- **Mô tả**: Doctor đã bắt đầu consultation
- **Người thực hiện**: Doctor
- **Thời gian**: Trong appointment time slot
- **Business Rules**: 
  - Chỉ Doctor có thể start consultation
  - Phải đã check-in trước đó

### **5. completed** (Hoàn thành)
- **Mô tả**: Consultation đã hoàn thành
- **Người thực hiện**: Doctor
- **Thời gian**: Sau khi consultation kết thúc
- **Business Rules**: 
  - Phải có medical record entry
  - Có thể có prescription

### **6. cancelled** (Đã hủy)
- **Mô tả**: Lịch hẹn bị hủy bởi Patient, Doctor hoặc Receptionist
- **Người thực hiện**: Patient/Doctor/Receptionist
- **Thời gian**: Bất kỳ lúc nào trước khi completed
- **Business Rules**: 
  - Phải có reason
  - Free up time slot

### **7. no_show** (Không đến)
- **Mô tả**: Patient không đến trong appointment time
- **Người thực hiện**: System (automated) hoặc Receptionist
- **Thời gian**: 15 phút sau appointment end time
- **Business Rules**: 
  - Automated detection
  - Có thể manual override

## 🔄 Status Transition Flow

### **Main Workflow**
```
scheduled → confirmed → checked_in → in_progress → completed
```

### **Alternative Flows**
```
scheduled → cancelled
confirmed → cancelled  
checked_in → cancelled
checked_in → no_show (automated)
confirmed → no_show (automated)
```

## 📋 Transition Rules Matrix

| From Status | To Status | Who Can Do | Conditions | Business Rules |
|-------------|-----------|------------|------------|----------------|
| scheduled | confirmed | Doctor/Receptionist | Before appointment date | Optional step |
| scheduled | cancelled | Patient/Doctor/Receptionist | Anytime | Reason required |
| confirmed | checked_in | Receptionist | On appointment date | Insurance verification |
| confirmed | cancelled | Patient/Doctor/Receptionist | Before appointment | Reason required |
| confirmed | no_show | System/Receptionist | 15min after end time | Automated |
| checked_in | in_progress | Doctor | During appointment time | Only assigned doctor |
| checked_in | cancelled | Doctor/Receptionist | Emergency only | Special reason |
| checked_in | no_show | Receptionist | Manual override | Special cases |
| in_progress | completed | Doctor | After consultation | Medical record required |
| in_progress | cancelled | Doctor | Emergency only | Special circumstances |

## ⏰ Time-based Rules

### **Automated Transitions**
1. **No-show Detection**: 
   - Trigger: 15 minutes after appointment end time
   - Condition: Status is still `confirmed` or `checked_in`
   - Action: Auto-change to `no_show`

2. **Reminder Notifications**:
   - 24 hours before: Confirmation reminder
   - 2 hours before: Check-in reminder
   - 30 minutes before: Appointment reminder

### **Time Restrictions**
1. **Check-in Window**: 
   - Earliest: 2 hours before appointment
   - Latest: 30 minutes after start time

2. **Cancellation Policies**:
   - Patient: Up to 2 hours before appointment
   - Doctor/Receptionist: Anytime with reason

## 🔐 Permission Matrix

| Role | scheduled | confirmed | checked_in | in_progress | completed | cancelled | no_show |
|------|-----------|-----------|------------|-------------|-----------|-----------|---------|
| Patient | View, Cancel | View, Cancel* | View | View | View | - | - |
| Doctor | View, Confirm, Cancel | View, Cancel, Start** | View, Start | View, Complete | View | View | View |
| Receptionist | View, Confirm, Cancel | View, Cancel, CheckIn | View, Cancel* | View | View | View | Set |
| Admin | All | All | All | All | All | All | All |

*With restrictions  
**Only if checked_in

## 📱 Notification Requirements

### **Status Change Notifications**
1. **scheduled → confirmed**: Notify Patient
2. **confirmed → checked_in**: Notify Doctor
3. **checked_in → in_progress**: Notify Patient (optional)
4. **in_progress → completed**: Notify Patient
5. **Any → cancelled**: Notify all parties
6. **Any → no_show**: Notify Doctor, log for Patient

### **Notification Channels**
- **Real-time**: WebSocket for active users
- **Email**: For important status changes
- **SMS**: For urgent notifications (optional)

## 🔧 Implementation Requirements

### **Backend Validation**
1. Status transition validation middleware
2. Permission checking for each transition
3. Business rule enforcement
4. Audit logging for all status changes

### **Frontend Updates**
1. Real-time status updates via WebSocket
2. Role-based action buttons
3. Status-specific UI components
4. Confirmation dialogs for critical actions

### **Database Changes**
1. Add `status_history` table for audit trail
2. Add `transition_reason` field
3. Add `automated_transition` flag
4. Index optimization for status queries

## 📊 Metrics & Monitoring

### **Key Metrics**
1. **No-show Rate**: Percentage of appointments marked as no_show
2. **Cancellation Rate**: By time before appointment
3. **Average Time in Status**: For workflow optimization
4. **Status Transition Errors**: Failed transitions

### **Alerts**
1. High no-show rate for specific doctors
2. Unusual cancellation patterns
3. Status transition failures
4. Long time in `checked_in` status

## 🧪 Testing Requirements

### **Unit Tests**
1. Status transition validation
2. Permission checking
3. Business rule enforcement
4. Time-based logic

### **Integration Tests**
1. End-to-end workflow testing
2. Real-time notification testing
3. Multi-user scenario testing
4. Error handling testing

## 📈 Future Enhancements

### **Phase 2 Features**
1. **Smart Scheduling**: AI-based appointment optimization
2. **Patient Preferences**: Preferred notification methods
3. **Doctor Availability**: Dynamic schedule management
4. **Analytics Dashboard**: Status workflow insights

### **Advanced Features**
1. **Waitlist Management**: Auto-fill cancelled slots
2. **Telemedicine Integration**: Virtual appointment status
3. **Mobile App**: Push notifications
4. **Integration**: Third-party calendar systems
