# PROJECT AUDIT REPORT

## Tổng quan

- Dự án chính gồm frontend `FE/` (Next.js, React, TypeScript) và backend `BE/` (Express, TypeScript, Prisma, MySQL).
- Frontend mặc định chạy tại `http://localhost:3000`.
- Backend mặc định chạy tại `http://localhost:8080`, health check tại `/api/health`.
- Việc kiểm tra và sửa lỗi được thực hiện theo từng nhóm tối đa ba lỗi liên quan.

## Nhật ký sửa lỗi

### Nhóm 1 — Critical: cấu hình root không hợp lệ

#### Lỗi

`package.json` và `package-lock.json` tại root còn marker Git conflict, khiến npm không parse được cấu hình và các lệnh điều phối frontend/backend không thể chạy.

#### Nguyên nhân gốc

Conflict giữa cấu hình frontend cũ tại root và cấu hình monorepo mới chưa được resolve hoàn chỉnh.

#### File liên quan

- `package.json`
- `package-lock.json`

#### Bản sửa

- Giữ cấu hình root theo mô hình dự án hiện tại: điều phối `FE/` và `BE/`.
- Tạo lại lockfile root tương ứng với package root không có dependency trực tiếp.

#### Kiểm tra lại

- `npm.cmd install --package-lock-only --ignore-scripts`: thành công, lockfile hợp lệ.
- `npm.cmd run build`: lệnh root đã được parse và điều phối lần lượt FE/BE.

#### Kết quả

Đã sửa lỗi cấu hình root. Build tiếp tục được tới bước kiểm tra TypeScript của frontend.

### Nhóm 2 — High: TypeScript frontend chặn build

#### Lỗi

- Trang quản lý khoa gọi `addFaculty`, `updateFaculty`, `deleteFaculty` nhưng store không cung cấp các hàm này.
- Trang quản lý người dùng gọi `deleteUser` nhưng store không cung cấp hàm.
- Callback đăng ký sự kiện truy cập biến `event` mà TypeScript không thể bảo đảm còn tồn tại.

#### Nguyên nhân gốc

Các hàm CRUD bị thiếu khỏi interface/context sau khi hợp nhất store; narrowing của `event` không được giữ qua ranh giới callback bất đồng bộ.

#### File liên quan

- `FE/src/hooks/useAppStore.tsx`
- `FE/src/pages/student/WorkEventDetailPage.tsx`

#### Bản sửa

- Khôi phục CRUD khoa và xóa người dùng qua API thật, có cập nhật state sau khi máy chủ thành công.
- Bổ sung đầy đủ type, default context, context value và dependency.
- Chụp các trường sự kiện đã được kiểm tra tồn tại trước khi callback đăng ký chạy.

#### Kiểm tra lại

- `npm.cmd run typecheck --prefix FE`: thành công.
- `npm.cmd run build`: frontend build thành công; backend tiếp tục chạy và phát hiện nhóm lỗi TypeScript riêng.

#### Kết quả

Đã sửa. Không dùng `any`, `@ts-ignore`, mock data hoặc vô hiệu hóa validation.

### Nhóm 3 — High: TypeScript backend chặn build

#### Lỗi

- Kết quả `getLeaderContext` vẫn mang kiểu `managedClass | null` dù hàm đã kiểm tra và ném lỗi khi chưa được phân công lớp.
- Các phép kiểm tra trạng thái bằng `Array.includes` khiến TypeScript suy luận mảng enum hẹp hơn biến cần kiểm tra.
- Tham số mặc định của `toAccountStatus` bị suy luận chỉ nhận `ACTIVE`, không nhận đầy đủ `AccountStatus`.

#### Nguyên nhân gốc

Thông tin narrowing bị mất ở kiểu trả về hàm và TypeScript suy luận literal union quá hẹp từ các mảng enum/tham số mặc định.

#### File liên quan

- `BE/src/services/classLeaderService.ts`
- `BE/src/services/creditService.ts`
- `BE/src/services/studentService.ts`
- `BE/src/services/systemService.ts`

#### Bản sửa

- Trả về context với `managedClass` và `managedClassId` đã được narrowing.
- Thay kiểm tra enum hẹp bằng các phép so sánh enum tường minh, giữ nguyên logic validation.
- Khai báo `fallback: AccountStatus` tường minh.

#### Kiểm tra lại

- `npm.cmd run typecheck --prefix BE`: thành công.
- `npm.cmd run build`: thành công cho cả frontend và backend, exit code `0`.

#### Kết quả

Đã sửa. Production build toàn hệ thống đã qua.

### Nhóm 4 — High: CRUD chỉ lưu local và mất sau refresh

#### Lỗi

- Thêm/cập nhật sinh viên chỉ tạo ID giả và ghi local state, không gọi backend.
- Tạo người dùng chỉ ghi local state, không tạo tài khoản trong MySQL.
- Khi refresh, Admin/Super Admin không tải lại danh sách sinh viên/người dùng từ backend.

#### Nguyên nhân gốc

Một phần store vẫn dùng triển khai demo dựa trên `delay`, `genId` và localStorage dù backend đã có đầy đủ endpoint bảo vệ bằng authentication/authorization.

#### File liên quan

- `FE/src/hooks/useAppStore.tsx`
- `BE/src/routes/systemRoutes.ts` (đối chiếu contract, không chỉnh sửa)
- `BE/src/controllers/systemController.ts` (đối chiếu contract, không chỉnh sửa)

