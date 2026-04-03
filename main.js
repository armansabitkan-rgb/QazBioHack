// ═══════════════════════════════════════════════════════════
// QazaqBioHub — Main JS (index.html)
// Live data simulation + UI interactions
// ═══════════════════════════════════════════════════════════

// ── Nav scroll effect ──
window.addEventListener('scroll', () => {
  document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Live clock ──
function updateClock() {
  const el = document.getElementById('aiRecTime');
  if (el) el.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ── AI Recommendation engine (simulated) ──
const MARKET_DATA = {
  sugarPrice: 490,   // $/т
  oilPrice: 87,      // Brent $/bbl
  lysineDemand: 'high',
  wheatPrice: 195,
  cornPrice: 180,
};

const RECOMMENDATIONS = [
  {
    condition: () => MARKET_DATA.sugarPrice > 480,
    branch: 'A',
    text: '⚡ Рекомендация: Переключить на Ветку А → ГФС → Экспорт Китай',
    margin: '+$240/т vs мука',
    reasons: ['Сахар ICE: $490/т 🔴 Выше порога $480', 'Спрос ГФС: Coca-Cola Q3 контракт', 'Фрахт Актобе→Шанхай: $38/т 🟢 Норма'],
  },
  {
    condition: () => MARKET_DATA.oilPrice > 85,
    branch: 'B',
    text: '⚡ Рекомендация: Переключить на Ветку Б → Биоэтанол → РФ/ЕС',
    margin: '+$210/т vs мука',
    reasons: ['Нефть Brent: $87 🔴 Выше $85', 'Квота E10 РФ: Июль вступает в силу', 'Экспорт ж/д: $22/т 🟢 Низкие тарифы'],
  },
  {
    condition: () => MARKET_DATA.lysineDemand === 'high',
    branch: 'C',
    text: '⚡ Рекомендация: СРОЧНО → Ветка В → Лизин → Птицефабрики',
    margin: '+$2 820/т vs мука',
    reasons: ['Спрос птицеводов: Пиковый сезон', 'Лизин L-форма: $3 000/т', 'Ближайший склад: 2 дня доставки'],
  },
];

function updateAIRec() {
  // Slightly fluctuate market data
  MARKET_DATA.sugarPrice += (Math.random() - 0.48) * 2;
  MARKET_DATA.oilPrice += (Math.random() - 0.48) * 0.5;

  const rec = RECOMMENDATIONS.find(r => r.condition()) || RECOMMENDATIONS[0];
  const mainEl = document.getElementById('aiRecMain');
  const reasonsEl = document.getElementById('aiRecReasons');
  if (mainEl) mainEl.textContent = rec.text;
  if (reasonsEl) {
    reasonsEl.innerHTML = rec.reasons.map(r =>
      `<span class="ai-rec-reason">${r}</span>`
    ).join('');
  }
}

setInterval(updateAIRec, 5000);
updateAIRec();

// ── Counter animation for hero stats ──
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.round(current) + suffix;
  }, 20);
}

// Trigger on scroll into view
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      const el1 = document.getElementById('statMargin');
      const el3 = document.getElementById('statProducts');
      if (el1) animateCounter(el1, 340, '%');
      if (el3) animateCounter(el3, 4, '');
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  observer.observe(heroStats);
}

// ── GSAP scroll animations ──
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero-badge', { opacity: 0, y: 20, duration: 0.8, delay: 0.2 });
  gsap.from('.hero-title', { opacity: 0, y: 40, duration: 0.9, delay: 0.4 });
  gsap.from('.hero-desc', { opacity: 0, y: 30, duration: 0.8, delay: 0.6 });
  gsap.from('.hero-stats', { opacity: 0, y: 30, duration: 0.8, delay: 0.8 });
  gsap.from('.hero-actions', { opacity: 0, y: 20, duration: 0.7, delay: 1.0 });

  gsap.from('.branch-card', {
    opacity: 0, y: 40, duration: 0.6, stagger: 0.1,
    scrollTrigger: { trigger: '.branches-grid', start: 'top 80%' }
  });

  gsap.from('.df-step', {
    opacity: 0, y: 30, duration: 0.5, stagger: 0.15,
    scrollTrigger: { trigger: '.decision-flow', start: 'top 80%' }
  });

  gsap.from('.ai-rec-box', {
    opacity: 0, scale: 0.97, duration: 0.7,
    scrollTrigger: { trigger: '.ai-rec-box', start: 'top 85%' }
  });

  gsap.from('.econ-card', {
    opacity: 0, x: index => index === 0 ? -40 : 40, duration: 0.7,
    scrollTrigger: { trigger: '.econ-comparison', start: 'top 80%' }
  });
}
