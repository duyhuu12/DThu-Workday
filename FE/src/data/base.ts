import type { User, Faculty, Class, Student, SemesterConfig, SystemSettings } from '@/types';

export const faculties: Faculty[] = [
  { id: 'f-1', name: 'Khoa Sư phạm Toán - Tin', code: 'SP-TT' },
  { id: 'f-2', name: 'Khoa Sư phạm Ngữ văn', code: 'SP-NV' },
  { id: 'f-3', name: 'Khoa Kinh tế - Quản trị kinh doanh', code: 'KT-QTKD' },
  { id: 'f-4', name: 'Khoa Sinh học - Công nghệ sinh học', code: 'SH-CNSH' },
];

export const classes: Class[] = [
  { id: 'c-1', name: 'SP Tin 21.A', code: 'SP21A-TIN', facultyId: 'f-1', schoolYear: '2021-2025' },
  { id: 'c-2', name: 'SP Tin 22.B', code: 'SP22B-TIN', facultyId: 'f-1', schoolYear: '2022-2026' },
  { id: 'c-3', name: 'SP Văn 21.A', code: 'SP21A-VAN', facultyId: 'f-2', schoolYear: '2021-2025' },
  { id: 'c-4', name: 'SP Văn 22.B', code: 'SP22B-VAN', facultyId: 'f-2', schoolYear: '2022-2026' },
  { id: 'c-5', name: 'QTKD 21.A', code: 'QTKD21A', facultyId: 'f-3', schoolYear: '2021-2025' },
  { id: 'c-6', name: 'QTKD 22.B', code: 'QTKD22B', facultyId: 'f-3', schoolYear: '2022-2026' },
  { id: 'c-7', name: 'CNSH 21.A', code: 'CNSH21A', facultyId: 'f-4', schoolYear: '2021-2025' },
  { id: 'c-8', name: 'CNSH 22.B', code: 'CNSH22B', facultyId: 'f-4', schoolYear: '2022-2026' },
];

export const users: User[] = [
  { id: 'u-1', email: 'student@dthu.edu.vn', name: 'Nguyễn Văn An', role: 'student', status: 'active', createdAt: '2021-09-01T00:00:00Z', phone: '0912345678' },
  { id: 'u-2', email: 'organizer@dthu.edu.vn', name: 'Trần Thị Bình', role: 'organizer', status: 'active', createdAt: '2021-09-01T00:00:00Z', phone: '0987654321' },
  { id: 'u-3', email: 'admin@dthu.edu.vn', name: 'Lê Hoàng Cường', role: 'admin', status: 'active', createdAt: '2021-09-01T00:00:00Z', phone: '0901234567' },
  { id: 'u-4', email: 'superadmin@dthu.edu.vn', name: 'Phạm Minh Đức', role: 'superadmin', status: 'active', createdAt: '2021-09-01T00:00:00Z', phone: '0936258014' },
];

const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const firstNames = ['An', 'Bình', 'Châu', 'Dung', 'Giang', 'Hà', 'Khanh', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quang', 'Sơn', 'Trang', 'Vy', 'Hùng', 'Thảo', 'Linh', 'Tuấn'];

function makeStudent(i: number): Student {
  const cls = classes[i % 8];
  const fac = faculties.find((f) => f.id === cls.facultyId)!;
  const fullName = `${lastNames[i % lastNames.length]} ${firstNames[i % firstNames.length]}`;
  const acc = (i % 5) + 2;
  return {
    id: `s-${i + 1}`, userId: `u-stu-${i + 1}`, studentCode: `DHTIN${String(21001 + i * 7)}`,
    fullName, email: `${fullName.split(' ').pop()!.toLowerCase()}${i + 1}@dthu.edu.vn`,
    phone: `09${String(10000000 + i * 11111).slice(0, 8)}`, facultyId: fac.id, classId: cls.id,
    schoolYear: cls.schoolYear, gender: i % 2 === 0 ? 'male' : 'female',
    birthDate: `2003-0${(i % 9) + 1}-1${i % 9}`, hometown: ['Cao Lãnh', 'Sa Đéc', 'Vĩnh Long', 'Cần Thơ', 'An Giang'][i % 5],
    status: i === 17 ? 'locked' : 'active', requiredWorkdays: 12, accumulatedWorkdays: acc, completedWorkdays: Math.max(0, acc - (i % 2)),
  };
}

export const students: Student[] = Array.from({ length: 20 }, (_, i) => makeStudent(i));
students[0] = { ...students[0], id: 's-1', userId: 'u-1', studentCode: 'DHTIN21001', fullName: 'Nguyễn Văn An', email: 'student@dthu.edu.vn', phone: '0912345678', facultyId: 'f-1', classId: 'c-1', schoolYear: '2021-2025', gender: 'male', birthDate: '2003-03-15', hometown: 'Cao Lãnh', status: 'active', requiredWorkdays: 12, accumulatedWorkdays: 8, completedWorkdays: 6 };

export const semesterConfigs: SemesterConfig[] = [
  { id: 'sem-1', name: 'Học kỳ 1', schoolYear: '2024-2025', startDate: '2024-09-01', endDate: '2025-01-15', requiredWorkdays: 12, isActive: true },
  { id: 'sem-2', name: 'Học kỳ 2', schoolYear: '2024-2025', startDate: '2025-02-01', endDate: '2025-06-15', requiredWorkdays: 12, isActive: false },
];
export const systemSettings: SystemSettings = { siteName: 'DThU Workday', supportEmail: 'workday@dthu.edu.vn', supportPhone: '02776543210', defaultRequiredWorkdays: 12, maxConcurrentRegistrations: 3, maintenanceMode: false };
