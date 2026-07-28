import { EventStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';

export interface CsvFile {
  filename: string;
  content: string;
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv(rows: unknown[][]): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

function dateLabel(value: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);
}

export async function getAdminReportSummary() {
  const [totalEvents, totalStudents, totalComplaints, credits, faculties, eventGroups, topStudents] =
    await prisma.$transaction([
      prisma.workEvent.count(),
      prisma.student.count(),
      prisma.complaint.count(),
      prisma.workCredit.aggregate({
        where: { status: { in: ['RECORDED', 'ADJUSTED'] } },
        _sum: { creditValue: true },
      }),
      prisma.faculty.findMany({
        orderBy: { name: 'asc' },
        include: {
          students: {
            select: {
              id: true,
              registrations: { select: { id: true } },
              workCredits: {
                where: { status: { in: ['RECORDED', 'ADJUSTED'] } },
                select: { creditValue: true },
              },
            },
          },
        },
      }),
      prisma.workEvent.groupBy({ by: ['status'], _count: { _all: true }, orderBy: { status: 'asc' } }),
      prisma.student.findMany({
        orderBy: { accumulatedWorkdays: 'desc' },
        take: 10,
        include: { faculty: true, class: true },
      }),
    ]);

  const completionRows = await prisma.student.findMany({
    select: { accumulatedWorkdays: true, requiredWorkdays: true },
  });
  const completedStudents = completionRows.filter(
    (student) => student.accumulatedWorkdays >= student.requiredWorkdays,
  ).length;

  return {
    totals: {
      events: totalEvents,
      students: totalStudents,
      credits: credits._sum.creditValue ?? 0,
      complaints: totalComplaints,
      completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
    },
    byFaculty: faculties.map((faculty) => ({
      id: String(faculty.id),
      name: faculty.name,
      students: faculty.students.length,
      registrations: faculty.students.reduce((sum, student) => sum + student.registrations.length, 0),
      credits: faculty.students.reduce(
        (sum, student) => sum + student.workCredits.reduce((creditSum, item) => creditSum + item.creditValue, 0),
        0,
      ),
    })),
    eventsByStatus: eventGroups.map((group) => ({
      status: group.status.toLowerCase(),
      value: typeof group._count === 'object' && group._count !== null && '_all' in group._count ? (group._count as { _all?: number })._all ?? 0 : 0,
    })),
    topStudents: topStudents.map((student) => ({
      id: String(student.id),
      studentCode: student.studentCode,
      fullName: student.fullName,
      facultyName: student.faculty.name,
      className: student.class.name,
      accumulatedWorkdays: student.accumulatedWorkdays,
      requiredWorkdays: student.requiredWorkdays,
    })),
  };
}

export async function exportAdminStudentReport(): Promise<CsvFile> {
  const students = await prisma.student.findMany({
    orderBy: [{ faculty: { name: 'asc' } }, { class: { name: 'asc' } }, { studentCode: 'asc' }],
    include: { faculty: true, class: true },
  });

  const rows: unknown[][] = [
    ['Mã sinh viên', 'Họ tên', 'Khoa', 'Lớp', 'Khóa', 'Ngày công tích lũy', 'Ngày công yêu cầu', 'Tỷ lệ hoàn thành', 'Trạng thái'],
    ...students.map((student) => {
      const rate = student.requiredWorkdays > 0
        ? Math.round((student.accumulatedWorkdays / student.requiredWorkdays) * 100)
        : 0;
      return [
        student.studentCode,
        student.fullName,
        student.faculty.name,
        student.class.name,
        student.schoolYear,
        student.accumulatedWorkdays,
        student.requiredWorkdays,
        `${rate}%`,
        student.accumulatedWorkdays >= student.requiredWorkdays ? 'Đã hoàn thành' : 'Chưa hoàn thành',
      ];
    }),
  ];

  return {
    filename: `bao-cao-ngay-cong-sinh-vien-${new Date().toISOString().slice(0, 10)}.csv`,
    content: makeCsv(rows),
  };
}

export async function getOrganizerReportSummary(organizerId: number) {
  const events = await prisma.workEvent.findMany({
    where: { organizerId },
    orderBy: { date: 'desc' },
    include: {
      registrations: true,
      attendances: true,
      workCredits: { where: { status: { in: ['RECORDED', 'ADJUSTED'] } } },
    },
  });

  const byEvent = events.map((event) => {
    const present = event.attendances.filter((item) =>
      ['CHECKED_IN', 'CHECKED_OUT', 'LATE', 'EARLY_LEAVE'].includes(item.status),
    ).length;
    return {
      id: String(event.id),
      name: event.name,
      date: event.date.toISOString().slice(0, 10),
      registrations: event.registrations.length,
      present,
      absent: event.attendances.filter((item) => item.status === 'ABSENT').length,
      credits: event.workCredits.reduce((sum, item) => sum + item.creditValue, 0),
      status: event.status.toLowerCase(),
    };
  });

  return {
    totals: {
      events: events.length,
      registrations: events.reduce((sum, event) => sum + event.registrations.length, 0),
      completedEvents: events.filter((event) => event.status === EventStatus.COMPLETED).length,
      credits: events.reduce(
        (sum, event) => sum + event.workCredits.reduce((creditSum, item) => creditSum + item.creditValue, 0),
        0,
      ),
    },
    byEvent,
  };
}

export async function exportOrganizerEventReport(organizerId: number): Promise<CsvFile> {
  const events = await prisma.workEvent.findMany({
    where: { organizerId },
    orderBy: { date: 'desc' },
    include: { registrations: true, attendances: true, workCredits: true },
  });

  const rows: unknown[][] = [
    ['Mã sự kiện', 'Tên sự kiện', 'Ngày', 'Trạng thái', 'Số đăng ký', 'Có mặt', 'Vắng mặt', 'Tổng ngày công'],
    ...events.map((event) => [
      event.code,
      event.name,
      dateLabel(event.date),
      event.status,
      event.registrations.length,
      event.attendances.filter((item) => ['CHECKED_IN', 'CHECKED_OUT', 'LATE', 'EARLY_LEAVE'].includes(item.status)).length,
      event.attendances.filter((item) => item.status === 'ABSENT').length,
      event.workCredits.reduce((sum, item) => sum + item.creditValue, 0),
    ]),
  ];

  return {
    filename: `bao-cao-su-kien-phu-trach-${new Date().toISOString().slice(0, 10)}.csv`,
    content: makeCsv(rows),
  };
}

export async function exportEventAttendance(eventId: number, userId: number, userRole: string): Promise<CsvFile> {
  const event = await prisma.workEvent.findUnique({
    where: { id: eventId },
    include: {
      attendances: {
        orderBy: { student: { studentCode: 'asc' } },
        include: { student: { include: { class: true, faculty: true } } },
      },
    },
  });

  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
  if ((userRole === 'ORGANIZER' || userRole === 'organizer') && event.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không có quyền xuất điểm danh sự kiện này');
  }

  const rows: unknown[][] = [
    ['Mã sinh viên', 'Họ tên', 'Lớp', 'Khoa', 'Trạng thái', 'Giờ vào', 'Giờ ra', 'Ghi chú'],
    ...event.attendances.map((attendance) => [
      attendance.student.studentCode,
      attendance.student.fullName,
      attendance.student.class.name,
      attendance.student.faculty.name,
      attendance.status,
      attendance.checkInTime ?? '',
      attendance.checkOutTime ?? '',
      attendance.notes ?? '',
    ]),
  ];

  return {
    filename: `diem-danh-${event.code}-${new Date().toISOString().slice(0, 10)}.csv`,
    content: makeCsv(rows),
  };
}