#### Bản sửa

- Chuyển thêm/cập nhật sinh viên sang `POST/PUT /api/system/students`.
- Chuyển tạo người dùng sang `POST /api/system/users`.
- Bổ sung tải danh sách sinh viên cho Admin/Super Admin và danh sách người dùng cho Super Admin khi khôi phục phiên đăng nhập.
- Chỉ cập nhật state sau khi API thành công.

#### Kiểm tra lại

- `npm.cmd run typecheck --prefix FE`: thành công.
- `npm.cmd run build`: thành công cho cả frontend và backend, exit code `0`.

#### Kết quả

Đã sửa ở mức contract và build. Chưa tạo dữ liệu thử trên database để tránh thay đổi dữ liệu thật khi chưa có bộ fixture/test riêng.

### Nhóm 5 — High: CRUD lớp nuốt lỗi API và làm lệch dữ liệu

#### Lỗi

- Thêm lớp tự tạo bản ghi local với ID giả nếu API/network thất bại.
- Cập nhật lớp vẫn sửa local state khi backend từ chối hoặc không kết nối được.
- Xóa lớp nuốt mọi lỗi API rồi xóa bản ghi khỏi giao diện.

#### Nguyên nhân gốc

Ba hàm CRUD có fallback demo và `catch` không truyền lỗi về giao diện. Frontend có thể hiển thị thao tác thành công dù MySQL không thay đổi.

#### File liên quan

- `FE/src/hooks/useAppStore.tsx`
- `BE/src/routes/systemRoutes.ts` (đối chiếu contract, không chỉnh sửa)
- `BE/src/services/systemService.ts` (đối chiếu validation, không chỉnh sửa trong nhóm này)

#### Bản sửa

- Dùng chung `apiRequest` cho `POST`, `PUT`, `DELETE /api/system/classes`.
- Loại bỏ ID giả và toàn bộ fallback local của CRUD lớp.
- Chỉ cập nhật state khi backend trả thành công; lỗi validation, authorization và network được truyền về trang gọi.

#### Kiểm tra lại

- `npm.cmd run typecheck --prefix FE`: thành công.
- `npm.cmd run build`: thành công cho frontend và backend, exit code `0`.

#### Kết quả

Đã sửa cả ba luồng CRUD lớp, không thay đổi API contract hoặc middleware phân quyền.

### Nhóm 6 — QA bàn giao: lỗi phân quyền danh sách sinh viên

#### Lỗi

Organizer có JWT hợp lệ gọi `GET /api/system/students` nhận HTTP 200 và danh sách sinh viên hệ thống.

#### Nguyên nhân gốc

Route danh sách sinh viên chỉ yêu cầu `authenticate`, trong khi các thao tác quản trị cùng module đã giới hạn Admin/Super Admin. Service chỉ thu hẹp dữ liệu cho Student/Class Leader nên Organizer nhận toàn bộ danh sách.

#### File liên quan

- `BE/src/routes/systemRoutes.ts`
- `QA_TEST_MATRIX.md`

#### Bản sửa

Thêm middleware `authorize(['ADMIN', 'SUPER_ADMIN'])` cho `GET /api/system/students`. Không xóa hoặc nới lỏng bất kỳ middleware phân quyền nào.

#### Kiểm tra lại

- Trước sửa: Organizer gọi endpoint nhận `200`.
- Sau sửa: Organizer gọi endpoint nhận `403`.
- `npm.cmd run typecheck --prefix BE`: thành công.
- `npm.cmd run build`: frontend và backend thành công, exit code `0`.

#### Kết quả

Đã sửa và có API regression test thủ công tự động hóa bằng script.

## File đã thay đổi

- `package.json`
- `package-lock.json`
- `PROJECT_AUDIT_REPORT.md`
- `FE/src/hooks/useAppStore.tsx`
- `FE/src/pages/student/WorkEventDetailPage.tsx`
- `BE/src/services/classLeaderService.ts`
- `BE/src/services/creditService.ts`
- `BE/src/services/studentService.ts`
- `BE/src/services/systemService.ts`
- `BE/src/routes/systemRoutes.ts`
- `QA_TEST_MATRIX.md`

## Test và build đã chạy

- Frontend type-check: thành công sau Nhóm 2.
- Frontend production build: thành công sau Nhóm 2.
- Backend build: chưa thành công; đang dừng tại lỗi strict TypeScript trong các service.
- Backend type-check: thành công sau Nhóm 3.
- Build toàn hệ thống: thành công sau Nhóm 3.
- Frontend type-check: tiếp tục thành công sau Nhóm 4.
- Build toàn hệ thống: tiếp tục thành công sau Nhóm 4.
- Frontend type-check và build toàn hệ thống: tiếp tục thành công sau Nhóm 5.
- Backend type-check và build toàn hệ thống: thành công sau Nhóm 6.

## Trạng thái database

- `npx.cmd prisma validate`: schema hợp lệ.
- `npm.cmd run prisma:status`: tìm thấy 2 migration; database schema đã up to date.
- `GET http://localhost:8080/api/health`: thành công, API và MySQL đang hoạt động.
- Không chạy migration, seed, reset hoặc thao tác thay đổi dữ liệu.

## Lỗi chưa xử lý

- Kết nối MySQL runtime và health check đã xác minh thành công.
- Chưa hoàn tất kiểm tra authentication, authorization và các luồng nghiệp vụ.
