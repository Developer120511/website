// ===== HEADER: estado al hacer scroll =====
const header = document.getElementById('header');
if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
}

// ===== REVELADO EN SCROLL =====
const revealTargets = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
} else {
    revealTargets.forEach(el => el.classList.add('in-view'));
}

// ===== CONTADORES ANIMADOS (ledger) =====
function animateCount(el, target, duration = 1200) {
    const start = performance.now();
    const from = 0;
    function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
    }
    requestAnimationFrame(tick);
}
document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(el, target);
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    io.observe(el);
});

// ===== POLVO AMBIENTAL (canvas de fondo, muy sutil) =====
(function () {
    const canvas = document.getElementById('dust-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width, height, motes = [];
    const COLORS = ['201,162,39', '95,143,196', '86,181,139'];
    const COUNT = 46;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    for (let i = 0; i < COUNT; i++) {
        motes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.12,
            vy: -Math.random() * 0.1 - 0.02,
            r: Math.random() * 1.6 + 0.4,
            alpha: Math.random() * 0.35 + 0.08,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        motes.forEach(m => {
            m.x += m.vx;
            m.y += m.vy;
            if (m.y < -10) { m.y = height + 10; m.x = Math.random() * width; }
            if (m.x < -10) m.x = width + 10;
            if (m.x > width + 10) m.x = -10;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${m.color}, ${m.alpha})`;
            ctx.fill();
        });
        if (!reduceMotion) requestAnimationFrame(draw);
    }
    draw();
})();
