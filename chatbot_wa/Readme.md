# 🤖 WhatsApp AI Chatbot - Ayres Parallel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Platform: Railway](https://img.shields.io/badge/Platform-Railway-blueviolet)](https://railway.app/)

**Ayres Parallel Chatbot** adalah asisten virtual WhatsApp canggih yang menggabungkan automasi berbasis aturan (*rule-based*) dengan kecerdasan buatan (*AI*) menggunakan **Ollama API**. Dirancang khusus untuk operasional Customer Service (CS) toko jersey/apparel, bot ini mampu menangani ribuan chat, mengirim gambar katalog, menjelaskan detail produk, hingga membantu proses pemesanan secara otomatis 24/7.

---

## ✨ Fitur Utama

- 🧠 **AI Hybrid System**: Menggunakan integrasi Ollama (LLM) untuk menjawab pertanyaan kompleks dan *rule-based handler* untuk perintah cepat.
- 🖼️ **Multi-Media Support**: Mengirim katalog produk, pricelist, size chart, dan contoh desain secara otomatis.
- 💬 **Context-Aware AI**: Mengingat riwayat percakapan untuk memberikan jawaban yang relevan dan personal.
- 🚀 **Fast Response**: Dilengkapi dengan sistem antrean (*queue*) per nomor WhatsApp untuk mencegah tabrakan pesan.
- 🛡️ **Anti-Ban Protection**: Simulasi pengetikan manusia (*human-like typing*) dan pembatasan frekuensi pesan (*rate limiting*).
- 📊 **Health Monitoring**: Server Express internal untuk memantau status koneksi bot.
- 🔄 **Auto Reconnect**: Watchdog internal untuk memastikan bot selalu terhubung kembali jika koneksi terputus.

---

## 📁 Struktur Proyek

```text
chatbot_wa/
├── auth/                       # Folder sesi WhatsApp (QR Login)
├── gambar/                     # Assets gambar (Katalog, Size Chart, dll)
│   ├── katalog/                # Berbagi kategori katalog jersey
│   ├── Size Chart/             # Gambar ukuran produk
│   └── hasil_design/           # Portfolio desain
├── src/                        # Source code utama
│   ├── ai/                     # Integrasi Ollama & Prompt Builder
│   ├── core/                   # Koneksi Baileys & Routing utama
│   ├── handlers/               # Logika perintah & Fallback AI
│   └── utils/                  # Logger, Throttle, & Helper
├── .env                        # Konfigurasi lingkungan
├── index.js                    # Entry point aplikasi
├── knowledge-base.json         # Data pengetahuan bisnis
└── package.json                # Dependensi & Scripts
```

---

## 🚀 Panduan Instalasi

### Prasyarat
- **Node.js** >= v18.0.0
- **npm** atau **yarn**
- **Ollama API Host & Key**

### Langkah-langkah
1. **Clone repositori:**
   ```bash
   git clone https://github.com/EzraNahumury/chatbot_wa.git
   cd chatbot_wa
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Salin file `.env.example` menjadi `.env` dan isi variabel yang diperlukan:
   ```bash
   cp .env.example .env
   ```

   **Detail Variabel `.env`:**
   | Variabel | Deskripsi | Default |
   |----------|-----------|---------|
   | `OLLAMA_HOST` | URL host Ollama API | - |
   | `OLLAMA_KEY` | API Key untuk autentikasi | - |
   | `OLLAMA_MODEL` | Model AI yang digunakan | - |
   | `RATE_LIMIT_MAX` | Maksimal pesan per jendela waktu | `10` |
   | `SESSION_DIR` | Folder penyimpanan sesi WA | `./auth` |

---

## 💻 Cara Menjalankan

### Mode Produksi
```bash
npm start
```

### Mode Pengembangan (Auto-reload)
```bash
npm run dev
```

### Autentikasi Pertama Kali
1. Jalankan bot.
2. Terminal akan menampilkan **QR Code**.
3. Buka WhatsApp di ponsel Anda > **Perangkat Tertaut** > **Tautkan Perangkat**.
4. Scan QR Code yang muncul di terminal.

---

## 🤖 Perintah yang Didukung

Bot akan mengenali perintah berikut secara otomatis sebelum dilempar ke AI:

| Perintah | Deskripsi |
|----------|-----------|
| `katalog` | Menampilkan menu kategori katalog jersey |
| `pricelist`| Menampilkan pilihan daftar harga paket |
| `size chart`| Mengirim gambar panduan ukuran |
| `alur order`| Menjelaskan langkah-langkah pemesanan |
| `bahan` | Menampilkan informasi jenis kain |
| `admin` | Menghubungkan langsung ke CS manusia |
| `reset` | Menghapus riwayat percakapan dengan AI |

---

## 🔧 Integrasi AI (Ollama)

Bot ini menggunakan file `knowledge-base.json` sebagai sumber data utama bagi AI untuk menjawab pertanyaan seputar:
- Detail layanan (Express, Custom Design, dll)
- Informasi harga & paket
- Syarat dan ketentuan
- FAQ umum

Sistem akan secara cerdas menyaring pesan. Jika pesan mengandung kata kunci "gambar" atau "katalog", bot akan mengarahkan ke pengiriman file fisik. Jika berupa pertanyaan umum, AI akan menjawab sesuai konteks bisnis.

---

## 🌩️ Deployment (Railway)

Proyek ini siap untuk di-deploy ke **Railway**:
1. Pastikan `build command` adalah `npm install`.
2. Pastikan `start command` adalah `npm start`.
3. Gunakan **Railway Volume** dan kaitkan ke `/data/auth` agar sesi WhatsApp tidak hilang saat restart.
4. Set `SESSION_DIR=/data/auth` di variabel lingkungan Railway.

---

## 🛠️ Troubleshooting

- **QR Code Terpotong**: Perkecil ukuran font terminal atau gunakan terminal modern seperti VS Code Terminal.
- **Sesi Logout Otomatis**: Hapus folder `auth/` dan scan ulang untuk mereset sesi.
- **AI Tidak Menjawab**: Pastikan `OLLAMA_HOST` dapat dijangkau dan kuota API mencukupi.

---

## 📄 Lisensi

Didistribusikan di bawah **Lisensi MIT**. Lihat file `LICENSE` untuk informasi lebih lanjut.

---

## 🤝 Kontribusi

Kontribusi selalu terbuka! Silakan lakukan *fork* dan ajukan *pull request* untuk perbaikan atau fitur baru.

---

**Dibuat dengan ❤️ oleh Ayres Parallel Team.**
