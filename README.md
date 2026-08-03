# Lao Động Sinh Viên — DThU Workday

Hệ thống quản lý sự kiện lao động, đăng ký tham gia, điểm danh và ngày công sinh viên của Trường Đại học Đồng Tháp.

## Kiến trúc

```text
.
├── FE/                         Next.js 13, React, TypeScript, Tailwind CSS
├── BE/                         Express, TypeScript, Prisma, MySQL
│   ├── prisma/schema.prisma    Mô hình dữ liệu
│   ├── prisma/migrations/      Lịch sử migration
│   ├── src/                    API và nghiệp vụ backend
│   └── uploads/                Ảnh được tải lên máy chủ
├── scripts/dev.mjs             Khởi động frontend và backend
├── QA_TEST_MATRIX.md           Ma trận kiểm thử
└── PROJECT_AUDIT_REPORT.md     Báo cáo rà soát kỹ thuật
```

Frontend mặc định chạy tại `http://localhost:3000`. Backend chạy tại `http://localhost:8080`, API health check tại `http://localhost:8080/api/health`.

## Vai trò

- Sinh viên: xem và đăng ký sự kiện, xem lịch, điểm danh QR, theo dõi ngày công và gửi khiếu nại.
- Người phụ trách: tạo sự kiện, quản lý sinh viên đăng ký, mở phiên điểm danh và xác nhận kết quả.
- Quản trị viên: duyệt sự kiện, quản lý sinh viên, khoa, lớp, ngày công, báo cáo và khiếu nại.
- Super Admin: quản lý tài khoản, vai trò, cấu hình hệ thống và nhật ký hoạt động.

Hệ thống không còn vai trò Cán bộ lớp.

## Luồng sự kiện

```text
Chờ duyệt → Đã duyệt → Đang đăng ký → Sắp diễn ra
                                            ↓
                                      Đang diễn ra
                                            ↓
                                      Đã hoàn thành
```

Sự kiện chỉ chuyển sang `Đang diễn ra` khi người phụ trách mở phiên check-in đúng ngày và trong khung giờ cho phép. Kết quả chỉ được xác nhận sau giờ kết thúc.

## Yêu cầu môi trường

- Node.js 20 trở lên.
- npm.
- MySQL 8 hoặc phiên bản MariaDB tương thích.
- Một database và tài khoản MySQL có quyền chạy migration.

## Cài đặt

Tại thư mục chứa file `package.json` gốc:

```powershell
npm.cmd run install:all
Copy-Item BE/.env.example BE/.env
```

Cập nhật các giá trị trong `BE/.env`, đặc biệt:

- `DATABASE_URL` dành cho Prisma CLI.
- Nhóm biến `DATABASE_*` dành cho backend khi chạy.
- `JWT_SECRET` tối thiểu 32 ký tự ngẫu nhiên.
- Nhóm biến `SMTP_*` để gửi OTP quên mật khẩu.

Nếu cần cấu hình riêng URL backend cho frontend, tạo `FE/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Khởi tạo Prisma và cập nhật database:

```powershell
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
```

Khởi động toàn hệ thống:

```powershell
npm.cmd run dev
```

## Các lệnh kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
```

Kiểm tra riêng frontend:

```powershell
npm.cmd run lint --prefix FE
npm.cmd run typecheck --prefix FE
```

Kiểm tra riêng backend:

```powershell
npm.cmd run typecheck --prefix BE
npm.cmd run prisma:status --prefix BE
```

## Lưu ý dữ liệu

- Không xóa sự kiện trực tiếp trong MySQL. Đăng ký và điểm danh liên quan có thể bị xóa theo khóa ngoại `CASCADE`.
- Không chạy seed trên database đang sử dụng nếu chưa sao lưu.
- `ALLOW_DATABASE_SEED` phải được bật rõ ràng trước khi tạo lại dữ liệu mẫu.
- Ảnh đại diện được lưu trong `BE/uploads/`; database chỉ lưu đường dẫn `avatarUrl`.
- Nhật ký hoạt động nên được giữ để Super Admin truy vết thao tác.

## Tài liệu còn sử dụng

- [Ma trận kiểm thử](./QA_TEST_MATRIX.md)
- [Báo cáo rà soát dự án](./PROJECT_AUDIT_REPORT.md)
