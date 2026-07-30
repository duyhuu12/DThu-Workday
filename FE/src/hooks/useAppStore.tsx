'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ActivityLog, Attendance, Complaint, Faculty, Class, Notification, Registration, Student, User, WorkCredit, WorkEvent, SemesterConfig, SystemSettings } from '@/types';
import { delay, genId } from '@/lib/config';
import { API_BASE_URL } from '@/services/api';
import { getCurrentStudentProfile } from '@/services/studentApi';

interface StoreState {
  students: Student[]; events: WorkEvent[]; registrations: Registration[]; attendance: Attendance[];
  credits: WorkCredit[]; complaints: Complaint[]; notifications: Notification[]; activityLogs: ActivityLog[];
  users: User[]; faculties: Faculty[]; classes: Class[]; semesterConfigs: SemesterConfig[]; settings: SystemSettings;
}

const initialState: StoreState = {
  students: [],
  events: [],
  registrations: [],
  attendance: [],
  credits: [],
  complaints: [],
  notifications: [],
  activityLogs: [],
  users: [],
  faculties: [],
  classes: [],
  semesterConfigs: [
    { id: 'sem-1', name: 'Học kỳ 1', schoolYear: '2024-2025', startDate: '2024-09-01', endDate: '2025-01-15', requiredWorkdays: 12, isActive: true },
    { id: 'sem-2', name: 'Học kỳ 2', schoolYear: '2024-2025', startDate: '2025-02-01', endDate: '2025-06-15', requiredWorkdays: 12, isActive: false },
    { id: 'sem-3', name: 'Học kỳ 1', schoolYear: '2025-2026', startDate: '2025-09-01', endDate: '2026-01-15', requiredWorkdays: 12, isActive: false },
  ],
  settings: {
    siteName: 'DThU Workday',
    supportEmail: 'workday@dthu.edu.vn',
    supportPhone: '02776543210',
    defaultRequiredWorkdays: 12,
    maxConcurrentRegistrations: 3,
    maintenanceMode: false
  },
};

const STORE_KEY = 'dthu-store';
const AUTH_KEY = 'dthu-auth';

