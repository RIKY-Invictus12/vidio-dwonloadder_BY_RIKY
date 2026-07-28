document.addEventListener("DOMContentLoaded", () => {
    // 1. Intro Animation
    setTimeout(() => {
        const intro = document.getElementById("intro-screen");
        const app = document.getElementById("app-container");
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.classList.add("hidden");
            app.classList.remove("hidden");
        }, 500);
    }, 3000);

    // 2. Background Particles
    const particlesContainer = document.getElementById("particles");
    for (let i = 0; i < 20; i++) {
        let particle = document.createElement("div");
        particle.classList.add("particle");
        particle.style.left = Math.random() * 100 + "vw";
        particle.style.animationDuration = (Math.random() * 10 + 5) + "s";
        particle.style.animationDelay = Math.random() * 5 + "s";
        particlesContainer.appendChild(particle);
    }

    // 3. Theme Toggle
    const themeBtn = document.getElementById("theme-toggle");
    const moonIcon = document.getElementById("moon-icon");
    const sunIcon = document.getElementById("sun-icon");

    if(localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }

    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        moonIcon.classList.toggle("hidden");
        sunIcon.classList.toggle("hidden");
        localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
    });

    // 4. History Management
    let history = JSON.parse(localStorage.getItem('vidHistory')) || [];
    const historyList = document.getElementById("history-list");

    function renderHistory() {
        historyList.innerHTML = "";
        if(history.length === 0) {
            historyList.innerHTML = `<li class="empty-history">Belum ada riwayat.</li>`;
            return;
        }
        history.forEach(link => {
            let li = document.createElement("li");
            let a = document.createElement("a");
            a.href = link;
            a.target = "_blank";
            a.textContent = link.length > 45 ? link.substring(0, 45) + "..." : link;
            li.appendChild(a);
            historyList.appendChild(li);
        });
    }
    renderHistory();

    function saveToHistory(link) {
        if (!history.includes(link)) {
            history.unshift(link);
            if (history.length > 5) history.pop();
            localStorage.setItem('vidHistory', JSON.stringify(history));
            renderHistory();
        }
    }

    // 5. Toast System
    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 3500);
    }

    // 6. UI Elements
    const loader = document.getElementById("loader");
    const resultSection = document.getElementById("result-section");
    const videoPreview = document.getElementById("video-preview");
    const downloadOptions = document.getElementById("download-options");
    
    const btnDlNoWm = document.getElementById("btn-dl-nowm");
    const btnDlMp4 = document.getElementById("btn-dl-mp4");
    const btnDlMp3 = document.getElementById("btn-dl-mp3");

    // --- TIKTOK HANDLER ---
    document.getElementById("btn-tiktok").addEventListener("click", async () => {
        const url = document.getElementById("tiktok-url").value.trim();
        if(!url || !url.includes("tiktok")) {
            return showToast("Masukkan link TikTok yang valid! (cth: vt.tiktok.com/...)");
        }

        prepareFetch();

        try {
            // FIX API TIKTOK: Pakai endpoint www.tikwm.com/api/
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const resData = await response.json();
            
            if(resData.code !== 0) {
                throw new Error("Video TikTok tidak ditemukan atau di-private.");
            }

            const data = resData.data;
            
            // Tampilkan Gambar Cover
            videoPreview.innerHTML = `<img src="${data.cover}" alt="Video Thumbnail">`;
            
            // Masukkan link download
            btnDlNoWm.href = data.play; 
            btnDlMp4.href = data.wmplay || data.play; 
            btnDlMp3.href = data.music;

            showResult(url, true);
        } catch (error) {
            handleError(error.message);
        }
    });

    // --- FACEBOOK HANDLER ---
    document.getElementById("btn-fb").addEventListener("click", async () => {
        const url = document.getElementById("fb-url").value.trim();
        if(!url || (!url.includes("facebook") && !url.includes("fb.watch"))) {
            return showToast("Masukkan link Facebook yang valid!");
        }

        prepareFetch();

        try {
            // FIX CORS FACEBOOK: Gunakan allorigins sebagai proxy agar tidak diblokir Github Pages
            const fbApiUrl = `https://www.facebook.com/plugins/video/oembed.json?url=${encodeURIComponent(url)}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fbApiUrl)}`;
            
            const response = await fetch(proxyUrl);
            if(!response.ok) throw new Error("Gagal mengambil data video FB.");
            
            const data = await response.json();

            if(!data || !data.html) {
                throw new Error("Link FB tidak bisa di-embed / di-private.");
            }

            // Tampilkan frame FB
            videoPreview.innerHTML = data.html;
            
            showResult(url, false); // false = sembunyikan tombol download mp4
        } catch (error) {
            handleError("CORS Error / Video tidak publik. Coba link video FB lain.");
        }
    });

    // Helper functions
    function prepareFetch() {
        loader.classList.remove("hidden");
        resultSection.classList.add("hidden");
    }

    function showResult(url, showButtons) {
        saveToHistory(url);
        loader.classList.add("hidden");
        resultSection.classList.remove("hidden");
        
        // Sembunyikan tombol download (resolusi 1080p, dll) khusus untuk FB, karena FB oembed cuma kasih iFrame Preview
        if(showButtons) {
            downloadOptions.style.display = "block";
        } else {
            downloadOptions.style.display = "none";
            showToast("Facebook preview berhasil! (Download FB direct dari frontend terbatas)");
        }
    }

    function handleError(msg) {
        loader.classList.add("hidden");
        showToast(msg);
    }
});

