'use client';

import { useRef, useState } from 'react';
import {
  Award,
  Building2,
  Camera,
  CalendarDays,
  GraduationCap,
  Hash,
  Mail,
  MapPin,
  Phone,
  Shield,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ROLE_LABELS } from '@/lib/constants';
import { apiAssetUrl } from '@/services/api';

const initials = (name: string) =>
  name
    .trim()
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function ProfilePage() {
  const { currentUser, faculties, classes, updateAvatar } = useAppStore();
  const student = useCurrentStudent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();

  if (!currentUser) return null;

  const faculty = student ? faculties.find((item) => item.id === student.facultyId) : null;
  const studentClass = student ? classes.find((item) => item.id === student.classId) : null;
  const progress = student?.requiredWorkdays
    ? Math.min(100, (student.accumulatedWorkdays / student.requiredWorkdays) * 100)
    : 0;
  const remainingWorkdays = student
    ? Math.max(0, student.requiredWorkdays - student.accumulatedWorkdays)
    : 0;

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Ảnh không hợp lệ', description: 'Vui lòng chọn ảnh JPG, PNG hoặc WebP.', variant: 'destructive' });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast({ title: 'Ảnh quá lớn', description: 'Dung lượng ảnh tối đa là 1 MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setUploadingAvatar(true);
      try {
        await updateAvatar(reader.result);
        toast({ title: 'Đã thay ảnh đại diện' });
      } catch (error) {
        toast({ title: 'Không thể lưu ảnh', description: error instanceof Error ? error.message : 'Máy chủ không thể xử lý ảnh.', variant: 'destructive' });
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.onerror = () => toast({ title: 'Không thể đọc ảnh', variant: 'destructive' });
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <PageHeader
        title={student ? 'Hồ sơ sinh viên' : 'Hồ sơ cá nhân'}
        description="Thông tin được đồng bộ từ dữ liệu quản lý của nhà trường"
      />

      <Card className="overflow-hidden rounded-2xl border-primary/10 shadow-sm">
        <div className="relative h-28 overflow-hidden bg-primary sm:h-32">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[38px] border-white/5" />
          <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/[0.04]" />
        </div>

        <CardContent className="p-0">
          <div className="relative px-5 pb-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative -mt-10 w-fit shrink-0 sm:-mt-12">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-md sm:h-28 sm:w-28">
                    {currentUser.avatarUrl && <AvatarImage src={apiAssetUrl(currentUser.avatarUrl)} alt={`Ảnh đại diện của ${currentUser.name}`} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary sm:text-3xl">
                      {initials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  {student && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label="Thay ảnh đại diện"
                        title="Thay ảnh đại diện"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        className="sr-only"
                      />
                    </>
                  )}
                </div>
                <div className="min-w-0 sm:pb-1">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {currentUser.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Shield className="h-3.5 w-3.5" /> {ROLE_LABELS[currentUser.role]}
                    </span>
                    {student?.studentCode && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" /> {student.studentCode}
                      </span>
                    )}
                  </div>
                  {student && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Camera className="h-3.5 w-3.5" /> {uploadingAvatar ? 'Đang tải ảnh...' : 'Thay ảnh đại diện'}
                    </button>
                  )}
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-2 text-xs font-semibold text-success sm:mb-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                Tài khoản hoạt động
              </span>
            </div>
          </div>

          {student && (
            <>
              <div className="border-y bg-muted/25 px-5 py-6 sm:px-8 lg:px-10">
                <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)_220px] lg:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tiến độ ngày công</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                      {student.accumulatedWorkdays}
                      <span className="ml-1 text-lg font-medium text-muted-foreground">/{student.requiredWorkdays} ngày</span>
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tiến độ học kỳ hiện tại</span>
                      <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground lg:border-l lg:pl-6">
                    {remainingWorkdays === 0
                      ? 'Bạn đã hoàn thành chỉ tiêu ngày công của học kỳ.'
                      : `Cần tích lũy thêm ${remainingWorkdays} ngày công để hoàn thành chỉ tiêu.`}
                  </p>
                </div>
              </div>

              <ProfileSection title="Thông tin học tập" description="Dữ liệu lớp và đơn vị quản lý">
                <InfoItem icon={Hash} label="Mã sinh viên" value={student.studentCode} />
                <InfoItem icon={Users} label="Lớp sinh hoạt" value={studentClass?.name ?? student.className ?? '—'} />
                <InfoItem icon={Building2} label="Khoa quản lý" value={faculty?.name ?? student.facultyName ?? '—'} />
                <InfoItem icon={GraduationCap} label="Niên khóa" value={student.schoolYear || '—'} />
                <InfoItem icon={Award} label="Ngày công đã hoàn thành" value={`${student.completedWorkdays} ngày`} />
              </ProfileSection>
            </>
          )}

          <ProfileSection
            title="Thông tin cá nhân"
            description="Thông tin nhận diện và liên hệ"
            last
          >
            <InfoItem icon={UserIcon} label="Họ và tên" value={currentUser.name} />
            <InfoItem icon={Mail} label="Địa chỉ email" value={currentUser.email} />
            <InfoItem icon={Phone} label="Số điện thoại" value={currentUser.phone || student?.phone || '—'} />
            {student && (
              <>
                <InfoItem
                  icon={UserIcon}
                  label="Giới tính"
                  value={student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : '—'}
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Ngày sinh"
                  value={student.birthDate ? new Date(student.birthDate).toLocaleDateString('vi-VN') : '—'}
                />
                <InfoItem icon={MapPin} label="Quê quán" value={student.hometown || '—'} />
              </>
            )}
          </ProfileSection>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSection({
  title,
  description,
  children,
  last = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={`px-5 py-7 sm:px-8 lg:px-10 lg:py-8 ${last ? '' : 'border-b'}`}>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
      </div>
    </section>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-5 text-foreground">{value}</p>
      </div>
    </div>
  );
}
