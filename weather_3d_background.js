/**
 * weather_3d_background.js
 * Tạo hiệu ứng chuyển động 3D theo thời tiết hiện tại
 * Sử dụng Canvas API để render các particle effects
 */

(function () {
    'use strict';

    /* ───────────────── CONSTANTS ───────────────── */
    const WEATHER_DATA_KEY = 'weather_cache';
    const CANVAS_ID = 'weather-3d-canvas';

    /* Weather types for 3D effects */
    const WEATHER_TYPES = {
        SUNNY: 'sunny',
        CLOUDY: 'cloudy',
        RAINY: 'rainy',
        SNOWY: 'snowy',
        STORMY: 'stormy',
        FOGGY: 'foggy',
        WINDY: 'windy'
    };

    /* Map WMO codes to weather types */
    const WMO_TO_WEATHER = {
        0: WEATHER_TYPES.SUNNY,
        1: WEATHER_TYPES.SUNNY,
        2: WEATHER_TYPES.CLOUDY,
        3: WEATHER_TYPES.CLOUDY,
        45: WEATHER_TYPES.FOGGY,
        48: WEATHER_TYPES.FOGGY,
        51: WEATHER_TYPES.RAINY,
        53: WEATHER_TYPES.RAINY,
        55: WEATHER_TYPES.RAINY,
        61: WEATHER_TYPES.RAINY,
        63: WEATHER_TYPES.RAINY,
        65: WEATHER_TYPES.RAINY,
        71: WEATHER_TYPES.SNOWY,
        73: WEATHER_TYPES.SNOWY,
        75: WEATHER_TYPES.SNOWY,
        80: WEATHER_TYPES.RAINY,
        81: WEATHER_TYPES.RAINY,
        82: WEATHER_TYPES.RAINY,
        95: WEATHER_TYPES.STORMY,
        96: WEATHER_TYPES.STORMY,
        99: WEATHER_TYPES.STORMY
    };

    /* ───────────────── CLASS: Particle ───────────────── */
    class Particle {
        constructor(canvas, type) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.type = type;
            this.reset();
        }

        reset() {
            switch (this.type) {
                case WEATHER_TYPES.SUNNY:
                    this.x = Math.random() * this.canvas.width;
                    this.y = Math.random() * this.canvas.height;
                    this.size = Math.random() * 2 + 1;
                    this.speedX = (Math.random() - 0.5) * 0.5;
                    this.speedY = (Math.random() - 0.5) * 0.5;
                    this.alpha = Math.random() * 0.5 + 0.3;
                    this.hue = Math.random() * 60 + 40; // Yellow-orange
                    break;

                case WEATHER_TYPES.RAINY:
                    this.x = Math.random() * this.canvas.width;
                    this.y = Math.random() * -this.canvas.height;
                    this.length = Math.random() * 20 + 10;
                    this.speed = Math.random() * 5 + 8;
                    this.width = Math.random() * 1.5 + 0.5;
                    this.alpha = Math.random() * 0.3 + 0.2;
                    break;

                case WEATHER_TYPES.SNOWY:
                    this.x = Math.random() * this.canvas.width;
                    this.y = Math.random() * -this.canvas.height;
                    this.radius = Math.random() * 3 + 1;
                    this.speed = Math.random() * 1 + 0.5;
                    this.sway = Math.random() * 0.02 + 0.01;
                    this.swayOffset = Math.random() * Math.PI * 2;
                    this.alpha = Math.random() * 0.6 + 0.4;
                    break;

                case WEATHER_TYPES.CLOUDY:
                    this.x = Math.random() * this.canvas.width;
                    this.y = Math.random() * this.canvas.height * 0.6;
                    this.radius = Math.random() * 50 + 30;
                    this.speed = Math.random() * 0.3 + 0.1;
                    this.alpha = Math.random() * 0.15 + 0.05;
                    break;

                case WEATHER_TYPES.STORMY:
                    this.x = Math.random() * this.canvas.width;
                    this.y = Math.random() * -this.canvas.height;
                    this.length = Math.random() * 30 + 20;
                    this.speed = Math.random() * 8 + 10;
                    this.width = Math.random() * 2 + 1;
                    this.alpha = Math.random() * 0.4 + 0.2;
                    this.isLightning = Math.random() < 0.02;
                    this.lightningTimer = 0;
                    break;

                case WEATHER_TYPES.FOGGY:
                    this.x = Math.random() * this.canvas.width;
                    this.y = Math.random() * this.canvas.height;
                    this.radius = Math.random() * 100 + 50;
                    this.speed = Math.random() * 0.2 + 0.05;
                    this.alpha = Math.random() * 0.1 + 0.02;
                    break;
            }
        }

        update(time) {
            switch (this.type) {
                case WEATHER_TYPES.SUNNY:
                    this.x += this.speedX;
                    this.y += this.speedY;
                    if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
                    if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;
                    break;

                case WEATHER_TYPES.RAINY:
                case WEATHER_TYPES.STORMY:
                    this.y += this.speed;
                    if (this.y > this.canvas.height) {
                        this.reset();
                    }
                    if (this.type === WEATHER_TYPES.STORMY && this.isLightning) {
                        this.lightningTimer++;
                        if (this.lightningTimer > 5) {
                            this.isLightning = false;
                            this.lightningTimer = 0;
                        }
                    }
                    break;

                case WEATHER_TYPES.SNOWY:
                    this.y += this.speed;
                    this.x += Math.sin(time * this.sway + this.swayOffset) * 0.5;
                    if (this.y > this.canvas.height) {
                        this.reset();
                    }
                    break;

                case WEATHER_TYPES.CLOUDY:
                case WEATHER_TYPES.FOGGY:
                    this.x += this.speed;
                    if (this.x > this.canvas.width + this.radius) {
                        this.x = -this.radius;
                    }
                    break;
            }
        }

        draw() {
            switch (this.type) {
                case WEATHER_TYPES.SUNNY:
                    this.ctx.beginPath();
                    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    this.ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.alpha})`;
                    this.ctx.fill();
                    break;

                case WEATHER_TYPES.RAINY:
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.x, this.y);
                    this.ctx.lineTo(this.x, this.y + this.length);
                    this.ctx.strokeStyle = `rgba(174, 194, 224, ${this.alpha})`;
                    this.ctx.lineWidth = this.width;
                    this.ctx.lineCap = 'round';
                    this.ctx.stroke();
                    break;

                case WEATHER_TYPES.SNOWY:
                    this.ctx.beginPath();
                    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                    this.ctx.fill();
                    break;

                case WEATHER_TYPES.CLOUDY:
                    const gradient = this.ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, this.radius
                    );
                    gradient.addColorStop(0, `rgba(200, 200, 200, ${this.alpha})`);
                    gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case WEATHER_TYPES.STORMY:
                    if (this.isLightning) {
                        this.drawLightning();
                    } else {
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.x, this.y);
                        this.ctx.lineTo(this.x, this.y + this.length);
                        this.ctx.strokeStyle = `rgba(150, 170, 200, ${this.alpha})`;
                        this.ctx.lineWidth = this.width;
                        this.ctx.lineCap = 'round';
                        this.ctx.stroke();
                    }
                    break;

                case WEATHER_TYPES.FOGGY:
                    const fogGradient = this.ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, this.radius
                    );
                    fogGradient.addColorStop(0, `rgba(200, 200, 200, ${this.alpha})`);
                    fogGradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
                    this.ctx.fillStyle = fogGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
        }

        drawLightning() {
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#ffffff';

            let lx = this.x;
            let ly = this.y;

            this.ctx.beginPath();
            this.ctx.moveTo(lx, ly);

            while (ly < this.canvas.height) {
                lx += (Math.random() - 0.5) * 30;
                ly += Math.random() * 20 + 10;
                this.ctx.lineTo(lx, ly);
            }

            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    /* ───────────────── CLASS: WeatherBackground ───────────────── */
    class WeatherBackground {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.particles = [];
            this.currentWeather = null;
            this.animationId = null;
            this.isRunning = false;
            this.lastWeatherType = null;
        }

        init() {
            this.createCanvas();
            this.loadWeatherData();
            this.setupResizeListener();
        }

        createCanvas() {
            // Check if canvas already exists
            this.canvas = document.getElementById(CANVAS_ID);
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.id = CANVAS_ID;
                this.canvas.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    pointer-events: none;
                `;
                document.body.insertBefore(this.canvas, document.body.firstChild);
            }

            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }

        resizeCanvas() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        setupResizeListener() {
            window.addEventListener('resize', () => {
                this.resizeCanvas();
                if (this.currentWeather) {
                    this.initParticles(this.currentWeather);
                }
            });
        }

        loadWeatherData() {
            try {
                const raw = localStorage.getItem(WEATHER_DATA_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data.wmoCode !== undefined) {
                        this.updateWeather(data.wmoCode);
                    }
                }
            } catch (e) {
                console.warn('[Weather3D] Cannot load weather data:', e);
            }
        }

        getWeatherType(wmoCode) {
            return WMO_TO_WEATHER[wmoCode] || WEATHER_TYPES.CLOUDY;
        }

        updateWeather(wmoCode) {
            const newWeatherType = this.getWeatherType(wmoCode);

            if (newWeatherType === this.lastWeatherType) {
                return;
            }

            this.lastWeatherType = newWeatherType;
            this.currentWeather = newWeatherType;

            this.initParticles(newWeatherType);

            if (!this.isRunning) {
                this.startAnimation();
            }
        }

        initParticles(weatherType) {
            this.particles = [];
            let particleCount = 0;

            switch (weatherType) {
                case WEATHER_TYPES.SUNNY:
                    particleCount = 100;
                    break;
                case WEATHER_TYPES.RAINY:
                    particleCount = 300;
                    break;
                case WEATHER_TYPES.SNOWY:
                    particleCount = 200;
                    break;
                case WEATHER_TYPES.CLOUDY:
                    particleCount = 30;
                    break;
                case WEATHER_TYPES.STORMY:
                    particleCount = 400;
                    break;
                case WEATHER_TYPES.FOGGY:
                    particleCount = 40;
                    break;
                default:
                    particleCount = 50;
            }

            for (let i = 0; i < particleCount; i++) {
                const particle = new Particle(this.canvas, weatherType);
                particle.reset();
                this.particles.push(particle);
            }
        }

        startAnimation() {
            this.isRunning = true;
            this.animate(0);
        }

        stopAnimation() {
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }

        animate(time) {
            if (!this.isRunning) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Apply weather-specific background gradient
            this.applyBackgroundGradient(this.currentWeather);

            // Update and draw particles
            this.particles.forEach(particle => {
                particle.update(time);
                particle.draw();
            });

            this.animationId = requestAnimationFrame((t) => this.animate(t));
        }

        applyBackgroundGradient(weatherType) {
            let gradient;

            switch (weatherType) {
                case WEATHER_TYPES.SUNNY:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#1e3c72');
                    gradient.addColorStop(1, '#2a5298');
                    break;

                case WEATHER_TYPES.RAINY:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#203a43');
                    gradient.addColorStop(1, '#2c5364');
                    break;

                case WEATHER_TYPES.SNOWY:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#83a4d4');
                    gradient.addColorStop(1, '#b6fbff');
                    break;

                case WEATHER_TYPES.CLOUDY:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#4b6cb7');
                    gradient.addColorStop(1, '#182848');
                    break;

                case WEATHER_TYPES.STORMY:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#0f0c29');
                    gradient.addColorStop(0.5, '#302b63');
                    gradient.addColorStop(1, '#24243e');
                    break;

                case WEATHER_TYPES.FOGGY:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#606c88');
                    gradient.addColorStop(1, '#3f4c6b');
                    break;

                default:
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    gradient.addColorStop(0, '#000000');
                    gradient.addColorStop(1, '#434343');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Listen for weather updates from popup_weather.script.js
        listenForWeatherUpdates() {
            const observer = new MutationObserver(() => {
                this.loadWeatherData();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Also check periodically
            setInterval(() => {
                this.loadWeatherData();
            }, 60000); // Check every minute
        }
    }

    /* ───────────────── BOOTSTRAP ───────────────── */
    const weatherBG = new WeatherBackground();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            weatherBG.init();
            weatherBG.listenForWeatherUpdates();
        });
    } else {
        weatherBG.init();
        weatherBG.listenForWeatherUpdates();
    }

})();