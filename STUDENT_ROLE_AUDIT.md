# KIỂM TRA VÀ HOÀN THIỆN ROLE SINH VIÊN

## 1. Kết quả đánh giá source ban đầu

| Chức năng | Trạng thái trước khi sửa | Kết quả sau bản vá |
|---|---|---|
| Đăng nhập bằng mã sinh viên | Thiếu; backend chỉ tìm `users.email` | Đã hỗ trợ đăng nhập bằng **email hoặc mã sinh viên** |
| Xem danh sách đợt lao động | Có | Giữ nguyên; tiếp tục đọc MySQL, lọc theo khoa/lớp/khóa; sửa lọc “tất cả khoa” |
| Xem chi tiết sự kiện | Có | Giữ nguyên layout; bổ sung thời lượng giờ và sửa tải trực tiếp URL không bị 404 giả |
| Đăng ký tham gia | Có nhưng kiểm tra chủ yếu ở giao diện | Bổ sung kiểm tra phía backend: trạng thái, thời hạn, đối tượng, sức chứa, giới hạn đăng ký và trùng lịch |
| Chọn ngày hoặc ca | Giao diện chưa lưu lựa chọn | Đã hiển thị lựa chọn và lưu ngày/ca/giờ vào đăng ký |
| Hủy trước thời hạn | Có | Bổ sung kiểm tra phía backend, cập nhật số lượng, xóa bản ghi điểm danh và tạo thông báo |
| Xem trạng thái đăng ký | Có | Giữ nguyên, bổ sung ngày/ca đã chọn, điểm danh và kết quả ngày công |
| Điểm danh bằng QR | Thiếu | Đã thêm QR check-in/check-out có JWT, hạn dùng, camera và nhập mã thủ công |
| Xem lịch sử tham gia | Chưa có trang tổng hợp riêng | Đã thêm `/student/history` tổng hợp đăng ký, điểm danh và ngày công |
| Xem tổng số ngày công | Có nhưng có thể lấy dữ liệu mock/stale | Đã lấy hồ sơ và ngày công từ MySQL; tính cả `RECORDED` và `ADJUSTED` |
| Gửi khiếu nại chưa ghi nhận | Có | Giữ nguyên API MySQL; bổ sung mở form từ lịch sử và tự chọn sự kiện/loại điểm danh |

## 2. Phạm vi phân quyền

Các API mới dành riêng cho sinh viên đều yêu cầu JWT và role `STUDENT`:

```http
GET  /api/student/profile
GET  /api/student/history
POST /api/attendance/student/scan
```

API tạo QR chỉ cho `ORGANIZER`, `ADMIN` hoặc `SUPER_ADMIN`:

```http
POST /api/attendance/event/:eventId/qr
```

Organizer chỉ được tạo QR cho sự kiện do chính mình phụ trách. Admin và Super Admin có quyền hỗ trợ quản lý.

## 3. Luồng nghiệp vụ sinh viên sau khi áp dụng

```text
Sinh viên đăng nhập bằng email hoặc mã sinh viên
→ Xem sự kiện đúng khoa/lớp/khóa
→ Mở chi tiết
→ Chọn/xác nhận ngày và ca
→ Đăng ký
→ Chờ Organizer/Admin duyệt đăng ký
→ Organizer tạo QR check-in tại trang điểm danh
→ Sinh viên quét QR
→ Organizer tạo QR check-out
→ Sinh viên quét QR lần hai
→ Organizer hoàn tất sự kiện
→ Hệ thống ghi ngày công
→ Sinh viên xem lịch sử/ngày công hoặc gửi khiếu nại
```

## 4. Các file được cập nhật

### Backend

- `BE/src/services/authService.ts`
- `BE/src/controllers/authController.ts`
- `BE/src/services/registrationService.ts`
- `BE/src/controllers/registrationController.ts`
- `BE/src/services/attendanceService.ts`
- `BE/src/controllers/attendanceController.ts`
- `BE/src/routes/attendanceRoutes.ts`
- `BE/src/services/studentService.ts`
- `BE/src/controllers/studentController.ts`
- `BE/src/routes/studentRoutes.ts`
- `BE/src/server.ts`
- `BE/src/types/qrcode.d.ts`
- `BE/package.json`

### Frontend sinh viên

