document.addEventListener('DOMContentLoaded', () => {
    // Tự động load nội dung Setting Modal từ popup_setting.html
    fetch('popup_setting.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initSettingEvents();
        })
        .catch(err => console.error("Could not load setting modal:", err));

    function initSettingEvents() {
        const settingModal = document.getElementById('setting-modal');
        const openSettingBtn = document.getElementById('open-setting-modal');
        const closeSettingBtn = document.getElementById('close-setting-modal');
        const floatingMenu = document.getElementById('floating-menu');

        // UI elements to toggle
        const toggleHistory = document.getElementById('toggle-history');
        const historyContainer = document.querySelector('.history-container');
        const bgDots = document.querySelectorAll('.bg-dot');

        // Preload video presets for seamless playback
        const videoDots = document.querySelectorAll('.bg-video-preset');
        videoDots.forEach(dot => {
            const videoUrl = dot.getAttribute('data-video');
            if (videoUrl && videoUrl.startsWith('http')) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'video';
                link.href = videoUrl;
                link.type = 'video/mp4';
                document.head.appendChild(link);
            }
        });

        if (openSettingBtn && settingModal) {
            openSettingBtn.addEventListener('click', () => {
                settingModal.classList.add('active');
                if (floatingMenu) floatingMenu.classList.add('hidden');
            });
        }

        if (closeSettingBtn && settingModal) {
            closeSettingBtn.addEventListener('click', () => {
                settingModal.classList.remove('active');
                setTimeout(() => { if (floatingMenu) floatingMenu.classList.remove('hidden'); }, 200);
            });
        }

        // Toggle Cat Visibility
        const toggleCat = document.getElementById('toggle-cat');
        const catContainer = document.getElementById('cat-container');
        const savedCat = localStorage.getItem('showCat');
        if (savedCat !== null && toggleCat && catContainer) {
            toggleCat.checked = (savedCat === 'true');
            catContainer.style.display = toggleCat.checked ? 'flex' : 'none';
        }
        if (toggleCat && catContainer) {
            toggleCat.addEventListener('change', (e) => {
                catContainer.style.display = e.target.checked ? 'flex' : 'none';
                localStorage.setItem('showCat', e.target.checked);
            });
        }

        // Toggle Weather Visibility
        const toggleWeather = document.getElementById('toggle-weather');
        const savedWeather = localStorage.getItem('showWeather');
        
        // Initial state
        if (savedWeather !== null && toggleWeather) {
            toggleWeather.checked = (savedWeather === 'true');
            // Apply initial state via body class for easier management
            if (savedWeather === 'false') document.body.classList.add('hide-weather');
        }
        
        if (toggleWeather) {
            toggleWeather.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.remove('hide-weather');
                } else {
                    document.body.classList.add('hide-weather');
                }
                localStorage.setItem('showWeather', e.target.checked);
            });
        }


        if (toggleHistory && historyContainer) {
            toggleHistory.addEventListener('change', (e) => {
                if (e.target.checked) {
                    historyContainer.style.display = 'block';
                } else {
                    historyContainer.style.display = 'none';
                }
                localStorage.setItem('showHistory', e.target.checked);
            });
        }

        // Background selection
        const bgVideo = document.getElementById('bg-video');
        let currentMediaBlobInfo = null; // store URL to revoke

        if (bgDots) {
            bgDots.forEach(dot => {
                dot.addEventListener('click', () => {
                    // remove active class from all
                    bgDots.forEach(d => d.classList.remove('active'));
                    
                    // add active to clicked
                    dot.classList.add('active');
                    
                    const selectedBg = dot.getAttribute('data-bg');
                    const selectedVideo = dot.getAttribute('data-video');

                    if (currentMediaBlobInfo) {
                        URL.revokeObjectURL(currentMediaBlobInfo);
                        currentMediaBlobInfo = null;
                    }

                    if (selectedVideo) {
                        localStorage.setItem('themeType', 'video');
                        localStorage.setItem('themeValue', selectedVideo);
                        document.body.style.backgroundImage = 'none';
                        document.body.style.backgroundColor = '#000';
                        if (bgVideo) {
                            bgVideo.style.display = 'block';
                            bgVideo.src = selectedVideo;
                            bgVideo.play();
                        }
                    } else if (selectedBg) {
                        localStorage.setItem('themeType', 'bg');
                        localStorage.setItem('themeValue', selectedBg);
                        document.body.style.backgroundColor = selectedBg;
                        document.body.style.backgroundImage = 'none'; // Clear image
                        if (bgVideo) {
                            bgVideo.style.display = 'none';
                            bgVideo.pause();
                            bgVideo.removeAttribute('src');
                        }
                    }
                    
                    // Cập nhật vị trí mèo dựa theo theme
                    if (window.myCat) window.myCat.updatePositionMode();
                    
                    // Thêm/bớt thẻ bọc blur glass cho đồng hồ
                    const countdownContainer = document.querySelector('.countdown-container');
                    if (countdownContainer) {
                        if (selectedBg === '#000000') {
                            countdownContainer.classList.remove('glass-mode');
                        } else {
                            countdownContainer.classList.add('glass-mode');
                        }
                    }
                });
            });

            // Restore saved theme on load
            const savedThemeType = localStorage.getItem('themeType');
            const savedThemeValue = localStorage.getItem('themeValue');
            if (savedThemeType && savedThemeValue && bgDots) {
                const targetDot = Array.from(bgDots).find(dot => {
                    if (savedThemeType === 'video') return dot.getAttribute('data-video') === savedThemeValue;
                    return dot.getAttribute('data-bg') === savedThemeValue;
                });
                if (targetDot) {
                    targetDot.click();
                }
            }
        }

        // Handle Custom Uploads
        const fileInput = document.getElementById('bg-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Cleanup previous
                if (currentMediaBlobInfo) {
                    URL.revokeObjectURL(currentMediaBlobInfo);
                }

                const objUrl = URL.createObjectURL(file);
                currentMediaBlobInfo = objUrl;

                bgDots.forEach(d => d.classList.remove('active'));

                // Apply blur to clock
                const countdownContainer = document.querySelector('.countdown-container');
                if (countdownContainer) countdownContainer.classList.add('glass-mode');

                if (file.type.startsWith('video/')) {
                    document.body.style.backgroundImage = 'none';
                    document.body.style.backgroundColor = '#000';
                    if (bgVideo) {
                        bgVideo.style.display = 'block';
                        bgVideo.src = objUrl;
                        bgVideo.play();
                    }
                } else if (file.type.startsWith('image/')) {
                    if (bgVideo) {
                        bgVideo.style.display = 'none';
                        bgVideo.pause();
                        bgVideo.removeAttribute('src');
                    }
                    document.body.style.backgroundImage = `url(${objUrl})`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundColor = '#000';
                }
                
                // Cập nhật vị trí mèo dựa theo theme mới
                if (window.myCat) window.myCat.updatePositionMode();
                
                // Clear input
                e.target.value = '';
            });
        }
    }
});
