/**
 * Cat Animation Script
 * - 2 khu vực: 'bottom' (đáy màn hình) và 'top' (trên .countdown-container)
 * - Mèo có thể chạy/nhún/đứng/ngủ ở cả hai khu vực
 * - Tự chọn khu vực ngẫu nhiên mỗi lần đổi hành động
 * - Click để đánh thức + hiện chat bubble
 */

const CAT_CONFIG = {
    frameSize: 32,
    scale: 3,
    speed: 2,
    actions: {
        bounce: { offset: 0, frames: 8, fps: 10 },
        run:    { offset: 1, frames: 4, fps: 12 },
        stand:  { offset: 2, frames: 2, fps: 4  },
        lie:    { offset: 3, frames: 2, fps: 2  }
    }
};

const CAT_MESSAGES = {
    happy: [
        "Meow! <3", "Purrr...", "Hi human!", "Xoa đầu trẫm đi!", "Hehe vui quá!", "Cưng xỉu!",
        "Thế giới này thật tươi đẹp!", "Lại đây chơi với trẫm!", "Yêu Sen nhất trần đời! (sau pate)"
    ],
    angry: [
        "Đừng chạm vào trẫm!", "Gừừừ...", "Đang ngủ mà!", "Cút ra!", "Muốn ăn đấm không?", "Hứ!", "Phiền quá!",
        "Móng vuốt của trẫm đã sẵn sàng!", "Đừng để trẫm phải nổi giận!", "Sen hôm nay gan nhỉ?"
    ],
    lazy: [
        "Lười quá...", "Ngủ thêm 5 phút nữa thôi...", "Đời là bể khổ, ngủ là bể bơi.",
        "Đừng làm phiền giấc mộng pate của trẫm.", "Trẫm không lười, trẫm chỉ đang tiết kiệm năng lượng.",
        "Gì? Dậy á? Không đời nào."
    ],
    sarcastic: [
        "Ồ, bạn lại nhấn vào tôi à? Thật sáng tạo.", "Thời gian vẫn trôi, và bạn vẫn ngồi đây.",
        "Lại nhìn đồng hồ à? Nó có chạy nhanh hơn đâu.", "Sen định làm gì đó hữu ích không?",
        "Trẫm đang nhìn bạn... và trẫm không ấn tượng lắm."
    ],
    philosophical: [
        "Thời gian là gì nếu không có pate?", "Chúng ta là ai trong vũ trụ bao la này?",
        "Tồn tại hay không tồn tại, đó mới là vấn đề.", "Mỗi giây trôi qua là một miếng cá biến mất.",
        "Đồng hồ quay vòng, còn trẫm thì quay... ngủ."
    ],
    worried: [
        "Hết giờ chưa? Lo quá!", "Sen ơi, hình như có gì đó sai sai...",
        "Bạn có quên gì không? Ví dụ như cho tôi ăn?", "Nhìn cái đồng hồ đó làm tôi chóng mặt quá.",
        "Tiếng tích tắc đang đuổi theo trẫm!"
    ],
    flirty: [
        "Nhìn gì mà nhìn? Yêu trẫm rồi à?", "Nhan sắc của trẫm làm bạn xao nhãng sao?",
        "Meow~ Bạn có pate ở đó không hay chỉ là đang vui thôi?", "Lại gần đây cho trẫm gửi lời yêu thương nào."
    ],
    random: [
        "Hết giờ chưa?", "Đói quá...", "Mèo béo không sợ thế giới!", "Ngủ tí thôi làm gì căng?", "Sen đâu, cơm đâu?",
        "Web này đẹp đấy, nhưng trẫm đẹp hơn.", "Tích tắc... tích tắc... meow!"
    ],
    dragLight: [
        "Đi đâu đấy?", "Chill thế~", "Nhẹ tay thôi Sen!", "Bay lên nào!", "Vui phết!",
        "Trẫm đang bay!", "Cảm giác thật là... phiêu.", "Nhẹ nhàng như đẩy xe hàng.",
        "Sen định đưa trẫm đi du lịch à?", "Cứ như đang ngồi xích đu ấy nhỉ?",
        "Hơi chóng mặt tí nhưng mà thích.", "Meow~ Phi thuyền khởi hành!",
        "Sen có tâm đấy, kéo rất êm.", "Lướt như bay!"
    ],
    dragHeavy: [
        "Aaaaa cứu!", "Chóng mặt quá!", "Dừng lạiii!", "Sen ơi tha cho trẫm!", "Động đất à?!", 
        "Trẫm sắp nôn rồi...", "Bớ người ta bắt cóc mèo!", "Thả trẫm xuốoooong!",
        "Trời đất quay cuồng...", "Nôn ra pate bây giờ!", "Sen định ám sát trẫm sao?",
        "Huhu dọa chết mèo rồi!", "Lòng tốt của Sen thật... nặng nề.",
        "Trẫm không phải là đồ chơi!", "Cứu!!! Mèo bay không kiểm soát!",
        "Dừng lại đi, trẫm xin lỗi mà!", "Sen ơi là Sen, ác vừa thôi!",
        "Chóng mặt muốn xỉu...", "Đừng rung lắc trẫm nữa!"
    ]
};

