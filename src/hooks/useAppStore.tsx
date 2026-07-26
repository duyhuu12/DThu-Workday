'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ActivityLog, Attendance, Complaint, Faculty, Class, Notification, Registration, Student, User, WorkCredit, WorkEvent, SemesterConfig, SystemSettings } from '@/types';
import * as mockData from '@/data';
import { delay, genId } from '@/lib/config';

interface StoreState {
  students: Student[]; events: WorkEvent[]; registrations: Registration[]; attendance: Attendance[];
  credits: WorkCredit[]; complaints: Complaint[]; notifications: Notification[]; activityLogs: ActivityLog[];
  users: User[]; faculties: Faculty[]; classes: Class[]; semesterConfigs: SemesterConfig[]; settings: SystemSettings;
}

const initialState: StoreState = {
  students: mockData.students, events: mockData.events, registrations: mockData.registrations,
  attendance: mockData.attendanceRecords, credits: mockData.workCredits, complaints: mockData.complaints,
  notifications: mockData.notifications, activityLogs: mockData.activityLogs, users: mockData.users,
  faculties: mockData.faculties, classes: mockData.classes, semesterConfigs: mockData.semesterConfigs, settings: mockData.systemSettings,
};

const STORE_KEY = 'dthu-store';
const AUTH_KEY = 'dthu-auth';

