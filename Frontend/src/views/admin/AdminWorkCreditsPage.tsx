'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  Check,
  Download,
  Loader2,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CREDIT_STATUS_LABELS, CREDIT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { exportAdminStudentReport } from '@/services/reportApi';
import type { CreditStatus, Student, WorkCredit } from '@/types';

type ViewMode = 'summary' | 'details';

interface StudentCreditSummary {
  student: Student;
  facultyName: string;
  className: string;
  accumulated: number;
  required: number;
  percentage: number;
}

const ALL = 'all';
const MANUAL_ADJUSTMENT = 'manual-adjustment';

export default function AdminWorkCreditsPage() {
  const {
    credits,
    students,
    faculties,
    classes,
    semesterConfigs,
    updateCredit,
  } = useAppStore();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>('summary');
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState(ALL);
  const [facultyId, setFacultyId] = useState(ALL);
  const [classId, setClassId] = useState(ALL);
  const [eventId, setEventId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const semesterOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const config of semesterConfigs) {
      const value = `${config.name}|${config.schoolYear}`;
      options.set(value, `${config.name} ${config.schoolYear}`);
    }
    for (const credit of credits) {
      const value = `${credit.semester}|${credit.schoolYear}`;
      options.set(value, `${credit.semester} ${credit.schoolYear}`);
    }
    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [credits, semesterConfigs]);

  const eventOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const credit of credits) options.set(credit.eventId ?? MANUAL_ADJUSTMENT, credit.eventName);
    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [credits]);

  const classOptions = useMemo(
    () => classes.filter((item) => facultyId === ALL || item.facultyId === facultyId),
    [classes, facultyId],
  );

  const filteredCredits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return credits.filter((credit) => {
      if (semester !== ALL && `${credit.semester}|${credit.schoolYear}` !== semester) return false;
      if (facultyId !== ALL && credit.facultyId !== facultyId) return false;
      if (classId !== ALL && credit.classId !== classId) return false;
      if (eventId !== ALL && (credit.eventId ?? MANUAL_ADJUSTMENT) !== eventId) return false;
      if (status !== ALL && credit.status !== status) return false;
      if (dateFrom && credit.eventDate < dateFrom) return false;
      if (dateTo && credit.eventDate > dateTo) return false;
      if (
        query &&
        !credit.studentName.toLowerCase().includes(query) &&
        !credit.studentCode.toLowerCase().includes(query) &&
        !credit.eventName.toLowerCase().includes(query)
      ) return false;
      return true;
    });
  }, [credits, search, semester, facultyId, classId, eventId, status, dateFrom, dateTo]);

  const summaryRows = useMemo<StudentCreditSummary[]>(() => {
    const query = search.trim().toLowerCase();
    return students
      .filter((student) => {
        if (facultyId !== ALL && student.facultyId !== facultyId) return false;
        if (classId !== ALL && student.classId !== classId) return false;
        if (
          query &&
          !student.fullName.toLowerCase().includes(query) &&
          !student.studentCode.toLowerCase().includes(query) &&
          !filteredCredits.some((credit) => credit.studentId === student.id)
        ) return false;
        return true;
      })
      .map((student) => {
        const accumulated = filteredCredits
          .filter((credit) => credit.studentId === student.id && ['recorded', 'adjusted'].includes(credit.status))
          .reduce((total, credit) => total + credit.creditValue, 0);
        const required = student.requiredWorkdays;
        return {
          student,
          facultyName: student.facultyName || faculties.find((item) => item.id === student.facultyId)?.name || '—',
          className: student.className || classes.find((item) => item.id === student.classId)?.name || '—',
          accumulated,
          required,
          percentage: required > 0 ? Math.round((accumulated / required) * 100) : 0,
        };
      });
  }, [students, filteredCredits, search, facultyId, classId, faculties, classes]);

  const completedStudents = summaryRows.filter((row) => row.accumulated >= row.required).length;
  const insufficientStudents = summaryRows.length - completedStudents;
  const pendingCredits = filteredCredits.filter((credit) => credit.status === 'pending').length;
  const totalRecordedCredits = filteredCredits
    .filter((credit) => ['recorded', 'adjusted'].includes(credit.status))
    .reduce((total, credit) => total + credit.creditValue, 0);

  const hasFilters = Boolean(
    search || semester !== ALL || facultyId !== ALL || classId !== ALL ||
    eventId !== ALL || status !== ALL || dateFrom || dateTo,
  );

  function resetFilters() {
    setSearch('');
    setSemester(ALL);
    setFacultyId(ALL);
    setClassId(ALL);
    setEventId(ALL);
    setStatus(ALL);
    setDateFrom('');
    setDateTo('');
  }

  function changeFaculty(value: string) {
    setFacultyId(value);
    if (value !== ALL && classId !== ALL) {
      const selectedClass = classes.find((item) => item.id === classId);
      if (selectedClass?.facultyId !== value) setClassId(ALL);
    }
  }

  async function updateStatus(credit: WorkCredit, newStatus: CreditStatus) {
    try {
      await updateCredit(credit.id, {
        status: newStatus,
        adjustedAt: new Date().toISOString(),
      });
      toast({ title: 'Đã cập nhật trạng thái' });
    } catch (error) {
      toast({
        title: 'Không thể cập nhật ngày công',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportAdminStudentReport();
      toast({ title: 'Đã xuất báo cáo ngày công sinh viên' });
    } catch (error) {
      toast({
        title: 'Xuất báo cáo thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }

  const summaryColumns: Column<StudentCreditSummary>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (row) => row.student.studentCode, render: (row) => <span className="font-mono text-xs">{row.student.studentCode}</span> },
    { key: 'studentName', header: 'Họ tên', sortable: true, sortValue: (row) => row.student.fullName, render: (row) => <span className="font-medium">{row.student.fullName}</span> },
    { key: 'faculty', header: 'Khoa', sortable: true, sortValue: (row) => row.facultyName, render: (row) => <span className="text-sm text-muted-foreground">{row.facultyName}</span> },
    { key: 'class', header: 'Lớp', sortable: true, sortValue: (row) => row.className, render: (row) => row.className },
    { key: 'accumulated', header: 'Đã có', sortable: true, sortValue: (row) => row.accumulated, render: (row) => <span className="font-semibold text-primary">{row.accumulated}</span> },
    { key: 'required', header: 'Yêu cầu', sortable: true, sortValue: (row) => row.required, render: (row) => row.required },
    {
      key: 'progress',
      header: 'Tiến độ',
      sortable: true,
      sortValue: (row) => row.percentage,
      className: 'min-w-[150px]',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Progress value={Math.min(100, row.percentage)} className="h-2 w-24" />
          <span className={`w-10 text-right text-xs font-semibold ${row.percentage >= 100 ? 'text-success' : 'text-muted-foreground'}`}>
            {row.percentage}%
          </span>
        </div>
      ),
    },
  ];

  const detailColumns: Column<WorkCredit>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (credit) => credit.studentCode, render: (credit) => <span className="font-mono text-xs">{credit.studentCode}</span> },
    { key: 'studentName', header: 'Họ tên', sortable: true, sortValue: (credit) => credit.studentName, render: (credit) => <span className="font-medium">{credit.studentName}</span> },
    { key: 'eventName', header: 'Sự kiện', sortable: true, sortValue: (credit) => credit.eventName, render: (credit) => <span>{credit.eventName}</span> },
    { key: 'eventDate', header: 'Ngày', sortable: true, sortValue: (credit) => credit.eventDate, render: (credit) => formatDate(credit.eventDate) },
    { key: 'class', header: 'Lớp', render: (credit) => credit.className },
    { key: 'creditValue', header: 'Ngày công', sortable: true, sortValue: (credit) => credit.creditValue, render: (credit) => <span className="font-semibold text-primary">{credit.creditValue}</span> },
    { key: 'status', header: 'Trạng thái', render: (credit) => <StatusBadge label={CREDIT_STATUS_LABELS[credit.status]} variant={CREDIT_STATUS_VARIANTS[credit.status]} /> },
    {
      key: 'action',
      header: '',
      render: (credit) => (
        <div className="flex justify-end gap-1">
          {credit.status !== 'recorded' && <Button size="icon" variant="ghost" title="Ghi nhận" onClick={() => void updateStatus(credit, 'recorded')}><Check className="h-4 w-4 text-success" /></Button>}
          {credit.status !== 'rejected' && <Button size="icon" variant="ghost" title="Từ chối" onClick={() => void updateStatus(credit, 'rejected')}><X className="h-4 w-4 text-destructive" /></Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="pb-6">
      <Card className="overflow-hidden rounded-xl shadow-sm">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Ngày công sinh viên</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Theo dõi chỉ tiêu và các phát sinh ngày công</p>
          </div>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Xuất báo cáo
          </Button>
        </div>

        <div className="grid grid-cols-2 border-y bg-muted/20 md:grid-cols-5">
          <Metric label="Tổng sinh viên" value={summaryRows.length} />
          <Metric label="Đã đủ chỉ tiêu" value={completedStudents} tone="success" />
          <Metric label="Chưa đủ chỉ tiêu" value={insufficientStudents} tone="warning" />
          <Metric label="Chờ xác nhận" value={pendingCredits} tone="pending" />
          <Metric label="Tổng ngày công" value={totalRecordedCredits} suffix="ngày" last />
        </div>

        <div className="space-y-3 border-b px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-9 pl-9" placeholder="Tìm mã SV, họ tên hoặc sự kiện..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <FilterSelect value={semester} onValueChange={setSemester} placeholder="Học kỳ">
              <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
              {semesterOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </FilterSelect>
            <FilterSelect value={facultyId} onValueChange={changeFaculty} placeholder="Khoa">
              <SelectItem value={ALL}>Tất cả khoa</SelectItem>
              {faculties.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </FilterSelect>
            <FilterSelect value={classId} onValueChange={setClassId} placeholder="Lớp">
              <SelectItem value={ALL}>Tất cả lớp</SelectItem>
              {classOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </FilterSelect>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_1fr_1fr_1fr_auto]">
            <FilterSelect value={eventId} onValueChange={setEventId} placeholder="Sự kiện">
              <SelectItem value={ALL}>Tất cả sự kiện</SelectItem>
              {eventOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </FilterSelect>
            <FilterSelect value={status} onValueChange={setStatus} placeholder="Trạng thái">
              <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
              {Object.entries(CREDIT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
            </FilterSelect>
            <DateFilter label="Từ ngày" value={dateFrom} onChange={setDateFrom} />
            <DateFilter label="Đến ngày" value={dateTo} onChange={setDateTo} />
            <Button variant="outline" className="h-9" onClick={resetFilters} disabled={!hasFilters}>
              <RotateCcw className="mr-2 h-4 w-4" /> Xóa lọc
            </Button>
          </div>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
          <div className="border-b px-5 py-3">
            <TabsList className="h-9">
              <TabsTrigger value="summary">Tổng hợp theo sinh viên</TabsTrigger>
              <TabsTrigger value="details">Chi tiết phát sinh</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-5">
            <TabsContent value="summary" className="mt-0">
              {summaryRows.length === 0 ? (
                <EmptyState icon={Award} title="Không có sinh viên phù hợp" />
              ) : (
                <DataTable columns={summaryColumns} data={summaryRows} rowKey={(row) => row.student.id} pageSize={12} />
              )}
            </TabsContent>
            <TabsContent value="details" className="mt-0">
              {filteredCredits.length === 0 ? (
                <EmptyState icon={Award} title="Không có phát sinh ngày công" />
              ) : (
                <DataTable columns={detailColumns} data={filteredCredits} rowKey={(credit) => credit.id} pageSize={12} initialSort={{ key: 'eventDate', direction: 'desc' }} />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone,
  last = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: 'success' | 'warning' | 'pending';
  last?: boolean;
}) {
  const valueColor = tone === 'success'
    ? 'text-success'
    : tone === 'warning'
      ? 'text-destructive'
      : tone === 'pending'
        ? 'text-warning'
        : 'text-foreground';
  return (
    <div className={`px-4 py-4 md:px-5 ${last ? '' : 'border-r'} border-b md:border-b-0`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${valueColor}`}>
        {value}{suffix && <span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <span className="shrink-0">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
      />
    </label>
  );
}
