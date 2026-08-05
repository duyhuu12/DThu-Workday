# QA Test Matrix — DThU Workday

Ngày kiểm thử: 2026-07-31  
Môi trường: Frontend `http://localhost:3000`, Backend `http://localhost:8080`

| ID | Chức năng | Vai trò | Điều kiện đầu vào | Các bước kiểm tra | Kết quả mong đợi | Kết quả thực tế | Pass/Fail | Mức độ lỗi | File hoặc API liên quan |
|---|---|---|---|---|---|---|---|---|---|
| E2E-01 | Tạo sự kiện | Ban tổ chức | Tài khoản Organizer hợp lệ; ngày và sức chứa hợp lệ | Đăng nhập → Sự kiện → Tạo mới → nhập đủ dữ liệu → lưu | API tạo bản ghi MySQL; sự kiện ở trạng thái nháp/chờ duyệt; refresh vẫn còn | Chưa chạy | Not Run | Critical nếu lỗi | `POST /api/events`; `OrganizerEventsPage`, `EventFormPage` |
| E2E-02 | Duyệt sự kiện | Quản trị viên | Có sự kiện chờ duyệt | Đăng nhập Admin → Duyệt sự kiện → mở chi tiết → duyệt | Trạng thái chuyển sang approved; Organizer và Admin cùng thấy trạng thái mới | Chưa chạy | Not Run | Critical nếu lỗi | Event approval route/controller/service; `EventApprovalsPage` |
| E2E-03 | Mở đăng ký | Quản trị viên | Sự kiện đã duyệt; thời hạn đăng ký hợp lệ | Chọn sự kiện approved → mở đăng ký | Trạng thái chuyển sang open; API trả thành công; refresh vẫn open | Chưa chạy | Not Run | Critical nếu lỗi | Event status API; `AdminEventDetailPage` |
| E2E-04 | Xem sự kiện mở | Sinh viên | Sự kiện open; sinh viên thuộc đối tượng được phép | Đăng nhập Student → Sự kiện ngày công → tìm/mở sự kiện | Sự kiện xuất hiện và chi tiết không 404; hiển thị thời gian, địa điểm, sức chứa | HTTP route test gặp 500 do Next dev cache thiếu chunk sau khi production build ghi vào cùng `.next`; stack trace `Cannot find module './8378.js'`. Đây là lỗi trạng thái tiến trình, cần restart frontend trước khi tiếp tục UI E2E. | Blocked | High nếu còn sau restart | Next dev runtime; `/student/work-events/[id]` |
| E2E-05 | Đăng ký sự kiện | Sinh viên | Sự kiện open, còn chỗ, trong hạn, không trùng lịch | Mở chi tiết → Đăng ký → xác nhận | Tạo đúng một registration; tăng số đăng ký nhất quán; refresh vẫn còn | Chưa chạy | Not Run | Critical nếu lỗi | `POST /api/registrations`; `registrationService` |
| E2E-06 | Chống đăng ký trùng | Sinh viên | Đã đăng ký cùng sự kiện | Gửi đăng ký lần hai/double-click | Backend từ chối 409 hoặc trả bản ghi hiện hữu an toàn; không tạo trùng | Chưa chạy | Not Run | High nếu lỗi | Unique `(eventId, studentId)`; registration API |
| E2E-07 | Organizer xem danh sách | Ban tổ chức | Có sinh viên đăng ký sự kiện thuộc Organizer | Đăng nhập Organizer → mở sự kiện → danh sách đăng ký | Thấy đúng sinh viên và trạng thái; không thấy dữ liệu sự kiện không thuộc quyền | Chưa chạy | Not Run | High nếu lỗi | Registration/event API; `OrganizerEventDetailPage` |
| E2E-08 | Check-in | Sinh viên | Registration được phép; đúng sự kiện/ngày/khung giờ | Mở QR check-in → nhập/quét mã hợp lệ | Tạo/cập nhật attendance đúng sinh viên và sự kiện; chặn sai ngày/quá sớm | Chưa chạy | Not Run | Critical nếu lỗi | Attendance routes/service; `QrAttendancePage` |
| E2E-09 | Xác nhận điểm danh | Ban tổ chức | Có attendance của sự kiện thuộc Organizer | Mở trang điểm danh → xác nhận check-in/check-out | Attendance chuyển trạng thái hợp lệ; Organizer khác không được sửa | Chưa chạy | Not Run | Critical nếu lỗi | Attendance API; `AttendancePage` |
| E2E-10 | Cộng ngày công | Hệ thống/Ban tổ chức | Điểm danh hoàn tất; semester active | Hoàn tất/xác nhận kết quả → tải credit và hồ sơ sinh viên | Chỉ tạo một credit; cộng đúng `workdayCredit`; tổng không cộng lặp | Chưa chạy | Not Run | Critical nếu lỗi | `workCredit`, attendance/event completion service |
| E2E-11 | Xem lịch sử | Sinh viên | Đã có attendance/credit | Sinh viên → Lịch sử tham gia/Ngày công → refresh | Lịch sử và tổng ngày công đúng database, không phụ thuộc localStorage | Chưa chạy | Not Run | High nếu lỗi | Student history/credit API; `ParticipationHistoryPage` |
| AUTH-01 | Đăng nhập đúng vai trò | Cả 4 vai trò | Tài khoản active hợp lệ | Đăng nhập lần lượt Student, Class Leader, Organizer, Admin | Nhận JWT; điều hướng đúng dashboard; refresh giữ phiên | API login Student, Organizer và Admin trả 200, đúng role và có token. Database hiện không có tài khoản `CLASS_LEADER`, nên chưa kiểm tra được vai trò này. UI automation không có browser khả dụng. | Blocked | High | `POST /api/auth/login`; auth store/middleware; dữ liệu môi trường thiếu Class Leader |
| AUTH-02 | Chặn truy cập trái vai trò | Cả 4 vai trò | JWT hợp lệ nhưng sai role | Gọi route/API của vai trò khác | Frontend chuyển 403 và backend trả 403; không rò dữ liệu | Lần đầu Organizer gọi `GET /api/system/students` nhận 200. Sau bản sửa route, test lại nhận 403. Các kiểm tra Student→Class Leader, Organizer→users, Admin→users/Class Leader đều nhận 403. | Pass | — | `BE/src/routes/systemRoutes.ts`; authorization middleware |
| CL-01 | Xem sinh viên trong lớp | Lớp trưởng | Đã được phân công lớp | Đăng nhập → Danh sách sinh viên | Chỉ thấy sinh viên thuộc lớp được phân công | Chưa chạy | Not Run | High nếu lỗi | `/api/class-leader/students`; `ClassStudentsPage` |
| CL-02 | Không tự sửa ngày công | Lớp trưởng | Có sinh viên và credit trong lớp | Thử gọi API cập nhật credit/admin | Backend trả 403; dữ liệu không đổi | Chưa chạy | Not Run | Critical nếu lỗi | Credit routes; authorization middleware |
| EDGE-01 | API không token | Khách | Không có Authorization header | Gọi endpoint protected | Trả 401 với JSON thống nhất | `GET /api/system/students` không token trả 401; login body rỗng trả 400. | Pass | — | Auth middleware |
| EDGE-02 | ID không tồn tại | Vai trò được phép | JWT hợp lệ; ID dương không tồn tại | Mở/cập nhật/xóa tài nguyên không tồn tại | Trả 404, không 500; UI hiển thị lỗi | Chưa chạy | Not Run | Medium nếu lỗi | Controllers/services và error handler |
| EDGE-03 | Dữ liệu sự kiện không hợp lệ | Ban tổ chức | end < start, deadline sai, capacity ≤ 0 | Gửi form/API | Trả 400; không tạo bản ghi | Chưa chạy | Not Run | High nếu lỗi | Event validation/service |

## Quy ước

- `Not Run`: chưa thực thi.
- `Blocked`: thiếu tài khoản/dữ liệu/điều kiện môi trường để kiểm tra an toàn.
- Chỉ đánh dấu `Pass` khi có bằng chứng từ UI/API/build; không suy luận từ source code.
- Không tự động seed/reset database và không ghi dữ liệu phá hoại vào môi trường hiện tại.
