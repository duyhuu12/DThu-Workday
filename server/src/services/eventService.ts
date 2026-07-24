import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { EventStatus, WorkShift } from '@prisma/client';

function mapEvent(e: any) {
  return {
    id: String(e.id),
    code: e.code,
    name: e.name,
    description: e.description,
    workContent: e.workContent,
    location: e.location,
    date: e.date.toISOString().split('T')[0],
    startTime: e.startTime,
    endTime: e.endTime,
    shift: e.shift.toLowerCase(),
    registrationOpen: e.registrationOpen.toISOString(),
    registrationClose: e.registrationClose.toISOString(),
    cancellationDeadline: e.cancellationDeadline.toISOString(),
    maxCapacity: e.maxCapacity,
    registeredCount: e.registeredCount,
    workdayCredit: e.workdayCredit,
    eligibleFacultyIds: JSON.parse(e.eligibleFacultyIds || '[]'),
    eligibleClassIds: JSON.parse(e.eligibleClassIds || '[]'),
    eligibleSchoolYears: JSON.parse(e.eligibleSchoolYears || '[]'),
    clothingRequirements: e.clothingRequirements || '',
    equipmentRequirements: e.equipmentRequirements || '',
    contactPerson: e.contactPerson,
    contactPhone: e.contactPhone,
    organizerId: String(e.organizerId),
    organizerName: e.organizer?.fullName || 'Ban Tổ Chức',
    status: e.status.toLowerCase(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function getAllEvents(filters: { status?: string, shift?: string, faculty?: string, search?: string }) {
  let whereClause: any = {};

  if (filters.status && filters.status !== 'all') {
    whereClause.status = filters.status.toUpperCase() as EventStatus;
  }
  if (filters.shift && filters.shift !== 'all') {
    whereClause.shift = filters.shift.toUpperCase() as WorkShift;
  }

  const dbEvents = await prisma.workEvent.findMany({
    where: whereClause,
    include: { organizer: true },
    orderBy: { date: 'desc' },
  });

  let filteredEvents = dbEvents.map(mapEvent);

  if (filters.faculty && filters.faculty !== 'all') {
    filteredEvents = filteredEvents.filter((e: any) =>
      e.eligibleFacultyIds.includes(filters.faculty)
    );
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filteredEvents = filteredEvents.filter(
      (e: any) =>
        e.name.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
    );
  }

  return filteredEvents;
}

export async function getEventDetail(id: number) {
  const event = await prisma.workEvent.findUnique({
    where: { id },
    include: { organizer: true },
  });

  if (!event) {
    throw new BusinessError(404, 'Không tìm thấy sự kiện');
  }

  return mapEvent(event);
}

export async function createNewEvent(eventData: any, organizerId: number) {
  const {
    name,
    description,
    workContent,
    location,
    date,
    startTime,
    endTime,
    shift,
    registrationOpen,
    registrationClose,
    cancellationDeadline,
    maxCapacity,
    workdayCredit,
    eligibleFacultyIds,
    eligibleClassIds,
    eligibleSchoolYears,
    clothingRequirements,
    equipmentRequirements,
    contactPerson,
    contactPhone,
  } = eventData;

  const code = `WD-${new Date(date).getFullYear()}-${String(Date.now()).slice(-4)}`;

  const event = await prisma.workEvent.create({
    data: {
      code,
      name,
      description,
      workContent,
      location,
      date: new Date(date),
      startTime,
      endTime,
      shift: shift.toString().toUpperCase() as WorkShift,
      registrationOpen: new Date(registrationOpen),
      registrationClose: new Date(registrationClose),
      cancellationDeadline: new Date(cancellationDeadline),
      maxCapacity: parseInt(maxCapacity) || 30,
      workdayCredit: parseFloat(workdayCredit) || 1.0,
      eligibleFacultyIds: JSON.stringify(eligibleFacultyIds || []),
      eligibleClassIds: JSON.stringify(eligibleClassIds || []),
      eligibleSchoolYears: JSON.stringify(eligibleSchoolYears || []),
      clothingRequirements,
      equipmentRequirements,
      contactPerson,
      contactPhone,
      organizerId,
      status: EventStatus.PENDING,
    },
    include: { organizer: true },
  });

  return mapEvent(event);
}

export async function updateEventDetail(id: number, updateData: any, userRole: string, userId: number) {
  const existing = await prisma.workEvent.findUnique({ where: { id } });
  if (!existing) {
    throw new BusinessError(404, 'Không tìm thấy sự kiện');
  }

  if (userRole === 'ORGANIZER' && existing.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không được phép sửa sự kiện của người khác');
  }

  const { shift, date, registrationOpen, registrationClose, cancellationDeadline, status, ...rest } = updateData;

  const dataToUpdate: any = {
    ...rest,
  };

  if (shift) dataToUpdate.shift = shift.toString().toUpperCase() as WorkShift;
  if (date) dataToUpdate.date = new Date(date);
  if (registrationOpen) dataToUpdate.registrationOpen = new Date(registrationOpen);
  if (registrationClose) dataToUpdate.registrationClose = new Date(registrationClose);
  if (cancellationDeadline) dataToUpdate.cancellationDeadline = new Date(cancellationDeadline);
  if (status) dataToUpdate.status = status.toString().toUpperCase() as EventStatus;

  if (updateData.eligibleFacultyIds) dataToUpdate.eligibleFacultyIds = JSON.stringify(updateData.eligibleFacultyIds);
  if (updateData.eligibleClassIds) dataToUpdate.eligibleClassIds = JSON.stringify(updateData.eligibleClassIds);
  if (updateData.eligibleSchoolYears) dataToUpdate.eligibleSchoolYears = JSON.stringify(updateData.eligibleSchoolYears);

  const updated = await prisma.workEvent.update({
    where: { id },
    data: dataToUpdate,
    include: { organizer: true },
  });

  return mapEvent(updated);
}
