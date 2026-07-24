import { prisma } from '../config/prisma.js';

export async function listFaculties() {
  const list = await prisma.faculty.findMany({
    orderBy: { name: 'asc' }
  });
  return list.map(f => ({
    id: String(f.id),
    name: f.name,
    code: f.code
  }));
}

export async function listClasses() {
  const list = await prisma.class.findMany({
    orderBy: { name: 'asc' }
  });
  return list.map(c => ({
    id: String(c.id),
    name: c.name,
    code: c.code,
    facultyId: String(c.facultyId),
    schoolYear: c.schoolYear
  }));
}

export async function getSystemConfig() {
  return await prisma.systemSettings.findFirst();
}

export async function updateSystemConfig(settingsData: any) {
  const { siteName, supportEmail, supportPhone, defaultRequiredWorkdays, maxConcurrentRegistrations, maintenanceMode } = settingsData;

  const existing = await prisma.systemSettings.findFirst();

  let settings;
  if (existing) {
    settings = await prisma.systemSettings.update({
      where: { id: existing.id },
      data: {
        siteName,
        supportEmail,
        supportPhone,
        defaultRequiredWorkdays: defaultRequiredWorkdays ? parseInt(defaultRequiredWorkdays) : undefined,
        maxConcurrentRegistrations: maxConcurrentRegistrations ? parseInt(maxConcurrentRegistrations) : undefined,
        maintenanceMode
      }
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: {
        siteName: siteName || 'DThU Workday',
        supportEmail: supportEmail || 'workday@dthu.edu.vn',
        supportPhone: supportPhone || '02776543210',
        defaultRequiredWorkdays: parseInt(defaultRequiredWorkdays) || 12,
        maxConcurrentRegistrations: parseInt(maxConcurrentRegistrations) || 3,
        maintenanceMode: !!maintenanceMode
      }
    });
  }

  return settings;
}
