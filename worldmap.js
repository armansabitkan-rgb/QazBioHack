// ═══════════════════════════════════════════════════════════
// QazaqBioHub — World Map (Leaflet.js)
// Real world map with animated vessel/train markers
// ═══════════════════════════════════════════════════════════

// ── Initialize Leaflet map ──
const map = L.map('leafletMap', {
  center: [42, 65],          // Center on Kazakhstan / Central Asia
  zoom: 4,
  minZoom: 2,
  maxZoom: 10,
  zoomControl: true,
  attributionControl: false,
}).setView([42, 65], 4);

// ── Dark tile layer (CartoDB Dark Matter — Bloomberg aesthetic) ──
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// ══════════════════════════════════
// ICON FACTORIES
// ══════════════════════════════════

// Ship icon — SVG with color border glow
function makeShipIcon(color, size) {
  size = size || 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
    <defs><filter id="g1"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${color}" flood-opacity="0.7"/></filter></defs>
    <g filter="url(#g1)">
      <path d="M24 6 L30 18 L36 30 L24 26 L12 30 L18 18 Z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="22" y="18" width="4" height="10" rx="1" fill="#fff" opacity="0.5"/>
    </g>
  </svg>`;
  return L.divIcon({
    html: `<div class="vessel-marker" title="Судно">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: '',
  });
}

// Train icon — SVG locomotive
function makeTrainIcon(color, size) {
  size = size || 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
    <defs><filter id="g2"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${color}" flood-opacity="0.7"/></filter></defs>
    <g filter="url(#g2)">
      <rect x="10" y="12" width="28" height="18" rx="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <rect x="14" y="16" width="8" height="6" rx="1" fill="#fff" opacity="0.5"/>
      <rect x="26" y="16" width="8" height="6" rx="1" fill="#fff" opacity="0.5"/>
      <circle cx="16" cy="34" r="3" fill="${color}" stroke="#fff" stroke-width="1.2"/>
      <circle cx="32" cy="34" r="3" fill="${color}" stroke="#fff" stroke-width="1.2"/>
      <rect x="14" y="30" width="20" height="3" rx="1" fill="${color}"/>
    </g>
  </svg>`;
  return L.divIcon({
    html: `<div class="vessel-marker" title="Поезд">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: '',
  });
}

// Plane icon
function makePlaneIcon(color, size) {
  size = size || 26;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
    <defs><filter id="g3"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${color}" flood-opacity="0.7"/></filter></defs>
    <g filter="url(#g3)">
      <path d="M24 4L28 16L42 20L28 24L24 44L20 24L6 20L20 16Z" fill="${color}" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>
    </g>
  </svg>`;
  return L.divIcon({
    html: `<div class="vessel-marker" title="Авиа">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: '',
  });
}

// Port icon
function makePortIcon(color) {
  return L.divIcon({
    html: `<div class="port-marker" style="background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
    className: '',
  });
}

// Source (QazaqBioHub) icon
function makeSourceIcon() {
  return L.divIcon({
    html: `<div class="source-marker" title="QazaqBioHub"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
    className: '',
  });
}

// ══════════════════════════════════
// LAYER GROUPS (for filtering)
// ══════════════════════════════════
const shipLayer = L.layerGroup().addTo(map);
const trainLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);
const portLayer = L.layerGroup().addTo(map);

