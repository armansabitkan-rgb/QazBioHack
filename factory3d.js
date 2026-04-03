// ═══════════════════════════════════════════════════════════
// QazaqBioHub — 3D Factory Visualization (Three.js)
// Interactive transformer plant model
// ═══════════════════════════════════════════════════════════

(function() {
  const canvas = document.getElementById('factoryCanvas');
  if (!canvas) return;

  const W = canvas.parentElement.offsetWidth;
  const H = canvas.parentElement.offsetHeight;

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ── Scene ──
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4ff);
  scene.fog = new THREE.Fog(0xf0f4ff, 30, 80);

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
  camera.position.set(18, 14, 20);
  camera.lookAt(0, 0, 0);

  // ── Lights ──
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(20, 30, 15);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  dirLight.shadow.mapSize.set(2048, 2048);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.4);
  fillLight.position.set(-10, 5, -10);
  scene.add(fillLight);

  // ── Ground plane ──
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xe8edf5 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid lines on ground
  const gridHelper = new THREE.GridHelper(60, 30, 0xd0d8e8, 0xd0d8e8);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // ── Helper: Create building block ──
  function makeBuilding(w, h, d, color, x, y, z, name, branchKey) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 60,
      transparent: true, opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { name, branchKey, originalColor: color, mat };

    // Edge outline
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    mesh.add(edges);

    scene.add(mesh);
    return mesh;
  }

  // ── Helper: Cylinder (pipe/silo) ──
  function makeCylinder(r, h, color, x, y, z, name, branchKey) {
    const geo = new THREE.CylinderGeometry(r, r * 1.05, h, 16);
    const mat = new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: 80 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.userData = { name, branchKey, originalColor: color, mat };
    scene.add(mesh);
    return mesh;
  }

  // ── Helper: Sphere (tank) ──
  function makeSphere(r, color, x, y, z, name, branchKey) {
    const geo = new THREE.SphereGeometry(r, 16, 16);
    const mat = new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: 100, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + r, z);
    mesh.castShadow = true;
    mesh.userData = { name, branchKey, originalColor: color, mat };
    scene.add(mesh);
    return mesh;
  }

  // ── Helper: Pipe connector ──
  function makePipe(x1, y1, z1, x2, y2, z2, color, branchKey) {
    const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.12, 0.12, len, 8);
    const mat = new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: 40 });
    const mesh = new THREE.Mesh(geo, mat);
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2, midZ = (z1 + z2) / 2;
    mesh.position.set(midX, midY, midZ);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.userData = { branchKey, isPipe: true };
    scene.add(mesh);
    return mesh;
  }

  // ── Helper: Floating label sprite ──
  function makeLabel(text, x, y, z) {
    const canvas2 = document.createElement('canvas');
    canvas2.width = 256; canvas2.height = 64;
    const ctx = canvas2.getContext('2d');
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.roundRect(4, 4, 248, 56, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas2);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 1, 1);
    sprite.userData = { isLabel: true };
    scene.add(sprite);
    return sprite;
  }

  // ═══════════════════════════════════
  // BUILD THE FACTORY
  // ═══════════════════════════════════
  const interactable = [];

  // ── TRUNK (Base processing) — Blue ──
  const grainSilo1 = makeCylinder(0.9, 6, '#94a3b8', -5, 0, 0, 'Зерновой элеватор', 'trunk');
  const grainSilo2 = makeCylinder(0.9, 7, '#94a3b8', -3.5, 0, 0, 'Зерновой элеватор', 'trunk');
  const grainSilo3 = makeCylinder(0.9, 5.5, '#94a3b8', -4.8, 0, 2, 'Зерновой элеватор', 'trunk');
  const mainBuilding = makeBuilding(5, 3.5, 4, '#2563EB', -1, 0, 0, 'Мельничный корпус (помол)', 'trunk');
  const separator = makeBuilding(3, 3, 3, '#3b82f6', 2.5, 0, 0, 'Сепаратор крахмал/глютен', 'trunk');
  const glutenTank = makeCylinder(0.8, 3.5, '#dbeafe', 2.5, 0, 3, 'Глютеновый резервуар', 'trunk');
  const starchTank = makeSphere(1.0, '#bfdbfe', 4.5, 0, 0, 'Крахмальный реактор', 'trunk');

  interactable.push(
    { mesh: grainSilo1, data: { icon: '🌾', title: 'Зерновой элеватор', sub: 'Базовый ствол', body: '<b>Вместимость:</b> 50 000 тонн<br><b>Типы:</b> Пшеница, Кукуруза<br><b>Автоматизация:</b> ИИ-весы + влажномер<br><br>Зерно поступает с полей и хранится после базовой очистки.' } },
    { mesh: mainBuilding, data: { icon: '⚙️', title: 'Мельничный корпус', sub: 'Помол зерна', body: '<b>Мощность:</b> 500 т/сутки<br><b>Тип:</b> Вальцевая мельница + аэросепаратор<br><b>Выход:</b> 72% крахмальное молоко + 28% отруби<br><br>Ключевой базовый этап — работает 24/7 независимо от выбранной ветки.' } },
    { mesh: separator, data: { icon: '🔬', title: 'Сепаратор крахмал/глютен', sub: 'Разделение потоков', body: '<b>Крахмал:</b> 62% → в реакторы<br><b>Глютен:</b> 10% → прямая продажа<br><b>Цена глютена:</b> $180–220/т<br><br>Глютен всегда уходит в продажу. Из крахмала выбирается нужная ветка.' } },
    { mesh: starchTank, data: { icon: '💧', title: 'Крахмальный реактор', sub: 'Центральный хаб переключения', body: '<b>Объём:</b> 2 000 м³<br><b>Функция:</b> Распределение на Ветки А/Б/В<br><b>Время переключения:</b> 48 часов<br><br>Из этой точки ИИ-навигатор направляет крахмал в нужную ветку в зависимости от цен.' } }
  );

  // ── BRANCH A — GFS (Glucose-Fructose Syrup) — Green ──
  const branchABuilding = makeBuilding(4, 2.8, 3.5, '#10b981', 7, 0, -4, 'Гидролиз → ГФС', 'A');
  const gfsTank1 = makeCylinder(0.75, 3, '#6ee7b7', 8.5, 0, -4, 'Резервуар ГФС-42', 'A');
  const gfsTank2 = makeCylinder(0.75, 3.5, '#6ee7b7', 9.5, 0, -2.5, 'Резервуар ГФС-55', 'A');
  interactable.push(
    { mesh: branchABuilding, data: { icon: '🍬', title: 'Ветка А — ГФС', sub: 'Глюкозно-фруктозные сиропы', body: '<b>Цена:</b> $620–680/т<br><b>Рынок:</b> Coca-Cola, соки, энергетики<br><b>Сезон:</b> Лето (апр–сент)<br><b>Сигнал активации:</b> Сахар > $480/т<br><br>Крахмал проходит ферментативный гидролиз. На выходе — жидкий сироп в ISO-танкерах в Китай, Россию.' } },
    { mesh: gfsTank1, data: { icon: '🫙', title: 'Резервуар ГФС-42', sub: 'Ветка А', body: '<b>ГФС-42:</b> 42% фруктозы<br><b>Применение:</b> Хлебопечение, соки<br><b>Объём:</b> 500 м³<br><b>Отгрузка:</b> ISO-танкеры → Китай' } }
  );

  // ── BRANCH B — Bioethanol — Amber ──
  const branchBBuilding = makeBuilding(4.5, 4, 4, '#d97706', 7, 0, 4, 'Ферментация → Биоэтанол', 'B');
  const distColumn = makeCylinder(0.5, 6, '#fbbf24', 9.5, 0, 4, 'Ректификационная колонна', 'B');
  const ethanolSphere = makeSphere(1.0, '#fef08a', 11, 0, 3, 'Резервуар биоэтанола', 'B');
  interactable.push(
    { mesh: branchBBuilding, data: { icon: '⛽', title: 'Ветка Б — Биоэтанол', sub: 'Дрожжевая ферментация', body: '<b>Цена:</b> $700–780/т<br><b>Рынок:</b> Автотопливо E10/E85, Сибирский коридор<br><b>Сезон:</b> Октябрь–март<br><b>Сигнал:</b> Нефть Brent > $85<br><br>Крахмал + дрожжи + 72ч ферментации = биоэтанол. Конкурирует с нефтяными ценами.' } },
    { mesh: distColumn, data: { icon: '🏭', title: 'Ректификационная колонна', sub: 'Ветка Б', body: '<b>Высота:</b> 24м (реальная)<br><b>Степень чистоты:</b> 99.5% этанол<br><b>Мощность:</b> 150 т/сутки<br><b>Маршрут:</b> ж/д → Актобе → Самара' } }
  );

  // ── BRANCH C — Amino acids — Purple ──
  const branchCBuilding = makeBuilding(4, 3, 3.5, '#8b5cf6', 7, 0, -10, 'Биосинтез → Аминокислоты', 'C');
  const bioreactor1 = makeCylinder(0.7, 4.5, '#a78bfa', 9, 0, -10, 'Ферментер Лизин', 'C');
  const bioreactor2 = makeCylinder(0.55, 3.5, '#c4b5fd', 9, 0, -8, 'Ферментер Лим. кислота', 'C');
  const aminoTank = makeSphere(0.8, '#ede9fe', 11, 0, -9.5, 'Кристаллизатор', 'C');
  interactable.push(
    { mesh: branchCBuilding, data: { icon: '🧬', title: 'Ветка В — Аминокислоты', sub: 'Микробиологический синтез', body: '<b>Цена лизина:</b> $2 800–3 200/т<br><b>Рынок:</b> Птицефабрики КЗ/РФ/CN<br><b>Сезон:</b> Февраль–апрель<br><b>Сигнал:</b> Птицеводство ↑<br><br>Самая высокомаржинальная ветка. Бактерии Corynebacterium glutamicum синтезируют лизин из крахмала.' } },
    { mesh: bioreactor1, data: { icon: '🔬', title: 'Ферментер Лизин', sub: 'Ветка В', body: '<b>Объём:</b> 300 м³<br><b>Бактерии:</b> Corynebacterium glutamicum<br><b>Цикл:</b> 30–36ч<br><b>Выход:</b> 38 кг лизина/т крахмала<br><b>Стоимость:</b> $3 000/т → маржа ×16 vs мука' } }
  );

  // ── Pipe connectors ──
  // Trunk pipes
  makePipe(-0.5, 2, 0, 1.5, 2, 0, '#60a5fa', 'trunk');
  makePipe(4.0, 1.8, 0, 5.5, 1.8, 0, '#60a5fa', 'trunk');

  // To Branch A
  makePipe(5.5, 1.5, 0, 5.5, 1.5, -3.5, '#6ee7b7', 'A');
  makePipe(5.5, 1.5, -3.5, 6.8, 1.5, -3.5, '#6ee7b7', 'A');

  // To Branch B
  makePipe(5.5, 1.5, 0, 5.5, 1.5, 3.5, '#fbbf24', 'B');
  makePipe(5.5, 1.5, 3.5, 6.8, 1.5, 3.5, '#fbbf24', 'B');

  // To Branch C
  makePipe(5.5, 1.5, 0, 5.5, 1.5, -8, '#a78bfa', 'C');
  makePipe(5.5, 1.5, -8, 6.8, 1.5, -8, '#a78bfa', 'C');

  // ── Labels ──
  makeLabel('🌾 Зерновой элеватор', -4, 8, 0);
  makeLabel('⚙️ Помол & Сепарация', 1, 5, 0);
  makeLabel('🍬 Ветка А: ГФС', 8, 5, -4);
  makeLabel('⛽ Ветка Б: Биоэтанол', 8, 6.5, 4);
  makeLabel('🧬 Ветка В: Аминокислоты', 8, 5.5, -10);

  // ── Floating particles (steam / activity) ──
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  const particleData = [];
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    particleData.push({ vx: 0, vy: 0.02 + Math.random() * 0.03, vz: 0, life: Math.random() });
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xbfdbfe, size: 0.15, transparent: true, opacity: 0.6
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ═══════════════════════════════════
  // ORBIT CONTROLS (manual)
  // ═══════════════════════════════════
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let theta = 0.6, phi = 0.9, radius = 28;
  const target = new THREE.Vector3(0, 2, 0);

  function updateCamera() {
    camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = target.y + radius * Math.cos(phi);
    camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    camera.lookAt(target);
  }
  updateCamera();

  canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    theta -= dx * 0.005;
    phi = Math.max(0.2, Math.min(Math.PI * 0.45, phi + dy * 0.005));
    prevMouse = { x: e.clientX, y: e.clientY };
    updateCamera();
  });
  canvas.addEventListener('wheel', e => {
    radius = Math.max(8, Math.min(50, radius + e.deltaY * 0.04));
    updateCamera();
    e.preventDefault();
  }, { passive: false });

  // Touch support
  let lastTouchDist = 0;
  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      radius = Math.max(8, Math.min(50, radius - (d - lastTouchDist) * 0.05));
      lastTouchDist = d; updateCamera();
    } else if (isDragging) {
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      theta -= dx * 0.005;
      phi = Math.max(0.2, Math.min(Math.PI * 0.45, phi + dy * 0.005));
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCamera();
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { isDragging = false; });

  // ═══════════════════════════════════
  // RAYCASTING (click on objects)
  // ═══════════════════════════════════
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const panel = document.getElementById('factoryInfoPanel');
  const fipIcon = document.getElementById('fipIcon');
  const fipTitle = document.getElementById('fipTitle');
  const fipSub = document.getElementById('fipSub');
  const fipBody = document.getElementById('fipBody');

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = interactable.map(i => i.mesh);
    const hits = raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
      const hit = hits[0].object;
      const match = interactable.find(i => i.mesh === hit);
      if (match) {
        fipIcon.textContent = match.data.icon;
        fipTitle.textContent = match.data.title;
        fipSub.textContent = match.data.sub;
        fipBody.innerHTML = match.data.body;
        panel.classList.add('visible');
        // Pulse the hit object
        gsap.to(hit.scale, { y: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
      }
    }
  });

  // ═══════════════════════════════════
  // BRANCH SELECTION
  // ═══════════════════════════════════
  const branchColors = {
    trunk: 0x60a5fa,
    A: 0x10b981,
    B: 0xd97706,
    C: 0x8b5cf6,
  };
  const dimColor = 0x94a3b8;

  window.selectBranch = function(branch) {
    document.querySelectorAll('.branch-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-branch="${branch}"]`).classList.add('active');

    const ind = document.getElementById('factoryActiveInd');
    const dot = document.getElementById('faiDot');
    const txt = document.getElementById('faiText');

    const branchLabels = {
      all: 'Все ветки активны',
      A: 'Ветка А — ГФС активна',
      B: 'Ветка Б — Биоэтанол активна',
      C: 'Ветка В — Аминокислоты активна',
    };
    const branchDots = { all: '#10b981', A: '#10b981', B: '#f59e0b', C: '#8b5cf6' };
    txt.textContent = branchLabels[branch];
    dot.style.background = branchDots[branch];

    // Dim/highlight all objects
    scene.traverse(obj => {
      if (obj.isMesh && obj.userData.mat) {
        const bk = obj.userData.branchKey;
        if (branch === 'all') {
          obj.userData.mat.opacity = 0.92;
          obj.userData.mat.color.set(obj.userData.originalColor);
        } else if (bk === branch || bk === 'trunk') {
          obj.userData.mat.opacity = 0.95;
          obj.userData.mat.color.set(obj.userData.originalColor);
        } else {
          obj.userData.mat.opacity = 0.2;
        }
      }
      if (obj.isLine && obj.userData.branchKey) {
        const bk = obj.userData.branchKey;
        obj.material.opacity = (branch === 'all' || bk === branch || bk === 'trunk') ? 0.3 : 0.05;
      }
    });
  };

  window.highlightBranch = function(branch) {
    selectBranch(branch === 'trunk' ? 'all' : branch);
  };

  // ═══════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════
  let animTime = 0;
  function animate() {
    requestAnimationFrame(animate);
    animTime += 0.016;

    // Animate particles
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += particleData[i].vy;
      particleData[i].life += 0.01;
      if (pos[i * 3 + 1] > 10 || particleData[i].life > 1) {
        pos[i * 3] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        particleData[i].life = 0;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Gentle auto rotate when not dragging
    if (!isDragging) {
      theta += 0.0005;
      updateCamera();
    }

    // Animate tank sphere bob
    if (starchTank) starchTank.position.y = 1 + Math.sin(animTime * 1.2) * 0.08;

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    const w = canvas.parentElement.offsetWidth;
    const h = canvas.parentElement.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
})();

// ═══════════════════════════════════
// Close panel
// ═══════════════════════════════════
function closeFactoryPanel() {
  document.getElementById('factoryInfoPanel').classList.remove('visible');
}
