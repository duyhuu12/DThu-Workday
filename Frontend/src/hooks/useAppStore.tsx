'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ActivityLog, Attendance, Complaint, Faculty, Class, Notification, Registration, Student, User, WorkCredit, WorkEvent, SemesterConfig, SystemSettings } from '@/types';
import { API_BASE_URL, apiRequest } from '@/services/api';
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
  semesterConfigs: [],
  settings: {
    siteName: 'DThU Workday',
    supportEmail: 'workday@dthu.edu.vn',
    supportPhone: '02776543210',
    defaultRequiredWorkdays: 12,
    maxConcurrentRegistrations: 3,
    maintenanceMode: false
  },
};

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
  fetchStudents: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchSemesters: () => Promise<void>;
  fetchActivityLogs: () => Promise<void>;
  fetchCurrentStudent: () => Promise<Student | null>;
  addEvent: (e: Partial<WorkEvent>) => Promise<WorkEvent>;
  updateEvent: (id: string, p: Partial<WorkEvent>) => Promise<void>;
  addRegistration: (r: Partial<Registration>) => Promise<Registration>;
  updateRegistration: (id: string, p: Partial<Registration>) => Promise<void>;
  updateCredit: (id: string, p: Partial<WorkCredit>) => Promise<void>;
  adjustStudentWorkdays: (studentId: string, creditValue: number, reason: string) => Promise<WorkCredit>;
  addComplaint: (c: Partial<Complaint>) => Promise<Complaint>;
  updateComplaint: (id: string, p: Partial<Complaint>) => Promise<void>;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  addFaculty: (f: Partial<Faculty>) => Promise<Faculty>;
  updateFaculty: (id: string, p: Partial<Faculty>) => Promise<void>;
  deleteFaculty: (id: string) => Promise<void>;
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
  addUser: (u: Partial<User> & { password?: string }) => Promise<User>;
  updateUser: (id: string, p: Partial<User> & { password?: string }) => Promise<void>;
  updateAvatar: (imageData: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateSettings: (p: Partial<SystemSettings>) => Promise<void>;
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
    fetchClasses: async () => {}, fetchStudents: async () => {}, fetchUsers: async () => {},
    fetchSettings: async () => {}, fetchSemesters: async () => {}, fetchActivityLogs: async () => {},
    fetchCurrentStudent: async () => null,
    addEvent: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateEvent: async () => {}, addRegistration: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateRegistration: async () => {}, updateCredit: async () => {},
    adjustStudentWorkdays: async () => { throw new Error('AppStoreProvider is not ready'); },
    addComplaint: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateComplaint: async () => {}, markNotifRead: () => {}, markAllNotifsRead: () => {},
    addFaculty: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateFaculty: async () => {}, deleteFaculty: async () => {},
    addStudent: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateStudent: async () => {}, deleteStudent: async () => {},
    addClass: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateClass: async () => {}, deleteClass: async () => {},
    addSemesterConfig: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateSemesterConfig: async () => {}, deleteSemesterConfig: async () => {}, setActiveSemesterConfig: async () => {},
    addUser: async () => { throw new Error('AppStoreProvider is not ready'); },
    updateUser: async () => {}, updateAvatar: async () => {}, deleteUser: async () => {},
    updateSettings: async () => {},
  };
}

