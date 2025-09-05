---
type: "always_apply"
---

RULES: TRIỂN KHAI 2 DATABASE SONG SONG (SUPABASE = AUTH/STORAGE, NEON = DATA DOMAIN) CHUẨN MICROSERVICE

PHẠM VI

Mục tiêu: tách Auth/Storage khỏi dữ liệu nghiệp vụ; mỗi service sở hữu không gian dữ liệu riêng; giao tiếp qua API/Event; tránh shared-DB & distributed-monolith.

KHÔNG THƯƠNG LƯỢNG: (a) KHÔNG join/FK chéo DB/schema; (b) KHÔNG 2PC/cross-DB transaction; (c) KHÔNG dùng Supabase service_key để CRUD domain.

RANH GIỚI & QUYỀN SỞ HỮU DỮ LIỆU

MUST: Mỗi service = 1 schema (tối thiểu) hoặc 1 database riêng trên Neon.

MUST: Mỗi service dùng 1 DB role riêng; role chỉ có quyền trên schema của chính nó; search_path trỏ về schema đó.

MUST: Liên kết liên-domain lưu “ID mềm” (uuid/ulid), kiểm tra ở tầng service.

MUST-NOT: Bảng domain nằm trong public; view/proc chạm schema khác; FDW/DB link online.

VAI TRÒ SUPABASE (AUTH/STORAGE)

MUST: FE đăng nhập Supabase → gửi JWT; BE verify JWKS Supabase; KHÔNG đọc auth.\* để xác thực.

MUST: Webhook user.created/user.updated → gọi Identity Service upsert identity.profiles (ở Neon).

SHOULD: Storage chỉ chứa avatar/file nhỏ (demo); PHI/ảnh lớn dùng object storage khác khi cần.

MUST-NOT: Dùng service_key Supabase cho CRUD dữ liệu domain.

VAI TRÒ NEON (DATABASE-PER-SERVICE)

MUST: Tạo schemas & roles theo bounded context: identity, patient, doctor, appointment, emr, billing, platform.

MUST: Thiết kế bảng cho từng service; kiểu dữ liệu chuẩn:

PK = UUID/ULID; thời gian = timestamptz (UTC); DOB = DATE; tiền = integer cents hoặc numeric(12,2).

Tránh enum cứng; dùng text + CHECK hoặc bảng code set.

Trạng thái thay xóa cứng: status + archived_at/deleted_at.

MUST: Index theo truy vấn; với đặt lịch dùng FOR UPDATE SKIP LOCKED hoặc bảng locks TTL.

GIAO TIẾP GIỮA SERVICES

MUST: BFF để compose dữ liệu UI; Gateway mỏng (auth, rate limit, routing).

MUST: Không DB-to-DB; đọc tổng hợp qua BFF; đồng bộ qua sự kiện.

MUST: Header chuẩn cho mọi call nội bộ:

Authorization: Bearer <JWT>

X-Correlation-Id: <uuid>

Idempotency-Key: <key> (bắt buộc cho mọi POST nhạy cảm)

NHẤT QUÁN & SỰ KIỆN (KHÔNG 2PC)

MUST: Pattern Outbox/Inbox:

Outbox ghi trong cùng transaction với state (ở service phát).

Inbox de-dupe bằng source_event_id (ở service nhận).

MUST: Saga cho luồng nhiều bước (đặt lịch → thanh toán → xác nhận) + bước bù (compensation).

MUST: Idempotency cho POST nhạy cảm (đặt lịch, thanh toán, hoàn tiền).

HỢP ĐỒNG & PHIÊN BẢN

MUST: REST theo /v1/...; thay đổi phá vỡ → /v2 chạy song song đủ thời gian chuyển tiếp.

MUST: Event có event_type, version, occurred_at, aggregate_id; thêm trường mới phải backward-compatible.

MUST-NOT: Chia sẻ “domain model library”; ONLY chia sẻ OpenAPI/Event schema để generate client.

MIGRATIONS

MUST: Mọi thay đổi DB qua migration (Prisma/Flyway/Liquibase); cấm sửa tay.

