/**
 * popup_weather.script.js
 * Weather popup — góc trái trên
 * - Lấy vị trí người dùng (Geolocation API)
 * - Gọi Open-Meteo (miễn phí, không cần API key)
 * - Geocoding ngược bằng nominatim để lấy tên địa điểm
 * - Cache kết quả vào localStorage 30 phút
 * - Tự động tạo DOM và inject vào index.html
 */

(function () {
    'use strict';

    /* ───────────────── CONSTANTS ───────────────── */
    const CACHE_KEY      = 'weather_cache';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 phút (ms)
    const POPUP_ID       = 'weather-popup';

    /* Map WMO weather code → icon file + mô tả tiếng Việt */
    const DAY_MAP = {
        0:  { icon: 'icons8-sun-100.png',            desc: 'Trời quang' },
        1:  { icon: 'icons8-sun-100.png',            desc: 'Chủ yếu quang' },
        2:  { icon: 'icons8-partly-cloudy-day-100.png', desc: 'Mây rải rác' },
        3:  { icon: 'icons8-clouds-100.png',         desc: 'Nhiều mây' },
        45: { icon: 'icons8-smoke-100.png',          desc: 'Sương mù' },
        48: { icon: 'icons8-smoke-100.png',          desc: 'Sương muối' },
        51: { icon: 'icons8-cloud-100.png',          desc: 'Mưa phùn nhẹ' },
        53: { icon: 'icons8-cloud-100.png',          desc: 'Mưa phùn vừa' },
        55: { icon: 'icons8-cloud-100.png',          desc: 'Mưa phùn dày' },
        61: { icon: 'icons8-rain-cloud-100.png',     desc: 'Mưa nhẹ' },
        63: { icon: 'icons8-rain-cloud-100.png',     desc: 'Mưa vừa' },
        65: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa to' },
        71: { icon: 'icons8-clouds-100-2.png',       desc: 'Tuyết nhẹ' },
        73: { icon: 'icons8-clouds-100-2.png',       desc: 'Tuyết vừa' },
        75: { icon: 'icons8-clouds-100-2.png',       desc: 'Tuyết dày' },
        80: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa rào nhẹ' },
        81: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa rào vừa' },
        82: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa rào to' },
        95: { icon: 'icons8-storm-100.png',          desc: 'Giông' },
        96: { icon: 'icons8-cloud-lightning-100.png',desc: 'Giông nhẹ' },
        99: { icon: 'icons8-stormy-weather-100.png', desc: 'Giông nặng' },
    };

    const NIGHT_MAP = {
        0:  { icon: 'icons8-night-100.png',          desc: 'Trời quang' },
        1:  { icon: 'icons8-night-100.png',          desc: 'Chủ yếu quang' },
        2:  { icon: 'icons8-night-wind-100.png',     desc: 'Mây rải rác' },
        3:  { icon: 'icons8-clouds-100.png',         desc: 'Nhiều mây' },
        45: { icon: 'icons8-smoke-100.png',          desc: 'Sương mù' },
        48: { icon: 'icons8-smoke-100.png',          desc: 'Sương muối' },
        51: { icon: 'icons8-cloud-100.png',          desc: 'Mưa phùn nhẹ' },
        53: { icon: 'icons8-cloud-100.png',          desc: 'Mưa phùn vừa' },
        55: { icon: 'icons8-cloud-100.png',          desc: 'Mưa phùn dày' },
        61: { icon: 'icons8-rain-cloud-100.png',     desc: 'Mưa nhẹ' },
        63: { icon: 'icons8-rain-cloud-100.png',     desc: 'Mưa vừa' },
        65: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa to' },
        71: { icon: 'icons8-clouds-100-2.png',       desc: 'Tuyết nhẹ' },
        73: { icon: 'icons8-clouds-100-2.png',       desc: 'Tuyết vừa' },
        75: { icon: 'icons8-clouds-100-2.png',       desc: 'Tuyết dày' },
        80: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa rào nhẹ' },
        81: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa rào vừa' },
        82: { icon: 'icons8-heavy-rain-100.png',     desc: 'Mưa rào to' },
        95: { icon: 'icons8-storm-100.png',          desc: 'Giông' },
        96: { icon: 'icons8-cloud-lightning-100.png',desc: 'Giông nhẹ' },
        99: { icon: 'icons8-stormy-weather-100.png', desc: 'Giông nặng' },
    };

    /* ───────────────── UTILITY ───────────────── */

    /**
     * Trả về đường dẫn icon tương đối từ index.html
     */
    function iconPath(filename, isNight) {
        const subDir = isNight ? 'night' : 'sun';
        return `public/weather/${subDir}/${filename}`;
    }

    /**
     * Chọn icon theo WMO code + giờ hiện tại
     */
    function resolveIcon(code, hour) {
        const isNight = hour >= 19 || hour < 6;
        const map     = isNight ? NIGHT_MAP : DAY_MAP;
        const entry   = map[code] || { icon: 'icons8-cloud-100.png', desc: 'Không xác định' };
        
        return {
            icon: entry.icon,
            desc: entry.desc,
            isNight: isNight
        };
    }

    /**
     * Format thời gian cập nhật
     */
    function formatUpdated(ts) {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `Cập nhật ${hh}:${mm}`;
    }

    /**
     * Đọc cache từ localStorage
     */
    function readCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (Date.now() - obj.timestamp > CACHE_DURATION) return null;
            return obj;
        } catch (_) {
            return null;
        }
    }

    /**
     * Ghi cache vào localStorage
     */
    function writeCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
        } catch (_) { /* quota exceeded – bỏ qua */ }
    }

    /* ───────────────── DOM BUILDER ───────────────── */

    /**
     * Tạo và trả về DOM của weather popup
     */
    function createPopupDOM() {
        const el = document.createElement('div');
        el.className = 'weather-popup';
        el.id = POPUP_ID;
        document.body.appendChild(el);
        return el;
    }

    /**
     * Render trạng thái loading
     */
    function renderLoading(popup) {
        popup.innerHTML = `
            <div class="weather-loading">
                <div class="weather-spinner"></div>
                <span>Đang lấy thời tiết…</span>
            </div>
        `;
        popup.classList.add('loaded');
    }

    /**
     * Render lỗi + nút retry
     */
    function renderError(popup, message) {
        popup.innerHTML = `
            <div class="weather-error">
                <span>⚠️ ${message}</span>
                <button class="weather-retry-btn" id="weather-retry-btn">Thử lại</button>
            </div>
        `;
        popup.classList.add('loaded');
        document.getElementById('weather-retry-btn')
            .addEventListener('click', () => init(true));
    }

    /**
     * Render thông tin thời tiết đầy đủ
     */
    function renderWeather(popup, data) {
        const { temp, wmoCode, location } = data;
        const now     = new Date();
        const hour    = now.getHours();
        const timeStr = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const { icon, desc, isNight } = resolveIcon(wmoCode, hour);

        popup.innerHTML = `
            <div class="weather-left">
                <img class="weather-icon" src="${iconPath(icon, isNight)}" alt="${desc}">
                <span class="weather-temp">${Math.round(temp)}°</span>
            </div>
            <div class="weather-right">
                <span class="weather-location" id="weather-location-name">${location}</span>
                <span class="weather-time">${timeStr}</span>
            </div>
        `;

        // Click on location name to search
        const locNameEl = popup.querySelector('#weather-location-name');
        if (locNameEl) {
            locNameEl.onclick = (e) => {
                e.stopPropagation(); // Don't open detail modal
                if (window.openWeatherSearch) window.openWeatherSearch();
            };
        }

        // Click to show detail
        popup.onclick = () => {
            if (window.showWeatherDetail) {
                window.showWeatherDetail(data.lat, data.lon, data.location);
            }
        };

        // Prefetch detail data for next click
        if (window.prefetchWeatherDetail) {
            window.prefetchWeatherDetail(data.lat, data.lon);
        }

        popup.classList.add('loaded');
    }

    /* ───────────────── API CALLS ───────────────── */

    /**
     * Lấy tọa độ người dùng (Promise)
     */
    function getCoords() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Trình duyệt không hỗ trợ định vị'));
                return;
            }

            // Ưu tiên dùng tọa độ đã lưu nếu cache còn hợp lệ
            const cache = readCache();
            if (cache && cache.lat !== undefined) {
                resolve({ lat: cache.lat, lon: cache.lon });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                err => reject(new Error('Không thể lấy vị trí. Hãy cho phép truy cập.')),
                { timeout: 8000, maximumAge: 5 * 60 * 1000 }
            );
        });
    }

    /**
     * Gọi Open-Meteo (không cần API key)
     */
    async function fetchWeather(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
                    `&wind_speed_unit=kmh&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Không lấy được dữ liệu thời tiết');

        const json = await res.json();
        const c    = json.current;
        return {
            temp:       c.temperature_2m,
            feelsLike:  c.apparent_temperature,
            humidity:   c.relative_humidity_2m,
            windSpeed:  c.wind_speed_10m,
            wmoCode:    c.weather_code,
        };
    }

    /**
     * Geocoding ngược bằng Nominatim để lấy tên địa điểm
     */
    async function fetchLocation(lat, lon) {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=vi`;
        try {
            const res  = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
            const json = await res.json();
            // Ưu tiên: city/town/village/county/state
            const addr = json.address || {};
            return (
                addr.city        ||
                addr.town        ||
                addr.village     ||
                addr.county      ||
                addr.state       ||
                json.display_name.split(',')[0] ||
                'Vị trí của bạn'
            );
        } catch (_) {
            return 'Vị trí của bạn';
        }
    }

    /* ───────────────── MAIN INIT ───────────────── */

    /**
     * Chọn địa điểm mới từ popup search
     */
    window.selectWeatherLocation = function (lat, lon, name) {
        const data = { lat: parseFloat(lat), lon: parseFloat(lon), location: name };
        // We need to fetch weather for these new coords
        init(true, data);
    };

    async function init(forceRefresh = false, manualData = null) {
        let popup = document.getElementById(POPUP_ID);
        if (!popup) popup = createPopupDOM();

        // Inject detail modal if not present
        if (!document.getElementById('weather-detail-modal')) {
            const detailRes = await fetch('weather/popup_detail.html');
            const detailHtml = await detailRes.text();
            document.body.insertAdjacentHTML('beforeend', detailHtml);
        }

        // Inject search modal if not present
        if (!document.getElementById('weather-search-modal')) {
            const searchRes = await fetch('weather/popup_search.html');
            const searchHtml = await searchRes.text();
            document.body.insertAdjacentHTML('beforeend', searchHtml);
        }

        /* Xem cache trước */
        if (!forceRefresh) {
            const cache = readCache();
            if (cache && cache.temp !== undefined) {
                renderWeather(popup, cache);
                return;
            }
        }

        renderLoading(popup);

        try {
            let lat, lon, location;

            if (manualData) {
                lat = manualData.lat;
                lon = manualData.lon;
                location = manualData.location;
            } else {
                const coords = await getCoords();
                lat = coords.lat;
                lon = coords.lon;
                location = await fetchLocation(lat, lon);
            }

            /* Fetch thời tiết */
            const weather = await fetchWeather(lat, lon);

            const data = { ...weather, location, lat, lon, timestamp: Date.now() };
            writeCache(data);
            renderWeather(popup, data);

        } catch (err) {
            console.warn('[Weather]', err.message);
            renderError(popup, err.message);
        }
    }

    /* ───────────────── BOOTSTRAP ───────────────── */

    /* Khởi chạy ngay khi DOM sẵn sàng */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }

    /* Tự refresh mỗi 30 phút */
    setInterval(() => init(true), CACHE_DURATION);

})();
