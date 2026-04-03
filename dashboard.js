// ═══════════════════════════════════════════════════════════
// QazaqBioHub — Dashboard JS
// Live market data simulation + chart + logistics tracking
// ═══════════════════════════════════════════════════════════

// ══════════════════════════════════
// MARKET DATA STATE
// ══════════════════════════════════
const state = {
  oil: 87.4,
  sugar: 491.0,
  wheat: 196.0,
  corn: 182.5,
  gfs55: 648.0,
  gfs42: 590.0,
  ethanol: 724.0,
  lysin: 2980.0,
  citric: 1240.0,
  freight_cn: 38.0,
  freight_ru: 22.0,
  freight_eu: 55.0,
  margin_a: 240,
  margin_b: 205,
  margin_c: 2820,
  time: new Date(),
  activeBranch: 'A',
  aiConfidence: 94,
};

// Price deltas for animation
const deltas = {};

// ══════════════════════════════════
// CLOCK
// ══════════════════════════════════
function updateClock() {
  const el = document.getElementById('dashTopTime');
  if (el) el.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
}
setInterval(updateClock, 1000);
updateClock();

// ══════════════════════════════════
// PRICE TICKER (topbar)
// ══════════════════════════════════
const TICKER_ITEMS = [
  { key: 'oil', name: 'BRENT', unit: '$/bbl' },
  { key: 'sugar', name: 'SUGAR11', unit: '$/т' },
  { key: 'wheat', name: 'WHEAT', unit: '$/т' },
  { key: 'corn', name: 'CORN', unit: '$/т' },
  { key: 'gfs55', name: 'GFS-55', unit: '$/т' },
  { key: 'ethanol', name: 'ETHANOL', unit: '$/т' },
  { key: 'lysin', name: 'LYSINE', unit: '$/т' },
  { key: 'citric', name: 'CITRIC', unit: '$/т' },
];

function buildTicker() {
  const el = document.getElementById('nbTickerInner');
  if (!el) return;
  // Double for infinite scroll
  let html = '';
  for (let rep = 0; rep < 2; rep++) {
    TICKER_ITEMS.forEach(item => {
      const val = state[item.key];
      const prev = deltas[item.key] || val;
      const diff = val - prev;
      const cls = diff >= 0 ? 'nb-ticker-up' : 'nb-ticker-dn';
      const sign = diff >= 0 ? '+' : '';
      html += `<div class="nb-ticker-item">
        <span class="nb-ticker-name">${item.name}</span>
        <span class="nb-ticker-price">$${val.toFixed(1)}</span>
        <span class="nb-ticker-ch ${cls}">${sign}${diff.toFixed(1)}</span>
      </div>`;
    });
  }
  el.innerHTML = html;
}
buildTicker();

// ══════════════════════════════════
// COMMODITY TABLE
// ══════════════════════════════════
const commodities = [
  { icon: '🌾', name: 'Пшеница (CME)', key: 'wheat', unit: '$/т', exchange: 'CME Chicago', branch: 'trunk', branchLabel: 'Сырьё', cls: 'ct-rec-none' },
  { icon: '🌽', name: 'Кукуруза (CME)', key: 'corn', unit: '$/т', exchange: 'CME Chicago', branch: 'trunk', branchLabel: 'Сырьё', cls: 'ct-rec-none' },
  { icon: '⛽', name: 'Нефть Brent', key: 'oil', unit: '$/bbl', exchange: 'ICE London', branch: 'B', branchLabel: 'Ветка Б', cls: 'ct-rec-b' },
  { icon: '🍬', name: 'Сахар-сырец', key: 'sugar', unit: '$/т', exchange: 'ICE #11', branch: 'A', branchLabel: 'Ветка А', cls: 'ct-rec-a' },
  { icon: '🫙', name: 'ГФС-55 (спот)', key: 'gfs55', unit: '$/т', exchange: 'Китай спот', branch: 'A', branchLabel: 'Ветка А', cls: 'ct-rec-a' },
  { icon: '🔥', name: 'Биоэтанол E300', key: 'ethanol', unit: '$/т', exchange: 'РФ СПБП', branch: 'B', branchLabel: 'Ветка Б', cls: 'ct-rec-b' },
  { icon: '🧬', name: 'L-Лизин HCl', key: 'lysin', unit: '$/т', exchange: 'Китай (Dalian)', branch: 'C', branchLabel: 'Ветка В', cls: 'ct-rec-c' },
  { icon: '⚗️', name: 'Лимонная к-та', key: 'citric', unit: '$/т', exchange: 'EU spot', branch: 'C', branchLabel: 'Ветка В', cls: 'ct-rec-c' },
];

