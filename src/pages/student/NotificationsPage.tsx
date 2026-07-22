'use client';
import { useMemo, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NOTIF_TYPE_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import Link from 'next/link';

const ICON_COLORS: Record<string, string> = { registration: 'bg-primary/10 text-primary', attendance: 'bg-secondary/10 text-secondary', credit: 'bg-success/10 text-success', complaint: 'bg-warning/10 text-warning', event: 'bg-info/10 text-info', system: 'bg-muted text-muted-foreground' };

export default function NotificationsPage() {
  const { notifications, markNotifRead, markAllNotifsRead, currentUser } = useAppStore();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const myNotifs = useMemo(() => notifications.filter((n) => n.userId === currentUser?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [notifications, currentUser]);
  const filtered = tab === 'unread' ? myNotifs.filter((n) => !n.isRead) : myNotifs;
  const unreadCount = myNotifs.filter((n) => !n.isRead).length;

  return <div className="space-y-6">
    <PageHeader title="Thông báo" description="Tất cả thông báo của bạn">{unreadCount > 0 && <Button variant="outline" onClick={markAllNotifsRead}><CheckCheck className="mr-2 h-4 w-4" /> Đánh dấu đã đọc tất cả</Button>}</PageHeader>
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}><TabsList><TabsTrigger value="all">Tất cả ({myNotifs.length})</TabsTrigger><TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger></TabsList></Tabs>
    {filtered.length === 0 ? <EmptyState icon={Bell} title="Không có thông báo" /> : <div className="space-y-2">{filtered.map((n) => <Card key={n.id} className={`transition-colors ${!n.isRead ? 'border-primary/30 bg-primary/[0.03]' : ''}`}><CardContent className="p-4"><div className="flex items-start gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_COLORS[n.type] ?? ICON_COLORS.system}`}><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'} text-foreground`}>{n.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p></div>{!n.isRead && <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => markNotifRead(n.id)}><Check className="h-4 w-4" /></Button>}</div><div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><span className="rounded bg-muted px-1.5 py-0.5">{NOTIF_TYPE_LABELS[n.type] ?? 'Hệ thống'}</span><span>{formatDateTime(n.createdAt)}</span>{n.link && <Link href={n.link} className="font-medium text-primary hover:underline">Xem chi tiết</Link>}</div></div></div></CardContent></Card>)}</div>}
  </div>;
}
