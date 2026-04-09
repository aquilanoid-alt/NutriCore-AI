# Checklist Final Siap Dipakai Kerja

## Yang sudah aman

- Frontend web sudah online di Vercel.
- Panduan PDF bisa dibuka dari aplikasi.
- Menu `Home`, `Track`, `Label`, `Recipe`, dan `Profile` sudah saling terhubung.
- Hasil label produk sekarang bisa lebih otomatis memengaruhi `Recipe`.
- Status `merah / kuning / hijau` sekarang lebih jelas terasa di rekomendasi recipe.
- Ekspor PDF / DOC / CSV / XLSX sudah tersedia.

## Yang masih perlu perhatian

- Backend masih berjalan dari laptop lokal.
- Backend online saat ini masih bergantung pada `ngrok`.
- Jika terminal backend atau terminal ngrok ditutup, fitur analisis akan berhenti.
- URL ngrok bisa berubah saat sesi baru dibuka, sehingga environment variable Vercel perlu diperbarui lagi.
- OCR foto label paling stabil saat backend lokal berjalan di macOS; belum ideal untuk server cloud Linux.

## Checklist harian sebelum mulai kerja

1. Pastikan terminal backend FastAPI sedang berjalan.
2. Pastikan terminal ngrok sedang berjalan dan URL `https` masih aktif.
3. Pastikan frontend Vercel memakai deployment terbaru.
4. Coba buka `Profile -> Lihat Panduan` untuk memastikan frontend tersambung ke backend.
5. Coba satu analisis singkat di `Home`.
6. Jika memakai scan label, cek bahwa hasil label masuk ke `Recipe`.

## Jika ada masalah

- `Analisis Status Gizi` tidak merespons:
  Cek backend FastAPI dan URL ngrok.

- Panduan PDF tidak terbuka:
  Cek backend dan refresh website.

- Hasil scan label tidak lengkap:
  Perbaiki manual angka produk, lalu analisis ulang.

- Recipe belum terasa mengikuti status label:
  Jalankan analisis label lagi, lalu buka ulang menu `Recipe`.

## Prioritas penguatan produksi berikutnya

1. Pindahkan backend ke hosting permanen.
2. Ganti OCR label ke engine server-side yang cocok untuk Linux/cloud.
3. Tambahkan domain backend tetap agar tidak bergantung pada URL ngrok yang berubah-ubah.
