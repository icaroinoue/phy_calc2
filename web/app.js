// app.js
// Ponte entre a UI e o núcleo compilado em C++ -> WebAssembly.
// IMPORTANTE: este arquivo precisa ser carregado ANTES de physics.js
// (o glue code gerado pelo Emscripten), pois ele reaproveita um objeto
// `Module` global se este já existir com `onRuntimeInitialized` definido.

let potentialEnergy, kineticEnergy, springEnergy;

window.Module = {
  onRuntimeInitialized() {
    // cwrap: (nomeExportado, tipoRetorno, [tiposParametros])
    potentialEnergy = Module.cwrap('potentialEnergy', 'number', ['number', 'number', 'number']);
    kineticEnergy   = Module.cwrap('kineticEnergy', 'number', ['number', 'number']);
    springEnergy    = Module.cwrap('springEnergy', 'number', ['number', 'number']);

    document.getElementById('wasm-status').classList.add('ready');
    document.getElementById('wasm-status-text').textContent = 'núcleo C++ carregado';

    initUI();
    calculate(); // primeira leitura ao carregar
  }
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function initUI() {
  const formulaSelect = document.getElementById('formula-select');
  const panels = { A: 'inputs-A', C: 'inputs-C', M: 'inputs-M' };

  formulaSelect.addEventListener('change', () => {
    Object.values(panels).forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(panels[formulaSelect.value]).classList.remove('hidden');

    document.querySelectorAll('.diagram-svg').forEach(el => el.classList.add('hidden'));
    document.getElementById('diagram-' + formulaSelect.value).classList.remove('hidden');

    calculate();
  });

  document.getElementById('calc-btn').addEventListener('click', calculate);

  // recalcula em tempo real ao digitar
  document.querySelectorAll('input[type="number"]').forEach(inp => {
    inp.addEventListener('input', calculate);
  });
}

function calculate() {
  const formula = document.getElementById('formula-select').value;
  let E = 0, label = '';

  if (formula === 'A') {
    const m = parseFloat(document.getElementById('A-m').value) || 0;
    const g = parseFloat(document.getElementById('A-g').value) || 0;
    const h = parseFloat(document.getElementById('A-h').value) || 0;
    E = potentialEnergy(m, g, h);
    label = `E = ${m} · ${g} · ${h}  (m · g · h)`;
    renderDiagramA(h);
  } else if (formula === 'C') {
    const m = parseFloat(document.getElementById('C-m').value) || 0;
    const v = parseFloat(document.getElementById('C-v').value) || 0;
    E = kineticEnergy(m, v);
    label = `E = ${m} · ${v}² / 2  (m · v² / 2)`;
    renderDiagramC(v);
  } else if (formula === 'M') {
    const k = parseFloat(document.getElementById('M-k').value) || 0;
    const x = parseFloat(document.getElementById('M-x').value) || 0;
    E = springEnergy(k, x);
    label = `E = ${k} · ${x}² / 2  (k · x² / 2)`;
    renderDiagramM(k, x);
  }

  document.getElementById('result-value').textContent = E.toFixed(2);
  document.getElementById('result-formula').textContent = label;
  updateGauge(E);
}

function updateGauge(E) {
  const needle = document.getElementById('needle');
  const magnitude = Math.log10(Math.max(E, 0) + 1); // escala log, energia varia muito de ordem
  const t = clamp(magnitude / 6, 0, 1); // 6 ordens de grandeza cobertas no mostrador
  const angleDeg = -90 + 180 * t;
  needle.style.transform = `rotate(${angleDeg}deg)`;
}

/* ---------- DIAGRAMA A: energia potencial ---------- */
function renderDiagramA(h) {
  const H = clamp(h, 0, 20);
  const groundY = 210;
  const pxH = clamp(H * 6, 20, 150);
  const blockY = groundY - pxH - 34;

  document.getElementById('mass-block-A').setAttribute('y', blockY);
  const dim = document.getElementById('dim-h');
  dim.setAttribute('y1', blockY + 34);
  dim.setAttribute('y2', groundY);

  const label = document.getElementById('dim-h-label');
  label.setAttribute('y', (blockY + 34 + groundY) / 2);
  label.textContent = `h = ${H.toFixed(2)} m`;

  drawHatch('hatch-ground', 20, 300, 210, 18);
}

/* ---------- DIAGRAMA C: energia cinética ---------- */
function renderDiagramC(v) {
  const V = clamp(v, 0, 50);
  const len = clamp(20 + V * 3, 20, 165);
  const vec = document.getElementById('vec-v');
  vec.setAttribute('x2', 128 + len);

  const label = document.getElementById('vec-v-label');
  label.setAttribute('x', 128 + len / 2);
  label.textContent = `v = ${V.toFixed(2)} m/s`;
}

/* ---------- DIAGRAMA M: energia elástica ---------- */
function renderDiagramM(k, x) {
  const naturalLen = 220;
  const compressionPx = clamp(Math.abs(x) * 400, 0, 170);
  const wallX = 30;
  const blockLeft = wallX + (naturalLen - compressionPx);
  const midY = 90;

  // zigue-zague da mola
  const segments = 10;
  const amp = 14;
  let points = [`${wallX},${midY}`];
  for (let i = 1; i < segments; i++) {
    const px = wallX + ((blockLeft - wallX) * i) / segments;
    const py = midY + (i % 2 === 0 ? amp : -amp);
    points.push(`${px},${py}`);
  }
  points.push(`${blockLeft},${midY}`);
  document.getElementById('spring-coil').setAttribute('points', points.join(' '));

  const block = document.getElementById('mass-block-M');
  block.setAttribute('x', blockLeft);
  block.setAttribute('y', midY - 15);

  const dim = document.getElementById('dim-x');
  dim.setAttribute('x1', blockLeft);
  dim.setAttribute('x2', wallX + naturalLen);
  dim.setAttribute('y1', midY + 30);
  dim.setAttribute('y2', midY + 30);

  const label = document.getElementById('dim-x-label');
  label.setAttribute('x', (blockLeft + wallX + naturalLen) / 2 - 10);
  label.setAttribute('y', midY + 46);
  label.textContent = `x = ${x.toFixed(2)} m`;

  drawHatch('wall-hatch', 40, 180, 40, 6, true);
}

/* Desenha um trilho de hachuras (símbolo técnico de solo/parede fixa) */
function drawHatch(groupId, x1, x2, y, count, vertical = false) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.innerHTML = '';
  const step = (x2 - x1) / count;
  for (let i = 0; i <= count; i++) {
    const px = x1 + step * i;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    if (vertical) {
      line.setAttribute('x1', 30);
      line.setAttribute('x2', 30 - 8);
      line.setAttribute('y1', px);
      line.setAttribute('y2', px + 8);
    } else {
      line.setAttribute('x1', px);
      line.setAttribute('x2', px - 8);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y + 10);
    }
    line.setAttribute('stroke', 'var(--line)');
    line.setAttribute('stroke-width', '1');
    group.appendChild(line);
  }
}