let prevValues = {};
commodities.forEach(c => { prevValues[c.key] = state[c.key]; });

function renderCommodityTable() {
  const tbody = document.getElementById('commodityTBody');
  if (!tbody) return;
  tbody.innerHTML = commodities.map(c => {
    const current = state[c.key];
    const prev = prevValues[c.key] || current;
    const diff = current - prev;
    const pct = prev ? ((diff / prev) * 100) : 0;
    const isUp = diff >= 0;
    const changeColor = isUp ? 'var(--green)' : 'var(--red)';
    const changeSign = isUp ? '+' : '';
    const barPct = Math.min(100, Math.max(10, ((current - current * 0.95) / (current * 0.1)) * 100));

    // Sparkline
    const spark = Array.from({ length: 8 }, (_, i) => {
      const h = 8 + Math.random() * 14;
      const col = isUp ? 'var(--green)' : 'var(--red)';
      return `<div class="sparkline-bar" style="height:${h}px;background:${i === 7 ? col : 'var(--slate-300)'}"></div>`;
    }).join('');

    return `<tr>
      <td><span class="ct-name">${c.icon} ${c.name}</span></td>
      <td style="font-weight:700;font-variant-numeric:tabular-nums">$${current.toFixed(1)}</td>
      <td>
        <span style="color:${changeColor};font-weight:700;font-size:0.82rem">${changeSign}${diff.toFixed(1)}</span>
        <span style="color:var(--slate-400);font-size:0.72rem;margin-left:4px">(${changeSign}${pct.toFixed(2)}%)</span>
      </td>
      <td style="font-size:0.78rem;color:var(--slate-500)">${c.exchange}</td>
      <td><span class="ct-rec-badge ${c.cls}">${c.branchLabel}</span></td>
      <td><div class="sparkline">${spark}</div></td>
    </tr>`;
  }).join('');
}
renderCommodityTable();

// ══════════════════════════════════
// LOGISTICS
// ══════════════════════════════════
const logisticsData = [
  { icon: '🚢', name: 'MV Astana Star', route: 'Актау → Тяньцзинь (CN)', cargo: 'ГФС-55 · 2 400т', eta: 'ETA: 14 дней', status: 'В пути', statusCls: 'li-en-route' },
  { icon: '🚂', name: 'КТЖ-7812', route: 'Петропавловск → Новосиб.', cargo: 'Пшеница · 1 800т', eta: 'ETA: 3 дня', status: 'В пути', statusCls: 'li-en-route' },
  { icon: '🚢', name: 'MT Caspian Wind', route: 'Актау → Баку (AZ)', cargo: 'Биоэтанол · 1 200т', eta: 'ETA: 2 дня', status: 'В пути', statusCls: 'li-en-route' },
  { icon: '🚂', name: 'КТЖ-4451', route: 'Нур-Султан → Москва', cargo: 'Глютен · 800т', eta: 'ETA: 5 дней', status: 'Погрузка', statusCls: 'li-loading' },
  { icon: '🚢', name: 'MV Grain Master', route: 'Актау → Бндр-Имам (IR)', cargo: 'Кукурузный крахмал', eta: 'Прибыл', status: 'Прибыл', statusCls: 'li-arrived' },
  { icon: '✈️', name: 'KLM Cargo KZ01', route: 'Алматы → Пекин (CN)', cargo: 'L-Лизин · 24т', eta: 'ETA: 18ч', status: 'В пути', statusCls: 'li-en-route' },
  { icon: '🚂', name: 'УТИ-China Express', route: 'Алматы → Ляньюньган', cargo: 'Лимонная к-та · 400т', eta: 'ETA: 12 дней', status: 'В пути', statusCls: 'li-en-route' },
  { icon: '🚢', name: 'MT KazOil Trans', route: 'Актау → Махачкала (RU)', cargo: 'Биоэтанол · 600т', eta: 'ETA: 4 дня', status: 'Погрузка', statusCls: 'li-loading' },
];

