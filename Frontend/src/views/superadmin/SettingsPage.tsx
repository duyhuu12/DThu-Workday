'use client';

import { useEffect, useState } from 'react';
import { Save, Plus, Pencil, Trash2, CheckCircle, CalendarDays } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import type { SemesterConfig } from '@/types';

export default function SettingsPage() {
  const {
    settings,
    fetchSettings,
    fetchSemesters,
    updateSettings,
    semesterConfigs,
    addSemesterConfig,
    updateSemesterConfig,
    deleteSemesterConfig,
    setActiveSemesterConfig,
  } = useAppStore();

  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  // Semester Management Modal state
  const [semModalOpen, setSemModalOpen] = useState(false);
  const [editingSem, setEditingSem] = useState<SemesterConfig | null>(null);
  const [deleteSemTarget, setDeleteSemTarget] = useState<SemesterConfig | null>(null);
  const [semSaving, setSemSaving] = useState(false);

  const [semForm, setSemForm] = useState({
    name: 'Học kỳ 1',
    schoolYear: '2024-2025',
    startDate: '',
    endDate: '',
    requiredWorkdays: 12,
    isActive: false,
  });

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    void Promise.allSettled([fetchSettings(), fetchSemesters()]);
  }, [fetchSettings, fetchSemesters]);

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await updateSettings(form);
      toast({ title: 'Đã lưu cài đặt vào hệ thống' });
    } catch (error) {
      toast({
        title: 'Không thể lưu cài đặt',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleMaintenanceChange(checked: boolean) {
    const previous = form.maintenanceMode;
    setForm((current) => ({ ...current, maintenanceMode: checked }));
    setMaintenanceSaving(true);
    try {
      await updateSettings({ maintenanceMode: checked });
      toast({
        title: checked ? 'Đã bật chế độ bảo trì' : 'Đã tắt chế độ bảo trì',
        description: checked
          ? 'Người dùng thông thường đã bị khóa truy cập.'
          : 'Người dùng có thể truy cập hệ thống trở lại.',
      });
    } catch (error) {
      setForm((current) => ({ ...current, maintenanceMode: previous }));
      toast({
        title: 'Không thể thay đổi chế độ bảo trì',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setMaintenanceSaving(false);
    }
  }

  function openAddSemester() {
    setEditingSem(null);
    setSemForm({
      name: 'Học kỳ 1',
      schoolYear: '2024-2025',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      requiredWorkdays: form.defaultRequiredWorkdays || 12,
      isActive: semesterConfigs.length === 0,
    });
    setSemModalOpen(true);
  }

  function openEditSemester(sem: SemesterConfig) {
    setEditingSem(sem);
    setSemForm({
      name: sem.name,
      schoolYear: sem.schoolYear,
      startDate: sem.startDate,
      endDate: sem.endDate,
      requiredWorkdays: sem.requiredWorkdays,
      isActive: sem.isActive,
    });
    setSemModalOpen(true);
  }

  async function handleSaveSemester() {
    if (!semForm.name.trim() || !semForm.schoolYear.trim()) {
      toast({ title: 'Vui lòng điền đầy đủ tên học kỳ và năm học', variant: 'destructive' });
      return;
    }

    setSemSaving(true);
    try {
      if (editingSem) {
        await updateSemesterConfig(editingSem.id, semForm);
        toast({ title: 'Đã cập nhật thông tin học kỳ' });
      } else {
        await addSemesterConfig(semForm);
        toast({ title: 'Đã thêm học kỳ mới' });
      }
      setSemModalOpen(false);
    } catch (error) {
      toast({
        title: 'Lỗi khi lưu học kỳ',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSemSaving(false);
    }
  }

  async function handleSetActive(sem: SemesterConfig) {
    try {
      await setActiveSemesterConfig(sem.id);
      toast({
        title: 'Đã chuyển học kỳ hiện tại',
        description: `Đã kích hoạt "${sem.name} ${sem.schoolYear}" làm học kỳ hiện tại của hệ thống.`,
      });
    } catch (error) {
      toast({
        title: 'Không thể kích hoạt học kỳ',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteSemester() {
    if (!deleteSemTarget) return;
    try {
      await deleteSemesterConfig(deleteSemTarget.id);
      toast({ title: 'Đã xóa học kỳ' });
      setDeleteSemTarget(null);
    } catch (error) {
      toast({
        title: 'Không thể xóa học kỳ',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt hệ thống" description={`Cấu hình ${settings.siteName} và học kỳ tác nghiệp`} />

      {/* Dynamic Semester Management Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Quản lý danh sách Học kỳ
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thêm, sửa, xóa và chọn Học kỳ đang diễn ra cho toàn hệ thống
            </p>
          </div>
          <Button size="sm" onClick={openAddSemester}>
            <Plus className="mr-1.5 h-4 w-4" /> Thêm học kỳ
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {semesterConfigs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chưa có cấu hình học kỳ nào. Hãy nhấn &ldquo;Thêm học kỳ&rdquo; để tạo mới.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="px-4 py-3">Tên học kỳ</th>
                    <th className="px-4 py-3">Năm học</th>
                    <th className="px-4 py-3">Thời gian diễn ra</th>
                    <th className="px-4 py-3 text-center">Chỉ tiêu ngày công</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semesterConfigs.map((sem) => (
                    <tr key={sem.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{sem.name}</td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{sem.schoolYear}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {sem.startDate || '—'} đến {sem.endDate || '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {sem.requiredWorkdays} ngày
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sem.isActive ? (
                          <Badge className="bg-success text-success-foreground hover:bg-success/90">
                            <CheckCircle className="mr-1 h-3 w-3" /> Học kỳ hiện tại
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Chưa chọn
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!sem.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => handleSetActive(sem)}
                            >
                              Chọn làm hiện tại
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditSemester(sem)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => setDeleteSemTarget(sem)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tên hệ thống</Label>
            <Input
              value={form.siteName}
              onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Email hỗ trợ</Label>
            <Input
              value={form.supportEmail}
              onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Điện thoại hỗ trợ</Label>
            <Input
              value={form.supportPhone}
              onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workday Configs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Cấu hình ngày công</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ngày công yêu cầu toàn hệ thống</Label>
            <Input
              type="number"
              min={1}
              value={form.defaultRequiredWorkdays}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  defaultRequiredWorkdays: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Đăng ký đồng thời tối đa</Label>
            <Input
              type="number"
              min={1}
              value={form.maxConcurrentRegistrations}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxConcurrentRegistrations: Number(e.target.value),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Bảo trì</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-foreground">Chế độ bảo trì</p>
              <p className="text-sm text-muted-foreground">
                Khóa truy cập hệ thống cho người dùng thông thường
              </p>
            </div>
            <Switch
              checked={form.maintenanceMode}
              disabled={maintenanceSaving}
              onCheckedChange={(checked) => void handleMaintenanceChange(checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Lưu cài đặt
            </>
          )}
        </Button>
      </div>

      {/* Semester Add/Edit Modal */}
      <Dialog open={semModalOpen} onOpenChange={setSemModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSem ? 'Sửa học kỳ' : 'Thêm học kỳ mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tên học kỳ *</Label>
                <Input
                  placeholder="VD: Học kỳ 1"
                  value={semForm.name}
                  onChange={(e) => setSemForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Năm học *</Label>
                <Input
                  placeholder="VD: 2024-2025"
                  value={semForm.schoolYear}
                  onChange={(e) => setSemForm((f) => ({ ...f, schoolYear: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={semForm.startDate}
                  onChange={(e) => setSemForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={semForm.endDate}
                  onChange={(e) => setSemForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ngày công yêu cầu trong học kỳ</Label>
              <Input
                type="number"
                min={1}
                value={semForm.requiredWorkdays}
                onChange={(e) =>
                  setSemForm((f) => ({ ...f, requiredWorkdays: Number(e.target.value) }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-foreground text-xs">Đặt làm học kỳ hiện tại</p>
                <p className="text-[11px] text-muted-foreground">Kích hoạt học kỳ này cho toàn hệ thống</p>
              </div>
              <Switch
                checked={semForm.isActive}
                onCheckedChange={(checked) =>
                  setSemForm((f) => ({ ...f, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSemModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveSemester} disabled={semSaving}>
              {semSaving ? 'Đang lưu...' : editingSem ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteSemTarget}
        onOpenChange={(open) => !open && setDeleteSemTarget(null)}
        title="Xóa học kỳ"
        description={`Bạn có chắc muốn xóa "${deleteSemTarget?.name} ${deleteSemTarget?.schoolYear}"?`}
        confirmLabel="Xóa"
        destructive
        onConfirm={handleDeleteSemester}
      />
    </div>
  );
}
