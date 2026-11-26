-- ============================================================================
-- SIDISPO — Skema Database Supabase Lengkap (Multi-Divisi & Superadmin)
-- Untuk instalasi baru: jalankan di Supabase SQL Editor -> New query -> Run.
-- Jika database lama sudah ada, jalankan supabase/migration_multi_divisi.sql.
-- ============================================================================

-- 1. Master Divisi (dengan kode arsip & kontak person)
CREATE TABLE IF NOT EXISTS public.divisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL UNIQUE,
  kode TEXT NOT NULL UNIQUE CHECK (kode ~ '^[A-Z0-9]{2,8}$'),
  kontak_nama TEXT NOT NULL DEFAULT '',
  kontak_wa TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profil Admin (terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'ADMIN_DIVISI'
    CHECK (role IN ('SUPERADMIN', 'ADMIN_DIVISI')),
  divisi_id UUID REFERENCES public.divisi(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Master Penerima Disposisi
CREATE TABLE IF NOT EXISTS public.penerima (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  divisi TEXT NOT NULL DEFAULT '',
  divisi_id UUID REFERENCES public.divisi(id),
  no_wa TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penerima_active ON public.penerima (is_active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_penerima_divisi_id ON public.penerima (divisi_id);
CREATE INDEX IF NOT EXISTS idx_penerima_nama ON public.penerima (nama);

-- 4. Sequence Kode Arsip per Divisi per Tahun (key: "<KODE>-<YYYY>")
CREATE TABLE IF NOT EXISTS public.arsip_sequences (
  periode TEXT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Surat Fisik & Informasi Surat
CREATE TABLE IF NOT EXISTS public.surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  divisi_id UUID NOT NULL REFERENCES public.divisi(id),
  kode_arsip TEXT NOT NULL UNIQUE,
  perihal TEXT NOT NULL,
  pengirim TEXT NOT NULL,
  nomor_surat TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_mime TEXT NOT NULL,
  file_size INT NOT NULL,
  is_segera BOOLEAN NOT NULL DEFAULT FALSE,
  batas_tindak_lanjut DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_surat_divisi_id ON public.surat (divisi_id);
CREATE INDEX IF NOT EXISTS idx_surat_created_at ON public.surat (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surat_is_segera ON public.surat (is_segera);

-- 6. Disposisi per Penerima
CREATE TABLE IF NOT EXISTS public.disposisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_id UUID NOT NULL REFERENCES public.surat(id) ON DELETE CASCADE,
  penerima_id UUID NOT NULL REFERENCES public.penerima(id),
  catatan TEXT NOT NULL DEFAULT '',
  token_hash TEXT NOT NULL UNIQUE,
  token_version INT NOT NULL DEFAULT 1,
  token_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  wa_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (wa_status IN ('PENDING', 'SENT', 'FAILED', 'DIKIRIM_MANUAL')),
  wa_sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'BELUM_DIKONFIRMASI'
    CHECK (status IN ('BELUM_DIKONFIRMASI', 'SUDAH_DIKONFIRMASI')),
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disposisi_surat_id ON public.disposisi (surat_id);
CREATE INDEX IF NOT EXISTS idx_disposisi_penerima_id ON public.disposisi (penerima_id);
CREATE INDEX IF NOT EXISTS idx_disposisi_status ON public.disposisi (status);
CREATE INDEX IF NOT EXISTS idx_disposisi_wa_status ON public.disposisi (wa_status);
CREATE INDEX IF NOT EXISTS idx_disposisi_expires_at ON public.disposisi (token_expires_at);
CREATE INDEX IF NOT EXISTS idx_disposisi_created_at ON public.disposisi (created_at DESC);

-- 7. Riwayat Aktivitas (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_email TEXT,
  divisi_id UUID REFERENCES public.divisi(id),
  surat_id UUID REFERENCES public.surat(id) ON DELETE SET NULL,
  disposisi_id UUID REFERENCES public.disposisi(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_divisi_id ON public.audit_logs (divisi_id);
CREATE INDEX IF NOT EXISTS idx_audit_surat_id ON public.audit_logs (surat_id);
CREATE INDEX IF NOT EXISTS idx_audit_disposisi_id ON public.audit_logs (disposisi_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs (created_at DESC);

-- 8. Riwayat Percobaan Pengiriman WhatsApp
CREATE TABLE IF NOT EXISTS public.wa_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disposisi_id UUID NOT NULL REFERENCES public.disposisi(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DIKIRIM_MANUAL')),
  response_code TEXT,
  response_summary TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_logs_disposisi_id ON public.wa_delivery_logs (disposisi_id);

-- ============================================================================
-- Fungsi RPC Atomik: Buat Surat + Kode Arsip per Divisi + Disposisi + Riwayat
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_surat_with_disposisi(
  p_divisi_id UUID,
  p_perihal TEXT,
  p_pengirim TEXT,
  p_nomor_surat TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_mime TEXT,
  p_file_size INT,
  p_is_segera BOOLEAN,
  p_batas_tindak_lanjut DATE,
  p_created_by UUID,
  p_actor_email TEXT,
  p_catatan TEXT,
  p_recipients JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYY');
  v_kode_divisi TEXT;
  v_seq_key TEXT;
  v_next_num INT;
  v_kode_arsip TEXT;
  v_surat_id UUID;
  v_item JSONB;
  v_disp_id UUID;
  v_created_disposisi JSONB := '[]'::JSONB;
BEGIN
  IF p_recipients IS NULL OR JSONB_ARRAY_LENGTH(p_recipients) = 0 THEN
    RAISE EXCEPTION 'Minimal satu penerima harus dipilih';
  END IF;

  SELECT kode INTO v_kode_divisi
  FROM public.divisi
  WHERE id = p_divisi_id AND is_active = TRUE;

  IF v_kode_divisi IS NULL THEN
    RAISE EXCEPTION 'Divisi pengirim tidak valid atau nonaktif';
  END IF;

  v_seq_key := v_kode_divisi || '-' || v_year;

  INSERT INTO public.arsip_sequences (periode, last_number, updated_at)
  VALUES (v_seq_key, 1, NOW())
  ON CONFLICT (periode)
  DO UPDATE SET
    last_number = public.arsip_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_num;

  v_kode_arsip := 'STP/' || v_kode_divisi || '/' || v_year || '/' || LPAD(v_next_num::TEXT, 4, '0');

  INSERT INTO public.surat (
    divisi_id, kode_arsip, perihal, pengirim, nomor_surat,
    file_path, file_name, file_mime, file_size,
    is_segera, batas_tindak_lanjut, created_by
  )
  VALUES (
    p_divisi_id, v_kode_arsip, p_perihal, p_pengirim, p_nomor_surat,
    p_file_path, p_file_name, p_file_mime, p_file_size,
    p_is_segera, p_batas_tindak_lanjut, p_created_by
  )
  RETURNING id INTO v_surat_id;

  FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(p_recipients)
  LOOP
    INSERT INTO public.disposisi (
      surat_id, penerima_id, catatan, token_hash, token_version,
      token_expires_at, wa_status, status
    )
    VALUES (
      v_surat_id,
      (v_item->>'penerima_id')::UUID,
      COALESCE(p_catatan, ''),
      v_item->>'token_hash',
      1,
      (v_item->>'token_expires_at')::TIMESTAMPTZ,
      'PENDING',
      'BELUM_DIKONFIRMASI'
    )
    RETURNING id INTO v_disp_id;

    v_created_disposisi := v_created_disposisi || JSONB_BUILD_OBJECT(
      'disposisi_id', v_disp_id,
      'penerima_id', v_item->>'penerima_id'
    );
  END LOOP;

  INSERT INTO public.audit_logs (
    actor_id, actor_email, divisi_id, surat_id, event_type, event_data
  )
  VALUES (
    p_created_by,
    p_actor_email,
    p_divisi_id,
    v_surat_id,
    'SURAT_CREATED',
    JSONB_BUILD_OBJECT(
      'kodeArsip', v_kode_arsip,
      'kodeDivisi', v_kode_divisi,
      'perihal', p_perihal,
      'pengirim', p_pengirim,
      'isSegera', p_is_segera,
      'jumlahPenerima', JSONB_ARRAY_LENGTH(p_recipients)
    )
  );

  RETURN JSONB_BUILD_OBJECT(
    'surat_id', v_surat_id,
    'kode_arsip', v_kode_arsip,
    'disposisi', v_created_disposisi
  );
END;
$$;

-- ============================================================================
-- Keamanan RLS & Izin Role
-- ============================================================================
ALTER TABLE public.divisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penerima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arsip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_delivery_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
REVOKE ALL ON FUNCTION public.create_surat_with_disposisi(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, UUID, TEXT, TEXT, JSONB) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_surat_with_disposisi(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, UUID, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================================
-- Seed Divisi & Contoh Penerima (Idempoten)
-- ============================================================================
INSERT INTO public.divisi (nama, kode, kontak_nama, kontak_wa)
VALUES
  ('Sekretariat', 'SEK', 'Admin Sekretariat STP', '6281234567800'),
  ('Inkubasi & Akselerasi', 'INK', 'Admin Divisi Inkubasi', '6281234567801'),
  ('Pendidikan & Pelatihan', 'DIK', 'Admin Divisi Pelatihan', '6281234567802'),
  ('Riset & Teknologi', 'RIT', 'Admin Divisi Riset & IT', '6281234567803'),
  ('Keuangan & Umum', 'KEU', 'Admin Keuangan & Umum', '6281234567804'),
  ('Kemitraan & Kerjasama', 'HUM', 'Admin Kemitraan & Humas', '6281234567805')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.penerima (nama, jabatan, divisi, divisi_id, no_wa)
SELECT v.nama, v.jabatan, d.nama, d.id, v.no_wa
FROM (VALUES
  ('Budi Santoso, S.T.', 'Kepala Divisi Inkubasi Bisnis', 'INK', '6281234567801'),
  ('Siti Rahmawati, M.M.', 'Kepala Divisi Pelatihan Vokasi', 'DIK', '6281234567802'),
  ('Agus Prasetyo, S.Kom.', 'Koordinator Layanan Teknologi & IT', 'RIT', '6281234567803'),
  ('Dewi Lestari, S.E.', 'Kepala Subbagian Keuangan & Umum', 'KEU', '6281234567804'),
  ('Hendra Wijaya, S.T.', 'Koordinator Kemitraan & Humas', 'HUM', '6281234567805')
) AS v(nama, jabatan, kode, no_wa)
JOIN public.divisi d ON d.kode = v.kode
WHERE NOT EXISTS (
  SELECT 1 FROM public.penerima p WHERE p.no_wa = v.no_wa AND p.deleted_at IS NULL
);