// ══════════════════════════════════
// PORTS & KEY LOCATIONS
// ══════════════════════════════════
const PORTS = [
  { name: 'QazaqBioHub (Актобе)', lat: 50.3, lon: 57.2, type: 'source', desc: '🏭 Головной завод-трансформер<br><b>Мощность:</b> 500 т/сутки' },
  { name: 'Нур-Султан (Астана)', lat: 51.2, lon: 71.4, type: 'city', desc: '🏙 Столица · Логистический центр' },
  { name: 'Алматы', lat: 43.3, lon: 76.9, type: 'city', desc: '🏙 Экспедиторский хаб · Авиа' },
  { name: 'Порт Актау', lat: 43.6, lon: 51.2, type: 'port', desc: '⚓ Каспийский порт · Экспорт морем' },
  { name: 'Тяньцзинь, Китай', lat: 39.0, lon: 117.7, type: 'port', desc: '⚓ Крупнейший импортёр ГФС' },
  { name: 'Шанхай, Китай', lat: 31.2, lon: 121.5, type: 'port', desc: '⚓ Импорт химии / аминокислот' },
  { name: 'Роттердам, Нидерланды', lat: 51.9, lon: 4.5, type: 'port', desc: '⚓ Главный хаб Евросоюза' },
  { name: 'Дубай, ОАЭ', lat: 25.2, lon: 55.3, type: 'port', desc: '⚓ Ближневосточный хаб' },
  { name: 'Баку, Азербайджан', lat: 40.4, lon: 49.9, type: 'port', desc: '⚓ Каспийский транзит' },
  { name: 'Бандар-Имам, Иран', lat: 30.4, lon: 49.1, type: 'port', desc: '⚓ Импорт пищевого крахмала' },
  { name: 'Ляньюньган, Китай', lat: 34.6, lon: 119.2, type: 'port', desc: '⚓ Ж/д терминал Новый Шёлковый путь' },
  { name: 'Махачкала, РФ', lat: 42.9, lon: 47.6, type: 'port', desc: '⚓ Каспийский порт РФ' },
  { name: 'Новосибирск, РФ', lat: 55.0, lon: 82.9, type: 'city', desc: '🏙 Ж/д узел Сибири' },
  { name: 'Москва, РФ', lat: 55.7, lon: 37.6, type: 'city', desc: '🏙 Рынок биоэтанола и глютена' },
  { name: 'Пекин, Китай', lat: 39.9, lon: 116.4, type: 'city', desc: '🏙 Авиагрузовой хаб' },
];

PORTS.forEach(p => {
  const icon = p.type === 'source' ? makeSourceIcon()
    : p.type === 'port' ? makePortIcon('#60a5fa')
      : makePortIcon('#94a3b8');
  const marker = L.marker([p.lat, p.lon], { icon })
    .bindPopup(`<b>${p.name}</b><br>${p.desc}`)
    .bindTooltip(p.name, { permanent: false, direction: 'right', offset: [12, 0], className: 'port-tooltip' });
  portLayer.addLayer(marker);
});

