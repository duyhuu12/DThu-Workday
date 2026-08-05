import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as eventService from '../services/eventService.js';
import { handleError } from '../utils/errors.js';

// 1. Get all events
export async function getEvents(req: AuthRequest, res: Response) {
  try {
    const { status, shift, faculty, search } = req.query;

    const data = await eventService.getAllEvents({
      status: status?.toString(),
      shift: shift?.toString(),
      faculty: faculty?.toString(),
      search: search?.toString(),
    }, req.user);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tải sự kiện');
  }
}

// 2. Get event detail
export async function getEventById(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }
  const { id } = req.params;
  const eventId = parseInt(id as string);

  try {
    const data = await eventService.getEventDetail(eventId, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi lấy chi tiết sự kiện');
  }
}

// 3. Create event
export async function createEvent(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await eventService.createNewEvent(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công, đang chờ phê duyệt',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi tạo sự kiện');
  }
}

// 4. Update event
export async function updateEvent(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const eventId = parseInt(id as string);

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await eventService.updateEventDetail(eventId, req.body, req.user.role, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Cập nhật sự kiện thành công',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi cập nhật sự kiện');
  }
}


// 5. Open event registration
export async function openEventRegistration(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const eventId = parseInt(id as string, 10);

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await eventService.openRegistration(
      eventId,
      req.user.role,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      message: 'Đã mở đăng ký sự kiện',
      data,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi hệ thống khi mở đăng ký sự kiện');
  }
}
