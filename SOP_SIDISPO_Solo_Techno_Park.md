# Standar Operasional Prosedur (SOP) — SIDISPO Multi-Divisi
**Sistem Disposisi Surat Internal — Solo Techno Park (STP)**

> **Prinsip Utama:** *"Dokumen fisik asli berhenti di divisi pencatat; distribusi dan tindak lanjut antar maupun intra divisi dilakukan melalui salinan digital."*

---

## 1. Pembagian Peran & Tanggung Jawab

| Peran | Siapa | Wewenang & Tanggung Jawab Utama |
|---|---|---|
| **Superadmin** | Kepala Sekretariat / Petugas IT STP (1–2 orang) | Mengelola master **Divisi** (kode arsip & kontak person), membuat/mengatur/menonaktifkan akun **Admin Divisi**, memantau surat dan riwayat aktivitas di semua divisi. |
| **Admin Divisi** | Operator administrasi pada masing-masing divisi (boleh >1 orang per divisi) | Mencatat surat masuk/keluar atas nama divisinya, memilih penerima dari divisi sendiri maupun divisi lain, mengelola daftar penerima divisinya, memantau **Surat Keluar** dan **Surat Masuk**, serta menyimpan surat fisik asli di ordner divisinya. |
| **Penerima Disposisi** | Karyawan / Kepala Divisi tujuan surat | Tidak perlu membuat akun atau login. Membuka tautan khusus dari WhatsApp, membaca dokumen & catatan arahan, menekan **Konfirmasi Penerimaan**, dan menghubungi kontak person divisi pengirim bila perlu klarifikasi. |

---

## 2. SOP Superadmin (Pengelolaan Sistem & Akun)

### 2.1 Menyiapkan Daftar Divisi & Kontak Person
1. Login ke SIDISPO menggunakan akun Superadmin.
2. Buka menu **Kelola Divisi** → klik **Tambah Divisi**.
3. Isi **Nama Divisi**, **Kode Arsip** (2–8 huruf kapital tanpa spasi, misalnya `SEK`, `INK`, `DIK`, `RIT`, `KEU`, `HUM`), **Nama Kontak Person**, dan **Nomor WhatsApp Kontak Person**.
4. Pastikan nomor kontak person selalu diperbarui bila petugas piket/admin divisi berganti, karena kontak tersebut tampil langsung di halaman penerima surat.

### 2.2 Membuat & Mengatur Akun Admin Divisi
1. Buka menu **Kelola Akun Admin** → klik **Buat Akun Admin**.
2. Masukkan nama, email resmi, pilih peran **Admin Divisi**, lalu pilih **Divisi** penempatannya.
3. Pilih cara aktivasi: **Buat Password Awal** (sampaikan secara langsung, bukan di grup umum) atau **Kirim Undangan Email**.
4. Disarankan setiap divisi memiliki minimal **2 akun admin** (atau 1 utama + 1 cadangan) agar operasional tidak berhenti ketika salah satu cuti.

### 2.3 Menonaktifkan Akun (Pegawai Pindah / Keluar)
1. Segera setelah admin divisi mutasi atau berhenti bertugas, buka **Kelola Akun Admin** → klik **Atur** pada akun terkait.
2. Jika mutasi ke divisi lain: ubah pilihan **Divisi** lalu simpan.
3. Jika tidak lagi bertugas sebagai admin: hilangkan centang **Akun Aktif** → **Simpan Perubahan**. Sesi login akun tersebut langsung terputus otomatis.

### 2.4 Pemeriksaan Berkala
- Minimal **1 kali per bulan**, Superadmin memeriksa daftar akun aktif di **Kelola Akun Admin**, kelengkapan kontak person di **Kelola Divisi**, dan memantau ringkasan lintas divisi di **Dashboard** serta **Riwayat Aktivitas**.

---

## 3. SOP Admin Divisi (Prosedur Penggunaan Sistem Digital)

### 3.1 Mengelola Daftar Penerima Divisi
1. Buka menu **Daftar Penerima** di bilah kiri.
2. Gunakan **dropdown Divisi** untuk menyaring kontak person dari divisi sendiri maupun melihat direktori kontak divisi lain.
3. Klik **Tambah Penerima** untuk menambah anggota di divisi Anda sendiri (isi Nama, Jabatan, dan Nomor WhatsApp; boleh ditulis mulai dari `08...` atau `62...`).
4. Jika anggota sudah tidak aktif menerima surat, nonaktifkan atau hapus (catatan surat sebelumnya tetap aman tersimpan).