// ══════════════════════════════════
// VESSELS (Ships + Trains + Planes)
// ══════════════════════════════════
const VESSELS = [
  // SHIPS
  {
    id: 'ship-1', name: 'MV Astana Star', type: 'ship', color: '#22c55e',
    cargo: 'ГФС-55', cargoType: 'ГФС', tonnage: '2 400 т',
    from: 'Порт Актау', to: 'Тяньцзинь (CN)',
    eta: '14 дней', value: '$1.56M',
    route: [[43.6, 51.2], [38, 65], [35, 80], [36, 95], [38, 110], [39, 117.7]],
    pos: 0,
  },
  {
    id: 'ship-2', name: 'MT Caspian Wind', type: 'ship', color: '#fbbf24',
    cargo: 'Биоэтанол', cargoType: 'Биоэтанол', tonnage: '1 200 т',
    from: 'Порт Актау', to: 'Баку (AZ)',
    eta: '2 дня', value: '$870K',
    route: [[43.6, 51.2], [42.5, 50.5], [40.4, 49.9]],
    pos: 0,
  },
  {
    id: 'ship-3', name: 'MV Grain Master', type: 'ship', color: '#22c55e',
    cargo: 'Крахмал пищевой', cargoType: 'Крахмал', tonnage: '800 т',
    from: 'Порт Актау', to: 'Бандар-Имам (IR)',
    eta: '3 дня', value: '$154K',
    route: [[43.6, 51.2], [38, 50.5], [33, 50.0], [30.4, 49.1]],
    pos: 0,
  },
  {
    id: 'ship-4', name: 'MT KazOil Trans', type: 'ship', color: '#fbbf24',
    cargo: 'Биоэтанол', cargoType: 'Биоэтанол', tonnage: '600 т',
    from: 'Порт Актау', to: 'Махачкала (RU)',
    eta: '4 дня', value: '$435K',
    route: [[43.6, 51.2], [43.2, 50.0], [42.9, 47.6]],
    pos: 0,
  },
  {
    id: 'ship-5', name: 'MV Lysine Express', type: 'ship', color: '#a78bfa',
    cargo: 'L-Лизин HCl', cargoType: 'Аминокислоты', tonnage: '180 т',
    from: 'Порт Актау', to: 'Шанхай (CN)',
    eta: '22 дня', value: '$536K',
    route: [[43.6, 51.2], [35, 60], [28, 75], [22, 90], [25, 105], [28, 115], [31.2, 121.5]],
    pos: 0,
  },
  {
    id: 'ship-6', name: 'MV Silk Route II', type: 'ship', color: '#22c55e',
    cargo: 'ГФС-42', cargoType: 'ГФС', tonnage: '1 800 т',
    from: 'Порт Актау', to: 'Дубай (UAE)',
    eta: '8 дней', value: '$1.08M',
    route: [[43.6, 51.2], [38, 52], [33, 53], [28, 54], [25.2, 55.3]],
    pos: 0,
  },
  // TRAINS
  {
    id: 'train-1', name: 'КТЖ-7812', type: 'train', color: '#f87171',
    cargo: 'Пшеница', cargoType: 'Зерно', tonnage: '1 800 т',
    from: 'Петропавловск', to: 'Новосибирск',
    eta: '3 дня', value: '$352K',
    route: [[54.9, 69.1], [55.0, 76], [55.0, 82.9]],
    pos: 0,
  },
  {
    id: 'train-2', name: 'КТЖ-4451', type: 'train', color: '#f87171',
    cargo: 'Глютен', cargoType: 'Глютен', tonnage: '800 т',
    from: 'Нур-Султан', to: 'Москва',
    eta: '5 дней', value: '$176K',
    route: [[51.2, 71.4], [53, 60], [54, 50], [55, 45], [55.7, 37.6]],
    pos: 0,
  },
  {
    id: 'train-3', name: 'УТИ-China Express', type: 'train', color: '#a78bfa',
    cargo: 'Лимонная кислота', cargoType: 'Аминокислоты', tonnage: '400 т',
    from: 'Алматы', to: 'Ляньюньган (CN)',
    eta: '12 дней', value: '$496K',
    route: [[43.3, 76.9], [42, 88], [40, 100], [37, 110], [34.6, 119.2]],
    pos: 0,
  },
  {
    id: 'train-4', name: 'КТЖ-Astana Express', type: 'train', color: '#22c55e',
    cargo: 'ГФС-42', cargoType: 'ГФС', tonnage: '600 т',
    from: 'Нур-Султан', to: 'Алматы',
    eta: '1 день', value: '$365K',
    route: [[51.2, 71.4], [47, 73], [44, 75], [43.3, 76.9]],
    pos: 0,
  },
  // AIR
  {
    id: 'plane-1', name: 'KLM Cargo KZ01', type: 'plane', color: '#60a5fa',
    cargo: 'L-Лизин HCl', cargoType: 'Аминокислоты', tonnage: '24 т',
    from: 'Алматы', to: 'Пекин (CN)',
    eta: '18 ч', value: '$72K',
    route: [[43.3, 76.9], [42, 90], [41, 105], [39.9, 116.4]],
    pos: 0,
  },
];

// Create markers and route lines
const vesselMarkers = {};
const vesselPolylines = {};

VESSELS.forEach(v => {
  // Icon based on type
  let icon;
  if (v.type === 'ship') icon = makeShipIcon(v.color, 30);
  else if (v.type === 'train') icon = makeTrainIcon(v.color, 28);
  else icon = makePlaneIcon(v.color, 26);

  // Random initial position along route
  v.pos = Math.random() * 0.7 + 0.1;

  // Create initial marker at interpolated position
  const initialLatLng = interpolateRoute(v.route, v.pos);
  const marker = L.marker(initialLatLng, { icon }).bindPopup(makeVesselPopup(v));

  const layer = v.type === 'ship' ? shipLayer : (v.type === 'train' ? trainLayer : shipLayer);
  layer.addLayer(marker);
  vesselMarkers[v.id] = marker;

  // Route polyline
  const polyline = L.polyline(v.route, {
    color: v.color,
    weight: 2,
    opacity: 0.35,
    dashArray: '8,6',
  });
  routeLayer.addLayer(polyline);
  vesselPolylines[v.id] = polyline;
});