MUST: Chiến lược Expand → Migrate → Contract; index CONCURRENTLY; backfill theo batch.

BẢO MẬT & TUÂN THỦ

MUST: Least-privilege cho DB role; secrets không commit; rotate định kỳ.

MUST: Data minimization; log không chứa PHI/PII; audit append-only cho hành vi nhạy cảm.

MUST: mTLS hoặc network policy nội bộ; rate limit/throttle & authz theo scope/role.

QUAN SÁT & LỖI

MUST: Truyền/ghi Correlation-Id xuyên FE→BFF→services→event→audit.

MUST: Log JSON; metrics kiểu RED (Rate, Errors, Duration); dashboards & alert.

MUST: Chuẩn lỗi Problem Details: { code, message, details?, correlationId }.

REALTIME & BÁO CÁO

SHOULD: Realtime ở tầng ứng dụng (WebSocket/PubSub) hoặc tự host Realtime/CDC; KHÔNG trông chờ DB-realtime của Supabase cho Neon.

MUST: Báo cáo/KPI chạy ở Reporting DB/Warehouse (CDC/ETL); KHÔNG query nặng trên OLTP.

CI/CD GUARDS (BẮT BUỘC)

Fail PR nếu:

Có bảng domain trong public hoặc GRANT cross-schema.

Tìm thấy Supabase service_key trong backend domain.

Migration không tuân Expand/Migrate/Contract hoặc tạo index không concurrently.

OpenAPI/Event schema breaking (check backward-compat).

E2E POST nhạy cảm thiếu Idempotency-Key hoặc Outbox→Inbox bị mất sự kiện.

MUST: Alert lag Outbox→Inbox; DLQ + công cụ replay.

DEFINITION OF DONE (MỖI SERVICE)

Có schema + role riêng; kết nối bằng DATABASE_URL riêng (search_path đúng schema).

Không FK/JOIN cross-service; liên kết = ID mềm + validation ở app.

POST nhạy cảm có Idempotency; có Outbox (và Inbox nếu nhận event).

API/Event versioned; migration EMC; log JSON + Correlation-Id; trả lỗi theo Problem Details.

TẠO NHANH (TEMPLATES — AGENT CHÈN THẲNG)

Neon — schema/role (ví dụ appointment):

create schema if not exists appointment;
create role svc_appt login password 'STRONG_PASS';
grant usage on schema appointment to svc_appt;
grant select, insert, update, delete on all tables in schema appointment to svc_appt;
alter default privileges in schema appointment grant select, insert, update, delete on tables to svc_appt;
alter role svc_appt set search_path = appointment, public;

Connection string (service):

DATABASE_URL="postgresql://svc_appt:STRONG_PASS@<neon-host>/<db>?sslmode=require"

Outbox/Inbox tối thiểu:

-- <schema>.outbox
create table <schema>.outbox(
id bigserial primary key,
event_type text not null,
version int not null default 1,
aggregate_id uuid not null,
payload jsonb not null,
occurred_at timestamptz default now(),
processed boolean default false
);
create index on <schema>.outbox(processed, occurred_at);

-- <schema>.inbox
create table <schema>.inbox(
id bigserial primary key,
source_event_id text unique not null,
payload jsonb not null,
received_at timestamptz default now()
);

Idempotency (ví dụ billing):

create table billing.idempotency_keys(
key text primary key,
response jsonb,
created_at timestamptz default now()
);

Audit log (cross-cutting):

create table platform.audit_log(
id bigserial primary key,
actor uuid,
action text not null,
entity_type text not null,
entity_id text not null,
before jsonb, after jsonb,
reason text,
correlation_id text,
at timestamptz default now()
);

ANTIPATTERN DENYLIST (TỰ ĐỘNG TỪ CHỐI)

Shared schema/public; JOIN/FDW cross-DB; 2PC; dual-write; dùng service_key Supabase cho domain; API/Event không version; POST nhạy cảm không có Idempotency; outbox ngoài transaction; report trên OLTP; log PHI; thiếu Correlation-Id; migration sửa tay.
