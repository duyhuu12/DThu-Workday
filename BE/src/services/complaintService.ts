import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { ComplaintType, ComplaintPriority, ComplaintStatus } from '@prisma/client';

function mapComplaint(c: any) {
  return {
    id: String(c.id),
    code: c.code,
    studentId: String(c.studentId),
    studentCode: c.student?.studentCode || '',
    studentName: c.student?.fullName || '',
    classId: String(c.student?.classId || ''),
    className: c.student?.class?.name || '',
    facultyId: String(c.student?.facultyId || ''),
    facultyName: c.student?.faculty?.name || '',
    eventId: c.eventId ? String(c.eventId) : '',
    eventName: c.event?.name || '',
    type: c.type.toLowerCase(),
    priority: c.priority.toLowerCase(),
    title: c.title,
    description: c.description,
    evidence: JSON.parse(c.evidence || '[]'),
    status: c.status.toLowerCase(),
    response: c.response || undefined,
    timeline: c.timeline?.map((t: any) => ({
      id: String(t.id),
      status: t.status.toLowerCase(),
      note: t.note,
      actor: t.actor,
      timestamp: t.timestamp.toISOString(),
    })) || [],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function listComplaints(userRole: string, currentStudentId: number | null) {
  let whereClause: any = {};

  if (['STUDENT', 'CLASS_LEADER', 'student', 'classleader'].includes(userRole)) {
    if (!currentStudentId) {
      throw new BusinessError(400, 'Không tìm thấy hồ sơ sinh viên');
    }
    whereClause.studentId = currentStudentId;
  }

  const list = await prisma.complaint.findMany({
    where: whereClause,
    include: {
      student: { include: { class: true, faculty: true } },
      event: true,
      timeline: { orderBy: { timestamp: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return list.map(mapComplaint);
}

export async function submitComplaint(complaintData: any, currentStudentId: number, studentName: string) {
  const { title, type, priority, eventId, content, evidence } = complaintData;

  if (!title || !content) {
    throw new BusinessError(400, 'Vui lòng nhập đầy đủ tiêu đề và nội dung khiếu nại');
  }

  const code = `KN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const result = await prisma.$transaction(async (tx: any) => {
    const complaint = await tx.complaint.create({
      data: {
        code,
        studentId: currentStudentId,
        eventId: eventId && eventId !== 'none' ? parseInt(eventId) : null,
        title,
        description: content,
        type: type.toUpperCase() as ComplaintType,
        priority: priority.toUpperCase() as ComplaintPriority,
        status: ComplaintStatus.SUBMITTED,
        evidence: JSON.stringify(evidence || []),
      },
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: complaint.id,
        status: ComplaintStatus.SUBMITTED,
        note: 'Khiếu nại đã được gửi',
        actor: studentName,
      }
    });

    const admins = await tx.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          type: 'COMPLAINT',
          title: 'Khiếu nại mới',
          message: `Có khiếu nại mới "${title}" từ sinh viên ${studentName}.`,
          link: '/admin/complaints',
        }
      });
    }

    return complaint;
  });

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: result.id },
    include: {
      student: { include: { class: true, faculty: true } },
      event: true,
      timeline: { orderBy: { timestamp: 'asc' } },
    }
  });

  if (!fullComplaint) {
    throw new BusinessError(500, 'Lỗi hệ thống khi tải dữ liệu khiếu nại vừa tạo');
  }

  return mapComplaint(fullComplaint);
}

export async function resolveComplaint(compId: number, status: string, note: string, actorName: string) {
  const existing = await prisma.complaint.findUnique({
    where: { id: compId },
    include: { student: true }
  });

  if (!existing) {
    throw new BusinessError(404, 'Không tìm thấy khiếu nại');
  }

  const nextStatus = status.toUpperCase() as ComplaintStatus;

  const result = await prisma.$transaction(async (tx: any) => {
    const complaint = await tx.complaint.update({
      where: { id: compId },
      data: {
        status: nextStatus,
        response: note,
      }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: compId,
        status: nextStatus,
        note: note || `Đổi trạng thái sang: ${status}`,
        actor: actorName,
      }
    });

    await tx.notification.create({
      data: {
        userId: existing.student.userId,
        type: 'COMPLAINT',
        title: 'Khiếu nại được cập nhật',
        message: `Khiếu nại ${existing.code} của bạn đã chuyển sang trạng thái: ${status}. Phản hồi: ${note || 'Không có'}`,
        link: '/student/complaints',
      }
    });

    return complaint;
  });

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: result.id },
    include: {
      student: { include: { class: true, faculty: true } },
      event: true,
      timeline: { orderBy: { timestamp: 'asc' } },
    }
  });

  if (!fullComplaint) {
    throw new BusinessError(500, 'Lỗi hệ thống khi tải khiếu nại đã cập nhật');
  }

  return mapComplaint(fullComplaint);
}
