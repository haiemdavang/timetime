(function () {
    'use strict';

    const MODAL_ID = 'weather-detail-modal';
    const SCROLL_ID = 'weather-forecast-scroll';

    // Map WMO weather code → icon file + mô tả tiếng Việt
    const DAY_MAP = {
        0: { icon: 'icons8-sun-100.png', desc: 'Trời quang' },
        1: { icon: 'icons8-sun-100.png', desc: 'Chủ yếu quang' },
        2: { icon: 'icons8-partly-cloudy-day-100.png', desc: 'Mây rải rác' },
        3: { icon: 'icons8-clouds-100.png', desc: 'Nhiều mây' },
        45: { icon: 'icons8-smoke-100.png', desc: 'Sương mù' },
        48: { icon: 'icons8-smoke-100.png', desc: 'Sương muối' },
        51: { icon: 'icons8-cloud-100.png', desc: 'Mưa phùn nhẹ' },
        53: { icon: 'icons8-cloud-100.png', desc: 'Mưa phùn vừa' },
        55: { icon: 'icons8-cloud-100.png', desc: 'Mưa phùn dày' },
        61: { icon: 'icons8-rain-cloud-100.png', desc: 'Mưa nhẹ' },
        63: { icon: 'icons8-rain-cloud-100.png', desc: 'Mưa vừa' },
        65: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa to' },
        71: { icon: 'icons8-clouds-100-2.png', desc: 'Tuyết nhẹ' },
        73: { icon: 'icons8-clouds-100-2.png', desc: 'Tuyết vừa' },
        75: { icon: 'icons8-clouds-100-2.png', desc: 'Tuyết dày' },
        80: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa rào nhẹ' },
        81: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa rào vừa' },
        82: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa rào to' },
        95: { icon: 'icons8-storm-100.png', desc: 'Giông' },
        96: { icon: 'icons8-cloud-lightning-100.png', desc: 'Giông nhẹ' },
        99: { icon: 'icons8-stormy-weather-100.png', desc: 'Giông nặng' },
    };

    const NIGHT_MAP = {
        0: { icon: 'icons8-night-100.png', desc: 'Trời quang' },
        1: { icon: 'icons8-night-100.png', desc: 'Chủ yếu quang' },
        2: { icon: 'icons8-night-wind-100.png', desc: 'Mây rải rác' },
        3: { icon: 'icons8-clouds-100.png', desc: 'Nhiều mây' },
        45: { icon: 'icons8-smoke-100.png', desc: 'Sương mù' },
        48: { icon: 'icons8-smoke-100.png', desc: 'Sương muối' },
        51: { icon: 'icons8-cloud-100.png', desc: 'Mưa phùn nhẹ' },
        53: { icon: 'icons8-cloud-100.png', desc: 'Mưa phùn vừa' },
        55: { icon: 'icons8-cloud-100.png', desc: 'Mưa phùn dày' },
        61: { icon: 'icons8-rain-cloud-100.png', desc: 'Mưa nhẹ' },
        63: { icon: 'icons8-rain-cloud-100.png', desc: 'Mưa vừa' },
        65: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa to' },
        71: { icon: 'icons8-clouds-100-2.png', desc: 'Tuyết nhẹ' },
        73: { icon: 'icons8-clouds-100-2.png', desc: 'Tuyết vừa' },
        75: { icon: 'icons8-clouds-100-2.png', desc: 'Tuyết dày' },
        80: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa rào nhẹ' },
        81: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa rào vừa' },
        82: { icon: 'icons8-heavy-rain-100.png', desc: 'Mưa rào to' },
        95: { icon: 'icons8-storm-100.png', desc: 'Giông' },
        96: { icon: 'icons8-cloud-lightning-100.png', desc: 'Giông nhẹ' },
        99: { icon: 'icons8-stormy-weather-100.png', desc: 'Giông nặng' },
    };

    function iconPath(filename, isNight) {
        const subDir = isNight ? 'night' : 'sun';
        return `public/weather/${subDir}/${filename}`;
    }

    const DETAIL_CACHE_KEY = 'weather_detail_cache';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    function getCache() {
        try {
            const raw = localStorage.getItem(DETAIL_CACHE_KEY);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (Date.now() - obj.timestamp > CACHE_DURATION) return null;
            return obj.data;
        } catch (_) { return null; }
    }

    function setCache(data) {
        try {
            localStorage.setItem(DETAIL_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (_) {}
    }

    function renderForecastHTML(hourly) {
        let html = '';
        const now = new Date();
        const currentHour = now.getHours();
        
        // Find the index of the current hour in the hourly.time array
        // hourly.time format is "2024-04-28T00:00"
        let startIndex = hourly.time.findIndex(t => {
            const date = new Date(t);
            return date.getHours() === currentHour && date.getDate() === now.getDate();
        });

        if (startIndex === -1) startIndex = 0;

        // Show next 12 hours from now
        for (let i = startIndex; i < startIndex + 12; i++) {
            if (i >= hourly.time.length) break;

            const time = new Date(hourly.time[i]);
            const hour = time.getHours();
            const isNight = hour >= 19 || hour < 6;
            const map = isNight ? NIGHT_MAP : DAY_MAP;
            
            const displayTime = i === startIndex ? 'Bây giờ' : `${String(hour).padStart(2, '0')}:00`;
            const temp = Math.round(hourly.temperature_2m[i]);
            const code = hourly.weather_code[i];
            const entry = map[code] || { icon: 'icons8-cloud-100.png', desc: 'Mây' };

            html += `
                <div class="forecast-item">
                    <span class="forecast-time">${displayTime}</span>
                    <div class="forecast-main">
                        <img src="${iconPath(entry.icon, isNight)}" class="forecast-icon">
                        <span class="forecast-desc">${entry.desc}</span>
                    </div>
                    <span class="forecast-temp">${temp}°</span>
                </div>
            `;
        }
        return html;
    }

    async function fetchForecast(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=2`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch forecast');
        return await res.json();
    }

    window.prefetchWeatherDetail = async function (lat, lon) {
        try {
            const data = await fetchForecast(lat, lon);
            setCache(data);
            return data;
        } catch (err) {
            console.error('Prefetch error:', err);
        }
    };

    window.showWeatherDetail = async function (lat, lon, locationName) {
        let modal = document.getElementById(MODAL_ID);
        if (!modal) return;

        const scrollEl = document.getElementById(SCROLL_ID);
        const locEl = document.getElementById('weather-detail-location');
        
        locEl.textContent = locationName;
        modal.classList.add('active');

        // 1. Check Cache
        const cachedData = getCache();
        if (cachedData) {
            scrollEl.innerHTML = renderForecastHTML(cachedData.hourly);
        } else {
            scrollEl.innerHTML = '<div style="text-align:center; padding: 20px; opacity:0.5;">Đang tải dự báo...</div>';
        }

        // 2. Background Fetch & Update
        try {
            const data = await fetchForecast(lat, lon);
            setCache(data);
            
            // Re-render with new data
            scrollEl.innerHTML = renderForecastHTML(data.hourly);
        } catch (err) {
            if (!cachedData) {
                scrollEl.innerHTML = `<div style="color: #ff6b6b; text-align:center; padding: 20px;">${err.message}</div>`;
            }
        }
    };

    // Close button logic
    document.addEventListener('click', (e) => {
        if (e.target.id === 'weather-detail-close' || e.target.id === MODAL_ID) {
            document.getElementById(MODAL_ID).classList.remove('active');
        }
    });

})();
