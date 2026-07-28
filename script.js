document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // 1. INTRO ANIMATION
    //
    // Timeline (diselaraskan dengan CSS):
    //   0.0s  → intro-content slide-up mulai (CSS animation)
    //   0.6s  → typewriter mulai ngetik (CSS animation-delay)
    //   0.6s  → progress bar mulai mengisi (CSS animation-delay)
    //   4.4s  → JS mulai fade-out (#intro-screen opacity → 0)
    //   5.1s  → intro class.hidden, app muncul dengan slide-up
    //
    // Jeda 2 detik ekstra (dibanding kode lama) agar animasi
    // terasa elegan dan user sempat membaca teks intro.
    // =========================================================
    const INTRO_HOLD_MS  = 4400; // waktu sebelum fade-out dimulai
    const INTRO_FADE_MS  = 700;  // durasi fade-out (harus cocok dengan CSS transition 0.7s)

    setTimeout(() => {
        const intro = document.getElementById("intro-screen");
        const app   = document.getElementById("app-container");

        // Fade-out halus (CSS transition opacity 0.7s sudah di-set di style.css)
        intro.style.opacity = "0";

        setTimeout(() => {
            intro.classList.add("hidden");
            app.classList.remove("hidden");
        }, INTRO_FADE_MS);

    }, INTRO_HOLD_MS);

    // =========================================================
    // 2. BACKGROUND PARTICLES
    // =========================================================
    const particlesContainer = document.getElementById("particles");
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");
        particle.style.left              = Math.random() * 100 + "vw";
        particle.style.animationDuration = (Math.random() * 10 + 5) + "s";
        particle.style.animationDelay   = Math.random() * 5 + "s";
        particlesContainer.appendChild(particle);
    }

    // =========================================================
    // 3. THEME TOGGLE
    // =========================================================
    const themeBtn  = document.getElementById("theme-toggle");
    const moonIcon  = document.getElementById("moon-icon");
    const sunIcon   = document.getElementById("sun-icon");

    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        moonIcon.classList.add("hidden");
        sunIcon.classList.remove("hidden");
    }

    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        moonIcon.classList.toggle("hidden");
        sunIcon.classList.toggle("hidden");
        localStorage.setItem("theme",
            document.body.classList.contains("light-mode") ? "light" : "dark"
        );
    });

    // =========================================================
    // 4. HISTORY MANAGEMENT
    // =========================================================
    let downloadHistory = JSON.parse(localStorage.getItem("vidHistory")) || [];
    const historyList   = document.getElementById("history-list");

    function renderHistory() {
        historyList.innerHTML = "";
        if (downloadHistory.length === 0) {
            historyList.innerHTML = `<li class="empty-history">Belum ada riwayat.</li>`;
            return;
        }
        downloadHistory.forEach(link => {
            const li = document.createElement("li");
            const a  = document.createElement("a");
            a.href       = link;
            a.target     = "_blank";
            a.rel        = "noopener";
            a.textContent = link.length > 45 ? link.substring(0, 45) + "…" : link;
            li.appendChild(a);
            historyList.appendChild(li);
        });
    }
    renderHistory();

    function saveToHistory(link) {
        if (!downloadHistory.includes(link)) {
            downloadHistory.unshift(link);
            if (downloadHistory.length > 5) downloadHistory.pop();
            localStorage.setItem("vidHistory", JSON.stringify(downloadHistory));
            renderHistory();
        }
    }

    // =========================================================
    // 5. TOAST SYSTEM
    //    isError=true → merah | isError=false → hijau (sukses)
    // =========================================================
    function showToast(message, isError = true) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.style.background = isError
            ? "linear-gradient(135deg, #e74c3c, #c0392b)"
            : "linear-gradient(135deg, #27ae60, #2ecc71)";
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 3500);
    }

    // =========================================================
    // 6. UI ELEMENT REFERENCES
    // =========================================================
    const loader          = document.getElementById("loader");
    const resultSection   = document.getElementById("result-section");
    const videoPreview    = document.getElementById("video-preview");
    const downloadOptions = document.getElementById("download-options");
    const badgeContainer  = document.getElementById("resolution-badges");

    const btnDlNoWm = document.getElementById("btn-dl-nowm");
    const btnDlMp4  = document.getElementById("btn-dl-mp4");
    const btnDlMp3  = document.getElementById("btn-dl-mp3");

    // =========================================================
    // 7. GLOBAL STATE — data video TikTok yang sedang aktif
    // =========================================================
    let currentTikTokData = null;

    // =========================================================
    // 8. TIKTOK — RESOLUTION BADGE LOGIC
    //
    // Mapping badge key → field API tikwm:
    //
    //   data.play   → video HD original, tanpa watermark (kualitas tertinggi)
    //   data.wmplay → video dengan watermark (kualitas lebih rendah / ukuran kecil)
    //   data.music  → audio MP3
    //
    // tikwm TIDAK memberi URL terpisah per resolusi (1080p/720p/480p).
    // Mapping di bawah adalah aproksimasi masuk akal:
    //   1080p & 720p → play  (resolusi asli, HD)
    //   480p         → wmplay (biasanya resolusi lebih kecil)
    //   MP3          → music
    // =========================================================
    const RESOLUTION_MAP = {
        "1080p": { field: "play",   label: "HD (Tanpa Watermark)" },
        "720p":  { field: "play",   label: "HD (Tanpa Watermark)" },
        "480p":  { field: "wmplay", label: "SD (Ada Watermark)"   },
        "MP3":   { field: "music",  label: "Audio MP3"            },
    };

    /**
     * Render badge resolusi secara dinamis.
     * Badge dengan URL null/undefined → badge-disabled (pointer-events:none di CSS).
     */
    function renderResolutionBadges(data) {
        if (!badgeContainer) return;
        badgeContainer.innerHTML = "";

        Object.entries(RESOLUTION_MAP).forEach(([key, info]) => {
            const url   = data[info.field];
            const badge = document.createElement("span");
            badge.classList.add("badge");
            badge.textContent      = key;
            badge.dataset.resolution = key;

            if (url) {
                badge.classList.add("badge-active");
                badge.title = `Unduh ${info.label}`;
                badge.addEventListener("click", () => handleBadgeClick(key, data));
            } else {
                badge.classList.add("badge-disabled");
                badge.title = "Tidak tersedia untuk video ini";
            }

            badgeContainer.appendChild(badge);
        });
    }

    /**
     * Update tombol download utama saat badge resolusi diklik.
     */
    function handleBadgeClick(resolution, data) {
        const info = RESOLUTION_MAP[resolution];
        if (!info) return;

        const url = data[info.field];
        if (!url) {
            showToast(`Resolusi ${resolution} tidak tersedia.`);
            return;
        }

        // Perbarui highlight badge
        badgeContainer.querySelectorAll(".badge").forEach(b => b.classList.remove("badge-selected"));
        const clickedBadge = badgeContainer.querySelector(`[data-resolution="${resolution}"]`);
        if (clickedBadge) clickedBadge.classList.add("badge-selected");

        // Update link tombol download sesuai resolusi yang dipilih
        if (resolution === "MP3") {
            btnDlMp3.href = url;
            btnDlMp3.setAttribute("download", `tiktok_audio_${Date.now()}.mp3`);
            showToast(`✅ Siap unduh: ${info.label}`, false);
        } else {
            btnDlNoWm.href = url;
            btnDlNoWm.setAttribute("download", `tiktok_${resolution}_${Date.now()}.mp4`);
            showToast(`✅ Resolusi dipilih: ${info.label}`, false);
        }
    }

    // =========================================================
    // 9. TIKTOK HANDLER
    // =========================================================
    document.getElementById("btn-tiktok").addEventListener("click", async () => {
        const url = document.getElementById("tiktok-url").value.trim();

        if (!url || !url.includes("tiktok")) {
            return showToast("Masukkan link TikTok yang valid! (cth: vt.tiktok.com/...)");
        }

        prepareFetch();
        currentTikTokData = null;

        try {
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const resData = await response.json();
            if (resData.code !== 0) {
                throw new Error(resData.msg || "Video tidak ditemukan atau di-private.");
            }

            const data = resData.data;
            currentTikTokData = data;

            // Thumbnail
            videoPreview.innerHTML = `
                <img src="${data.cover}" alt="Video Thumbnail"
                     style="max-width:100%;border-radius:8px;">
            `;

            // Default download links (1080p HD)
            btnDlNoWm.href = data.play;
            btnDlNoWm.setAttribute("download", `tiktok_hd_${Date.now()}.mp4`);
            btnDlMp4.href  = data.wmplay || data.play;
            btnDlMp4.setAttribute("download", `tiktok_wm_${Date.now()}.mp4`);
            btnDlMp3.href  = data.music;
            btnDlMp3.setAttribute("download", `tiktok_audio_${Date.now()}.mp3`);

            // Render badge & pilih default 1080p
            renderResolutionBadges(data);
            const defaultBadge = badgeContainer.querySelector('[data-resolution="1080p"]');
            if (defaultBadge && defaultBadge.classList.contains("badge-active")) {
                defaultBadge.classList.add("badge-selected");
            }

            showResult(url, true);
            showToast("✅ Video TikTok berhasil diambil!", false);

        } catch (error) {
            handleError(`TikTok Error: ${error.message}`);
        }
    });

    // =========================================================
    // 10. FACEBOOK HANDLER — Multi-Proxy Fallback Strategy
    //
    // KENAPA INI SULIT:
    //   Facebook secara aktif memblokir CORS dari browser.
    //   Link Reels/pendek (/share/r/, fb.watch) tidak didukung oembed.
    //
    // STRATEGI (urutan prioritas):
    //   1. noembed.com  → agregator oembed, CORS-friendly, gratis
    //   2. FB oembed.json via 3 proxy publik berbeda (fallback berantai)
    //   3. Jika semua gagal → tampilkan fallback UI + link layanan alternatif
    // =========================================================

    const FB_OEMBED_BASE = "https://www.facebook.com/plugins/video/oembed.json";
    const NOEMBED_BASE   = "https://noembed.com/embed";

    // Proxy publik gratis — diurutkan dari paling stabil
    const PROXY_LIST = [
        (t) => `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,
        (t) => `https://corsproxy.io/?${encodeURIComponent(t)}`,
        (t) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(t)}`,
    ];

    function detectFbLinkType(url) {
        if (url.includes("/share/r/") || url.includes("/reel/")) return "reels";
        if (url.includes("fb.watch"))                            return "short";
        if (url.includes("/videos/"))                            return "video";
        return "unknown";
    }

    /**
     * Coba fetch ke targetUrl melalui semua proxy satu per satu.
     * Timeout 8 detik per proxy. Throw jika semua gagal.
     */
    async function fetchWithProxyFallback(targetUrl) {
        let lastError = null;

        for (let i = 0; i < PROXY_LIST.length; i++) {
            const proxyUrl  = PROXY_LIST[i](targetUrl);
            const controller = new AbortController();
            const timer      = setTimeout(() => controller.abort(), 8000);

            try {
                const res = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timer);

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const text = await res.text();
                if (text.trim().startsWith("<")) throw new Error("Response adalah HTML, bukan JSON");

                return JSON.parse(text);

            } catch (err) {
                clearTimeout(timer);
                console.warn(`[FB Proxy ${i + 1}] Gagal:`, err.message);
                lastError = err;
            }
        }

        throw new Error(`Semua proxy gagal. Error terakhir: ${lastError?.message}`);
    }

    async function fetchFacebookVideo(url) {
        // Strategi 1: noembed.com (no proxy needed)
        try {
            const controller = new AbortController();
            const timer      = setTimeout(() => controller.abort(), 8000);
            const res        = await fetch(`${NOEMBED_BASE}?url=${encodeURIComponent(url)}`, {
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.ok) {
                const data = await res.json();
                if (data?.html && !data.error) return { source: "noembed", data };
            }
        } catch (err) {
            console.warn("[FB] noembed.com gagal:", err.message);
        }

        // Strategi 2: FB oembed via multi-proxy
        try {
            const fbApiUrl = `${FB_OEMBED_BASE}?url=${encodeURIComponent(url)}`;
            const data     = await fetchWithProxyFallback(fbApiUrl);
            if (data?.html) return { source: "fb-oembed", data };
        } catch (err) {
            console.warn("[FB] FB oembed via proxy gagal:", err.message);
        }

        throw new Error("FETCH_FAILED");
    }

    document.getElementById("btn-fb").addEventListener("click", async () => {
        const url = document.getElementById("fb-url").value.trim();

        if (!url || (!url.includes("facebook") && !url.includes("fb.watch"))) {
            return showToast("Masukkan link Facebook yang valid!");
        }

        prepareFetch();

        try {
            const { data } = await fetchFacebookVideo(url);

            // Tampilkan embedded player responsive
            videoPreview.innerHTML = `
                <div style="position:relative;width:100%;padding-bottom:56.25%;overflow:hidden;border-radius:8px;">
                    ${data.html}
                </div>
            `;

            const iframe = videoPreview.querySelector("iframe");
            if (iframe) {
                Object.assign(iframe.style, {
                    position: "absolute", top: "0", left: "0",
                    width: "100%", height: "100%", border: "none",
                });
            }

            showResult(url, false);
            showToast("✅ Preview Facebook berhasil dimuat!", false);

        } catch {
            handleFacebookFallback(url);
        }
    });

    /**
     * Fallback UI Facebook — berguna & tidak membingungkan user.
     */
    function handleFacebookFallback(url) {
        loader.classList.add("hidden");
        resultSection.classList.remove("hidden");
        downloadOptions.style.display = "none";

        const isReels = detectFbLinkType(url) === "reels";

        videoPreview.innerHTML = `
            <div style="
                width:100%;padding:28px 20px;text-align:center;
                background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.12);
                border-radius:14px;line-height:1.6;
            ">
                <div style="font-size:2.6rem;margin-bottom:12px;">⚠️</div>
                <h3 style="margin-bottom:8px;font-size:1.05rem;font-family:'Poppins',sans-serif;">
                    ${isReels ? "Facebook Reels tidak didukung" : "Video tidak dapat diambil langsung"}
                </h3>
                <p style="font-size:0.87rem;opacity:.72;margin-bottom:20px;max-width:440px;margin-inline:auto;">
                    ${isReels
                        ? "Link Reels (/share/r/) tidak tersedia via oembed publik — ini kebijakan Meta, bukan bug."
                        : "Facebook memblokir akses langsung dari browser. Pastikan video berstatus <strong>Publik</strong>."
                    }
                </p>
                <p style="font-size:0.82rem;opacity:.55;margin-bottom:14px;">Gunakan layanan alternatif:</p>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                    <a href="https://snapsave.app/id/" target="_blank" rel="noopener"
                       style="padding:8px 18px;background:linear-gradient(135deg,#3b5998,#4267B2);
                              color:#fff;text-decoration:none;border-radius:8px;font-size:.85rem;font-weight:600;">
                        SnapSave
                    </a>
                    <a href="https://fdown.net/" target="_blank" rel="noopener"
                       style="padding:8px 18px;background:linear-gradient(135deg,#1877f2,#0d6efd);
                              color:#fff;text-decoration:none;border-radius:8px;font-size:.85rem;font-weight:600;">
                        FDown
                    </a>
                    <a href="https://www.getfvid.com/" target="_blank" rel="noopener"
                       style="padding:8px 18px;background:linear-gradient(135deg,#4CAF50,#45a049);
                              color:#fff;text-decoration:none;border-radius:8px;font-size:.85rem;font-weight:600;">
                        GetFVid
                    </a>
                </div>
            </div>
        `;

        showToast("Facebook CORS error — lihat alternatif di bawah.");
    }

    // =========================================================
    // 11. SHARED HELPERS
    // =========================================================
    function prepareFetch() {
        loader.classList.remove("hidden");
        resultSection.classList.add("hidden");
        currentTikTokData = null;
        // Reset badge sebelum fetch baru
        if (badgeContainer) badgeContainer.innerHTML = "";
    }

    function showResult(url, showButtons) {
        saveToHistory(url);
        loader.classList.add("hidden");
        resultSection.classList.remove("hidden");
        downloadOptions.style.display = showButtons ? "block" : "none";
    }

    function handleError(msg) {
        loader.classList.add("hidden");
        showToast(msg);
    }

});