### 3.2 Mencatat Surat & Mengirim Disposisi (Intra & Lintas Divisi)
1. Buka menu **Catat Surat Baru**.
2. **Unggah berkas scan surat** (format PDF, JPG, atau PNG, maksimal 10 MB).
3. Lengkapi **Informasi Surat**: Perihal, Pengirim/Instansi, Nomor Surat (opsional), Batas Tindak Lanjut (opsional), centang **Tandai Sifat SEGERA** bila mendesak, serta tulis **Catatan / Instruksi Disposisi**.
4. Pada kotak **Pilih Penerima Disposisi**:
   - Gunakan **dropdown Divisi** untuk memilih penerima dari divisi sendiri *(default)*, **Semua Divisi**, atau divisi tujuan tertentu.
   - Centang penerima yang dituju (bisa gunakan kolom pencarian atau tombol **Pilih Semua**).
   - Untuk mengirim ke **lebih dari satu divisi sekaligus**, cukup ganti dropdown ke divisi berikutnya lalu centang lagi — penerima yang sudah dipilih sebelumnya tetap tersimpan di kotak **Penerima Terpilih**.
5. Klik **Simpan Surat & Buat Disposisi**.
6. Sistem menampilkan **Kode Arsip Resmi Divisi** (contoh: `STP/INK/2026/0001`) beserta daftar tombol pengiriman WhatsApp.
7. Untuk tiap penerima: klik **Kirim via WhatsApp** → tekan **Kirim** di WhatsApp → kembali ke SIDISPO dan klik **Tandai Terkirim** *(atau gunakan tombol **Salin Tautan** bila diperlukan)*.

### 3.3 Memantau Surat Keluar & Surat Masuk
1. Buka menu **Daftar Surat**:
   - Tab **Surat Keluar:** semua surat yang dicatat oleh divisi Anda. Anda dapat memperpanjang masa berlaku tautan, membuat tautan baru, menonaktifkan tautan, mengirim pengingat, dan menandai status WhatsApp.
   - Tab **Surat Masuk:** semua surat dari divisi lain yang ditujukan kepada anggota divisi Anda (**mode lihat saja**). Digunakan agar admin/kepala divisi mengetahui adanya disposisi lintas divisi untuk timnya tanpa bisa mengubah surat milik divisi pengirim.
2. Cek kartu **Perlu Diingatkan** di **Dashboard** setiap pagi untuk mengingatkan penerima yang belum konfirmasi ketika masa berlaku tautan tersisa ≤ 3 hari.

---

## 4. SOP Penerima Disposisi

1. Terima pesan WhatsApp berisi ringkasan surat, catatan arahan, dan tautan khusus.
2. Ketuk tautan dari browser ponsel (tidak perlu login).
3. Baca informasi surat, kotak kuning **Instruksi / Catatan Disposisi**, dan isi dokumen pada penampil dokumen.
4. Tekan tombol **Konfirmasi Penerimaan** di bagian bawah layar → pilih **Ya, Konfirmasi Penerimaan**.
5. Jika terdapat pertanyaan, salah kirim, atau membutuhkan klarifikasi, tekan tombol **Hubungi via WhatsApp** pada kotak **Kontak Person Divisi Pengirim** di halaman surat.
6. **Larangan:** jangan meneruskan tautan kepada pihak luar yang tidak berwenang.

---

## 5. Prosedur Operasional Fisik & Arsip per Divisi

| Tahap | Kegiatan Fisik di Meja Divisi | Penanggung Jawab |
|---|---|---|
| **1. Penerimaan Surat** | Terima surat fisik yang masuk ke divisi (baik dari eksternal maupun sekretariat). Periksa kelengkapan lampiran. | Admin Divisi |
| **2. Arahan Pimpinan** | Minta arahan pimpinan/kepala divisi mengenai penerima tujuan dan catatan disposisi. | Admin Divisi & Pimpinan |
| **3. Pemindaian (Scan)** | Scan seluruh halaman surat menjadi **1 berkas PDF** (disarankan) atau JPG/PNG yang tegak, jelas, dan tidak terpotong (maksimal 10 MB). | Admin Divisi |
| **4. Pencatatan Digital** | Input ke SIDISPO untuk memperoleh **Kode Arsip Divisi** (`STP/<KODE>/<TAHUN>/<URUT>`), misalnya `STP/INK/2026/0001`. | Admin Divisi |
| **5. Pelabelan Fisik** | Tulis Kode Arsip secara jelas di **pojok kanan atas halaman pertama** surat fisik asli. | Admin Divisi |
| **6. Penyimpanan Ordner** | Simpan surat fisik asli di **ordner khusus divisi pencatat** secara berurutan per tahun (contoh: *"Arsip Disposisi INK 2026"*). Surat fisik tidak diedarkan ke divisi lain. | Admin Divisi |
| **7. Peminjaman Antar Divisi** | Jika divisi penerima membutuhkan dokumen asli (misalnya untuk tanda tangan basah/legalisasi), catat di buku peminjaman fisik (Kode Arsip, divisi peminjam, nama, tanggal pinjam, tanggal kembali). | Admin Divisi Pemilik |