function makeVesselPopup(v) {
  const typeLabel = v.type === 'ship' ? '🚢 Судно' : v.type === 'train' ? '🚂 Поезд' : '✈️ Авиагруз';
  return `<div style="min-width:180px">
    <div style="font-size:14px;font-weight:800;margin-bottom:6px">${v.name}</div>
    <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">${typeLabel} · ${v.cargoType}</div>
    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.08)">
      <span style="color:#94a3b8">Груз</span><span><b>${v.cargo}</b> · ${v.tonnage}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.08)">
      <span style="color:#94a3b8">Маршрут</span><span>${v.from} → ${v.to}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.08)">
      <span style="color:#94a3b8">ETA</span><span>${v.eta}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">
      <span style="color:#94a3b8">Стоимость</span><span style="color:#22c55e;font-weight:700">${v.value}</span>
    </div>
  </div>`;
}

// ══════════════════════════════════
// CONTRACT ARCS (curved lines from KZ)
// ══════════════════════════════════
const CONTRACTS = [
  { from: [50.3, 57.2], to: [39.0, 117.7], label: 'ГФС → Тяньцзинь $3.24M', color: '#22c55e' },
  { from: [50.3, 57.2], to: [55.7, 37.6], label: 'Биоэтанол → Москва $1.44M', color: '#fbbf24' },
  { from: [50.3, 57.2], to: [51.9, 4.5], label: 'Лим. кислота → Роттердам', color: '#a78bfa' },
  { from: [50.3, 57.2], to: [25.2, 55.3], label: 'ГФС → Дубай $186K', color: '#22c55e' },
  { from: [50.3, 57.2], to: [30.4, 49.1], label: 'Крахмал → Иран', color: '#60a5fa' },
];

CONTRACTS.forEach(c => {
  // Create curved arc via midpoint offset
  const mid = [(c.from[0] + c.to[0]) / 2, (c.from[1] + c.to[1]) / 2];
  const dist = Math.sqrt(Math.pow(c.to[0] - c.from[0], 2) + Math.pow(c.to[1] - c.from[1], 2));
  mid[0] += dist * 0.08;  // curve upward

  const points = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const lat = (1 - t) * (1 - t) * c.from[0] + 2 * (1 - t) * t * mid[0] + t * t * c.to[0];
    const lon = (1 - t) * (1 - t) * c.from[1] + 2 * (1 - t) * t * mid[1] + t * t * c.to[1];
    points.push([lat, lon]);
  }

  const poly = L.polyline(points, {
    color: c.color,
    weight: 1.5,
    opacity: 0.25,
    dashArray: '4,6',
  }).bindTooltip(c.label, { sticky: true });
  routeLayer.addLayer(poly);
});

// ══════════════════════════════════
// INTERPOLATION & ANIMATION
// ══════════════════════════════════
function interpolateRoute(route, t) {
  t = Math.max(0, Math.min(1, t));
  const segments = route.length - 1;
  const seg = Math.min(Math.floor(t * segments), segments - 1);
  const localT = (t * segments) - seg;
  const p1 = route[seg], p2 = route[seg + 1];
  return [
    p1[0] + (p2[0] - p1[0]) * localT,
    p1[1] + (p2[1] - p1[1]) * localT,
  ];
}

// Animate vessels
const SPEED = { ship: 0.00015, train: 0.00035, plane: 0.0006 };

function animateVessels() {
  VESSELS.forEach(v => {
    v.pos += SPEED[v.type] || 0.0002;
    if (v.pos >= 1) v.pos = 0;
    const latlng = interpolateRoute(v.route, v.pos);
    const marker = vesselMarkers[v.id];
    if (marker) marker.setLatLng(latlng);
  });
}

setInterval(animateVessels, 50);

