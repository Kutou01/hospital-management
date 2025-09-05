---
type: "always_apply"
---

Nhóm Core (làm trước)

API Gateway + BFF — [MVP]

Vai trò: xác thực JWT Supabase, rate-limit, routing; BFF gom dữ liệu nhiều service thành payload cho UI.

DB: không sở hữu dữ liệu (stateless).

API mẫu: /bff/availability, /bff/appointments, /bff/billing.

Identity Service — [MVP]

Neon schema: identity.\* → profiles(user_id PK), roles, permissions.

Nhiệm vụ: nhận webhook user.created từ Supabase → upsert profile; cấp quyền nội bộ.

Sự kiện: USER_PROVISIONED.

Patient Service — [MVP]

Schema: patient.\* → patients, contacts, insurances.

Nhiệm vụ: CRUD bệnh nhân, liên kết profiles.

Doctor Service — [MVP]

Schema: doctor.\* → doctors, departments, schedules.

Nhiệm vụ: danh bạ bác sĩ/khoa, lịch làm việc.

Appointment Service (orchestrator) — [MVP]

Schema: appointment.\* → slots, appointments(RESERVED/CONFIRMED/CANCELLED), locks, outbox.

Nhiệm vụ: giữ slot, đặt lịch, điều phối Saga với Billing.

Sự kiện: APPOINTMENT_RESERVED/CONFIRMED/CANCELLED.

Billing / Payments Service — [MVP]

Schema: billing.\* → invoices, payments, payment_requests, idempotency_keys, inbox, outbox.

Nhiệm vụ: tạo hóa đơn, nhận webhook provider, idempotency, bù trừ.

Sự kiện: PAYMENT_CONFIRMED/FAILED.

Notification Service — [MVP]

Schema (tuỳ): notification.\* (log gửi).

Nhiệm vụ: nghe sự kiện (APPOINTMENT_CONFIRMED, PAYMENT_CONFIRMED) → email/SMS/push.

Với 7 service này bạn có luồng: đăng nhập (Supabase) → xem slot → đặt lịch (RESERVED) → thanh toán → xác nhận (CONFIRMED) → thông báo.

Nhóm Y tế mở rộng (làm sau khi cần)

EMR Service — [Later]

Schema: emr.\* → visits, orders, diagnoses, lab_results(meta).

Nhiệm vụ: hồ sơ khám; mở hồ sơ khi APPOINTMENT_CHECKED_IN.

Pharmacy Service — [Later]

Schema: pharmacy.\* → drugs, stock, prescriptions.
