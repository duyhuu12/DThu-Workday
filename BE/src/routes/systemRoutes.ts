import { Router } from 'express';
import {
  getFaculties, createFaculty, updateFaculty, deleteFaculty,
  getClasses, createClass, updateClass, deleteClass,
  getStudents, createStudent, updateStudent, deleteStudent,
  getUsers, createUser, updateUser, deleteUser,
  getSettings, updateSettings, getSemesters,
  getActivityLogs, createActivityLog,
} from '../controllers/systemController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const admins = ['ADMIN', 'SUPER_ADMIN'] as const;

router.get('/faculties', getFaculties);
router.post('/faculties', authenticate, authorize([...admins]), createFaculty);
router.put('/faculties/:id', authenticate, authorize([...admins]), updateFaculty);
router.delete('/faculties/:id', authenticate, authorize([...admins]), deleteFaculty);

router.get('/classes', getClasses);
router.post('/classes', authenticate, authorize([...admins]), createClass);
router.put('/classes/:id', authenticate, authorize([...admins]), updateClass);
router.delete('/classes/:id', authenticate, authorize([...admins]), deleteClass);

router.get('/students', authenticate, getStudents);
router.post('/students', authenticate, authorize([...admins]), createStudent);
router.put('/students/:id', authenticate, authorize([...admins]), updateStudent);
router.delete('/students/:id', authenticate, authorize([...admins]), deleteStudent);

router.get('/users', authenticate, authorize(['SUPER_ADMIN']), getUsers);
router.post('/users', authenticate, authorize(['SUPER_ADMIN']), createUser);
router.put('/users/:id', authenticate, authorize(['SUPER_ADMIN']), updateUser);
router.delete('/users/:id', authenticate, authorize(['SUPER_ADMIN']), deleteUser);

router.get('/settings', getSettings);
router.put('/settings', authenticate, authorize(['SUPER_ADMIN']), updateSettings);
router.get('/semesters', getSemesters);

router.get('/activity-logs', authenticate, authorize([...admins]), getActivityLogs);
router.post('/activity-logs', authenticate, createActivityLog);

export default router;
