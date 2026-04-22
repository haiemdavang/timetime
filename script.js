document.addEventListener('DOMContentLoaded', () => {
    const ids = ['hour-1', 'hour-2', 'min-1', 'min-2', 'sec-1', 'sec-2'];
    const strips = {};

    const alarmNotice = document.getElementById('alarm-notice');
    const noticeMsg = document.getElementById('notice-msg');
    const dismissBtn = document.getElementById('dismiss-alarm');

    // Khởi tạo các dải số (0-9) cho mỗi vị trí
    ids.forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        const strip = container.querySelector('.digit-strip');

        for (let i = 0; i <= 9; i++) {
            const div = document.createElement('div');
            div.className = 'digit';
            div.textContent = i;
            strip.appendChild(div);
        }
        strips[id] = strip;
    });

    const alarmAudio = document.getElementById('alarm-audio');

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            alarmNotice.classList.remove('active');
            if (alarmAudio) {
                alarmAudio.pause();
                alarmAudio.currentTime = 0;
            }
        });
    }

    const testBtn = document.getElementById('test-notice');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            triggerAlarm({ msg: "Đây là thông báo kiểm tra giao diện!" });
        });
    }

    const funnyMessages = [
        "Sếp đi rồi, xách mông về thôi!",
        "Công ty không nuôi bạn đêm nay đâu, về nhà đi!",
        "KPI hôm nay thế là đủ rồi, đi nhậu thôi!",
        "Máy tính mệt rồi, nó muốn đi ngủ, bạn cũng thế!",
        "17h rồi, thế giới bên ngoài đang chờ bạn đó!",
        "Dừng tay lại! Giờ này mà còn làm là có lỗi với bản thân!",
        "Cẩn thận, ở lại muộn là bị bảo vệ nhốt đấy!",
        "Về thôi, nồi cơm điện đang đợi bạn ở nhà!"
    ];

    function checkAlarm(h, m, s) {
        const timeNow = `${h}:${m}:${s}`;

        // 1. Kiểm tra báo thức người dùng đặt
        const alarmIndex = window.activeAlarms.findIndex(a => a.time === timeNow);
        if (alarmIndex !== -1) {
            triggerAlarm(window.activeAlarms[alarmIndex]);
            window.activeAlarms.splice(alarmIndex, 1);
            if (window.renderTimeline) window.renderTimeline();
            return;
        }

        // 2. Kiểm tra báo thức mặc định 17h (Nghỉ làm)
        if (timeNow === "17:00:00") {
            const day = new Date().getDay();
            if (day >= 1 && day <= 5) { // Thứ 2 đến Thứ 6
                const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
                triggerAlarm({ time: "17:00:00", msg: randomMsg });
            }
        }
    }

    let toastTimer = null;

    function triggerAlarm(alarm) {
        // Hiển thị UI thông báo
        if (noticeMsg) noticeMsg.textContent = alarm.msg;
        if (alarmNotice) {
            alarmNotice.classList.add('active');

            if (alarmAudio) {
                alarmAudio.currentTime = 0;
                alarmAudio.play().catch(e => console.log('Audio autoplay prevented by browser'));
            }

            // Tự động ẩn sau 8 giây
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                alarmNotice.classList.remove('active');
                if (alarmAudio) {
                    alarmAudio.pause();
                    alarmAudio.currentTime = 0;
                }
            }, 8000);
        }

        // Cập nhật Timeline
        window.pastAlarm = { ...alarm };

        // Thông báo hệ thống
        if (!document.hasFocus() && Notification.permission === 'granted') {
            new Notification('Báo thức!', { body: alarm.msg });
        }
    }

    function updateDigit(id, value) {
        const strip = strips[id];
        if (!strip) return;
        const digitHeight = strip.children[0].offsetHeight;
        const offset = -(parseInt(value) * digitHeight);
        strip.style.transform = `translateY(${offset}px)`;
    }

    function updateTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        updateDigit('hour-1', h[0]);
        updateDigit('hour-2', h[1]);
        updateDigit('min-1', m[0]);
        updateDigit('min-2', m[1]);
        updateDigit('sec-1', s[0]);
        updateDigit('sec-2', s[1]);

        // Kiểm tra báo thức mỗi giây
        checkAlarm(h, m, s);
    }

    // Khởi động
    updateTime();
    setInterval(updateTime, 1000);
    // Chặn copy và chuột phải
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Drag and Elastic Snap logic for countdown container
    const countdownContainer = document.querySelector('.countdown-container');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;

    if (countdownContainer) {
        let lastDragDist = 0;

        countdownContainer.addEventListener('mousedown', (e) => {
            if (!countdownContainer.classList.contains('glass-mode')) return;
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            lastDragDist = 0;
            
            countdownContainer.style.transition = 'none';
            countdownContainer.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            countdownContainer.style.transform = `translate(${translateX}px, ${translateY}px)`;
            
            // Calculate current distance from 0,0
            lastDragDist = Math.sqrt(translateX * translateX + translateY * translateY);
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            
            // Cat reacts to the maximum drag distance achieved
            if (window.myCat) {
                window.myCat.reactToDrag(lastDragDist);
            }

            countdownContainer.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            countdownContainer.style.cursor = 'grab';
            
            translateX = 0;
            translateY = 0;
            countdownContainer.style.transform = `translate(0px, 0px)`;
            
            setTimeout(() => {
                if (!isDragging) countdownContainer.style.transition = 'all 0.5s ease';
            }, 600);
        });

        countdownContainer.addEventListener('mouseenter', () => {
            if (countdownContainer.classList.contains('glass-mode') && !isDragging) {
                countdownContainer.style.cursor = 'grab';
            }
        });

        countdownContainer.addEventListener('mouseleave', () => {
            if (!isDragging) countdownContainer.style.cursor = 'default';
        });
    }

    window.addEventListener('resize', updateTime);
});