class Cat {
    constructor() {
        this.container = document.getElementById('cat-container');
        this.sprite    = document.getElementById('cat-sprite');
        this.countdown = document.querySelector('.countdown-container');

        this.direction     = 1;        // 1 = phải, -1 = trái
        this.currentAction = 'run';
        this.currentFrame  = 0;
        this.posX          = 50; // Bắt đầu ở giữa
        this.zone          = 'top'; 

        this.actionTimeout  = null;
        this.messageTimeout = null;
        this.timer          = 0;
        this.lastTime       = 0;

        this.idleTime      = 0;
        this.idleThreshold = 20000; // 20 giây không làm gì sẽ nói chuyện

        this.init();
    }

    /* ─── Init ─────────────────────────────────────────── */
    init() {
        if (!this.sprite || !this.container) return;

        this.container.style.pointerEvents = 'all';
        this.container.style.cursor = 'pointer';
        this.container.addEventListener('click', () => this.handleInteraction());

        this.bubble = document.createElement('div');
        this.bubble.className = 'cat-bubble';
        this.container.appendChild(this.bubble);

        this.applyZone();
        this.initIdleDetection();
        requestAnimationFrame(this.animate.bind(this));
        this.changeAction();
    }

    /* ─── Idle Detection ────────────────────────────────── */
    initIdleDetection() {
        const resetIdle = () => {
            this.idleTime = 0;
        };

        const events = ['mousemove', 'mousedown', 'touchstart', 'click', 'keydown', 'wheel'];
        events.forEach(evt => {
            window.addEventListener(evt, resetIdle, { passive: true });
        });
    }

