# Integrasi Panduan PDF di Aplikasi

Dokumen ini menjelaskan bagaimana PDF panduan NutriCore AI dihubungkan ke aplikasi mobile.

## 1. File yang Disiapkan

- Backend metadata endpoint: `GET /api/v1/resources/guide`
- Backend file endpoint: `GET /api/v1/resources/guide/file`
- React Native screen: `mobile/src/screens/GuideCenterScreen.tsx`
- React Native service: `mobile/src/services/guideService.ts`
- Help center menu item: `mobile/src/navigation/helpMenu.ts`

## 2. Alur Penggunaan di Aplikasi

1. Pengguna membuka menu `Profile` atau `Help Center`
2. Pengguna memilih `Panduan Lengkap`
3. Aplikasi memanggil metadata PDF dari backend
4. Pengguna dapat:
   - melihat PDF di dalam aplikasi
   - membagikan tautan ke WhatsApp
   - membuka draft email
   - mencetak PDF

## 3. Rekomendasi Penempatan

- Tab `Profile`
- Menu `Help Center`
- Onboarding akhir untuk pengguna baru

## 4. Dependensi React Native yang Disarankan

```bash
npm install react-native-pdf react-native-print
```

Gunakan native share sheet bawaan React Native untuk berbagi umum. Jika ingin kontrol berbagi file yang lebih kuat, dapat ditambahkan `react-native-share`.

## 5. Catatan Implementasi

- `RNPrint.print({ filePath: guideFileUrl })` dapat diganti dengan file lokal bila strategi download-cache diterapkan.
- Untuk pengalaman offline, aplikasi sebaiknya mengunduh PDF dan menyimpannya ke local storage.
- Endpoint backend saat ini menyajikan PDF langsung dari folder `docs/`.
