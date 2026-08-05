'use client';
import { createContext, useContext, useState } from 'react';
interface SidebarCtx { collapsed: boolean; setCollapsed: (v: boolean) => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void; }
const Ctx = createContext<SidebarCtx | null>(null);
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <Ctx.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>{children}</Ctx.Provider>;
}
export function useSidebar() { const c = useContext(Ctx); if (!c) throw new Error('useSidebar must be used within SidebarProvider'); return c; }
