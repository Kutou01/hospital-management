import { body, param, query, ValidationChain } from 'express-validator';

// Receptionist profile validation
export const validateReceptionistProfile: ValidationChain[] = [
  body('full_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên đầy đủ phải từ 2-100 ký tự'),
  
  body('department_id')
    .optional()
    .matches(/^DEPT\d{3}$/)
    .withMessage('Mã khoa không hợp lệ (định dạng: DEPT001)'),
  
  body('shift_schedule')
    .optional()
    .isObject()
    .withMessage('Lịch trình ca làm việc phải là object'),
  
  body('languages_spoken')
    .optional()
    .isArray()
    .withMessage('Ngôn ngữ phải là mảng'),
  
  body('languages_spoken.*')
    .optional()
    .isString()
    .withMessage('Mỗi ngôn ngữ phải là chuỗi'),
];

// Check-in validation
export const validateCheckIn: ValidationChain[] = [
  body('appointmentId')
    .notEmpty()
    .withMessage('Mã lịch hẹn là bắt buộc')
    .matches(/^APT-\d{6}-\d{3}$/)
    .withMessage('Mã lịch hẹn không hợp lệ'),
  
  body('patientId')
    .notEmpty()
    .withMessage('Mã bệnh nhân là bắt buộc')
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không hợp lệ'),
  
  body('insuranceVerified')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái xác minh bảo hiểm phải là boolean'),
  
  body('documentsComplete')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoàn thành hồ sơ phải là boolean'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự'),
];

// Appointment notes validation
export const validateAppointmentNotes: ValidationChain[] = [
  param('appointmentId')
    .matches(/^APT-\d{6}-\d{3}$/)
    .withMessage('Mã lịch hẹn không hợp lệ'),
  
  body('receptionist_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú lễ tân không được vượt quá 1000 ký tự'),
  
  body('insurance_verified')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái xác minh bảo hiểm phải là boolean'),
];

// Reschedule appointment validation
export const validateRescheduleAppointment: ValidationChain[] = [
  param('appointmentId')
    .matches(/^APT-\d{6}-\d{3}$/)
    .withMessage('Mã lịch hẹn không hợp lệ'),
  
  body('new_date')
    .isISO8601()
    .withMessage('Ngày mới phải có định dạng hợp lệ (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        throw new Error('Ngày mới không được là ngày trong quá khứ');
      }
      return true;
    }),
  
  body('new_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Giờ mới phải có định dạng HH:MM'),
  
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Lý do đổi lịch không được vượt quá 200 ký tự'),
];

// Cancel appointment validation
export const validateCancelAppointment: ValidationChain[] = [
  param('appointmentId')
    .matches(/^APT-\d{6}-\d{3}$/)
    .withMessage('Mã lịch hẹn không hợp lệ'),
  
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Lý do hủy lịch không được vượt quá 200 ký tự'),
];

// Patient search validation
export const validatePatientSearch: ValidationChain[] = [
  query('query')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Từ khóa tìm kiếm phải từ 2-100 ký tự'),
  
  query('phone')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),
  
  query('patient_id')
    .optional()
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không hợp lệ'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1-100'),
];

// Patient details validation
export const validatePatientDetails: ValidationChain[] = [
  param('patientId')
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không hợp lệ'),
];

// Emergency contact validation
export const validateEmergencyContact: ValidationChain[] = [
  param('patientId')
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không hợp lệ'),
  
  body('emergency_contact')
    .isObject()
    .withMessage('Thông tin liên hệ khẩn cấp phải là object'),
  
  body('emergency_contact.name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên người liên hệ phải từ 2-100 ký tự'),
  
  body('emergency_contact.phone')
    .matches(/^0\d{9}$/)
    .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),
  
  body('emergency_contact.relationship')
    .isLength({ min: 2, max: 50 })
    .withMessage('Mối quan hệ phải từ 2-50 ký tự'),
];

// Insurance info validation
export const validateInsuranceInfo: ValidationChain[] = [
  param('patientId')
    .matches(/^PAT-\d{6}-\d{3}$/)
    .withMessage('Mã bệnh nhân không hợp lệ'),
  
  body('insurance_info')
    .isObject()
    .withMessage('Thông tin bảo hiểm phải là object'),
  
  body('insurance_info.provider')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nhà cung cấp bảo hiểm phải từ 2-100 ký tự'),
  
  body('insurance_info.policy_number')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('Số hợp đồng phải từ 5-50 ký tự'),
  
  body('insurance_info.group_number')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Số nhóm phải từ 2-50 ký tự'),
  
  body('insurance_info.expiry_date')
    .optional()
    .isISO8601()
    .withMessage('Ngày hết hạn phải có định dạng hợp lệ'),
];

// Reports validation
export const validateReportsQuery: ValidationChain[] = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Ngày phải có định dạng hợp lệ (YYYY-MM-DD)'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu phải có định dạng hợp lệ (YYYY-MM-DD)'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc phải có định dạng hợp lệ (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        
        if (endDate < startDate) {
          throw new Error('Ngày kết thúc không được trước ngày bắt đầu');
        }
      }
      return true;
    }),
];

// Call next patient validation
export const validateCallNextPatient: ValidationChain[] = [
  body('doctorId')
    .notEmpty()
    .withMessage('Mã bác sĩ là bắt buộc')
    .matches(/^[A-Z]{4}-DOC-\d{6}-\d{3}$/)
    .withMessage('Mã bác sĩ không hợp lệ'),
  
  body('roomNumber')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Số phòng phải từ 1-20 ký tự'),
];

// Appointment status update validation
export const validateAppointmentStatusUpdate: ValidationChain[] = [
  param('appointmentId')
    .matches(/^APT-\d{6}-\d{3}$/)
    .withMessage('Mã lịch hẹn không hợp lệ'),
  
  body('status')
    .isIn(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'])
    .withMessage('Trạng thái không hợp lệ'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự'),
];

// Shift schedule validation
export const validateShiftSchedule: ValidationChain[] = [
  param('receptionistId')
    .isUUID()
    .withMessage('Mã lễ tân không hợp lệ'),
  
  body('schedule')
    .isObject()
    .withMessage('Lịch trình ca làm việc phải là object')
    .custom((value) => {
      // Validate schedule structure
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day in value) {
        if (!validDays.includes(day.toLowerCase())) {
          throw new Error(`Ngày không hợp lệ: ${day}`);
        }
        
        const daySchedule = value[day];
        if (daySchedule && typeof daySchedule === 'object') {
          if (daySchedule.start_time && !daySchedule.start_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            throw new Error(`Giờ bắt đầu không hợp lệ cho ${day}`);
          }
          if (daySchedule.end_time && !daySchedule.end_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
            throw new Error(`Giờ kết thúc không hợp lệ cho ${day}`);
          }
        }
      }
      
      return true;
    }),
];