const StoreCtx = createContext<Ctx>(createDefaultContext());

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = state.settings.siteName;
  }, [state.settings.siteName]);

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

  const fetchStudents = useCallback(async () => {
    const result = await apiRequest<Student[]>('/system/students');
    setState((prev) => ({ ...prev, students: result.data ?? [] }));
  }, []);

  const fetchUsers = useCallback(async () => {
    const result = await apiRequest<User[]>('/system/users');
    setState((prev) => ({ ...prev, users: result.data ?? [] }));
  }, []);

  const fetchSettings = useCallback(async () => {
    const result = await apiRequest<SystemSettings>('/system/settings');
    if (result.data) {
      setState((prev) => ({ ...prev, settings: result.data! }));
    }
  }, []);

  const fetchSemesters = useCallback(async () => {
    const result = await apiRequest<SemesterConfig[]>('/system/semesters');
    setState((prev) => ({ ...prev, semesterConfigs: result.data ?? [] }));
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    const result = await apiRequest<ActivityLog[]>('/system/activity-logs');
    setState((prev) => ({ ...prev, activityLogs: result.data ?? [] }));
  }, []);

  const fetchAuthenticatedUser = useCallback(async (): Promise<User> => {
    const result = await apiRequest<User>('/auth/me');
    if (!result.data) throw new Error('Máy chủ không trả về người dùng');
    const user = {
      ...result.data,
      role: result.data.role?.toLowerCase?.() ?? 'student',
    } as User;
    setCurrentUser(user);
    return user;
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
    let active = true;
    const initialize = async () => {
      const tasks: Promise<unknown>[] = [fetchFaculties(), fetchClasses(), fetchSettings(), fetchSemesters()];
      localStorage.removeItem('dthu-store');
      localStorage.removeItem('dthu-auth');
      try {
        const token = localStorage.getItem('dthu-jwt-token');
        if (token) {
          const user = await fetchAuthenticatedUser();
          const role = user.role?.toLowerCase?.();
          tasks.push(fetchEvents(), fetchRegistrations(), fetchCredits(), fetchNotifications());
          if (['student', 'admin', 'superadmin'].includes(role)) tasks.push(fetchComplaints());
          if (['admin', 'superadmin'].includes(role)) tasks.push(fetchStudents(), fetchActivityLogs());
          if (role === 'superadmin') tasks.push(fetchUsers());
          if (role === 'student') tasks.push(fetchCurrentStudent());
        }
      } catch {
        localStorage.removeItem('dthu-jwt-token');
        setCurrentUser(null);
      }
      await Promise.allSettled(tasks);
      if (active) setLoaded(true);
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, fetchStudents, fetchUsers, fetchSettings, fetchSemesters, fetchActivityLogs, fetchAuthenticatedUser, fetchCurrentStudent]);

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
    setCurrentUser(normalizedUser);

    localStorage.removeItem('dthu-store');
    localStorage.removeItem('dthu-auth');
    setState((prev) => ({
      ...prev,
      events: [],
      registrations: [],
      credits: [],
      complaints: [],
      notifications: [],
      activityLogs: [],
    }));

    const settingsResult = await apiRequest<SystemSettings>('/system/settings');
    if (settingsResult.data) {
      setState((prev) => ({ ...prev, settings: settingsResult.data! }));
      if (settingsResult.data.maintenanceMode && normalizedUser.role !== 'superadmin') {
        return normalizedUser;
      }
    }

    await Promise.all([
      fetchEvents(),
      fetchRegistrations(),
      fetchCredits(),
      ['student', 'admin', 'superadmin'].includes(normalizedUser.role) ? fetchComplaints() : Promise.resolve(),
      fetchNotifications(),
      ['admin', 'superadmin'].includes(normalizedUser.role) ? fetchStudents() : Promise.resolve(),
      ['admin', 'superadmin'].includes(normalizedUser.role) ? fetchActivityLogs() : Promise.resolve(),
      normalizedUser.role === 'superadmin' ? fetchUsers() : Promise.resolve(),
      normalizedUser.role === 'student' ? fetchCurrentStudent() : Promise.resolve(null),
    ]);

    return normalizedUser;
  }, [fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchStudents, fetchActivityLogs, fetchUsers, fetchCurrentStudent]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentStudent(null);
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
    if (currentUser?.role === 'student' && p.status === 'cancelled') {
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
    const isStatusOnlyUpdate = p.status !== undefined && p.creditValue === undefined;
    const endpoint = isStatusOnlyUpdate ? `/credits/${id}/status` : `/credits/${id}/adjust`;
    const body = isStatusOnlyUpdate
      ? { status: p.status }
      : { creditValue: p.creditValue, reason: p.adjustmentReason ?? p.notes };
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dthu-jwt-token')}`
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể điều chỉnh ngày công');
    setState((prev) => ({ ...prev, credits: prev.credits.map((c) => (c.id === id ? result.data : c)) }));
    await fetchStudents();
  }, [fetchStudents]);

  const adjustStudentWorkdays = useCallback(async (studentId: string, creditValue: number, reason: string) => {
    const result = await apiRequest<WorkCredit>('/credits/manual', {
      method: 'POST',
      body: JSON.stringify({ studentId, creditValue, reason }),
    });
    if (!result.data) throw new Error('Máy chủ không trả dữ liệu điều chỉnh ngày công');
    await Promise.all([fetchCredits(), fetchStudents()]);
    return result.data;
  }, [fetchCredits, fetchStudents]);

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

  const addFaculty = useCallback(async (input: Partial<Faculty>) => {
    const result = await apiRequest<Faculty>('/system/faculties', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!result.data) throw new Error('Máy chủ không trả về khoa vừa tạo');
    setState((prev) => ({ ...prev, faculties: [...prev.faculties, result.data!] }));
    return result.data;
  }, []);
  const updateFaculty = useCallback(async (id: string, input: Partial<Faculty>) => {
    const result = await apiRequest<Faculty>(`/system/faculties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    if (result.data) {
      setState((prev) => ({
        ...prev,
        faculties: prev.faculties.map((item) => item.id === id ? result.data! : item),
      }));
    }
  }, []);
  const deleteFaculty = useCallback(async (id: string) => {
    await apiRequest(`/system/faculties/${id}`, { method: 'DELETE' });
    setState((prev) => ({
      ...prev,
      faculties: prev.faculties.filter((item) => item.id !== id),
    }));
  }, []);

  const addStudent = useCallback(async (input: Partial<Student>) => {
    const result = await apiRequest<Student>('/system/students', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!result.data) throw new Error('Máy chủ không trả về sinh viên vừa tạo');
    setState((prev) => ({ ...prev, students: [result.data!, ...prev.students] }));
    return result.data;
  }, []);
  const updateStudent = useCallback(async (id: string, input: Partial<Student>) => {
    const result = await apiRequest<Student>(`/system/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    if (result.data) {
      setState((prev) => ({
        ...prev,
        students: prev.students.map((student) => student.id === id ? result.data! : student),
      }));
    }
  }, []);
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
  const addClass = useCallback(async (input: Partial<Class>) => {
    const result = await apiRequest<Class>('/system/classes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!result.data) throw new Error('Máy chủ không trả về lớp vừa tạo');
    setState((prev) => ({ ...prev, classes: [...prev.classes, result.data!] }));
    return result.data;
  }, []);

  const updateClass = useCallback(async (id: string, input: Partial<Class>) => {
    const result = await apiRequest<Class>(`/system/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    if (result.data) {
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((item) => item.id === id ? result.data! : item),
      }));
    }
  }, []);
  const deleteClass = useCallback(async (id: string) => {
    await apiRequest(`/system/classes/${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, classes: prev.classes.filter((c) => c.id !== id) }));
  }, []);

  const addSemesterConfig = useCallback(async (s: Partial<SemesterConfig>) => {
    const result = await apiRequest<SemesterConfig>('/system/semesters', {
      method: 'POST',
      body: JSON.stringify(s),
    });
    if (!result.data) throw new Error('Máy chủ không trả về học kỳ vừa tạo');
    await Promise.all([fetchSemesters(), fetchSettings(), fetchStudents()]);
    return result.data;
  }, [fetchSemesters, fetchSettings, fetchStudents]);

  const updateSemesterConfig = useCallback(async (id: string, s: Partial<SemesterConfig>) => {
    await apiRequest<SemesterConfig>(`/system/semesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(s),
    });
    await Promise.all([fetchSemesters(), fetchSettings(), fetchStudents()]);
  }, [fetchSemesters, fetchSettings, fetchStudents]);

  const deleteSemesterConfig = useCallback(async (id: string) => {
    await apiRequest(`/system/semesters/${id}`, { method: 'DELETE' });
    await fetchSemesters();
  }, [fetchSemesters]);

  const setActiveSemesterConfig = useCallback(async (id: string) => {
    await apiRequest<SemesterConfig>(`/system/semesters/${id}/activate`, { method: 'PUT' });
    await Promise.all([fetchSemesters(), fetchSettings(), fetchStudents()]);
  }, [fetchSemesters, fetchSettings, fetchStudents]);
  const addUser = useCallback(async (input: Partial<User> & { password?: string }) => {
    const result = await apiRequest<User>('/system/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!result.data) throw new Error('Máy chủ không trả về người dùng vừa tạo');
    setState((prev) => ({ ...prev, users: [result.data!, ...prev.users] }));
    return result.data;
  }, []);
  const updateUser = useCallback(async (id: string, p: Partial<User> & { password?: string }) => {
    const isOwnProfile = currentUser?.id === id;
    const isSuperAdminPasswordChange = currentUser?.role === 'superadmin' && Boolean(p.password);
    const endpoint = isOwnProfile && !isSuperAdminPasswordChange ? '/auth/me' : `/system/users/${id}`;

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
        password: p.password,
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
      if (updatedUser.role === 'student') {
        await fetchCurrentStudent();
      }
    }
  }, [currentUser, fetchCurrentStudent]);
  const updateAvatar = useCallback(async (imageData: string) => {
    const result = await apiRequest<User>('/auth/me/avatar', {
      method: 'PUT',
      body: JSON.stringify({ imageData }),
    });
    if (!result.data) throw new Error('Máy chủ không trả về ảnh đại diện');

    const updatedUser = {
      ...result.data,
      role: result.data.role?.toLowerCase?.() ?? currentUser?.role ?? 'student',
    } as User;
    setCurrentUser(updatedUser);
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => user.id === updatedUser.id ? updatedUser : user),
    }));
  }, [currentUser]);
  const deleteUser = useCallback(async (id: string) => {
    await apiRequest(`/system/users/${id}`, { method: 'DELETE' });
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((user) => user.id !== id),
    }));
  }, []);
  const updateSettings = useCallback(async (p: Partial<SystemSettings>) => {
    const result = await apiRequest<SystemSettings>('/system/settings', {
      method: 'PUT',
      body: JSON.stringify(p),
    });
    if (!result.data) throw new Error('Máy chủ không trả dữ liệu cài đặt');
    setState((prev) => ({ ...prev, settings: result.data! }));
  }, []);

  const value = useMemo<Ctx>(() => ({
    currentUser, currentStudent, login, logout, students: state.students, events: state.events, registrations: state.registrations,
    attendance: state.attendance, credits: state.credits, complaints: state.complaints, notifications: state.notifications,
    activityLogs: state.activityLogs, faculties: state.faculties, classes: state.classes, users: state.users,
    semesterConfigs: state.semesterConfigs, settings: state.settings,
    fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, fetchStudents, fetchUsers, fetchSettings, fetchSemesters, fetchActivityLogs, fetchCurrentStudent,
    addEvent, updateEvent, addRegistration,
    updateRegistration, updateCredit, adjustStudentWorkdays, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead,
    addFaculty, updateFaculty, deleteFaculty,
    addStudent, updateStudent, deleteStudent, addClass, updateClass, deleteClass,
    addSemesterConfig, updateSemesterConfig, deleteSemesterConfig, setActiveSemesterConfig,
    addUser, updateUser, updateAvatar, deleteUser, updateSettings,
  }), [currentUser, currentStudent, login, logout, state, fetchEvents, fetchRegistrations, fetchCredits, fetchComplaints, fetchNotifications, fetchFaculties, fetchClasses, fetchStudents, fetchUsers, fetchSettings, fetchSemesters, fetchActivityLogs, fetchCurrentStudent, addEvent, updateEvent, addRegistration, updateRegistration, updateCredit, adjustStudentWorkdays, addComplaint, updateComplaint, markNotifRead, markAllNotifsRead, addFaculty, updateFaculty, deleteFaculty, addStudent, updateStudent, deleteStudent, addClass, updateClass, deleteClass, addSemesterConfig, updateSemesterConfig, deleteSemesterConfig, setActiveSemesterConfig, addUser, updateUser, updateAvatar, deleteUser, updateSettings]);

  if (!loaded) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAppStore() { return useContext(StoreCtx); }
export function useCurrentStudent() { return useAppStore().currentStudent; }