function renderLogistics() {
  const grid = document.getElementById('logisticsGrid');
  if (!grid) return;
  grid.innerHTML = logisticsData.map(l => `
    <div class="logistics-item">
      <div class="li-icon">${l.icon}</div>
      <div class="li-body">
        <div class="li-name">${l.name}</div>
        <div class="li-route">${l.route}</div>
      </div>
      <div class="li-right">
        <div class="li-cargo">${l.cargo}</div>
        <div class="li-eta">${l.eta}</div>
        <span class="li-status ${l.statusCls}">${l.status}</span>
      </div>
    </div>
  `).join('');
}
renderLogistics();

// ══════════════════════════════════
// CONTRACTS
// ══════════════════════════════════
const contractsData = [
  { flag: '🇨🇳', name: 'Tianjin Foods Co.', detail: 'ГФС-55 · 5 000т · Q3 2025', amount: '$3.24M', status: 'Активен', cls: 'contract-active' },
  { flag: '🇷🇺', name: 'Газпромнефть', detail: 'Биоэтанол E10 · 2 000т/мес', amount: '$1.44M', status: 'Активен', cls: 'contract-active' },
  { flag: '🇰🇿', name: 'Agrovet KZ', detail: 'L-Лизин HCl · 200т/квартал', amount: '$596К', status: 'Активен', cls: 'contract-active' },
  { flag: '🇪🇺', name: 'ADM Europe BV', detail: 'Лимонная кислота · 150т', amount: '$186К', status: 'На рассмотрении', cls: 'contract-pending' },
  { flag: '🇮🇷', name: 'Persian Foods Int', detail: 'Крахмал пищевой · 800т', amount: '$192К', status: 'Активен', cls: 'contract-active' },
  { flag: '🇩🇪', name: 'Brenntag SE', detail: 'Глютен пшеничный · 500т', amount: '$110К', status: 'Проверка', cls: 'contract-review' },
];

function renderContracts() {
  const list = document.getElementById('contractsList');
  if (!list) return;
  list.innerHTML = contractsData.map(c => `
    <div class="contract-item">
      <div class="contract-flag">${c.flag}</div>
      <div class="contract-body">
        <div class="contract-name">${c.name}</div>
        <div class="contract-detail">${c.detail}</div>
      </div>
      <div class="contract-val">
        <div class="contract-amount">${c.amount}</div>
        <div class="contract-status ${c.cls}">${c.status}</div>
      </div>
    </div>
  `).join('');
}
renderContracts();

// ══════════════════════════════════
// FREIGHT RATES
// ══════════════════════════════════
const freightData = [
  { from: 'Актобе / Петропавловск', to: '→ Тяньцзинь, Китай (море)', type: '🚢 Балкер', cost: '$38/т', trend: '↑' },
  { from: 'Нур-Султан', to: '→ Москва, Россия (ж/д)', type: '🚂 ЖД КТЖ', cost: '$22/т', trend: '→' },
  { from: 'Алматы', to: '→ Ляньюньган, Китай (ж/д)', type: '🚂 Китайская ж/д', cost: '$45/т', trend: '↓' },
  { from: 'Актау (Каспий)', to: '→ Баку, Азербайджан', type: '🚢 Каспийск.ром', cost: '$18/т', trend: '→' },
  { from: 'Алматы', to: '→ Дубай, ОАЭ (авиа)', type: '✈️ Авиагруз', cost: '$280/т', trend: '↑' },
];

function renderFreight() {
  const list = document.getElementById('freightList');
  if (!list) return;
  list.innerHTML = freightData.map(f => `
    <div class="freight-item">
      <div class="freight-route">
        <div class="freight-from">${f.from}</div>
        <div class="freight-to">${f.to}</div>
      </div>
      <span class="freight-type">${f.type}</span>
      <div class="freight-cost">
        ${f.cost}
        <span>${f.trend}</span>
      </div>
    </div>
  `).join('');
}
renderFreight();