- `FE/src/pages/auth/LoginPage.tsx`
- `FE/src/pages/student/WorkEventsPage.tsx`
- `FE/src/pages/student/WorkEventDetailPage.tsx`
- `FE/src/pages/student/MyRegistrationsPage.tsx`
- `FE/src/components/student/SchedulePageClient.tsx`
- `FE/src/components/student/StudentDashboardClient.tsx`
- `FE/src/pages/student/WorkCreditsPage.tsx`
- `FE/src/pages/student/ComplaintsPage.tsx`
- `FE/src/pages/student/QrAttendancePage.tsx`
- `FE/src/pages/student/ParticipationHistoryPage.tsx`
- `FE/app/student/qr-attendance/page.tsx`
- `FE/app/student/history/page.tsx`
- `FE/src/services/studentApi.ts`
- `FE/src/services/attendanceApi.ts`
- `FE/src/routes/nav-config.ts`
- `FE/src/hooks/useAppStore.tsx`
- `FE/src/types/index.ts`

### File hỗ trợ Organizer cho nghiệp vụ QR

- `FE/src/pages/organizer/AttendancePage.tsx`

File Organizer này chỉ bổ sung nút tạo QR để chức năng quét của sinh viên hoạt động trọn luồng; không chuyển quyền quản lý sang sinh viên.

## 5. Cách áp dụng

Giải nén patch, mở PowerShell tại thư mục patch rồi chạy:

```powershell
Set-ExecutionPolicy -Scope Process Bypass

.\APPLY_FIX.ps1 `
  -ProjectRoot "D:\DThU_Working\DThu-Workday-DB-CRUD-Fixed\DThu-Workday-DB-CRUD-Fixed"
```

Script sẽ:

1. Kiểm tra cấu trúc `FE` và `BE`.
2. Sao lưu file cũ thành `*.bak-student-role-<timestamp>`.
3. Chép các file mới vào đúng vị trí.
4. Cài package `qrcode` cho backend.

Bản vá **không thay đổi Prisma schema**, vì vậy không cần tạo migration mới.

## 6. Khởi động lại

Backend:

```powershell
cd "<PROJECT_ROOT>\BE"
npm run dev
```

Frontend:

```powershell
cd "<PROJECT_ROOT>\FE"
npm run dev
```

Hoặc chạy từ thư mục gốc nếu `package.json` đã cấu hình concurrently:

```powershell
npm run dev
```

## 7. Kiểm tra nhanh API sinh viên

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\CHECK_STUDENT_ROLE.ps1
```

Script chỉ đọc dữ liệu, không thêm/sửa/xóa database. Nó kiểm tra:

- API health.
- Đăng nhập bằng mã sinh viên hoặc email.
- Hồ sơ sinh viên.
- Danh sách sự kiện.
- Đăng ký.
- Ngày công.
- Lịch sử tham gia.

## 8. Kiểm thử thủ công QR

1. Dùng Organizer mở một sự kiện đã có đăng ký sinh viên được duyệt.
2. Vào **Điểm danh** và bấm **Tạo QR check-in**.
3. Dùng tài khoản Student vào **Điểm danh QR**.
4. Quét QR hoặc dán đường dẫn QR vào ô nhập mã.
5. Organizer tạo **QR check-out** và Student quét lần hai.
6. Kiểm tra bảng `attendances` trong DBeaver.

QR camera chỉ hoạt động trên `localhost` hoặc website HTTPS. Trình duyệt chưa hỗ trợ `BarcodeDetector` vẫn có thể dùng ô nhập/dán mã.

## 9. Giới hạn còn lại của mô hình ngày/ca

Schema hiện tại quy định **mỗi sự kiện có một ngày và một ca** trong bảng `work_events`. Bản vá đã cho sinh viên xác nhận và lưu lựa chọn ngày/ca của sự kiện. Để một sự kiện có nhiều ngày hoặc nhiều ca độc lập, cần bổ sung bảng như `event_sessions` và giao diện Organizer cấu hình nhiều phiên; đây là thay đổi schema lớn và nên triển khai ở giai đoạn riêng.

## 10. Kiểm tra kỹ thuật đã thực hiện

- Đọc và đối chiếu toàn bộ route/page liên quan Role Student.
- Phân tích cú pháp 219 file TypeScript/TSX: không phát hiện lỗi cú pháp.
- Không thêm mật khẩu, `.env`, `node_modules`, `.next` hoặc dữ liệu MySQL vào patch.
- Chưa chạy kiểm thử runtime với MySQL trên máy người dùng; cần chạy `CHECK_STUDENT_ROLE.ps1` và kiểm thử QR sau khi áp dụng.
