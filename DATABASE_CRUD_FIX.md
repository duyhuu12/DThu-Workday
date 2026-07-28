# Sửa lỗi thêm/sửa/xóa không cập nhật MySQL

## Nguyên nhân đã xác định

Source cũ chỉ gọi API thật cho đăng nhập, sự kiện, đăng ký, khiếu nại, thông báo và một phần ngày công. Các thao tác quản trị sau vẫn chạy bằng state giả và `localStorage`:

- Thêm/sửa sinh viên.
- Thêm/sửa lớp.
- Thêm/sửa/khóa người dùng.
- Lưu cài đặt hệ thống.
- Ghi nhật ký hoạt động.
- Khoa chỉ đọc, chưa có CRUD.

Trong `FE/src/hooks/useAppStore.tsx` cũ, các hàm trên dùng `delay()`, `genId()` và `persist()` nên giao diện đổi nhưng MySQL không nhận câu lệnh INSERT/UPDATE/DELETE.

Ngoài ra, nút xác nhận/từ chối ngày công gửi `creditValue = undefined` đến API điều chỉnh giá trị, nên có thể phát sinh `NaN` và không cập nhật được bản ghi.

## Những phần đã sửa

### Backend

Bổ sung API MySQL thật:

```text
GET/POST/PUT/DELETE /api/system/faculties
GET/POST/PUT/DELETE /api/system/classes
GET/POST/PUT/DELETE /api/system/students
GET/POST/PUT/DELETE /api/system/users
GET/PUT              /api/system/settings
GET                  /api/system/semesters
GET/POST             /api/system/activity-logs
PUT                   /api/credits/:id/status
```

Mỗi thao tác quản trị sử dụng Prisma và ghi `activity_logs`. Việc tạo sinh viên chạy transaction để tạo đồng thời `users` và `students`. Việc sửa sinh viên đồng bộ họ tên, email, số điện thoại và trạng thái ở cả hai bảng.

Các quy tắc an toàn:

- Không xóa khoa đang có lớp hoặc sinh viên.
- Không xóa lớp đang có sinh viên.
- Không tự xóa tài khoản đang đăng nhập.
- Không xóa người phụ trách đang có sự kiện.
- Xóa sinh viên thông qua tài khoản `users`, các dữ liệu phụ thuộc được xử lý theo khóa ngoại/cascade trong schema.

### Frontend

- Loại bỏ nguồn dữ liệu nghiệp vụ từ `mockData` và `dthu-store`.
- Tải dữ liệu lại từ API sau khi đăng nhập.
- Thêm CRUD database thật cho khoa, lớp, sinh viên và người dùng.
- Thêm nút xóa có hộp thoại xác nhận.
- Cài đặt hệ thống được lưu bằng `PUT /api/system/settings`.
- Nhật ký hoạt động được đọc từ bảng `activity_logs`.
- Sửa thao tác duyệt/từ chối ngày công sang endpoint trạng thái riêng.
- Hiển thị thông báo lỗi thật từ backend thay vì chỉ thay đổi giao diện local.

## Không cần migration mới

Bản sửa không thêm bảng hoặc cột, vì schema hiện tại đã có đủ model. Chỉ cần:

```powershell
cd BE
npx prisma generate
npx prisma migrate deploy
```

## Chạy hệ thống

Terminal backend:

```powershell
cd BE
npm run dev
```

Terminal frontend:

```powershell
cd FE
npm run dev
```

Hoặc tại thư mục gốc:

```powershell
npm run dev
```

## Xóa cache dữ liệu cũ trên trình duyệt

Source cũ từng lưu dữ liệu giả trong `localStorage`. Bản sửa tự xóa khóa `dthu-store`, nhưng nên làm thêm một lần:

```javascript
localStorage.removeItem('dthu-store');
location.reload();
```

Không xóa `dthu-auth` và `dthu-jwt-token` nếu không muốn đăng nhập lại.

## Kiểm tra database

Ví dụ kiểm tra các bảng trong DBeaver:

```sql
SELECT * FROM faculties ORDER BY id DESC;
SELECT * FROM classes ORDER BY id DESC;
SELECT * FROM students ORDER BY id DESC;
SELECT * FROM users ORDER BY id DESC;
SELECT * FROM system_settings;
SELECT * FROM activity_logs ORDER BY timestamp DESC;
```

Sau mỗi thao tác trên web, nhấn Refresh trong DBeaver hoặc chạy lại câu `SELECT`. DBeaver không tự tải lại result set cũ.

## Kiểm tra tự động

Chạy backend trước rồi chạy:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\TEST_DATABASE_CRUD.ps1
```

Script đăng nhập bằng tài khoản Admin/Super Admin, tạo một khoa thử nghiệm, sửa tên, đọc lại và xóa. Không ảnh hưởng dữ liệu thật khác.
