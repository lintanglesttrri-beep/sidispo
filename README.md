# SIDISPO — Sistem Disposisi Surat Internal Sekretariat Solo Techno Park

Aplikasi web berbasis **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, dan **Supabase sepenuhnya** (Postgres + Storage privat + Auth, **tanpa Prisma**) dengan gaya desain terinspirasi SIVIKA Solo Techno Park (Obsidian + Gold).

> *"Dokumen fisik asli berhenti di sekretariat; distribusi dan tindak lanjut dilakukan melalui salinan digital."*

## Setup Super Sederhana (Hanya 3 Langkah)

1. **Jalankan skema SQL:** buka **Supabase Dashboard → SQL Editor → New query**, tempel seluruh isi [supabase/schema.sql](supabase/schema.sql), lalu klik **Run**.
   *(Membuat 7 tabel, fungsi RPC atomik kode arsip, mengaktifkan RLS ketat, dan mengisi 5 contoh penerima.)*
2. **Storage & Auth di Supabase Dashboard:**
   - **Storage:** buat bucket bernama `surat` dengan **Public = OFF**.
   - **Auth:** matikan *Allow new users to sign up*, lalu buat 1 akun admin di **Authentication → Users** (centang *Auto Confirm User*).
3. **Isi `.env.local`** (hanya butuh 3 kunci Supabase):
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
   SUPABASE_SECRET_KEY="sb_secret_..."
   ```
   Lalu jalankan:
   ```bash
   npm install
   npm run dev
   ```
   Buka `http://127.0.0.1:3000`.

## Deploy ke Vercel

1. Hubungkan repository ke Vercel (region `sin1` / Singapore sudah diatur di `vercel.json`).
2. Masukkan variabel dari `.env.example` ke **Vercel → Project Settings → Environment Variables** (ubah `APP_URL` ke domain produksi).
3. Pastikan `SUPABASE_SECRET_KEY` dan `CRON_SECRET` **tidak** diberi awalan `NEXT_PUBLIC_`.
4. Perbarui **Site URL** di Supabase **Authentication → URL Configuration** ke domain produksi.
