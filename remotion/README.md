# 🎬 Video Motion Graphic Perpustakaan Digital SMKN 1 Beringin

Video promosi dan demonstrasi alur sistem **Perpustakaan Digital & Kios Presensi Mandiri SMK Negeri 1 Beringin** berbasis **Remotion**.

---

## 🚀 Cara Menjalankan di Mode Pengembangan (Remotion Studio)

Untuk membuka interactive preview studio di browser:

```bash
npm run remotion
```
*atau:*
```bash
npx remotion studio remotion/index.ts
```

Studio akan terbuka di port lokal (default `http://localhost:3000` atau port berikutnya), di mana Anda dapat:
- Memutar video penuh 42 detik dengan audio & sound effect sinkron.
- Membuka dan mengedit setiap scene secara terpisah (Scene 1 s/d Scene 11).
- Menyesuaikan durasi, warna, teks, atau timing animasi secara visual.

---

## 🎥 Cara Render Video Final (.mp4)

Untuk merender video beresolusi Full HD 1080p:

```bash
npm run remotion:render
```
File video final akan tersimpan di:
📁 `out/perpus-motion.mp4`

---

## 🎞️ Struktur 11 Scene Motion Graphic

| Scene | Judul / Alur | Deskripsi | Durasi |
|---|---|---|---|
| **Scene 1** | **Intro & Perkenalan** | Logo SMKN 1 Beringin & Kolaborasi Sumut Berkah, typography minimalis, 3 pilar utama. | 3.3s (0-100 f) |
| **Scene 2** | **Komparasi Manual vs Digital** | Pengisian buku kunjungan fisik manual (antre, rentan hilang, rekap lambat) vs Kios Presensi Mandiri (1 detik, akurat, paperless). | 4.0s (100-220 f) |
| **Scene 3** | **Alur Siswa 1 - Cek & Simpan Kartu Digital** | Pencarian NISN siswa, visualisasi Kartu Anggota Digital lengkap (QR Presensi, Barcode 128, Nama & Kelas), dan tombol simpan ke galeri smartphone. | 4.3s (220-350 f) |
| **Scene 4** | **Alur Siswa 2 - Kios Presensi Mandiri** | Siswa memilih keperluan kunjungan di kios, scan kartu HP/fisik, animasi laser scan, counter live bertambah, notifikasi sukses. | 4.3s (350-480 f) |
| **Scene 5** | **Rekapitulasi Live - Statistik Pengunjung** | Dashboard statistik pengunjung live, 6 analitik metrics (Total kunjungan, unik, rata-rata, hari/jam teramai), pertumbuhan +600%, ekspor CSV & PDF. | 4.3s (480-610 f) |
| **Scene 6** | **Alur Petugas 1 - Login Panel Admin** | Tampilan Login Petugas dengan logo sekolah & kolaborasi, animasi ketik username `admin` + password, dan verifikasi sukses. | 3.3s (610-710 f) |
| **Scene 7** | **Alur Petugas 2 - Dashboard Command Center** | Showcase dashboard admin (Total koleksi, eksemplar, sirkulasi scanner, auto-fetch ISBN, denda). | 4.0s (710-830 f) |
| **Scene 8** | **Alur Petugas 3 - Manajemen Koleksi Buku & Inventaris** | Header Katalog Utama, 4 Stat Cards (Judul 7, Stok Fisik 26, Tersedia 26, Dipinjam 0), Barcode Quick Scan, dan Tabel Koleksi Buku Terdaftar. | 4.3s (830-960 f) |
| **Scene 9** | **Alur Petugas 4 - Validasi & Sirkulasi** | Validasi eksemplar buku fisik dengan barcode scanner, cek ketersediaan stok, checklist validasi 100% lolos. | 4.3s (960-1090 f) |
| **Scene 10** | **Katalog E-Book Online** | Akses koleksi e-book digital langsung dari smartphone, laptop, dan tablet. | 2.7s (1090-1170 f) |
| **Scene 11** | **Outro & Brand Identity** | Animasi glowing shield logo SMKN 1 Beringin, Kolaborasi Sumut Berkah, dan slogan resmi. | 3.0s (1170-1260 f) |

---

## 🔊 Sound Effects & Audio Synthesizer

Audio dan efek suara tersimpan di folder `public/audio/`:
- `energetic_tech.mp3` : Backsound Energetic Tech / Modern Electronic bertempo 126 BPM (punchy kick, rolling bass, tech arpeggiator & sweep risers).
- `whoosh.wav` : Efek transisi antar scene dinamis.
- `scan_beep.wav` : Efek suara barcode scanner meja kios digital & sirkulasi.
- `success_chime.wav` : Melodi akor harmonis penanda kartu muncul, presensi sukses, rekapitulasi ter-update, login verified, dan validasi buku.
- `pop.wav` : Efek suara pop elemen UI interaktif.
