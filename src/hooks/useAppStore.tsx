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

  useEffect(() => {
    const s = loadState();
    setState(s);
    try { const a = localStorage.getItem(AUTH_KEY); if (a) { const u = JSON.parse(a) as User; const fresh = s.users.find((x) => x.id === u.id); setCurrentUser(fresh ?? u); } } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback((fn: (p: StoreState) => StoreState) => {
    setState((prev) => { const next = fn(prev); saveState(next); return next; });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await delay(500);
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.status === 'active');
    if (!user || password !== '123456') throw new Error('Email hoặc mật khẩu không đúng');
    const updated = { ...user, lastLogin: new Date().toISOString() };
    persist((p) => ({ ...p, users: p.users.map((u) => (u.id === user.id ? updated : u)), activityLogs: [{ id: genId('log'), userId: user.id, userName: user.name, userRole: user.role, action: 'Đăng nhập', affectedItem: 'Hệ thống', timestamp: new Date().toISOString() }, ...p.activityLogs] }));
    setCurrentUser(updated);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    return updated;
  }, [state.users, persist]);

  const logout = useCallback(() => { setCurrentUser(null); localStorage.removeItem(AUTH_KEY); }, []);

  const addEvent = useCallback(async (e: Partial<WorkEvent>) => {
    await delay();
    const ne: WorkEvent = { id: genId('e'), code: e.code ?? `WD-${new Date().getFullYear()}-${String(state.events.length + 1).padStart(3, '0')}`, name: e.name ?? '', description: e.description ?? '', workContent: e.workContent ?? '', location: e.location ?? '', date: e.date ?? '', startTime: e.startTime ?? '07:00', endTime: e.endTime ?? '11:00', shift: e.shift ?? 'morning', registrationOpen: e.registrationOpen ?? '', registrationClose: e.registrationClose ?? '', cancellationDeadline: e.cancellationDeadline ?? '', maxCapacity: e.maxCapacity ?? 30, registeredCount: 0, workdayCredit: e.workdayCredit ?? 1, eligibleFacultyIds: e.eligibleFacultyIds ?? [], eligibleClassIds: e.eligibleClassIds ?? [], eligibleSchoolYears: e.eligibleSchoolYears ?? [], clothingRequirements: e.clothingRequirements ?? '', equipmentRequirements: e.equipmentRequirements ?? '', contactPerson: e.contactPerson ?? '', contactPhone: e.contactPhone ?? '', organizerId: currentUser?.id ?? 'u-2', organizerName: currentUser?.name ?? 'Trần Thị Bình', status: e.status ?? 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    persist((p) => ({ ...p, events: [ne, ...p.events] }));
    return ne;
  }, [state.events.length, currentUser, persist]);

  const updateEvent = useCallback(async (id: string, p: Partial<WorkEvent>) => { await delay(); persist((prev) => ({ ...prev, events: prev.events.map((e) => (e.id === id ? { ...e, ...p, updatedAt: new Date().toISOString() } : e)) })); }, [persist]);
  const addRegistration = useCallback(async (r: Partial<Registration>) => { await delay(); const nr: Registration = { id: genId('r'), eventId: r.eventId ?? '', studentId: r.studentId ?? '', studentCode: r.studentCode ?? '', studentName: r.studentName ?? '', classId: r.classId ?? '', className: r.className ?? '', facultyId: r.facultyId ?? '', facultyName: r.facultyName ?? '', status: r.status ?? 'pending', registeredAt: new Date().toISOString(), attendanceStatus: 'not_checked', ...r }; persist((p) => ({ ...p, registrations: [nr, ...p.registrations], events: p.events.map((e) => (e.id === nr.eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e)) })); return nr; }, [persist]);
  const updateRegistration = useCallback(async (id: string, p: Partial<Registration>) => { await delay(); persist((prev) => ({ ...prev, registrations: prev.registrations.map((r) => (r.id === id ? { ...r, ...p } : r)) })); }, [persist]);
  const updateCredit = useCallback(async (id: string, p: Partial<WorkCredit>) => { await delay(); persist((prev) => ({ ...prev, credits: prev.credits.map((c) => (c.id === id ? { ...c, ...p } : c)) })); }, [persist]);
  const addComplaint = useCallback(async (c: Partial<Complaint>) => { await delay(); const nc: Complaint = { id: genId('cp'), code: c.code ?? `KN-${new Date().getFullYear()}-${String(state.complaints.length + 1).padStart(3, '0')}`, studentId: c.studentId ?? '', studentCode: c.studentCode ?? '', studentName: c.studentName ?? '', classId: c.classId ?? '', className: c.className ?? '', facultyId: c.facultyId ?? '', facultyName: c.facultyName ?? '', eventId: c.eventId ?? '', eventName: c.eventName ?? '', type: c.type ?? 'other', priority: c.priority ?? 'medium', title: c.title ?? '', description: c.description ?? '', evidence: c.evidence ?? [], status: 'submitted', timeline: [{ id: genId('t'), status: 'submitted', note: 'Khiếu nại đã được gửi', actor: c.studentName ?? '', timestamp: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...c }; persist((p) => ({ ...p, complaints: [nc, ...p.complaints] })); return nc; }, [state.complaints.length, persist]);
  const updateComplaint = useCallback(async (id: string, p: Partial<Complaint>) => { await delay(); persist((prev) => ({ ...prev, complaints: prev.complaints.map((c) => (c.id === id ? { ...c, ...p, updatedAt: new Date().toISOString() } : c)) })); }, [persist]);
  const markNotifRead = useCallback((id: string) => persist((p) => ({ ...p, notifications: p.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) })), [persist]);
  const markAllNotifsRead = useCallback(() => { if (!currentUser) return; persist((p) => ({ ...p, notifications: p.notifications.map((n) => (n.userId === currentUser.id ? { ...n, isRead: true } : n)) })); }, [currentUser, persist]);
  const addNotification = useCallback((n: Partial<Notification>) => { const nn: Notification = { id: genId('n'), userId: n.userId ?? currentUser?.id ?? '', type: n.type ?? 'system', title: n.title ?? '', message: n.message ?? '', isRead: false, link: n.link, createdAt: new Date().toISOString() }; persist((p) => ({ ...p, notifications: [nn, ...p.notifications] })); }, [currentUser, persist]);
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
    semesterConfigs: state.semesterConfigs, settings: state.settings, addEvent, updateEvent, addRegistration,
    updateRegistration, updateCredit, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addNotification,
    addStudent, updateStudent, addClass, updateClass, addUser, updateUser, updateSettings, addActivityLog,
  }), [currentUser, login, logout, state, addEvent, updateEvent, addRegistration, updateRegistration, updateCredit, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addNotification, addStudent, updateStudent, addClass, updateClass, addUser, updateUser, updateSettings, addActivityLog]);

  if (!loaded) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAppStore() { const c = useContext(StoreCtx); if (!c) throw new Error('useAppStore must be used within AppStoreProvider'); return c; }
export function useCurrentStudent() { const { currentUser, students } = useAppStore(); return students.find((s) => s.userId === currentUser?.id) ?? null; }
