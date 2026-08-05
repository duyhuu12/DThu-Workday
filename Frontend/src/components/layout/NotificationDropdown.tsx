'use client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { Bell, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/hooks/useAppStore';
import { NOTIF_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function NotificationDropdown() {
  const { currentUser, notifications, markNotifRead, markAllNotifsRead } = useAppStore();
  if (!currentUser) return null;
  const userNotifs = notifications.filter((n) => n.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = userNotifs.filter((n) => !n.isRead).length;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative" aria-label="Thông báo"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread > 9 ? '9+' : unread}</span>}</Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80 p-0">
      <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm font-semibold">Thông báo</p>{unread > 0 && <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={markAllNotifsRead}><CheckCheck className="h-3.5 w-3.5" /> Đánh dấu đã đọc</Button>}</div>
      <ScrollArea className="h-[360px]">
        {userNotifs.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center"><Bell className="mb-2 h-8 w-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">Không có thông báo</p></div> :
        <div className="divide-y">{userNotifs.map((n) => { const content = <div className={cn('flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50', !n.isRead && 'bg-primary/5')}><div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-primary')} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{n.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p><div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/70"><span className="font-medium">{NOTIF_TYPE_LABELS[n.type]}</span><span>·</span><span>{formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true, locale: vi })}</span></div></div>{!n.isRead && <button className="mt-1 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); markNotifRead(n.id); }} aria-label="Đánh dấu đã đọc"><Check className="h-3.5 w-3.5" /></button>}</div>; return n.link ? <Link key={n.id} href={n.link} onClick={() => !n.isRead && markNotifRead(n.id)}>{content}</Link> : <div key={n.id}>{content}</div>; })}</div>}
      </ScrollArea>
      {currentUser.role !== 'student' && <div className="border-t p-2"><Button asChild variant="ghost" size="sm" className="w-full text-xs"><Link href={`/${currentUser.role}/notifications`}>Xem tất cả</Link></Button></div>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
