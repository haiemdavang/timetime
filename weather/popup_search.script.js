(function () {
    'use strict';

    const MODAL_ID = 'weather-search-modal';
    const INPUT_ID = 'weather-search-input';
    const RESULTS_ID = 'weather-search-results';
    const SPINNER_ID = 'weather-search-spinner';

    let searchTimeout;

    let provinceList = [];

    // Fetch province list from official VN API
    async function fetchProvinces() {
        if (provinceList.length > 0) return provinceList;
        try {
            const res = await fetch('https://provinces.open-api.vn/api/p/');
            provinceList = await res.json();
            return provinceList;
        } catch (err) {
            console.error('Provinces API error:', err);
            return [];
        }
    }

    async function searchLocation(query) {
        if (!query || query.length < 2) return [];
        
        // Use Nominatim for comprehensive search (Wards, Districts, Provinces) in Vietnam
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=vn&accept-language=vi`;
        
        try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const json = await res.json();
            return json;
        } catch (err) {
            console.error('Search error:', err);
            return [];
        }
    }

    function renderResults(results) {
        const container = document.getElementById(RESULTS_ID);
        if (results.length === 0) {
            container.innerHTML = '<div class="search-hint">Không tìm thấy địa điểm nào...</div>';
            return;
        }

        let html = '';
        results.forEach(res => {
            const addr = res.address || {};
            // Extract the most specific name
            const mainName = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.city || res.display_name.split(',')[0];
            
            // Build a clean subtitle (District, Province)
            const parts = [];
            if (addr.district || addr.county) parts.push(addr.district || addr.county);
            if (addr.city || addr.state) parts.push(addr.city || addr.state);
            const subName = parts.length > 0 ? parts.join(', ') : 'Việt Nam';

            html += `
                <div class="search-result-item" data-lat="${res.lat}" data-lon="${res.lon}" data-name="${mainName}">
                    <span class="result-main">${mainName}</span>
                    <span class="result-sub">${subName}</span>
                </div>
            `;
        });
        container.innerHTML = html;

        // Click on a result
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.onclick = () => {
                const lat = item.getAttribute('data-lat');
                const lon = item.getAttribute('data-lon');
                const name = item.getAttribute('data-name');
                
                if (window.selectWeatherLocation) {
                    window.selectWeatherLocation(lat, lon, name);
                }
                
                closeModal();
            };
        });
    }

    function closeModal() {
        const modal = document.getElementById(MODAL_ID);
        if (modal) {
            modal.classList.remove('active');
            const input = document.getElementById(INPUT_ID);
            if (input) input.value = '';
            const results = document.getElementById(RESULTS_ID);
            if (results) results.innerHTML = '<div class="search-hint">Hãy nhập ít nhất 2 ký tự...</div>';
        }
    }

    window.openWeatherSearch = function () {
        const modal = document.getElementById(MODAL_ID);
        if (modal) {
            modal.classList.add('active');
            const input = document.getElementById(INPUT_ID);
            if (input) input.focus();
        }
    };

    // Use event delegation because elements are injected dynamically
    document.addEventListener('input', async (e) => {
        if (e.target.id === INPUT_ID) {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            const resultsContainer = document.getElementById(RESULTS_ID);
            const spinner = document.getElementById(SPINNER_ID);

            if (!query || query.length < 2) {
                if (resultsContainer) resultsContainer.innerHTML = '<div class="search-hint">Hãy nhập ít nhất 2 ký tự...</div>';
                return;
            }

            if (spinner) spinner.classList.remove('hidden');
            
            searchTimeout = setTimeout(async () => {
                const results = await searchLocation(query);
                if (spinner) spinner.classList.add('hidden');
                renderResults(results);
            }, 500);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'weather-search-close' || e.target.id === MODAL_ID) {
            closeModal();
        }
    });

})();