// ══════════════════════════════════
// FILTER SYSTEM
// ══════════════════════════════════
function filterMap(filter) {
  document.querySelectorAll('.wm-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));

  if (filter === 'all') {
    map.addLayer(shipLayer); map.addLayer(trainLayer); map.addLayer(routeLayer); map.addLayer(portLayer);
  } else if (filter === 'ships') {
    map.addLayer(shipLayer); map.removeLayer(trainLayer); map.addLayer(routeLayer); map.addLayer(portLayer);
  } else if (filter === 'trains') {
    map.removeLayer(shipLayer); map.addLayer(trainLayer); map.addLayer(routeLayer); map.addLayer(portLayer);
  } else if (filter === 'routes') {
    map.addLayer(shipLayer); map.addLayer(trainLayer); map.addLayer(routeLayer); map.removeLayer(portLayer);
  }
}

// ══════════════════════════════════
// TICKER
// ══════════════════════════════════
const wmTickerData = [
  { name: 'WHEAT.CME', val: 196.0, delta: +1.2 },
  { name: 'CORN.CME', val: 182.5, delta: -0.8 },
  { name: 'BRENT.ICE', val: 87.4, delta: +0.5 },
  { name: 'SUGAR11', val: 491.0, delta: +3.1 },
  { name: 'ETHANOL', val: 724.0, delta: +4.5 },
  { name: 'LYSINE.CN', val: 2980, delta: +20 },
  { name: 'GFS-55.CN', val: 648.0, delta: +2.1 },
  { name: 'CITRIC.EU', val: 1240, delta: -8.0 },
  { name: 'KZT/USD', val: 450.2, delta: +0.3 },
  { name: 'USD/EUR', val: 0.922, delta: -0.002 },
  { name: 'BALT.IDX', val: 1840, delta: +12 },
  { name: 'CRUDE.WTI', val: 83.6, delta: +0.4 },
];

function buildTicker() {
  const el = document.getElementById('wmTickerInner');
  if (!el) return;
  wmTickerData.forEach(i => {
    i.val += (Math.random() - 0.49) * Math.abs(i.delta) * 0.3;
    i.delta += (Math.random() - 0.5) * 0.3;
  });
  let html = '';
  for (let rep = 0; rep < 3; rep++) {
    wmTickerData.forEach(i => {
      const up = i.delta >= 0;
      html += `<div class="wm-ticker-item">
        <span class="wm-ticker-name">${i.name}</span>
        <span class="wm-ticker-val">${i.val.toFixed(i.val > 100 ? 1 : 3)}</span>
        <span class="wm-ticker-chg ${up ? 'wm-ticker-up' : 'wm-ticker-dn'}">${up ? '+' : ''}${i.delta.toFixed(2)}</span>
      </div>`;
    });
  }
  el.innerHTML = html;
}
buildTicker();
setInterval(buildTicker, 6000);

// ── Left panel live prices ──
function updatePanel() {
  const r = (base, v) => (base + (Math.random() - 0.5) * v).toFixed(1);
  const el = id => document.getElementById(id);
  if (el('wm-oil')) el('wm-oil').textContent = '$' + r(87.4, 2) + '/bbl';
  if (el('wm-sugar')) el('wm-sugar').textContent = '$' + Math.round(491 + (Math.random() - 0.5) * 8) + '/т';
  if (el('wm-wheat')) el('wm-wheat').textContent = '$' + Math.round(196 + (Math.random() - 0.5) * 4) + '/т';
  if (el('wm-lysin')) el('wm-lysin').textContent = '$' + Math.round(2980 + (Math.random() - 0.5) * 50).toLocaleString() + '/т';
  if (el('wm-gfs')) el('wm-gfs').textContent = '$' + Math.round(648 + (Math.random() - 0.5) * 10) + '/т';
  if (el('wm-eth')) el('wm-eth').textContent = '$' + Math.round(724 + (Math.random() - 0.5) * 12) + '/т';
}
setInterval(updatePanel, 4000);

// ── DateTime ──
function updateDT() {
  const el = document.getElementById('wmDateTime');
  if (el) el.textContent = new Date().toLocaleString('ru-RU', {
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) + ' (UTC+5)';
}
setInterval(updateDT, 1000);
updateDT();