---

## 6. Prosedur Pencatatan Data & Aturan Disposisi Lintas Divisi

### 6.1 Standar Pengisian Data
- **Nama File Scan (disarankan):** `YYYYMMDD_Instansi_PerihalSingkat.pdf`.
- **Perihal & Pengirim:** tulis lengkap dan jelas sesuai surat asli, hindari singkatan tidak umum.
- **Nomor Surat & Batas Tindak Lanjut:** isi sesuai surat asli bila tercantum; kosongkan bila tidak ada.
- **Sifat SEGERA:** centang hanya untuk surat mendesak (jadwal < 3 hari kerja atau arahan prioritas).
- **Catatan Disposisi:** tulis instruksi secara spesifik, termasuk peran masing-masing divisi bila dikirim lintas divisi.

### 6.2 Aturan Tanggung Jawab Disposisi Lintas Divisi
1. **Kepemilikan & Pemantauan:** Divisi yang mencatat surat (divisi pengirim) bertanggung jawab menyimpan dokumen fisik, memantau status konfirmasi seluruh penerima, serta menangani perpanjangan/pembuatan tautan baru.
2. **Tindak Lanjut:** Penerima di divisi tujuan (dan kepala divisinya yang memantau lewat tab **Surat Masuk**) bertanggung jawab menindaklanjuti isi instruksi sesuai batas waktu.
3. **Koordinasi:** Semua pertanyaan mengenai dokumen merujuk ke **Kontak Person Divisi Pengirim** yang tertera di halaman surat.

---

## 7. Prosedur Penanganan Kesalahan

| Skenario Kesalahan | Tindakan Perbaikan |
|---|---|
| **1. Salah pilih penerima / salah divisi tujuan** | Buka **Detail** surat → klik **Nonaktifkan** pada penerima yang keliru → beri tahu singkat lewat WA bahwa tautan telah dinonaktifkan. Jika penerima yang benar belum menerima, catat disposisi baru dan beri keterangan koreksi. |
| **2. Salah input informasi atau salah unggah file scan** | **Jangan hapus nomor arsip lama.** Nonaktifkan seluruh tautan pada surat yang keliru, lalu buat pencatatan baru (kode arsip baru). Pada surat fisik, coret kode lama dengan **satu garis rapi** (tanpa tip-ex), tulis kode baru di sebelahnya beserta paraf admin. |
| **3. Salah tulis kode arsip di surat fisik** | Cocokkan fisik surat dengan **Lihat Dokumen Scan** di SIDISPO. Coret kode salah dengan satu garis, tulis kode benar + paraf & tanggal koreksi, lalu susun ulang di ordner divisi. |
| **4. Lupa mencatat (sudah terlanjur kirim manual)** | Pindai dan catat ke SIDISPO pada hari yang sama. Tambahkan keterangan *"Pencatatan susulan; dokumen awal disampaikan tanggal DD/MM/YYYY"* di kolom catatan, tulis kode arsip di surat fisik, lalu kirim tautan ke penerima untuk konfirmasi. |
| **5. Tautan kedaluwarsa (>30 hari) atau hilang** | Jika link masih ada di chat → klik **Perpanjang** (+7/+14/+30 hari). Jika chat terhapus atau tautan sempat dinonaktifkan → klik **Buat Tautan Baru** lalu kirim lewat WhatsApp. |
| **6. Nomor WA penerima salah / ganti** | Perbarui nomor di **Daftar Penerima** (oleh admin divisi terkait atau Superadmin), lalu klik **Buat Tautan Baru** di halaman Detail surat. |
| **7. Kontak person divisi berganti / admin pindah divisi** | Laporkan ke **Superadmin** pada hari yang sama untuk memperbarui kontak di **Kelola Divisi** dan memindahkan/menonaktifkan akun di **Kelola Akun Admin**. |
| **8. Gangguan sistem / internet mati (surat SEGERA)** | Kirim foto/scan sementara lewat WhatsApp resmi divisi agar tindak lanjut tidak tertunda, letakkan surat fisik di map *"Tunda Input SIDISPO"*, lalu segera catat susulan begitu koneksi pulih. |

---

*Standar Operasional Prosedur SIDISPO Multi-Divisi — Solo Techno Park (STP).*
