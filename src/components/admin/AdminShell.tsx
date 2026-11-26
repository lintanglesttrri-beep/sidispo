"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  FilePlus2,
  Users,
  History,
  LogOut,
  Menu,
  X,
  Plus,
  Building2,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { AdminUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/login/actions";

const baseNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/surat", label: "Daftar Surat", icon: Mail, exact: false },
  {
    href: "/admin/surat/baru",
    label: "Catat Surat Baru",
    icon: FilePlus2,
    exact: true,
  },
  { href: "/admin/penerima", label: "Daftar Penerima", icon: Users, exact: false },
  { href: "/admin/audit", label: "Riwayat Aktivitas", icon: History, exact: false },
];

const superadminNavItems = [
  { href: "/admin/divisi", label: "Kelola Divisi", icon: Building2, exact: false },
  { href: "/admin/akun", label: "Kelola Akun Admin", icon: UserCog, exact: false },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuper = admin.role === "SUPERADMIN";

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    if (href === "/admin/surat") {
      return (
        pathname === "/admin/surat" ||
        (pathname.startsWith("/admin/surat/") &&
          pathname !== "/admin/surat/baru")
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Obsidian Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-slate-950 text-white border-r border-slate-800 shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800/80">
          <BrandLogo href="/admin" dark compact />
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Menu Utama
          </p>
          {baseNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isSuper && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-400/80">
                Pengaturan Superadmin
              </p>
              {superadminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="px-3.5 py-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  isSuper
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                }`}
              >
                {isSuper && <ShieldCheck className="w-3 h-3" />}
                {isSuper ? "Superadmin" : admin.divisiNama || "Admin Divisi"}
              </span>
            </div>
            <p className="text-xs font-extrabold text-white truncate">
              {admin.nama}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{admin.email}</p>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-rose-600/90 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
                aria-label="Buka menu navigasi"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div className="lg:hidden">
                <BrandLogo href="/admin" compact />
              </div>
              <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>
                  {isSuper
                    ? "Mode Superadmin • Semua Divisi Solo Techno Park"
                    : `Divisi ${admin.divisiNama || "-"} • Solo Techno Park`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/surat/baru"
                className="px-4 py-2.5 bg-slate-950 hover:bg-black text-white font-extrabold rounded-xl text-xs shadow-xs hover:shadow-md flex items-center gap-1.5 transition-all border border-slate-800"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Catat Surat Baru</span>
                <span className="sm:hidden">Baru</span>
              </Link>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1.5">
              {[...baseNavItems, ...(isSuper ? superadminNavItems : [])].map(
                (item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        active
                          ? "bg-slate-950 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
              )}
              <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between px-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {admin.nama}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isSuper ? "Superadmin" : admin.divisiNama || "Admin Divisi"} •{" "}
                    {admin.email}
                  </p>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
