# Validation — Role 2 Cán bộ lớp/Lớp trưởng

## Đã kiểm tra trong môi trường xử lý

- Phân tích cú pháp 242 file TypeScript/TSX: không có lỗi cú pháp.
- Xác thực 10 file JSON: hợp lệ.
- Prisma datasource vẫn là `mysql`.
- Migration mới không chứa `DROP TABLE` hoặc thao tác xóa dữ liệu.
- Backend đã mount `/api/class-leader`.
- Có trang `/admin/class-leaders` và toàn bộ route `/classleader/*`.
- API sửa ngày công vẫn chỉ cho `ADMIN` và `SUPER_ADMIN`.
- Không đóng gói `.env`, `.env.local`, `node_modules`, `.next`, `dist`, `.git` hoặc mật khẩu thật.
- Script kiểm tra Role 2 có bước xác nhận HTTP 403 khi cán bộ lớp thử sửa ngày công.

## Chưa thể kiểm tra trong sandbox

- `npm ci`, `npm run typecheck` và `npm run build` không hoàn tất do quá trình tải package npm bị timeout.
- Không có MySQL của máy người dùng nên chưa thể chạy migration và kiểm thử API runtime trên dữ liệu thật.

## Bắt buộc chạy trên máy người dùng

```powershell
cd BE
npm install
npx prisma generate
npx prisma migrate deploy
npm run typecheck
```

```powershell
cd ..\FE
npm install
npm run typecheck
npm run build
```

Sau khi BE và FE hoạt động:

```powershell
.\CHECK_CLASS_LEADER_ROLE.ps1
```
