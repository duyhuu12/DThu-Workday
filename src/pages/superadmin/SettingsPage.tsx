'use client';
import { Settings, Save } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function SettingsPage() {
  const { settings, updateSettings, addActivityLog } = useAppStore();
  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { updateSettings(form); addActivityLog({ action: 'Cập nhật cài đặt hệ thống', affectedItem: 'System Settings' }); toast({ title: 'Đã lưu cài đặt' }); } finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageHeader title="Cài đặt hệ thống" description="Cấu hình hệ thống DThU Workday" />
    <Card><CardHeader><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Tên hệ thống</Label><Input value={form.siteName} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Email hỗ trợ</Label><Input value={form.supportEmail} onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Điện thoại hỗ trợ</Label><Input value={form.supportPhone} onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))} /></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Cấu hình ngày công</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Ngày công yêu cầu mặc định</Label><Input type="number" min={1} value={form.defaultRequiredWorkdays} onChange={(e) => setForm((f) => ({ ...f, defaultRequiredWorkdays: Number(e.target.value) }))} /></div>
      <div className="space-y-2"><Label>Đăng ký đồng thời tối đa</Label><Input type="number" min={1} value={form.maxConcurrentRegistrations} onChange={(e) => setForm((f) => ({ ...f, maxConcurrentRegistrations: Number(e.target.value) }))} /></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Bảo trì</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between rounded-lg border p-4"><div><p className="font-medium text-foreground">Chế độ bảo trì</p><p className="text-sm text-muted-foreground">Khóa truy cập hệ thống cho người dùng thông thường</p></div><Switch checked={form.maintenanceMode} onCheckedChange={(c) => setForm((f) => ({ ...f, maintenanceMode: c }))} /></div></CardContent></Card>
    <div className="flex justify-end"><Button onClick={handleSave} disabled={saving}>{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <><Save className="mr-2 h-4 w-4" /> Lưu cài đặt</>}</Button></div>
  </div>;
}
