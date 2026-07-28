# KẾT QUẢ KIỂM TRA BẢN FE/BE ENHANCED

## Đã kiểm tra trong môi trường xử lý

- Cấu trúc tách riêng `FE/` và `BE/`.
- 206 file TypeScript/TSX được phân tích cú pháp: không phát hiện lỗi cú pháp.
- 8 file JSON được đọc và xác thực hợp lệ.
- Không đóng gói `.env`, `.env.local`, `node_modules`, `.next`, `dist` hoặc `.git`.
- Không còn mật khẩu MySQL đã xuất hiện trong source người dùng.
- Các URL API trong mã frontend được gom qua `NEXT_PUBLIC_API_BASE_URL`.
- Route báo cáo và điểm danh đã được nối vào `BE/src/server.ts`.

## Chưa thể xác nhận trong sandbox

Không thể chạy đầy đủ `npm install`, `npm run typecheck`, `npm run build` và kết nối MySQL thật vì quá trình tải package từ npm trong sandbox bị timeout. Vì vậy, cần chạy các lệnh dưới đây trên máy phát triển trước khi deploy.

```powershell
npm run install:all
npm run prisma:generate
npm run prisma:migrate
npm run typecheck
npm run build
```

Kiểm tra khi hệ thống đang chạy:

```powershell
Invoke-RestMethod "http://localhost:8080/api/health"
```

## Smoke test cần thực hiện

1. Đăng nhập đủ 4 vai trò.
2. Organizer tạo sự kiện; Admin duyệt; sinh viên nhìn thấy sự kiện phù hợp.
3. Sinh viên đăng ký; Organizer duyệt.
4. Organizer mở trang điểm danh, cập nhật từng sinh viên và cập nhật hàng loạt.
5. Hoàn tất sự kiện và kiểm tra bản ghi `work_credits`.
6. Admin và Organizer xuất CSV báo cáo.
7. Mở CSV bằng Excel và kiểm tra tiếng Việt.
