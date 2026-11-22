import React from "react";
import { ShieldCheck, FileCheck2, Send } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Login Admin — SIDISPO Solo Techno Park",
};

export default function LoginPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Obsidian Showcase Panel (SIVIKA-inspired) */}
      <div className="relative overflow-hidden bg-slate-950 text-white lg:w-1/2 xl:w-[52%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-slate-700/30 rounded-full blur-3xl pointer-events-none animate-float-delayed" />

        <div className="relative z-10">
          <BrandLogo href="/login" dark />
        </div>

        <div className="relative z-10 my-10 lg:my-0 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-200 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Sekretariat Kawasan Solo Techno Park</span>
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-[1.12]">
            Sistem Disposisi Surat Internal{" "}
            <span className="text-amber-400">Terkendali</span>
            <span className="text-amber-400">.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            &ldquo;Dokumen fisik asli berhenti di sekretariat; distribusi dan
            tindak lanjut dilakukan melalui salinan digital.&rdquo;
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <FileCheck2 className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xs font-extrabold text-white">Kode Arsip Unik</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Otomatis & berurutan per periode
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <Send className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xs font-extrabold text-white">Distribusi Cepat</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tautan khusus per penerima via WA
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xs font-extrabold text-white">Riwayat Tercatat</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Terekam sejak dibuat s.d. konfirmasi
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Solo Techno Park — Sekretariat Internal
        </p>
      </div>

      {/* Right Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-7 sm:p-9 space-y-6 animate-card-enter">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Panel Admin Sekretariat
            </span>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">
              Masuk ke SIDISPO<span className="text-amber-500">.</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Masuk menggunakan akun resmi admin sekretariat Solo Techno Park.
            </p>
          </div>

          <LoginForm supabaseReady={supabaseReady} />

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            Penerima disposisi tidak perlu login — cukup buka tautan unik yang
            dikirimkan Sekretariat melalui WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}
