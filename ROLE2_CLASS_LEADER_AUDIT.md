# Đánh giá và triển khai Role 2 — Cán bộ lớp/Lớp trưởng

## 1. Kết luận

Role `CLASS_LEADER` đã được bổ sung thành một vai trò độc lập trong MySQL/Prisma và giao diện, nhưng vẫn giữ toàn bộ quyền cá nhân của một sinh viên.

| Yêu cầu | Trạng thái | Cách triển khai |
|---|---:|---|
| Xem sinh viên trong lớp | ✅ | Chỉ truy vấn `students.class_id = users.managed_class_id` |
| Theo dõi đã/chưa đăng ký | ✅ | Chọn sự kiện, xem toàn bộ lớp; đăng ký đã hủy được tính là chưa đăng ký |
| Nhắc sinh viên chưa đủ ngày công | ✅ | Gửi notification đến nhóm có `accumulated_workdays < required_workdays` |
| Xác nhận sơ bộ người tham gia | ✅ | Lưu riêng trong `registrations.preliminary_*`, không đổi duyệt chính thức |
| Xuất danh sách ngày công lớp | ✅ | Tải CSV UTF-8, dữ liệu đọc từ MySQL |
| Gửi thông báo đến lớp | ✅ | Gửi toàn lớp, nhóm thiếu ngày công hoặc nhóm chưa đăng ký sự kiện |
| Không được sửa ngày công | ✅ | API sửa/trạng thái ngày công chỉ cho `ADMIN`, `SUPER_ADMIN` |
| Giữ quyền cá nhân của sinh viên | ✅ | Đăng ký, QR, lịch, lịch sử, ngày công, khiếu nại vẫn dùng được |

## 2. Phân quyền

### Cán bộ lớp được phép

- Xem dữ liệu đúng lớp được phân công.
- Xem tiến độ ngày công của sinh viên trong lớp.
- Xem trạng thái đăng ký theo từng sự kiện áp dụng cho lớp.
- Đánh dấu `Đã xác nhận sơ bộ`, `Cần kiểm tra`, hoặc bỏ xác nhận sơ bộ.
- Gửi nhắc nhở và thông báo trong lớp.
- Xuất CSV ngày công của lớp.

### Cán bộ lớp không được phép

- Thêm, sửa hoặc xóa sinh viên.
- Duyệt đăng ký chính thức.
- Check-in/check-out thay sinh viên.
- Sửa trạng thái hoặc giá trị ngày công.
- Xử lý khiếu nại.
- Xem dữ liệu lớp khác.
- Tạo, duyệt hoặc sửa sự kiện.

## 3. Luồng nghiệp vụ

```text
Admin
  → Cán bộ lớp
  → Phân công một sinh viên cho đúng lớp đang học
  → users.role = CLASS_LEADER
  → users.managed_class_id = students.class_id

Cán bộ lớp đăng nhập lại
  → /classleader/dashboard
  → Xem sinh viên và đăng ký của lớp
  → Xác nhận sơ bộ / gửi nhắc nhở / xuất báo cáo
```

Xác nhận sơ bộ không thay thế việc duyệt của Organizer/Admin:

```text
registration.status                = trạng thái chính thức
registration.preliminary_status    = ý kiến sơ bộ của cán bộ lớp
```

## 4. Database thay đổi

Migration mới:

```text
BE/prisma/migrations/20260728073000_add_class_leader_role/migration.sql
```

Thay đổi chính:

- Thêm `CLASS_LEADER` vào enum `users.role`.
- Thêm `users.managed_class_id` liên kết đến `classes.id`.
- Thêm `registrations.preliminary_status`.
- Thêm thời gian và người xác nhận sơ bộ.

Migration không xóa bảng và không xóa dữ liệu hiện có.

## 5. API

### Cán bộ lớp

```http
GET  /api/class-leader/profile
GET  /api/class-leader/dashboard
GET  /api/class-leader/events
GET  /api/class-leader/students?eventId=:eventId
PUT  /api/class-leader/registrations/:id/preliminary
POST /api/class-leader/notifications
POST /api/class-leader/reminders/workdays
GET  /api/class-leader/reports/work-credits.csv
```

### Admin phân công

```http
GET    /api/class-leader/admin/assignments
PUT    /api/class-leader/admin/assign
DELETE /api/class-leader/admin/assignments/:userId
```

## 6. Trang giao diện

```text
/classleader/dashboard
/classleader/students
/classleader/registrations
/classleader/reminders
/classleader/announcements
/classleader/reports
/classleader/notifications
/admin/class-leaders
```

## 7. Cách áp dụng migration an toàn

Sao lưu database trước khi migrate. Sau đó:

```powershell
cd BE
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Không chạy `prisma db seed` trên database đang có dữ liệu. Seed chỉ dùng cho database demo trống khi `ALLOW_DATABASE_SEED=true`.

Mở terminal khác:

```powershell
cd FE
npm run dev
```

Admin truy cập:

```text
http://localhost:3000/admin/class-leaders
```

Sau khi phân công, tài khoản được phân công phải đăng xuất và đăng nhập lại để frontend chuyển sang `/classleader/dashboard`.

## 8. Tài khoản demo trên database trống

Khi chủ động seed database demo, hệ thống tạo:

```text
classleader@dthu.edu.vn
```

Mật khẩu là giá trị `SEED_DEMO_PASSWORD`. Không cần seed để sử dụng Role 2 trên database hiện tại; Admin có thể phân công một sinh viên có sẵn.

## 9. Kiểm tra bảo vệ ngày công

Các route ghi ngày công vẫn được giới hạn:

```http
PUT /api/credits/:id/status  → ADMIN, SUPER_ADMIN
PUT /api/credits/:id/adjust  → ADMIN, SUPER_ADMIN
```

Cán bộ lớp chỉ đọc dữ liệu tổng hợp và tải CSV. Không có API Role 2 nào gọi `workCredit.update`, `workCredit.create` hoặc `workCredit.delete`.

## 10. Kiểm thử sau khi áp dụng

1. Admin phân công một sinh viên làm cán bộ lớp.
2. Đăng nhập lại bằng tài khoản đó.
3. Kiểm tra chỉ thấy sinh viên cùng lớp.
4. Chọn một sự kiện và đối chiếu đã/chưa đăng ký.
5. Xác nhận sơ bộ một đăng ký; kiểm tra cột `preliminary_status` trong MySQL.
6. Gửi nhắc nhở; kiểm tra bảng `notifications`.
7. Xuất CSV và mở bằng Excel.
8. Thử gọi API sửa ngày công; phải nhận HTTP `403`.
9. Hủy phân công; tài khoản trở lại vai trò Sinh viên.
