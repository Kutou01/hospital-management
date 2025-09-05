---
type: "always_apply"
---

checklist lỗi/antipattern ngoài database mà team cần TRÁNH khi phát triển microservices:

1. Ranh giới & Coupling

Service quá nhỏ/CRUD-per-entity (chatty) → Gom theo bounded context; đọc tổng hợp qua BFF.

God service (nhồi quá nhiều nghiệp vụ) → Chia lại theo domain + dòng thay đổi.

Shared library trap (chia sẻ “domain model” chung) → Chỉ chia sẻ OpenAPI/Proto/Event schema, sinh client tự động.

2. API Contract & Versioning

Thay đổi phá vỡ client không version → REST /v1…; breaking ⇒ /v2 song song; event có version.

API rò rỉ chi tiết nội bộ → Tách DTO với model; ẩn trường nội bộ.

Thiếu phân trang/lọc/sort → Chuẩn hoá ?page/limit/sort + tối đa giới hạn.

3. Giao tiếp & Độ bền

Chuỗi gọi đồng bộ sâu (A→B→C→D) → Rút ngắn chuỗi; chuyển async/event khi phù hợp; dùng BFF để fan-in.

Không timeout/retry/backoff → Mặc định timeout (3–5s), retry có jitter, giới hạn tối đa.

Không circuit breaker/bulkhead → Bật breaker cho downstream; giới hạn concurrency/nối kết.

POST không idempotent → Bắt buộc Idempotency-Key + lưu cache kết quả.

Trộn orchestration/choreography vô tội vạ → Chọn 1: Saga orchestrator cho quy trình phức tạp; choreography cho broadcast nhẹ.

4. Hàng đợi & Sự kiện

Mộng “exactly-once” → Thiết kế at-least-once + de-dupe (Idempotency/In-box).

Không DLQ/Replay → Bắt buộc Dead-Letter Queue + tool replay an toàn.

Không giám sát age/depth → Metric outbox_age_seconds, queue_depth + cảnh báo.

5. Quan sát & Xử lý lỗi

Không Correlation-Id → Truyền header X-Correlation-Id xuyên suốt (FE→BFF→svc→event).

Log tuỳ hứng → Log JSON; không log PHI/PII; mask nhạy cảm.

Thiếu metrics & trace → RED metrics (Rate/Errors/Duration); OpenTelemetry trace; dashboard & alert bắt buộc.

Lỗi không có chuẩn → Problem Details { code, message, details?, correlationId }.

6. Hiệu năng & Tài nguyên

N+1 call từ FE → BFF tổng hợp; cache theo màn hình.

Payload phình to, nén tắt → Bật gzip/br; giới hạn kích thước body; dùng presigned URL cho upload lớn.

Không giới hạn thread/conn → Connection pool; giới hạn worker; backpressure khi queue đầy.

Readiness/Liveness thiếu → /healthz (liveness), /readyz kiểm DB/queue; graceful shutdown bắt SIGTERM.

7. Bảo mật

Tin cậy theo mạng (no mTLS) → mTLS nội bộ hoặc policy mạng chặt.

JWT verify hời hợt → Kiểm issuer/audience/exp/nbf; xoay khóa (JWKS).

Rỗng rate-limit → Rate limit/throttle per client/route; captcha với endpoints nhạy cảm.

Secrets trong repo → Secret manager; rotate định kỳ.

8. Triển khai & Phát hành

Lock-step release (đẩy cả đám cùng lúc) → Deploy độc lập per service; backward-compat contract trước.

Không chiến lược phát hành → Blue/Green/Canary + feature flag; rollback nhanh.

Migration phá vỡ → Expand→Migrate→Contract; không DDL “nặng” giờ cao điểm.

9. Kiểm thử

Chỉ unit test → Pyramid: unit + contract (CDC) + integration (Testcontainers) + E2E.

Không test retry/timeout/chaos → Kịch bản provider down, webhook lặp, latency spike.

Không test idempotency → E2E F5/duplicate requests phải trả kết quả cũ.

10. Cấu hình & Thời gian

Hard-code config → 12-factor: ENV, config per env, không rebuild khi đổi.

Timezone rối → UTC cho timestamp; DATE cho DOB; dùng monotonic clock đo duration.

11. Caching & Consistency UX

Cache không invalidation → TTL rõ; cache key chứa phiên bản/tenant; “pending” UX cho eventual consistency.

Client fan-out → FE chỉ gọi BFF; BFF gọi các service bên dưới.

12. Đa tenant / Quy mô

Lẫn dữ liệu cơ sở → Thêm tenant_id mọi bảng/domain & mọi token; kiểm tra ở tầng service.

Autoscale mù mờ → HPA dựa p95 latency/queue depth thay vì CPU thuần.

Quick “Do/Don’t” cho agent

DO: BFF, Idempotency, Saga + Outbox/Inbox (+DLQ), RED metrics + OTel, Problem Details, JWT verify chuẩn, mTLS, readiness/liveness, graceful shutdown, CDC tests, 12-factor.
DON’T: Sync chains dài, dual-write, no timeout/retry, shared model lib, breaking API không version, log PHI, secrets trong repo, lock-step release.
