import dynamic from 'next/dynamic';

const StudentDashboardClient = dynamic(() => import('@/components/student/StudentDashboardClient'), { ssr: false });

export default function StudentDashboard() {
  return <StudentDashboardClient />;
}
