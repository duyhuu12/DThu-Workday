'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  LogIn,
  LogOut,
  QrCode,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ATT_STATUS_LABELS, ATT_STATUS_VARIANTS } from '@/lib/constants';
import {
  bulkUpdateAttendance,
  generateAttendanceQr,
  getAttendanceByEvent,
  updateAttendanceStatus,
  type AttendanceRow,
} from '@/services/attendanceApi';
import { exportEventAttendance } from '@/services/reportApi';
import type { AttendanceQrData, AttendanceStatus } from '@/types';

const initials = (name: string) =>
  name.trim().split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();

export default function AttendancePage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const router = useRouter();
  const { events, fetchEvents } = useAppStore();
  const { toast } = useToast();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrData, setQrData] = useState<AttendanceQrData | null>(null);
  const event = events.find((item) => item.id === eventId);

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    setLoading(true);
    void fetchEvents();
    getAttendanceByEvent(eventId)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((error: unknown) => {
        toast({
          title: 'Không thể tải danh sách điểm danh',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, fetchEvents, toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.studentName, row.studentCode, row.className, row.facultyName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const present = rows.filter((row) =>
    ['checked_in', 'checked_out', 'late', 'early_leave'].includes(row.status),
  ).length;
  const absent = rows.filter((row) => row.status === 'absent').length;

  async function setAttendance(row: AttendanceRow, status: AttendanceStatus) {
    setBusyId(row.id);
    try {
      const updated = await updateAttendanceStatus(row.id, status);
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
      toast({
        title: 'Đã cập nhật điểm danh',
        description: `${row.studentName}: ${ATT_STATUS_LABELS[status]}`,
      });
    } catch (error) {
      toast({
        title: 'Cập nhật điểm danh thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setAll(status: AttendanceStatus) {
    if (!eventId) return;
    setBulkBusy(true);
    try {
      const data = await bulkUpdateAttendance(eventId, status);
      setRows(data);
      toast({ title: `Đã cập nhật ${data.length} sinh viên` });
    } catch (error) {
      toast({
        title: 'Điểm danh hàng loạt thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleGenerateQr(mode: 'check_in' | 'check_out') {
    if (!eventId) return;
    setQrBusy(true);
    try {
      const data = await generateAttendanceQr(eventId, mode, 5);
      setQrData(data);
      toast({
        title: mode === 'check_in' ? 'Đã tạo QR check-in' : 'Đã tạo QR check-out',
        description: 'Mã có hiệu lực trong 5 phút.',
      });
    } catch (error) {
      toast({
        title: 'Không thể tạo mã QR',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setQrBusy(false);
    }
  }

  async function handleExport() {
    if (!eventId) return;
    try {
      await exportEventAttendance(eventId);
      toast({ title: 'Đã xuất danh sách điểm danh CSV' });
    } catch (error) {
      toast({
        title: 'Xuất báo cáo thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  }

  if (!event && !loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <EmptyState icon={UserCheck} title="Không tìm thấy sự kiện" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title="Điểm danh" description={event?.name ?? 'Đang tải sự kiện...'}>
        <Button variant="outline" onClick={handleExport} disabled={!eventId || loading}>
          <Download className="mr-2 h-4 w-4" /> Xuất CSV
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{rows.length}</p><p className="text-sm text-muted-foreground">Tổng số</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{present}</p><p className="text-sm text-muted-foreground">Có mặt</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{absent}</p><p className="text-sm text-muted-foreground">Vắng mặt</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-5 p-6 lg:flex-row">
          <div className="flex h-52 w-52 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-2">
            {qrData ? (
              <img
                src={qrData.qrDataUrl}
                alt={`QR ${qrData.mode === 'check_in' ? 'check-in' : 'check-out'}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <QrCode className="h-24 w-24 text-primary/30" />
            )}
          </div>
          <div className="flex-1 space-y-3 text-center lg:text-left">
            <div>
              <h3 className="font-semibold">Mã QR điểm danh</h3>
              <p className="text-sm text-muted-foreground">
                Tạo mã riêng cho check-in hoặc check-out. Sinh viên quét trong mục Điểm danh QR.
              </p>
            </div>
            {qrData && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  {qrData.mode === 'check_in' ? 'QR check-in' : 'QR check-out'} · {qrData.eventName}
                </p>
                <p className="text-muted-foreground">
                  Hết hạn: {new Date(qrData.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <Button onClick={() => handleGenerateQr('check_in')} disabled={!eventId || qrBusy}>
                {qrBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Tạo QR check-in
              </Button>
              <Button variant="outline" onClick={() => handleGenerateQr('check_out')} disabled={!eventId || qrBusy}>
                <LogOut className="mr-2 h-4 w-4" /> Tạo QR check-out
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mỗi mã chỉ có hiệu lực 5 phút và được ký bằng JWT của backend.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, mã sinh viên, lớp..." className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setAll('checked_in')} disabled={bulkBusy || rows.length === 0}>
                {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Tất cả vào
              </Button>
              <Button variant="outline" onClick={() => setAll('checked_out')} disabled={bulkBusy || rows.length === 0}>
                <LogOut className="mr-2 h-4 w-4" /> Tất cả ra
              </Button>
              <Button variant="destructive" onClick={() => setAll('absent')} disabled={bulkBusy || rows.length === 0}>
                <UserX className="mr-2 h-4 w-4" /> Tất cả vắng
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCheck} title="Không có sinh viên" description="Chỉ các đăng ký đã được duyệt mới xuất hiện trong danh sách điểm danh." />
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initials(row.studentName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{row.studentName}</p>
                    <p className="text-sm text-muted-foreground">{row.studentCode}{row.className ? ` • ${row.className}` : ''}</p>
                    {(row.checkInTime || row.checkOutTime) && (
                      <p className="text-xs text-muted-foreground">Vào: {row.checkInTime ?? '—'} · Ra: {row.checkOutTime ?? '—'}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={ATT_STATUS_LABELS[row.status]} variant={ATT_STATUS_VARIANTS[row.status]} />
                  <Button size="sm" variant={row.status === 'checked_in' ? 'default' : 'outline'} disabled={busyId === row.id} onClick={() => setAttendance(row, 'checked_in')} title="Check-in">
                    <LogIn className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant={row.status === 'checked_out' ? 'default' : 'outline'} disabled={busyId === row.id} onClick={() => setAttendance(row, 'checked_out')} title="Check-out">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant={row.status === 'absent' ? 'destructive' : 'outline'} disabled={busyId === row.id} onClick={() => setAttendance(row, 'absent')} title="Vắng mặt">
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
