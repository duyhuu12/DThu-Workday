# ĐÁNH GIÁ VÀ TÁI CẤU TRÚC DỰ ÁN DThU WORKDAY

## 1. Kết luận nhanh

Source ban đầu có giao diện tương đối đầy đủ và đã có backend Express + Prisma, nhưng cấu trúc còn gây nhầm lẫn vì frontend nằm ở thư mục gốc, backend nằm trong `server/`, dữ liệu frontend trộn giữa API, mock data và `localStorage`.

Bản này đã được tổ chức lại thành:

```text
DThu-Workday-FE-BE-Enhanced/
├── FE/                     # Next.js 13 + TypeScript + Tailwind
├── BE/                     # Express + TypeScript + Prisma + MySQL
├── scripts/                # Script chạy đồng thời FE/BE
├── docker-compose.yml
├── START_LOCAL.ps1
├── CHECK_PROJECT.ps1
└── README.md
```

Giao diện, route App Router và layout theo vai trò được giữ nguyên.

## 2. Các vấn đề phát hiện trong source gốc

### 2.1. Backend dùng sai driver database

- Prisma schema khai báo `provider = "mysql"`.
- `server/package.json` lại cài `@prisma/adapter-pg` và `pg` dành cho PostgreSQL.
- `PrismaClient` được khởi tạo không có adapter dù source dùng Prisma 7.

Hậu quả: backend có thể mở cổng nhưng truy vấn database lỗi hoặc không khởi động được.

### 2.2. Backend mở cổng trước khi xác nhận MySQL

`app.listen()` được gọi trực tiếp. Khi MySQL sai mật khẩu hoặc chưa chạy, `/api/health` vẫn có thể báo API sống nhưng các nghiệp vụ trả 500.

Đã sửa: backend chỉ mở cổng 8080 sau khi `SELECT 1` thành công.

### 2.3. File môi trường chưa an toàn

- `.env.example` ban đầu có mật khẩu thật.
- `JWT_SECRET` có giá trị mặc định trong source.
- Seed dùng mật khẩu hash cố định và luôn xóa dữ liệu.

Đã sửa:

- Chỉ để `CHANGE_ME` trong file mẫu.
- Bắt buộc khai báo `JWT_SECRET`.
- Seed chỉ chạy khi `ALLOW_DATABASE_SEED=true`.
- Mật khẩu demo lấy từ `SEED_DEMO_PASSWORD` rồi hash bằng bcrypt.
- Danh sách tài khoản demo trên trang đăng nhập mặc định bị ẩn và chỉ bật bằng biến môi trường dành cho kiểm thử.

### 2.4. Frontend hard-code địa chỉ API

Nhiều nơi gọi trực tiếp `http://localhost:8080/api`. Điều này gây khó deploy và dễ sai khi đổi domain.

Đã sửa: dùng `NEXT_PUBLIC_API_BASE_URL` qua `FE/.env.local`.

### 2.5. Store frontend đang trộn server state với mock/localStorage

`useAppStore.tsx` vẫn dùng mock data làm giá trị khởi tạo cho sinh viên, tài khoản, khoa, lớp và một số module. Các module sự kiện, đăng ký, ngày công, khiếu nại, thông báo đã gọi API nhưng chưa tách hoàn toàn khỏi local state.

Bản này giữ cơ chế đó để tránh phá layout và các chức năng hiện có. Hướng phát triển tiếp theo là chuyển từng module sang API/query state hoàn toàn.

### 2.6. Điểm danh trên giao diện chưa gọi attendance API

Trang điểm danh ban đầu cập nhật thông qua `updateRegistration()`, trong khi backend đã có bảng `attendances`. Vì vậy trạng thái dễ lệch giữa đăng ký và điểm danh.

Đã sửa:

- Tải danh sách từ `GET /api/attendance/event/:eventId`.
- Check-in, check-out, vắng mặt từng sinh viên.
- Điểm danh hàng loạt.
- Lưu giờ vào/ra và activity log.
- Hoàn tất sự kiện để sinh ngày công.
- Xuất danh sách điểm danh CSV.

### 2.7. Báo cáo chỉ hiển thị dữ liệu local

Trang báo cáo ban đầu lấy từ store/mock và không có xuất file.

Đã sửa:

- Báo cáo Admin đọc dữ liệu tổng hợp từ MySQL.
- Báo cáo Organizer đọc dữ liệu sự kiện do tài khoản đó phụ trách.
- Xuất CSV UTF-8 mở được bằng Excel.
- Xuất danh sách điểm danh theo sự kiện.

## 3. API được bổ sung

### Báo cáo

```http
GET /api/reports/admin/summary
GET /api/reports/admin/students.csv
GET /api/reports/organizer/summary
GET /api/reports/organizer/events.csv
GET /api/reports/events/:eventId/attendance.csv
```

### Điểm danh

```http
GET  /api/attendance/event/:eventId
PUT  /api/attendance/:id/status
PUT  /api/attendance/event/:eventId/bulk
POST /api/attendance/event/:eventId/complete
```

Endpoint cũ `POST /api/attendance/complete` vẫn được giữ để tương thích.

## 4. Chức năng được giữ nguyên

- Layout và màu sắc hiện tại.
- Route Sinh viên, Người phụ trách, Admin, Super Admin.
- Đăng nhập và phân quyền JWT.
- Tạo và cập nhật sự kiện.
- Đăng ký/hủy/duyệt đăng ký.
- Khiếu nại, thông báo, ngày công.
- Dashboard và biểu đồ hiện có.

## 5. Hạn chế còn lại

1. Quản lý sinh viên, lớp, user và settings trên frontend vẫn còn một phần xử lý local/mock.
2. Chưa có upload minh chứng thật lên storage.
3. QR điểm danh hiện mới giữ UI, chưa có token QR hết hạn và trang quét dành cho sinh viên.
4. Chưa có test tự động Jest/Vitest/Supertest.
5. Chưa có phân trang server-side cho dữ liệu lớn.
6. Báo cáo hiện xuất CSV; có thể bổ sung XLSX/PDF khi cần.

## 6. Ưu tiên phát triển tiếp

1. Viết CRUD MySQL thật cho sinh viên, lớp, khoa, user và học kỳ.
2. Bỏ dữ liệu nghiệp vụ khỏi `localStorage`.
3. Dùng TanStack Query cho dữ liệu server.
4. Thêm QR token một lần, thời hạn 30–60 giây.
5. Thêm test cho đăng ký, duyệt, điểm danh và ghi ngày công.
6. Bổ sung xuất XLSX/PDF và bộ lọc học kỳ/khoa/lớp.
