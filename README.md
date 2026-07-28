# Web Video Downloader

Proyek berbasis HTML, CSS, dan JavaScript vanilla untuk mengunduh video dari TikTok (Tanpa Tanda Air) dan Facebook. Dirancang agar ringan, responsif (mobile-first), dan menggunakan *interface* Dark Mode elegan.

## Fitur
- **Animasi Intro & Partikel:** Efek visual menarik saat aplikasi pertama kali dimuat.
- **Dukungan API:** Terintegrasi dengan API Publik `tikwm.com` (TikTok) dan `oembed` (Facebook).
- **Penyimpanan Lokal (Riwayat):** 5 Tautan yang baru dicari akan tersimpan di browser `localStorage`.
- **Light/Dark Mode:** Toggle kustomisasi tema secara instan.
- **Full Front-end:** 100% Client-side. Tidak membutuhkan Node.js, PHP, atau konfigurasi *backend server*.

## Cara Deploy ke Github Pages
Website ini dirancang secara khusus agar bisa dikonfigurasi melalui *repository* statis dan berjalan optimal di GitHub Pages.

1. **Buat Repository:** Buat *repository* baru di GitHub.
2. **Upload File:** *Push* atau *upload* ketiga file utama (`index.html`, `style.css`, `script.js`) ke dalam *root repository* tersebut.
3. **Aktifkan Pages:**
   - Masuk ke tab **Settings** di *repository*.
   - Pilih menu **Pages** di *sidebar* kiri.
   - Di bagian *Build and deployment*, atur Source ke **Deploy from a branch**.
   - Pada dropdown Branch, pilih **main** (atau master), lalu simpan (Save).
4. Selesai! Web akan ter-publish dalam beberapa menit di URL `https://[username].github.io/[nama-repo]`.
