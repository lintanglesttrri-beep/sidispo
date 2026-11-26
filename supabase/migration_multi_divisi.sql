-- ============================================================================
-- SIDISPO — Migrasi Multi-Divisi & Superadmin
-- Jalankan SEKALI di Supabase Dashboard -> SQL Editor -> New query -> Run
-- Aman dijalankan ulang (idempoten) pada database yang sudah berisi data.
-- ============================================================================

-- 1. Tabel Master Divisi (dengan kode arsip & kontak person)
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

-- Seed divisi bawaan (termasuk Sekretariat dan divisi dari seed penerima)
INSERT INTO public.divisi (nama, kode, kontak_nama, kontak_wa)
VALUES
  ('Sekretariat', 'SEK', 'Admin Sekretariat STP', '6281234567800'),
  ('Inkubasi & Akselerasi', 'INK', 'Admin Divisi Inkubasi', '6281234567801'),
  ('Pendidikan & Pelatihan', 'DIK', 'Admin Divisi Pelatihan', '6281234567802'),
  ('Riset & Teknologi', 'RIT', 'Admin Divisi Riset & IT', '6281234567803'),
  ('Keuangan & Umum', 'KEU', 'Admin Keuangan & Umum', '6281234567804'),
  ('Kemitraan & Kerjasama', 'HUM', 'Admin Kemitraan & Humas', '6281234567805')
ON CONFLICT (kode) DO NOTHING;

-- 2. Perbarui tabel profiles (role SUPERADMIN / ADMIN_DIVISI, divisi_id, is_active)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS divisi_id UUID REFERENCES public.divisi(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Migrasikan admin lama ('ADMIN_SEKRETARIAT') menjadi SUPERADMIN
UPDATE public.profiles
SET role = 'SUPERADMIN'
WHERE role NOT IN ('SUPERADMIN', 'ADMIN_DIVISI');

-- Pastikan constraint role valid
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('SUPERADMIN', 'ADMIN_DIVISI'));

-- 3. Perbarui tabel penerima (tambah divisi_id & migrasikan data teks divisi lama)
ALTER TABLE public.penerima
  ADD COLUMN IF NOT EXISTS divisi_id UUID REFERENCES public.divisi(id);

-- Cocokkan penerima yang sudah punya nama divisi ke tabel divisi
UPDATE public.penerima p
SET divisi_id = d.id
FROM public.divisi d
WHERE p.divisi_id IS NULL
  AND LOWER(TRIM(p.divisi)) = LOWER(TRIM(d.nama));

-- Sisanya (jika kosong atau belum cocok) diarahkan ke divisi Sekretariat
UPDATE public.penerima
SET divisi_id = (SELECT id FROM public.divisi WHERE kode = 'SEK' LIMIT 1)
WHERE divisi_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_penerima_divisi_id ON public.penerima (divisi_id);

-- 4. Perbarui tabel surat (tambah divisi_id pemilik/pengirim)
ALTER TABLE public.surat
  ADD COLUMN IF NOT EXISTS divisi_id UUID REFERENCES public.divisi(id);

UPDATE public.surat
SET divisi_id = (SELECT id FROM public.divisi WHERE kode = 'SEK' LIMIT 1)
WHERE divisi_id IS NULL;

ALTER TABLE public.surat
  ALTER COLUMN divisi_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_surat_divisi_id ON public.surat (divisi_id);

-- 5. Perbarui tabel audit_logs (tambah divisi_id untuk filter per divisi)
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS divisi_id UUID REFERENCES public.divisi(id);

UPDATE public.audit_logs a
SET divisi_id = s.divisi_id
FROM public.surat s
WHERE a.surat_id = s.id AND a.divisi_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_divisi_id ON public.audit_logs (divisi_id);

-- 6. Fungsi RPC Atomik Baru: Kode Arsip per Divisi (STP/<KODE>/<YYYY>/<NNNN>)
DROP FUNCTION IF EXISTS public.create_surat_with_disposisi(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, UUID, TEXT, TEXT, JSONB);

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
  p_recipients JSONB -- array of { penerima_id, token_hash, token_expires_at }
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

-- 7. Keamanan RLS & Izin Role
ALTER TABLE public.divisi ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

REVOKE ALL ON FUNCTION public.create_surat_with_disposisi(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, UUID, TEXT, TEXT, JSONB) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_surat_with_disposisi(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, UUID, TEXT, TEXT, JSONB) TO service_role;