interface Ctx {
  currentUser: User | null;
  currentStudent: Student | null;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => void;
  students: Student[]; events: WorkEvent[]; registrations: Registration[]; attendance: Attendance[];
  credits: WorkCredit[]; complaints: Complaint[]; notifications: Notification[]; activityLogs: ActivityLog[];
  faculties: Faculty[]; classes: Class[]; users: User[]; semesterConfigs: SemesterConfig[]; settings: SystemSettings;
  fetchEvents: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  fetchCredits: () => Promise<void>;
  fetchComplaints: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchFaculties: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchCurrentStudent: () => Promise<Student | null>;
  addEvent: (e: Partial<WorkEvent>) => Promise<WorkEvent>;
  updateEvent: (id: string, p: Partial<WorkEvent>) => Promise<void>;
  addRegistration: (r: Partial<Registration>) => Promise<Registration>;
  updateRegistration: (id: string, p: Partial<Registration>) => Promise<void>;
  updateCredit: (id: string, p: Partial<WorkCredit>) => Promise<void>;
  addComplaint: (c: Partial<Complaint>) => Promise<Complaint>;
  updateComplaint: (id: string, p: Partial<Complaint>) => Promise<void>;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  addNotification: (n: Partial<Notification>) => void;
  addStudent: (s: Partial<Student>) => Promise<Student>;
  updateStudent: (id: string, p: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addClass: (c: Partial<Class>) => Promise<Class>;
  updateClass: (id: string, p: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addSemesterConfig: (s: Partial<SemesterConfig>) => Promise<SemesterConfig>;
  updateSemesterConfig: (id: string, s: Partial<SemesterConfig>) => Promise<void>;
  deleteSemesterConfig: (id: string) => Promise<void>;
  setActiveSemesterConfig: (id: string) => Promise<void>;
  addUser: (u: Partial<User>) => Promise<User>;
  updateUser: (id: string, p: Partial<User>) => Promise<void>;
  updateSettings: (p: Partial<SystemSettings>) => void;
  addActivityLog: (l: Partial<ActivityLog>) => void;
}

function createDefaultContext(): Ctx {
  return {
    currentUser: null,
    currentStudent: null,
    login: async () => { throw new Error('AppStoreProvider is not ready'); },
    logout: () => {},
    students: [], events: [], registrations: [], attendance: [],
    credits: [], complaints: [], notifications: [], activityLogs: [],
    faculties: [], classes: [], users: [], semesterConfigs: initialState.semesterConfigs, settings: initialState.settings,
    fetchEvents: async () => {}, fetchRegistrations: async () => {}, fetchCredits: async () => {},
    fetchComplaints: async () => {}, fetchNotifications: async () => {}, fetchFaculties: async () => {},
    fetchClasses: async () => {}, fetchCurrentStudent: async () => null,
    addEvent: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateEvent: async () => {}, addRegistration: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateRegistration: async () => {}, updateCredit: async () => {},
    addComplaint: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateComplaint: async () => {}, markNotifRead: () => {}, markAllNotifsRead: () => {},
    addNotification: () => {}, addStudent: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateStudent: async () => {}, deleteStudent: async () => {},
    addClass: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateClass: async () => {}, deleteClass: async () => {},
    addSemesterConfig: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateSemesterConfig: async () => {}, deleteSemesterConfig: async () => {}, setActiveSemesterConfig: async () => {},
    addUser: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateUser: async () => {}, updateSettings: () => {}, addActivityLog: () => {},
  };
}

const StoreCtx = createContext<Ctx>(createDefaultContext());

function loadState(): StoreState {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return { ...initialState, ...JSON.parse(raw) }; } catch {}
  return initialState;
}
function saveState(s: StoreState) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {} }

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loaded, setLoaded] = useState(false);

  const persist = useCallback((fn: (p: StoreState) => StoreState) => {
    setState((prev) => { const next = fn(prev); saveState(next); return next; });
  }, []);

  // API Async fetch functions
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, events: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/registrations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, registrations: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/credits`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, credits: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, complaints: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, notifications: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchFaculties = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/system/faculties`);
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, faculties: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/system/classes`);
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, classes: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchCurrentStudent = useCallback(async () => {
    try {
      const profile = await getCurrentStudentProfile();
      setCurrentStudent(profile);
      setState((prev) => ({
        ...prev,
        students: [profile, ...prev.students.filter((student) => student.id !== profile.id)],
      }));
      return profile;
    } catch (error) {
      console.error(error);
      setCurrentStudent(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const s = loadState();
    setState(s);
    try {
      const a = localStorage.getItem(AUTH_KEY);
      if (a) {
        const u = JSON.parse(a) as User;
        setCurrentUser({ ...u, role: u.role?.toLowerCase?.() ?? 'student' } as User);
        const token = localStorage.getItem('dthu-jwt-token');
        if (token) {
          fetchEvents();
          fetchRegistrations();
          fetchCredits();
          fetchComplaints();
          fetchNotifications();
          if (['student', 'classleader'].includes(u.role?.toLowerCase?.())) {
            fetchCurrentStudent();
          }
        }
      }
    } catch {}
    fetchFaculties();
    fetchClasses();
    setLoaded(true);
  }, [fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, fetchCurrentStudent]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || 'Email/mã sinh viên hoặc mật khẩu không đúng');
    
    const { token, data } = result;
    const normalizedUser = { ...data, role: data.role?.toLowerCase?.() ?? 'student' };
    localStorage.setItem('dthu-jwt-token', token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(normalizedUser));
    setCurrentUser(normalizedUser);

    // Loại bỏ dữ liệu nghiệp vụ cũ trong localStorage trước khi tải MySQL.
    localStorage.removeItem(STORE_KEY);
    setState((prev) => ({
      ...prev,
      events: [],
      registrations: [],
      credits: [],
      complaints: [],
      notifications: [],
    }));

    await Promise.all([
      fetchEvents(),
      fetchRegistrations(),
      fetchCredits(),
      fetchComplaints(),
      fetchNotifications(),
      ['student', 'classleader'].includes(normalizedUser.role) ? fetchCurrentStudent() : Promise.resolve(null),
    ]);

    return normalizedUser;
  }, [fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchCurrentStudent]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentStudent(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('dthu-jwt-token');
  }, []);

  const addEvent = useCallback(async (e: Partial<WorkEvent>) => {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify(e),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể tạo sự kiện');
    setState((prev) => ({ ...prev, events: [result.data, ...prev.events] }));
    return result.data;
  }, []);

  const updateEvent = useCallback(async (id: string, p: Partial<WorkEvent>) => {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify(p),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể cập nhật sự kiện');
    setState((prev) => ({ ...prev, events: prev.events.map((e) => (e.id === id ? result.data : e)) }));
  }, []);

  const addRegistration = useCallback(async (r: Partial<Registration>) => {
    const res = await fetch(`${API_BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify({
        eventId: r.eventId,
        selectedDate: r.selectedDate,
        selectedShift: r.selectedShift,
        selectedStartTime: r.selectedStartTime,
        selectedEndTime: r.selectedEndTime,
      }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể đăng ký sự kiện');
    setState((prev) => ({ ...prev, registrations: [result.data, ...prev.registrations.filter((item) => item.id !== result.data.id)] }));
    fetchEvents(); // Refresh event registered count
    return result.data;
  }, [fetchEvents]);

  const updateRegistration = useCallback(async (id: string, p: Partial<Registration>) => {
    // Nếu là sinh viên hủy đăng ký
    if (['student', 'classleader'].includes(currentUser?.role ?? '') && p.status === 'cancelled') {
      const res = await fetch(`${API_BASE_URL}/registrations/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
        }
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Không thể hủy đăng ký');
      setState((prev) => ({ ...prev, registrations: prev.registrations.map((r) => (r.id === id ? result.data : r)) }));
      fetchEvents();
      return;
    }

    // Nếu là Organizer duyệt/từ chối đăng ký
    const res = await fetch(`${API_BASE_URL}/registrations/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify({ status: p.status, rejectionReason: p.rejectionReason }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể cập nhật đăng ký');
    setState((prev) => ({ ...prev, registrations: prev.registrations.map((r) => (r.id === id ? result.data : r)) }));
  }, [currentUser, fetchEvents]);

  const updateCredit = useCallback(async (id: string, p: Partial<WorkCredit>) => {
    const res = await fetch(`${API_BASE_URL}/credits/${id}/adjust`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify({ creditValue: p.creditValue, reason: p.notes }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể điều chỉnh ngày công');
    setState((prev) => ({ ...prev, credits: prev.credits.map((c) => (c.id === id ? result.data : c)) }));
  }, []);

  const addComplaint = useCallback(async (c: Partial<Complaint>) => {
    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify({
        title: c.title,
        type: c.type,
        priority: c.priority,
        eventId: c.eventId,
        content: c.description,
        evidence: c.evidence
      }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể gửi khiếu nại');
    setState((prev) => ({ ...prev, complaints: [result.data, ...prev.complaints] }));
    return result.data;
  }, []);

  const updateComplaint = useCallback(async (id: string, p: Partial<Complaint>) => {
    const res = await fetch(`${API_BASE_URL}/complaints/${id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify({ status: p.status, note: p.response }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể xử lý khiếu nại');
    setState((prev) => ({ ...prev, complaints: prev.complaints.map((c) => (c.id === id ? result.data : c)) }));
  }, []);

  const markNotifRead = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      setState((p) => ({ ...p, notifications: p.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
    } catch (e) {}
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      setState((p) => ({ ...p, notifications: p.notifications.map((n) => (n.userId === currentUser.id ? { ...n, isRead: true } : n)) }));
    } catch (e) {}
  }, [currentUser]);

  const addNotification = useCallback((n: Partial<Notification>) => {
    const nn: Notification = { id: genId('n'), userId: n.userId ?? currentUser?.id ?? '', type: n.type ?? 'system', title: n.title ?? '', message: n.message ?? '', isRead: false, link: n.link, createdAt: new Date().toISOString() };
    persist((p) => ({ ...p, notifications: [nn, ...p.notifications] }));
  }, [currentUser, persist]);

  const addStudent = useCallback(async (s: Partial<Student>) => { await delay(); const ns: Student = { id: genId('s'), userId: genId('u'), studentCode: s.studentCode ?? `DH${Date.now()}`, fullName: s.fullName ?? '', email: s.email ?? '', phone: s.phone, facultyId: s.facultyId ?? '', classId: s.classId ?? '', schoolYear: s.schoolYear ?? '2024-2028', gender: s.gender ?? 'male', birthDate: s.birthDate, hometown: s.hometown, status: 'active', requiredWorkdays: s.requiredWorkdays ?? state.settings.defaultRequiredWorkdays, accumulatedWorkdays: 0, completedWorkdays: 0 }; persist((p) => ({ ...p, students: [ns, ...p.students] })); return ns; }, [state.settings.defaultRequiredWorkdays, persist]);
  const updateStudent = useCallback(async (id: string, p: Partial<Student>) => { await delay(); persist((prev) => ({ ...prev, students: prev.students.map((s) => (s.id === id ? { ...s, ...p } : s)) })); }, [persist]);
  const deleteStudent = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/system/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`,
      },
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.message || 'Không thể xóa sinh viên');
    }
    setState((prev) => ({ ...prev, students: prev.students.filter((student) => student.id !== id) }));
  }, []);
  const addClass = useCallback(async (c: Partial<Class>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/system/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`,
        },
        body: JSON.stringify(c),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Lớp hoặc mã lớp đã tồn tại');
      }
      if (result.data) {
        setState((prev) => ({ ...prev, classes: [...prev.classes, result.data] }));
        return result.data;
      }
    } catch (e) {
      if (e instanceof Error && (e.message.includes('tồn tại') || e.message.includes('Duplicate'))) throw e;
    }
    const nc: Class = { id: genId('cls'), name: c.name ?? '', code: c.code ?? '', facultyId: c.facultyId ?? '', schoolYear: c.schoolYear ?? '2024-2028' };
    persist((p) => ({ ...p, classes: [...p.classes, nc] }));
    return nc;
  }, [persist]);

  const updateClass = useCallback(async (id: string, p: Partial<Class>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/system/classes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`,
        },
        body: JSON.stringify(p),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Không thể cập nhật lớp');
      }
      if (result.data) {
        setState((prev) => ({ ...prev, classes: prev.classes.map((c) => (c.id === id ? result.data : c)) }));
        return;
      }
    } catch (e) {
      if (e instanceof Error && (e.message.includes('tồn tại') || e.message.includes('Duplicate'))) throw e;
    }
    persist((prev) => ({ ...prev, classes: prev.classes.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  }, [persist]);
  const deleteClass = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/system/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`,
        },
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.message || 'Không thể xóa lớp');
      }
    } catch (e) {
      console.warn('API deleteClass:', e);
    }
    setState((prev) => ({ ...prev, classes: prev.classes.filter((c) => c.id !== id) }));
  }, []);

  const addSemesterConfig = useCallback(async (s: Partial<SemesterConfig>) => {
    const ns: SemesterConfig = {
      id: genId('sem'),
      name: s.name ?? 'Học kỳ 1',
      schoolYear: s.schoolYear ?? '2024-2025',
      startDate: s.startDate ?? new Date().toISOString().split('T')[0],
      endDate: s.endDate ?? new Date().toISOString().split('T')[0],
      requiredWorkdays: s.requiredWorkdays ?? 12,
      isActive: s.isActive ?? false,
    };
    persist((prev) => {
      const updated = ns.isActive
        ? prev.semesterConfigs.map((item) => ({ ...item, isActive: false }))
        : prev.semesterConfigs;
      return { ...prev, semesterConfigs: [...updated, ns] };
    });
    return ns;
  }, [persist]);

  const updateSemesterConfig = useCallback(async (id: string, s: Partial<SemesterConfig>) => {
    persist((prev) => {
      const updated = prev.semesterConfigs.map((item) => {
        if (item.id === id) {
          return { ...item, ...s };
        }
        if (s.isActive) {
          return { ...item, isActive: false };
        }
        return item;
      });
      return { ...prev, semesterConfigs: updated };
    });
  }, [persist]);

  const deleteSemesterConfig = useCallback(async (id: string) => {
    persist((prev) => ({
      ...prev,
      semesterConfigs: prev.semesterConfigs.filter((item) => item.id !== id),
    }));
  }, [persist]);

  const setActiveSemesterConfig = useCallback(async (id: string) => {
    persist((prev) => ({
      ...prev,
      semesterConfigs: prev.semesterConfigs.map((item) => ({
        ...item,
        isActive: item.id === id,
      })),
    }));
  }, [persist]);
  const addUser = useCallback(async (u: Partial<User>) => { await delay(); const nu: User = { id: genId('u'), email: u.email ?? '', name: u.name ?? '', role: u.role ?? 'student', status: u.status ?? 'active', createdAt: new Date().toISOString(), phone: u.phone }; persist((p) => ({ ...p, users: [nu, ...p.users] })); return nu; }, [persist]);
  const updateUser = useCallback(async (id: string, p: Partial<User>) => {
    const isOwnProfile = currentUser?.id === id;
    const endpoint = isOwnProfile ? '/auth/me' : `/system/users/${id}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`,
      },
      body: JSON.stringify({
        name: p.name,
        email: p.email,
        phone: p.phone,
        role: p.role,
        status: p.status,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Không thể cập nhật người dùng');
    }

    const updatedUser = {
      ...result.data,
      role: result.data.role?.toLowerCase?.() ?? currentUser?.role ?? 'student',
    } as User;

    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => (user.id === id ? updatedUser : user)),
    }));

    if (isOwnProfile) {
      setCurrentUser(updatedUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
      if (['student', 'classleader'].includes(updatedUser.role)) {
        await fetchCurrentStudent();
      }
    }
  }, [currentUser, fetchCurrentStudent]);
  const updateSettings = useCallback((p: Partial<SystemSettings>) => persist((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })), [persist]);
  const addActivityLog = useCallback((l: Partial<ActivityLog>) => { const nl: ActivityLog = { id: genId('log'), userId: l.userId ?? currentUser?.id ?? '', userName: l.userName ?? currentUser?.name ?? '', userRole: l.userRole ?? currentUser?.role ?? 'student', action: l.action ?? '', affectedItem: l.affectedItem ?? '', oldValue: l.oldValue, newValue: l.newValue, timestamp: new Date().toISOString(), ipAddress: l.ipAddress }; persist((p) => ({ ...p, activityLogs: [nl, ...p.activityLogs] })); }, [currentUser, persist]);

  const value = useMemo<Ctx>(() => ({
    currentUser, currentStudent, login, logout, students: state.students, events: state.events, registrations: state.registrations,
    attendance: state.attendance, credits: state.credits, complaints: state.complaints, notifications: state.notifications,
    activityLogs: state.activityLogs, faculties: state.faculties, classes: state.classes, users: state.users,
    semesterConfigs: state.semesterConfigs, settings: state.settings,
    fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, fetchCurrentStudent,
    addEvent, updateEvent, addRegistration,
    updateRegistration, updateCredit, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addNotification,
    addStudent, updateStudent, deleteStudent, addClass, updateClass, deleteClass,
    addSemesterConfig, updateSemesterConfig, deleteSemesterConfig, setActiveSemesterConfig,
    addUser, updateUser, updateSettings, addActivityLog,
  }), [currentUser, currentStudent, login, logout, state, fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, fetchCurrentStudent, addEvent, updateEvent, addRegistration, updateRegistration, updateCredit, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addNotification, addStudent, updateStudent, deleteStudent, addClass, updateClass, deleteClass, addSemesterConfig, updateSemesterConfig, deleteSemesterConfig, setActiveSemesterConfig, addUser, updateUser, updateSettings, addActivityLog]);

  if (!loaded) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAppStore() { return useContext(StoreCtx); }
export function useCurrentStudent() { return useAppStore().currentStudent; }