// ══════════════════════════════════
// AI FACTORS PANEL
// ══════════════════════════════════
const aiFactors = [
  { icon: '🍬', name: 'Сахар ICE', val: 'key: sugar', signal: 'buy', signalLabel: 'Ветка А', cls: 'signal-buy' },
  { icon: '⛽', name: 'Нефть Brent', val: 'key: oil', signal: 'hold', signalLabel: 'Ветка Б', cls: 'signal-hold' },
  { icon: '🧬', name: 'Лизин спрос', val: 'Высокий Q2', signal: 'sell', signalLabel: 'Ветка В', cls: 'signal-sell' },
  { icon: '🚢', name: 'Фрахт Китай', val: 'key: freight_cn', signal: 'buy', signalLabel: 'Норма', cls: 'signal-buy' },
  { icon: '🌾', name: 'Пшеница', val: 'key: wheat', signal: 'hold', signalLabel: 'Рост себест.', cls: 'signal-hold' },
];

function renderAIFactors() {
  const el = document.getElementById('aiNavFactors');
  if (!el) return;
  el.innerHTML = aiFactors.map(f => {
    const val = f.val.startsWith('key: ') ? `$${state[f.val.replace('key: ', '')].toFixed(1)}` : f.val;
    return `<div class="ai-factor">
      <div class="ai-factor-icon">${f.icon}</div>
      <div class="ai-factor-text">
        <div class="ai-factor-name">${f.name}</div>
        <div class="ai-factor-val">${val}</div>
      </div>
      <span class="ai-factor-signal ${f.cls}">${f.signalLabel}</span>
    </div>`;
  }).join('');

  // Confidence bar
  const existing = el.querySelector('.ai-confidence');
  if (!existing) {
    el.insertAdjacentHTML('afterend', `
      <div class="ai-confidence">
        <div class="ai-conf-label">
          <span>Уверенность алгоритма</span>
          <span id="aiConfNum">${state.aiConfidence}%</span>
        </div>
        <div class="ai-conf-bar">
          <div class="ai-conf-fill" id="aiConfFill" style="width:${state.aiConfidence}%"></div>
        </div>
      </div>
      <button class="branch-switch-btn" onclick="triggerBranchSwitch()">⚡ Переключить ветку сейчас</button>
    `);
  }
}
renderAIFactors();