interface Ctx {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
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
  addClass: (c: Partial<Class>) => Promise<Class>;
  updateClass: (id: string, p: Partial<Class>) => Promise<void>;
  addUser: (u: Partial<User>) => Promise<User>;
  updateUser: (id: string, p: Partial<User>) => Promise<void>;
  updateSettings: (p: Partial<SystemSettings>) => void;
  addActivityLog: (l: Partial<ActivityLog>) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

function loadState(): StoreState {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return { ...initialState, ...JSON.parse(raw) }; } catch {}
  return initialState;
}
function saveState(s: StoreState) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {} }

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  const persist = useCallback((fn: (p: StoreState) => StoreState) => {
    setState((prev) => { const next = fn(prev); saveState(next); return next; });
  }, []);

  // API Async fetch functions
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/events', {
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
      const res = await fetch('http://localhost:8080/api/registrations', {
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
      const res = await fetch('http://localhost:8080/api/credits', {
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
      const res = await fetch('http://localhost:8080/api/complaints', {
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
      const res = await fetch('http://localhost:8080/api/notifications', {
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
      const res = await fetch('http://localhost:8080/api/system/faculties');
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
      const res = await fetch('http://localhost:8080/api/system/classes');
      const result = await res.json();
      if (result.success) {
        setState((prev) => ({ ...prev, classes: result.data }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const s = loadState();
    setState(s);
    try {
      const a = localStorage.getItem(AUTH_KEY);
      if (a) {
        const u = JSON.parse(a) as User;
        setCurrentUser(u);
        const token = localStorage.getItem('dthu-jwt-token');
        if (token) {
          fetchEvents();
          fetchRegistrations();
          fetchCredits();
          fetchComplaints();
          fetchNotifications();
        }
      }
    } catch {}
    fetchFaculties();
    fetchClasses();
    setLoaded(true);
  }, [fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || 'Email hoặc mật khẩu không đúng');
    
    const { token, data } = result;
    localStorage.setItem('dthu-jwt-token', token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setCurrentUser(data);

    // Load actual data upon login
    fetchEvents();
    fetchRegistrations();
    fetchCredits();
    fetchComplaints();
    fetchNotifications();

    return data;
  }, [fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('dthu-jwt-token');
  }, []);

  const addEvent = useCallback(async (e: Partial<WorkEvent>) => {
    const res = await fetch('http://localhost:8080/api/events', {
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
    const res = await fetch(`http://localhost:8080/api/events/${id}`, {
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
    const res = await fetch('http://localhost:8080/api/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify({ eventId: r.eventId }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể đăng ký sự kiện');
    setState((prev) => ({ ...prev, registrations: [result.data, ...prev.registrations] }));
    fetchEvents(); // Refresh event registered count
    return result.data;
  }, [fetchEvents]);

  const updateRegistration = useCallback(async (id: string, p: Partial<Registration>) => {
    // Nếu là sinh viên hủy đăng ký
    if (currentUser?.role === 'student' && p.status === 'cancelled') {
      const res = await fetch(`http://localhost:8080/api/registrations/${id}/cancel`, {
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
    const res = await fetch(`http://localhost:8080/api/registrations/${id}/status`, {
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
    const res = await fetch(`http://localhost:8080/api/credits/${id}/adjust`, {
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
    const res = await fetch('http://localhost:8080/api/complaints', {
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
    const res = await fetch(`http://localhost:8080/api/complaints/${id}/respond`, {
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
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}` }
      });
      setState((p) => ({ ...p, notifications: p.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
    } catch (e) {}
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch('http://localhost:8080/api/notifications/read-all', {
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
  const addClass = useCallback(async (c: Partial<Class>) => { await delay(); const nc: Class = { id: genId('cls'), name: c.name ?? '', code: c.code ?? '', facultyId: c.facultyId ?? '', schoolYear: c.schoolYear ?? '2024-2028' }; persist((p) => ({ ...p, classes: [...p.classes, nc] })); return nc; }, [persist]);
  const updateClass = useCallback(async (id: string, p: Partial<Class>) => { await delay(); persist((prev) => ({ ...prev, classes: prev.classes.map((c) => (c.id === id ? { ...c, ...p } : c)) })); }, [persist]);
  const addUser = useCallback(async (u: Partial<User>) => { await delay(); const nu: User = { id: genId('u'), email: u.email ?? '', name: u.name ?? '', role: u.role ?? 'student', status: u.status ?? 'active', createdAt: new Date().toISOString(), phone: u.phone }; persist((p) => ({ ...p, users: [nu, ...p.users] })); return nu; }, [persist]);
  const updateUser = useCallback(async (id: string, p: Partial<User>) => { await delay(); persist((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === id ? { ...u, ...p } : u)) })); if (currentUser?.id === id) setCurrentUser((prev) => (prev ? { ...prev, ...p } : prev)); }, [persist, currentUser]);
  const updateSettings = useCallback((p: Partial<SystemSettings>) => persist((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })), [persist]);
  const addActivityLog = useCallback((l: Partial<ActivityLog>) => { const nl: ActivityLog = { id: genId('log'), userId: l.userId ?? currentUser?.id ?? '', userName: l.userName ?? currentUser?.name ?? '', userRole: l.userRole ?? currentUser?.role ?? 'student', action: l.action ?? '', affectedItem: l.affectedItem ?? '', oldValue: l.oldValue, newValue: l.newValue, timestamp: new Date().toISOString(), ipAddress: l.ipAddress }; persist((p) => ({ ...p, activityLogs: [nl, ...p.activityLogs] })); }, [currentUser, persist]);

  const value = useMemo<Ctx>(() => ({
    currentUser, login, logout, students: state.students, events: state.events, registrations: state.registrations,
    attendance: state.attendance, credits: state.credits, complaints: state.complaints, notifications: state.notifications,
    activityLogs: state.activityLogs, faculties: state.faculties, classes: state.classes, users: state.users,
    semesterConfigs: state.semesterConfigs, settings: state.settings,
    fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses,
    addEvent, updateEvent, addRegistration,
    updateRegistration, updateCredit, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addNotification,
    addStudent, updateStudent, addClass, updateClass, addUser, updateUser, updateSettings, addActivityLog,
  }), [currentUser, login, logout, state, fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, addEvent, updateEvent, addRegistration, updateRegistration, updateCredit, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addNotification, addStudent, updateStudent, addClass, updateClass, addUser, updateUser, updateSettings, addActivityLog]);

  if (!loaded) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAppStore() { const c = useContext(StoreCtx); if (!c) throw new Error('useAppStore must be used within AppStoreProvider'); return c; }
export function useCurrentStudent() { const { currentUser, students } = useAppStore(); return students.find((s) => s.userId === currentUser?.id) ?? null; }
