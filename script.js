document.addEventListener("DOMContentLoaded", () => {
    // 1. Intro Animation Logic
    setTimeout(() => {
        const intro = document.getElementById("intro-screen");
        const app = document.getElementById("app-container");
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.classList.add("hidden");
            app.classList.remove("hidden");
        }, 500);
    }, 3000); // 3 detik

    // 2. Generate Particles
    const particlesContainer = document.getElementById("particles");
    for (let i = 0; i < 20; i++) {
        let particle = document.createElement("div");
        particle.classList.add("particle");
        particle.style.left = Math.random() * 100 + "vw";
        particle.style.animationDuration = (Math.random() * 10 + 5) + "s";
        particle.style.animationDelay = Math.random() * 5 + "s";
        particlesContainer.appendChild(particle);
    }

    // 3. Dark/Light Mode Toggle
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
        
        if (document.body.classList.contains("light-mode")) {
            localStorage.setItem("theme", "light");
        } else {
            localStorage.setItem("theme", "dark");
        }
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
            a.textContent = link.length > 50 ? link.substring(0, 50) + "..." : link;
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

    // 5. Toast Notification
    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 3000);
    }

    // 6. Fetching API Logic
    const btnSearch = document.getElementById("btn-search");
    const inputUrl = document.getElementById("video-url");
    const loader = document.getElementById("loader");
    const resultSection = document.getElementById("result-section");
    const videoPreview = document.getElementById("video-preview");

    // Tombol Download
    const btnDlNoWm = document.getElementById("btn-dl-nowm");
    const btnDlMp4 = document.getElementById("btn-dl-mp4");
    const btnDlMp3 = document.getElementById("btn-dl-mp3");

    btnSearch.addEventListener("click", async () => {
        const url = inputUrl.value.trim();
        if(!url) {
            showToast("Harap masukkan link video!");
            return;
        }

        const isTikTok = url.includes("tiktok.com");
        const isFacebook = url.includes("facebook.com") || url.includes("fb.watch");

        if(!isTikTok && !isFacebook) {
            showToast("Error: Link tidak valid! Hanya mendukung TikTok & Facebook.");
            return;
        }

        // Show loading, hide previous result
        loader.classList.remove("hidden");
        resultSection.classList.add("hidden");

        try {
            if (isTikTok) {
                // Fetch TikTok
                const response = await fetch(`https://api.tikwm.com/video/?url=${url}`);
                const resData = await response.json();
                
                if(resData.code !== 0) {
                    throw new Error("Gagal mengambil data video TikTok.");
                }

                const data = resData.data;
                videoPreview.innerHTML = `<img src="${data.cover}" alt="Video Thumbnail">`;
                
                btnDlNoWm.href = data.play; // Tanpa WM biasanya di data.play/hdplay
                btnDlMp4.href = data.wmplay || data.play; 
                btnDlMp3.href = data.music;
                
            } else if (isFacebook) {
                // Fetch Facebook via oEmbed API
                const response = await fetch(`https://www.facebook.com/plugins/video/oembed.json?url=${encodeURIComponent(url)}`);
                const data = await response.json();

                if(!data || !data.html) {
                    throw new Error("Gagal mengambil data video Facebook.");
                }

                // Render oEmbed HTML string
                videoPreview.innerHTML = data.html;
                
                // oEmbed Facebook tidak menyediakan link MP4/MP3 mentah.
                // Tombol di-set untuk memuat kembali URL aslinya.
                btnDlNoWm.href = url;
                btnDlMp4.href = url;
                btnDlMp3.href = url;
                btnDlNoWm.onclick = () => alert("Facebook direct link membatasi unduhan langsung dari oEmbed. Diarahkan ke video...");
            }

            // Sukses
            saveToHistory(url);
            loader.classList.add("hidden");
            resultSection.classList.remove("hidden");

        } catch (error) {
            loader.classList.add("hidden");
            showToast(error.message);
        }
    });
});
