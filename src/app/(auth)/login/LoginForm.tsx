"use client";

import React, { useActionState, useState } from "react";
import {
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ supabaseReady }: { supabaseReady: boolean }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {!supabaseReady && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Sistem belum terhubung ke server</p>
            <p className="mt-0.5 text-amber-800">
              Mohon hubungi petugas IT untuk melengkapi pengaturan koneksi
              sebelum masuk.
            </p>
          </div>
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Masukkan email"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="Masukkan password"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-all cursor-pointer"
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            title={showPassword ? "Sembunyikan password" : "Lihat password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3.5 bg-slate-950 hover:bg-black disabled:opacity-60 text-white font-extrabold rounded-2xl text-sm shadow-md hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2.5 transition-all border border-slate-800 group cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Memeriksa akun...</span>
          </>
        ) : (
          <>
            <span>Masuk</span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}
