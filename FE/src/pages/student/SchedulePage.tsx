import dynamic from 'next/dynamic';

const SchedulePageClient = dynamic(() => import('@/components/student/SchedulePageClient'), { ssr: false });

export default function SchedulePage() {
  return <SchedulePageClient />;
}
