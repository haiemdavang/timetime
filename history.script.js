// Quản lý dòng thời gian báo thức (1 cũ + 2 mới)
window.pastAlarm = null;
window.activeAlarms = []; // Danh sách các báo thức đang đợi

document.addEventListener('DOMContentLoaded', () => {
    window.renderTimeline();
});

window.renderTimeline = function() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const displayList = [];
    
    // 1. Lấy alarm vừa reo xong (nếu có)
    if (window.pastAlarm) {
        displayList.push({ ...window.pastAlarm, status: 'past' });
    }
    
    // 2. Lấy tối đa 2 alarm sắp tới
    window.activeAlarms.slice(0, 2).forEach(alarm => {
        displayList.push({ ...alarm, status: 'upcoming' });
    });

    if (displayList.length === 0) {
        historyList.innerHTML = '<div style="opacity: 0.2; text-align: center; font-size: 0.8rem; width: 100%; margin-top: 20px;">No alarms scheduled</div>';
        return;
    }

    historyList.innerHTML = '';
    displayList.forEach((alarm, index) => {
        const item = document.createElement('div');
        item.className = `history-item ${alarm.status}`;
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="status-dot"></span>
                <span class="history-time">${alarm.time}</span>
            </div>
            <span class="history-msg">${alarm.msg}</span>
            <button class="delete-history" onclick="removeAlarm(${index}, '${alarm.status}')">×</button>
        `;
        historyList.appendChild(item);
    });
};

window.removeAlarm = function(index, status) {
    if (status === 'past') {
        window.pastAlarm = null;
    } else {
        // Tìm đúng index trong mảng active
        const actualIndex = window.activeAlarms.indexOf(window.activeAlarms.slice(0, 2)[status === 'past' ? index - 1 : index]);
        window.activeAlarms.splice(actualIndex, 1);
    }
    window.renderTimeline();
};
