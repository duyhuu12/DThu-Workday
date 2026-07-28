# DThU Workday — FE/BE Enhanced

Hệ thống quản lý ngày công sinh viên, được tách rõ thành Frontend và Backend nhưng giữ nguyên layout, route và chức năng hiện có.

## Cấu trúc

```text
.
├── FE/       Next.js + TypeScript + Tailwind
├── BE/       Express + TypeScript + Prisma + MySQL
├── scripts/
├── START_LOCAL.ps1
├── CHECK_PROJECT.ps1
└── docker-compose.yml
```

## Yêu cầu chạy local

- Node.js 20 trở lên.
- MySQL đang chạy tại `127.0.0.1:3306`.
- Database `dthu_workday` và user MySQL ứng dụng.

## 1. Tạo cấu hình

### Backend

```powershell
Copy-Item .\BE\.env.example .\BE\.env
notepad .\BE\.env
```

Các giá trị quan trọng:

```env
DATABASE_URL="mysql://dthu_app:dinhhuuduy46@127.0.0.1:3306/dthu_workday"
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=dthu_app
DATABASE_PASSWORD=dinhhuuduy46
DATABASE_NAME=dthu_workday
JWT_SECRET=CHUOI_BI_MAT_DAI_HON_32_KY_TU
```

`dinhhuuduy46` là mật khẩu gốc. Phần mật khẩu trong `DATABASE_URL` phải URL-encode nếu có ký tự đặc biệt.

### Frontend

```powershell
Copy-Item .\FE\.env.example .\FE\.env.local
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false
NEXT_PUBLIC_DEMO_PASSWORD=123456
```

Mặc định danh sách tài khoản demo bị ẩn. Chỉ bật `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true` trên môi trường kiểm thử nội bộ.

## 2. Cài package

```powershell
npm run install:all
```

## 3. Prisma

```powershell
npm run prisma:generate
npm run prisma:migrate
```

Chỉ tạo lại dữ liệu demo khi database không có dữ liệu quan trọng:

```powershell
# Trong BE/.env
ALLOW_DATABASE_SEED=true
SEED_DEMO_PASSWORD=123456

npm run prisma:seed
```

Sau seed, đổi lại:

```env
ALLOW_DATABASE_SEED=false
```

## 4. Chạy hệ thống

### Cách nhanh

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\START_LOCAL.ps1
```

### Chạy thủ công bằng một terminal

```powershell
npm run dev
```

### Chạy riêng

```powershell
npm run dev --prefix BE
npm run dev --prefix FE
```

Truy cập:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
Health:   http://localhost:8080/api/health
```

## 5. Kiểm tra cấu trúc và kết nối

```powershell
.\CHECK_PROJECT.ps1
```

Kiểm tra build:

```powershell
npm run typecheck
npm run build
```

## 6. Điểm danh sinh viên

1. Organizer mở sự kiện.
2. Vào **Điểm danh**.
3. Danh sách chỉ lấy các đăng ký đã duyệt từ MySQL.
4. Có thể check-in, check-out, đánh dấu vắng hoặc cập nhật hàng loạt.
5. Vào **Kết quả** và chọn **Xác nhận kết quả**.
6. Backend ghi ngày công cho sinh viên có mặt.
7. Nút **Xuất CSV** tải danh sách điểm danh.

## 7. Xuất báo cáo

- Admin → Báo cáo → **Xuất CSV**: tổng hợp ngày công sinh viên.
- Organizer → Báo cáo → **Xuất CSV**: tổng hợp các sự kiện phụ trách.
- Organizer → Kết quả/Điểm danh → **Xuất CSV**: danh sách điểm danh sự kiện.

File có UTF-8 BOM nên có thể mở trực tiếp bằng Microsoft Excel.

## 8. Docker

```powershell
Copy-Item .env.docker.example .env
notepad .env
docker compose up -d --build
```

Kiểm tra:

```powershell
docker compose ps
docker compose logs -f backend
```

Dừng nhưng giữ dữ liệu:

```powershell
docker compose down
```

Xóa cả volume MySQL, chỉ dùng khi chấp nhận mất dữ liệu Docker:

```powershell
docker compose down -v
```

## 9. Lưu ý bảo mật

- Không commit `BE/.env`, `FE/.env.local` hoặc `.env` Docker.
- Không dùng tài khoản MySQL `root` cho backend.
- Đổi mật khẩu và JWT secret trước khi deploy.
- Không bật `ALLOW_DATABASE_SEED=true` trên production.

Xem đánh giá chi tiết tại [CODE_AUDIT.md](./CODE_AUDIT.md).

## 10. Kết quả kiểm tra

Xem [VALIDATION.md](./VALIDATION.md) để biết các bước đã xác thực và phần cần chạy lại trên máy thật.


## Cập nhật CRUD MySQL

Bản này đã thay các thao tác quản trị từng lưu ở `localStorage` bằng API Prisma/MySQL thật. Xem chi tiết tại [`DATABASE_CRUD_FIX.md`](./DATABASE_CRUD_FIX.md).

Sau khi cập nhật source:

```powershell
cd BE
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Mở terminal khác:

```powershell
cd FE
npm run dev
```

Có thể chạy kiểm thử CRUD không phá dữ liệu:

```powershell
.\TEST_DATABASE_CRUD.ps1
```