// ══════════════════════════════════
// MARGIN CHART (Canvas 2D)
// ══════════════════════════════════
const marginChartCanvas = document.getElementById('marginChart');
if (marginChartCanvas) {
  const ctx = marginChartCanvas.getContext('2d');
  marginChartCanvas.width = marginChartCanvas.parentElement.offsetWidth;
  marginChartCanvas.height = 180;

  // Generate historical data (4 hours = 48 data points)
  const points = 48;
  const dataA = Array.from({ length: points }, (_, i) => 200 + Math.sin(i * 0.3) * 30 + Math.random() * 20 + i * 1.2);
  const dataB = Array.from({ length: points }, (_, i) => 170 + Math.cos(i * 0.25) * 25 + Math.random() * 15 + i * 0.8);
  const dataC = Array.from({ length: points }, (_, i) => 2700 + Math.sin(i * 0.2) * 80 + Math.random() * 50 + i * 2.5);

  function drawMarginChart() {
    const W = marginChartCanvas.width;
    const H = marginChartCanvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H / 4) * i;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 10, y); ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    const maxA = Math.max(...dataA);
    const labels = ['$300', '$270', '$240', '$210', '$180'];
    labels.forEach((l, i) => ctx.fillText(l, 36, (H / 4) * i + 4));

    // Draw line function
    function drawLine(data, color, fillColor) {
      const minV = Math.min(...data), maxV = Math.max(...data);
      const range = maxV - minV || 1;
      const normalize = v => H - 20 - ((v - minV) / range) * (H - 40);
      const dx = (W - 50) / (data.length - 1);

      // Fill gradient
      ctx.beginPath();
      ctx.moveTo(40, normalize(data[0]));
      data.forEach((v, i) => i > 0 && ctx.lineTo(40 + i * dx, normalize(v)));
      ctx.lineTo(40 + (data.length - 1) * dx, H);
      ctx.lineTo(40, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, fillColor + '40');
      grad.addColorStop(1, fillColor + '00');
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(40, normalize(data[0]));
      data.forEach((v, i) => i > 0 && ctx.lineTo(40 + i * dx, normalize(v)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Last point dot
      const lastX = 40 + (data.length - 1) * dx;
      const lastY = normalize(data[data.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawLine(dataA, '#10b981', '#10b981');
    drawLine(dataB, '#f59e0b', '#f59e0b');
    // Branch C data is scaled down for display
    const dataCScaled = dataC.map(v => 200 + (v - 2700) / 10);
    drawLine(dataCScaled, '#8b5cf6', '#8b5cf6');

    // X-axis time labels
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.font = '10px Inter, sans-serif';
    const now = new Date();
    const times = ['-4ч', '-3ч', '-2ч', '-1ч', 'Сейчас'];
    times.forEach((t, i) => {
      ctx.fillText(t, 40 + (i * (W - 50) / 4), H - 2);
    });
  }

  drawMarginChart();

  // Update periodically
  setInterval(() => {
    dataA.push(dataA[dataA.length - 1] + (Math.random() - 0.48) * 8);
    dataA.shift();
    dataB.push(dataB[dataB.length - 1] + (Math.random() - 0.48) * 6);
    dataB.shift();
    dataC.push(dataC[dataC.length - 1] + (Math.random() - 0.48) * 30);
    dataC.shift();
    drawMarginChart();
  }, 3000);

  window.addEventListener('resize', () => {
    marginChartCanvas.width = marginChartCanvas.parentElement.offsetWidth;
    drawMarginChart();
  });
}

// ══════════════════════════════════
// LIVE PRICE UPDATES
// ══════════════════════════════════
function updatePrices() {
  prevValues = { ...state };

  // Simulate price movements
  const fluctuate = (val, volatility) => val + (Math.random() - 0.49) * volatility;
  state.oil = Math.max(60, Math.min(120, fluctuate(state.oil, 0.4)));
  state.sugar = Math.max(300, Math.min(700, fluctuate(state.sugar, 2.5)));
  state.wheat = Math.max(140, Math.min(280, fluctuate(state.wheat, 1.2)));
  state.corn = Math.max(140, Math.min(260, fluctuate(state.corn, 1.0)));
  state.gfs55 = Math.max(500, Math.min(800, fluctuate(state.gfs55, 3)));
  state.ethanol = Math.max(580, Math.min(900, fluctuate(state.ethanol, 4)));
  state.lysin = Math.max(2400, Math.min(3500, fluctuate(state.lysin, 20)));
  state.citric = Math.max(900, Math.min(1600, fluctuate(state.citric, 8)));

  // Calculate margins
  const costBase = state.wheat * 0.9 + 35; // wheat + processing
  state.margin_a = state.gfs55 - costBase - state.freight_cn;
  state.margin_b = state.ethanol - costBase - state.freight_ru;
  state.margin_c = state.lysin - costBase * 1.3 - 40;

  // Update AI recommendation
  let bestBranch = 'A', bestMargin = state.margin_a;
  if (state.margin_b > bestMargin) { bestBranch = 'B'; bestMargin = state.margin_b; }
  if (state.margin_c > bestMargin) { bestBranch = 'C'; bestMargin = state.margin_c; }
  state.aiConfidence = 85 + Math.random() * 14;

  // Update DOM
  setDom('oilVal', `$${state.oil.toFixed(1)}`);
  setDom('sugarVal', `$${state.sugar.toFixed(0)}`);
  setDom('wheatVal', `$${state.wheat.toFixed(0)}`);
  setDom('lysinVal', `$${state.lysin.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`);
  setDom('marginToday', `$${state.gfs55.toFixed(0)}`);

  const oilDiff = state.oil - prevValues.oil;
  const sugarDiff = state.sugar - prevValues.sugar;
  setDom('oilChange', `${oilDiff >= 0 ? '↑' : '↓'} ${oilDiff >= 0 ? '+' : ''}${oilDiff.toFixed(2)}`);
  setDom('sugarChange', `${sugarDiff >= 0 ? '↑' : '↓'} ${sugarDiff >= 0 ? '+' : ''}${sugarDiff.toFixed(0)}/т`);

  // Branch names
  const branchNames = { A: 'Ветка А — ГФС', B: 'Ветка Б — Биоэтанол', C: 'Ветка В — Лизин' };
  const branchRecs = {
    A: `Ветка А → ГФС-55 → Экспорт Китай · Маржа $${state.margin_a.toFixed(0)}/т`,
    B: `Ветка Б → Биоэтанол → РФ/ЕС · Маржа $${state.margin_b.toFixed(0)}/т`,
    C: `Ветка В → L-Лизин → Птицефабрики · Маржа $${state.margin_c.toFixed(0)}/т`,
  };
  setDom('activebranchVal', branchNames[bestBranch]);
  setDom('aiNavRec', branchRecs[bestBranch]);
  setDom('aiNavMargin', `Маржа: +$${Math.round(bestMargin)}/т · Уверенность: ${Math.round(state.aiConfidence)}%`);

  const confFill = document.getElementById('aiConfFill');
  const confNum = document.getElementById('aiConfNum');
  if (confFill) confFill.style.width = state.aiConfidence + '%';
  if (confNum) confNum.textContent = Math.round(state.aiConfidence) + '%';

  // Re-render commodity table
  renderCommodityTable();
  buildTicker();

  // Update alert
  if (state.sugar > 480) {
    setDom('dashAlertText', `<strong>⚡ ИИ-Навигатор:</strong> Цена сахара ICE $${state.sugar.toFixed(0)}/т — выше $480. Активация Ветки А рекомендована. Потенциал +$${state.margin_a.toFixed(0)}/т.`);
  } else if (state.oil > 85) {
    setDom('dashAlertText', `<strong>⚡ ИИ-Навигатор:</strong> Нефть Brent $${state.oil.toFixed(1)}/bbl — Биоэтанол ветка Б выгодна. ETA переключения 48ч.`);
  }
}

function setDom(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

setInterval(updatePrices, 4000);

// ══════════════════════════════════
// BRANCH SWITCH
// ══════════════════════════════════
function triggerBranchSwitch() {
  const branches = ['A', 'B', 'C'];
  const names = { A: 'Ветка А — ГФС', B: 'Ветка Б — Биоэтанол', C: 'Ветка В — Лизин' };
  const current = state.activeBranch;
  const next = branches[(branches.indexOf(current) + 1) % 3];
  state.activeBranch = next;

  // Show notification
  const alert = document.getElementById('dashAlertText');
  if (alert) {
    alert.innerHTML = `<strong>🔄 Переключение запущено:</strong> ${names[current]} → ${names[next]}. Время переключения: 48 часов. Реакторы останавливаются для промывки.`;
    document.getElementById('dashMainAlert').style.borderLeftColor = 'var(--purple)';
    document.getElementById('dashMainAlert').style.background = 'var(--purple-pale)';
  }
  setDom('activebranchVal', names[next]);
}

// ══════════════════════════════════
// SIDEBAR LIVE UPDATES
// ══════════════════════════════════
function updateSidebar() {
  const grainBadge = document.getElementById('sbGrainBadge');
  const energyBadge = document.getElementById('sbEnergyBadge');
  const chemBadge = document.getElementById('sbChemBadge');
  if (grainBadge) {
    const pct = ((state.wheat - 196) / 196 * 100).toFixed(1);
    grainBadge.textContent = `${pct >= 0 ? '↑' : '↓'}${Math.abs(pct)}%`;
    grainBadge.className = `dash-nav-badge ${pct >= 0 ? 'dash-nav-badge-green' : 'dash-nav-badge-red'}`;
  }
  if (energyBadge) {
    const pct = ((state.oil - 87.4) / 87.4 * 100).toFixed(1);
    energyBadge.textContent = `${pct >= 0 ? '↑' : '↓'}${Math.abs(pct)}%`;
    energyBadge.className = `dash-nav-badge ${pct >= 0 ? 'dash-nav-badge-amber' : 'dash-nav-badge-green'}`;
  }
  if (chemBadge) {
    const pct = ((state.lysin - 2980) / 2980 * 100).toFixed(1);
    chemBadge.textContent = `${pct >= 0 ? '↑' : '↓'}${Math.abs(pct)}%`;
    chemBadge.className = `dash-nav-badge ${pct >= 0 ? 'dash-nav-badge-green' : 'dash-nav-badge-red'}`;
  }
}
setInterval(updateSidebar, 5000);
