// Quản lý Popup cài đặt báo thức
window.currentAlarm = null;

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-alarm-panel');
    const floatingMenu = document.getElementById('floating-menu');
    const closeBtn = document.getElementById('close-settings');
    const sidePanel = document.getElementById('side-panel');
    const setAlarmBtn = document.getElementById('set-alarm');
    
    const alarmH = document.getElementById('alarm-h');
    const alarmM = document.getElementById('alarm-m');
    const alarmS = document.getElementById('alarm-s');
    const alarmMsgInput = document.getElementById('alarm-msg');
    const alarmStatus = document.getElementById('alarm-status');

    if (!openBtn || !sidePanel) return;

    // Tự động chuyển ô khi nhập xong
    [alarmH, alarmM, alarmS].forEach((input, index, array) => {
        input.addEventListener('input', () => {
            if (input.value.length >= 2 && index < array.length - 1) {
                array[index + 1].focus();
            }
        });
    });

    openBtn.addEventListener('click', () => {
        sidePanel.classList.add('open');
        if (floatingMenu) floatingMenu.classList.add('hidden');
    });

    closeBtn.addEventListener('click', () => {
        sidePanel.classList.remove('open');
        setTimeout(() => { if (floatingMenu) floatingMenu.classList.remove('hidden'); }, 200);
    });

    setAlarmBtn.addEventListener('click', () => {
        const h = alarmH.value.padStart(2, '0');
        const m = alarmM.value.padStart(2, '0');
        const s = alarmS.value.padStart(2, '0');
        const msg = alarmMsgInput.value || 'Hết giờ rồi!';
        
        if (h && m && s) {
            const time = `${h}:${m}:${s}`;
            
            // Thêm vào danh sách active
            window.activeAlarms.push({ time, msg });
            
            // Sắp xếp lại theo thời gian
            window.activeAlarms.sort((a, b) => a.time.localeCompare(b.time));
            
            // Cập nhật giao diện timeline
            if (window.renderTimeline) window.renderTimeline();

            sidePanel.classList.remove('open');
            setTimeout(() => { if (floatingMenu) floatingMenu.classList.remove('hidden'); }, 200);
            
            if (Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        }
    });
});
