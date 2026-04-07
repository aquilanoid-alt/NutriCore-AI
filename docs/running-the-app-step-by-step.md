# Menjalankan NutriCore AI Step by Step

Panduan ini untuk mencoba versi awal aplikasi NutriCore AI yang ada di folder `app/` dan backend FastAPI di folder `backend/`.

## 1. Jalankan Backend

Buka terminal pertama:

```bash
cd "/Users/theresiaaquila/Documents/NutriCore AI"
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn
cd backend
uvicorn app.main:app --reload
```

Jika berhasil, backend tersedia di:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/api/v1/resources/guide`
- `http://127.0.0.1:8000/api/v1/resources/guide/file`

## 2. Jalankan Mobile App

Buka terminal kedua:

```bash
cd "/Users/theresiaaquila/Documents/NutriCore AI/app"
cp .env.example .env
npm install
npm start
```

Jika Metro/Expo terbuka, Anda bisa memilih:

- tekan `w` untuk membuka versi web
- tekan `i` untuk iOS Simulator
- tekan `a` untuk Android Emulator
- scan QR dengan Expo Go untuk HP fisik

## 3. Jika Menjalankan di Browser

Cara tercepat:

1. pastikan backend sudah jalan
2. jalankan `npm start`
3. tekan `w`
4. buka tab `Profile`
5. tekan `Lihat PDF`

## 4. Jika Menjalankan di HP Fisik

`localhost` tidak akan mengarah ke laptop Anda. Ganti isi file `.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://IP_LAPTOP_ANDA:8000
```

Contoh:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
```

Lalu restart Expo:

```bash
npm start
```

## 5. Apa yang Sudah Bisa Dicoba

- Home screen NutriCore AI
- Tab `Track`
- Tab `Recipe`
- Tab `Profile`
- Akses PDF panduan dari tab `Profile`
- Tombol `Bagikan`
- Shortcut `WhatsApp`
- Shortcut `Email`
- Tombol `Cetak` dengan membuka file PDF

## 6. Jika Ada Error

### Error backend tidak tersambung

Periksa:

- backend benar-benar berjalan di port `8000`
- URL pada `.env` benar
- jika memakai HP fisik, gunakan IP laptop, bukan `127.0.0.1`

### Error dependency Expo

Jalankan:

```bash
cd "/Users/theresiaaquila/Documents/NutriCore AI/app"
rm -rf node_modules package-lock.json
npm install
```

### PDF tidak terbuka

Periksa URL ini di browser:

`http://127.0.0.1:8000/api/v1/resources/guide/file`

Jika URL itu tidak membuka PDF, berarti backend belum jalan atau file tidak terbaca.