    showIdleMessage() {
        // Chọn ngẫu nhiên một cảm xúc để thể hiện khi Sen lười
        const moods = ['lazy', 'philosophical', 'sarcastic', 'random', 'happy'];
        const mood = moods[Math.floor(Math.random() * moods.length)];
        const msgs = CAT_MESSAGES[mood];
        const text = msgs[Math.floor(Math.random() * msgs.length)];

        this.bubble.textContent = text;
        this.bubble.classList.add('active');

        // Nếu đang ngủ thì cựa quậy tí
        if (this.currentAction === 'lie') {
            this.currentFrame = 0; 
        }

        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            this.bubble.classList.remove('active');
        }, 4000);
    }

    /* ─── Zone helpers ──────────────────────────────────── */
    getZoneBottom() {
        if (this.countdown) {
            const rect = this.countdown.getBoundingClientRect();
            return window.innerHeight - rect.top; // sát mép trên của countdown
        }
        return 15;
    }

    getZoneBounds() {
        // bounds giờ tính theo độ rộng của .countdown-container
        if (this.countdown) {
            return { minX: -20, maxX: this.countdown.offsetWidth - 80 };
        }
        return { minX: 0, maxX: 100 };
    }

    applyZone() {
        // Tọa độ đứng được cố định bởi CSS (bottom: 100%)
    }

    /* ─── Giữ mèo luôn trên countdown ─────────────────── */
    resetPosInZone() {
        const bounds = this.getZoneBounds();
        this.posX = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    }

    /* ─── Interaction ───────────────────────────────────── */
    handleInteraction() {
        this.wakeUp();
        this.showRandomMessage();
    }

    showRandomMessage() {
        const cats     = Object.keys(CAT_MESSAGES);
        const category = cats[Math.floor(Math.random() * cats.length)];
        const msgs     = CAT_MESSAGES[category];
        const text     = msgs[Math.floor(Math.random() * msgs.length)];

        this.bubble.textContent = text;
        this.bubble.classList.add('active');

        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            this.bubble.classList.remove('active');
        }, 2500);
    }

    reactToDrag(distance) {
        // distance: sqrt(dx^2 + dy^2)
        let category = 'dragLight';
        if (distance > 150) category = 'dragHeavy';

        const msgs = CAT_MESSAGES[category];
        const text = msgs[Math.floor(Math.random() * msgs.length)];

        this.bubble.textContent = text;
        this.bubble.classList.add('active');

        // Wake up if dragging
        if (this.currentAction === 'lie') this.wakeUp();

        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            this.bubble.classList.remove('active');
        }, 2000);
    }

    wakeUp() {
        if (this.currentAction === 'lie') {
            this.switchAction('stand');
            setTimeout(() => this.switchAction('run'), 1000);
        } else {
            this.switchAction('bounce');
            setTimeout(() => this.switchAction('run'), 800);
        }
    }

    /* ─── Action management ─────────────────────────────── */
    switchAction(name) {
        if (this.actionTimeout) clearTimeout(this.actionTimeout);
        this.currentAction = name;
        this.currentFrame  = 0;
        this.timer         = 0;

        const duration = name === 'lie'
            ? 10000 + Math.random() * 10000
            : 3000  + Math.random() * 4000;
        this.actionTimeout = setTimeout(() => this.changeAction(), duration);
    }

    changeAction() {
        const actions = ['run', 'stand', 'lie', 'bounce'];
        const weights = [0.3, 0.1, 0.4, 0.2];
        const rand    = Math.random();
        let cum = 0, nextAction = 'run';

        for (let i = 0; i < actions.length; i++) {
            cum += weights[i];
            if (rand < cum) { nextAction = actions[i]; break; }
        }

        // Cat stays at current posX — no teleport
        this.switchAction(nextAction);
    }

    /* ─── Animation loop ────────────────────────────────── */
    update(deltaTime) {
        const action    = CAT_CONFIG.actions[this.currentAction];
        const frameTime = 1000 / action.fps;

        this.timer += deltaTime;
        if (this.timer >= frameTime) {
            this.currentFrame = (this.currentFrame + 1) % action.frames;
            this.timer = 0;
        }

        if (this.currentAction === 'run') {
            this.posX += CAT_CONFIG.speed * this.direction;

            const bounds = this.getZoneBounds();
            if (this.posX > bounds.maxX && this.direction === 1) this.direction = -1;
            else if (this.posX < bounds.minX && this.direction === -1) this.direction = 1;
        }

        // Idle logic
        this.idleTime += deltaTime;
        if (this.idleTime >= this.idleThreshold) {
            this.showIdleMessage();
            this.idleTime = 0; 
            // Sau khi nói một câu, chờ lâu hơn một chút cho câu tiếp theo (vd: 30-60s)
            this.idleThreshold = 30000 + Math.random() * 30000;
        }

        this.draw();
    }

    draw() {
        const action    = CAT_CONFIG.actions[this.currentAction];
        const rowOffset = this.direction === 1 ? 0 : 4;
        const row       = action.offset + rowOffset;
        const x         = this.currentFrame * CAT_CONFIG.frameSize;
        const y         = row * CAT_CONFIG.frameSize;

        this.sprite.style.backgroundPosition = `-${x}px -${y}px`;
        this.container.style.left = `${this.posX}px`;
    }

    animate(time) {
        if (!this.lastTime) this.lastTime = time;
        const deltaTime = time - this.lastTime;
        this.lastTime   = time;
        this.update(deltaTime);
        requestAnimationFrame(this.animate.bind(this));
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.myCat = new Cat(); 
});
