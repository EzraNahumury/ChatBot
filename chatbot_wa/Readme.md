# WhatsApp Chatbot - Ayres Parallel

Bot WhatsApp berbasis `Baileys` + AI (`Ollama API`) untuk membalas chat customer secara otomatis.

## 1. Persiapan

Pastikan sudah terpasang:
- Node.js `>= 18`
- npm
- Akun WhatsApp yang akan dipakai untuk bot
- API key Ollama (jika menggunakan endpoint berbayar)

## 2. Install dependency

Jalankan dari folder project:

```bash
cd C:\AI ENGINEER\ChatBot\chatbot_wa
npm install
```

## 3. Setup environment

Copy file contoh env:

```bash
copy .env.example .env
```

Lalu isi nilai penting di `.env`:
- `OLLAMA_HOST` (default: `https://ollama.com`)
- `OLLAMA_KEY`
- `OLLAMA_MODEL` (default: `gpt-oss:120b-cloud`)
- `SESSION_DIR` (default lokal: `./auth`)

## 4. Jalankan bot

Start bot dengan:

```bash
node index.js
```

Alternatif:

```bash
npm start
```

## 5. Scan QR WhatsApp

Saat pertama kali jalan, terminal akan menampilkan QR code.

Langkah scan:
1. Buka WhatsApp di HP.
2. Masuk ke **Perangkat tertaut / Linked devices**.
3. Pilih **Tautkan perangkat / Link a device**.
4. Scan QR yang muncul di terminal.

Jika sukses, log akan menunjukkan status koneksi terbuka (`connected`).

## 6. Cek bot aktif

Health endpoint:
- `GET http://localhost:3000/`
- `GET http://localhost:3000/health`

`/health` akan return `200` jika status bot sudah `connected`.

## 7. Coba chat ke bot

Kirim pesan ke nomor WhatsApp bot:
- `ping` -> balasan `pong`
- `menu` / `halo` / `hi` / `hello` -> pesan sapaan
- `reset` atau `/reset` -> reset history chat user
- `admin` -> balasan handoff ke admin

Selain command di atas, pesan akan diproses ke AI.

## 8. Troubleshooting

- QR tidak muncul:
  - Pastikan proses `node index.js` berjalan normal (tidak crash).
  - Hapus folder sesi `auth` lalu jalankan ulang jika sesi lama bermasalah.

- Status `logged_out`:
  - Sesi terputus dari WhatsApp, bot akan regenerate QR.
  - Scan ulang QR terbaru.

- Bot balas error AI:
  - Cek `OLLAMA_HOST`, `OLLAMA_KEY`, dan koneksi internet.
  - Pastikan model pada `OLLAMA_MODEL` tersedia.

- Port bentrok:
  - Ubah `PORT` di environment sebelum menjalankan bot.
