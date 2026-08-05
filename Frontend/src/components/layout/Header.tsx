'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Home, Menu, Moon, Search, Sun, LogOut, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { useSidebar } from './SidebarContext';
import { NotificationDropdown } from './NotificationDropdown';
import { ROLE_LABELS } from '@/lib/constants';
import { useLogout } from '@/routes/RoleGuard';
import { getPageTitle } from './Breadcrumbs';
import { apiAssetUrl } from '@/services/api';

const initials = (name: string) => name.trim().split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();

export function Header() {
  const { currentUser, events, semesterConfigs } = useAppStore();
  const { theme, toggleTheme, mounted } = useTheme();
  const { setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [searchQuery, setSearchQuery] = useState('');

  const activeSemester = semesterConfigs.find((s) => s.isActive) ?? {
    name: 'Chưa cấu hình',
    schoolYear: '',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let path = '/';
    const role = currentUser?.role.toLowerCase();
    if (role === 'student') {
      path = `/student/work-events?search=${encodeURIComponent(searchQuery.trim())}`;
    } else if (role === 'organizer') {
      path = `/organizer/events?search=${encodeURIComponent(searchQuery.trim())}`;
    } else if (role === 'admin') {
      path = `/admin/events?search=${encodeURIComponent(searchQuery.trim())}`;
    } else if (role === 'superadmin') {
      path = `/superadmin/users?search=${encodeURIComponent(searchQuery.trim())}`;
    }

    router.push(path);
  };

  if (!currentUser) return null;
  return <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu className="h-5 w-5" /></Button>
    <div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{getPageTitle(pathname ?? '/', events)}</h2></div>
    <div className="hidden md:block">
      <form onSubmit={handleSearch} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Tìm kiếm..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-56 pl-9 lg:w-64" 
          aria-label="Tìm kiếm" 
        />
      </form>
    </div>
    <div className="hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 lg:flex">
      <span className="text-xs font-medium text-muted-foreground">Học kỳ:</span>
      <span className="text-xs font-semibold text-foreground">{activeSemester.name} {activeSemester.schoolYear}</span>
    </div>
    {currentUser.role === 'student' && <Button asChild variant="ghost" size="icon" aria-label="Về trang chủ" title="Trang chủ">
      <Link href="/student/dashboard"><Home className="h-5 w-5" /></Link>
    </Button>}
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}>{mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
    <NotificationDropdown />
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted" aria-label="Menu tài khoản"><Avatar className="h-8 w-8 border">{currentUser.avatarUrl && <AvatarImage src={apiAssetUrl(currentUser.avatarUrl)} alt={`Ảnh đại diện của ${currentUser.name}`} className="object-cover" />}<AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(currentUser.name)}</AvatarFallback></Avatar><div className="hidden text-left sm:block"><p className="text-xs font-semibold leading-tight text-foreground">{currentUser.name}</p><p className="text-[11px] leading-tight text-muted-foreground">{ROLE_LABELS[currentUser.role]}</p></div></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel><div className="flex flex-col"><span className="text-sm font-semibold">{currentUser.name}</span><span className="text-xs font-normal text-muted-foreground">{currentUser.email}</span></div></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile" className="cursor-pointer"><UserIcon className="mr-2 h-4 w-4" /> Hồ sơ cá nhân</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /> Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>;
}
