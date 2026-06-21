// ==================== CONFIG ====================
// ✅ V1.26 - URL DE LA API
const API = 'https://script.google.com/macros/s/AKfycbzRZPu2wH1FRq92I_VuRFv7088nJHLjHrM2cbTdWApZ_-w7r9Hy1Fx3EeF5L9lBqCao/exec';
let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';
let rol = localStorage.getItem('rol') || '';
let nombreJuego = localStorage.getItem('nombreJuego') || '';

async function apiCall(body) {
  if (token) body.token = token;
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) });
  return await r.json();
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if (!email || !pass) return showAuthError('Completa todos los campos');
  const res = await apiCall({ action: 'login', email, password: pass });
  if (res.success) {
    token = res.token; userId = res.userId; rol = res.rol; nombreJuego = res.nombreJuego;
    localStorage.setItem('token', token); localStorage.setItem('userId', userId);
    localStorage.setItem('rol', rol); localStorage.setItem('nombreJuego', nombreJuego);
    document.getElementById('authBox').classList.add('hidden');
    document.getElementById('appMain').classList.remove('hidden');
    initApp();
  } else showAuthError(res.error);
}

async function register() {
  const data = {
    action: 'registro',
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regPass').value.trim(),
    nombreJuego: document.getElementById('regNombre').value.trim(),
    tag: document.getElementById('regTag').value.trim(),
    supercellId: document.getElementById('regSupercell').value.trim(),
    telefono: document.getElementById('regTel').value.trim()
  };
  if (!data.email || !data.password || !data.nombreJuego) return showAuthError('Completa los campos obligatorios');
  const res = await apiCall(data);
  if (res.success) {
    toast('Cuenta creada. Inicia sesión.');
    switchAuthTab('login');
  } else showAuthError(res.error);
}

function showAuthError(msg) { document.getElementById('authError').textContent = msg; }
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('authFormLogin').classList.add('hidden');
  document.getElementById('authFormRegister').classList.add('hidden');
  if (tab === 'login') {
    document.querySelector('.auth-tab:nth-child(1)').classList.add('active');
    document.getElementById('authFormLogin').classList.remove('hidden');
  } else {
    document.querySelector('.auth-tab:nth-child(2)').classList.add('active');
    document.getElementById('authFormRegister').classList.remove('hidden');
  }
  document.getElementById('authError').textContent = '';
}

function logout() {
  localStorage.clear(); token = ''; userId = ''; rol = ''; nombreJuego = '';
  location.reload();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

function toast(m, t='success') {
  const c = document.getElementById('toastContainer');
  const d = document.createElement('div');
  d.className = `toast ${t}`; d.textContent = m; c.appendChild(d);
  playBeep(); setTimeout(() => d.remove(), 3000);
}

function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
  const btn = document.getElementById('menuBtn');
  if (btn) btn.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
  const btn = document.getElementById('menuBtn');
  if (btn) btn.classList.remove('open');
}

function switchTab(tab, el) {
  document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + tab);
  if (panel) panel.classList.add('active');
  if (typeof onTabSwitch === 'function') onTabSwitch(tab);
  closeMenu();
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function ampliar(url) {
  document.getElementById('imagenGrande').src = url;
  document.getElementById('modalImagen').classList.remove('hidden');
}

function acceptCookies() {
  localStorage.setItem('cookiesAccepted', '1');
  document.getElementById('cookieBanner').classList.add('hidden');
}
if (localStorage.getItem('cookiesAccepted') === '1') {
  document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.add('hidden');
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const wabtn = document.getElementById('whatsapp-btn');
    if (wabtn) {
        wabtn.classList.add('show');
        setTimeout(() => {
            wabtn.classList.add('tooltip-active');
            setTimeout(() => {
                wabtn.classList.remove('tooltip-active');
            }, 2000);
        }, 10000);
    }
});

// Formateador de moneda venezolana (Bs)
function formatVES(amount) {
    if (isNaN(amount)) return '0,00';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

let cacheBatallasAdmin = null, cacheUsuarios = null;
let cacheRecargas = [], cacheRetiros = [], cacheMovimientosAdmin = [];
let pendingRecargas = 0, pendingRetiros = 0;
let cachePerfil = null;

async function initAdmin() {
  cachePerfil = await apiCall({ action: 'getPerfil', userId });
  await updateSidebarStatsAdmin();
  cacheBatallasAdmin = await apiCall({ action: 'getBatallas' });
  cacheUsuarios = await apiCall({ action: 'getUsuarios' });
  const todosMovs = await apiCall({ action: 'getMovimientos' });
  cacheRecargas = todosMovs.filter(m => m.tipo === 'Recarga' && m.estado === 'Pendiente');
  cacheRetiros = todosMovs.filter(m => m.tipo === 'Retiro' && m.estado === 'Pendiente');
  cacheMovimientosAdmin = todosMovs.filter(m => m.estado !== 'Pendiente');
  pendingRecargas = cacheRecargas.length;
  pendingRetiros = cacheRetiros.length;
  updateBadges();
  renderBatallasAdmin();
  renderUsuariosAdmin();
  renderRecargasAdmin();
  renderRetirosAdmin();
  renderMovimientosAdmin();
  renderDisputasAdmin(cacheBatallasAdmin.filter(b => b.estado === 'Disputa'));
  renderAjustes();
}

async function updateSidebarStatsAdmin() {
    const gStats = await apiCall({ action: 'getAdminStats' });
    if (gStats.totalSaldo !== undefined) {
        const statsContainer = document.getElementById('sidebarStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class='sidebar-stat'><div class='val gold'>$${gStats.totalSaldo.toFixed(2)}</div><div class='lbl'>Saldo Total</div></div>
                <div class='sidebar-stat'><div class='val green'>$${gStats.totalRecargas.toFixed(2)}</div><div class='lbl'>Recargas Totales</div></div>
                <div class='sidebar-stat'><div class='val red'>$${gStats.totalRetiros.toFixed(2)}</div><div class='lbl'>Retiros Totales</div></div>
                <div class='sidebar-stat'><div class='val gold'>$${gStats.gananciasCasa.toFixed(2)}</div><div class='lbl'>Ganancias Casa</div></div>
            `;
        }
    }
}

function updateBadges() {
  const badgeRec = document.getElementById('badgeRecargas');
  const badgeRet = document.getElementById('badgeRetiros');
  if (badgeRec) { badgeRec.textContent = pendingRecargas; badgeRec.style.display = pendingRecargas > 0 ? 'inline' : 'none'; }
  if (badgeRet) { badgeRet.textContent = pendingRetiros; badgeRet.style.display = pendingRetiros > 0 ? 'inline' : 'none'; }
}

function renderBatallasAdmin(filtro = '') {
  let batallas = cacheBatallasAdmin || [];
  if (filtro) batallas = batallas.filter(b => b.estado === filtro);
  let html = `<div style='margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap;'>
    <select onchange='renderBatallasAdmin(this.value)' style='padding:8px 12px; border-radius:8px; background:var(--bg-card); color:white; border:2px solid var(--gold-border);'>
      <option value=''>Todos</option>
      <option value='Pendiente de pago'>Pendiente de pago</option>
      <option value='Lista para jugar'>Lista para jugar</option>
      <option value='Disputa'>Disputa</option>
      <option value='Finalizada'>Finalizada</option>
    </select>
  </div>`;
  html += `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>J1</th><th>J2</th><th>Estado</th><th>Ganador</th></tr></thead><tbody>`;
  batallas.forEach(b => {
    const badgeEstado = b.estado === 'Pendiente de pago' ? 'badge-pending' : b.estado === 'Lista para jugar' ? 'badge-ready' : b.estado === 'Disputa' ? 'badge-pending' : 'badge-done';
    html += `<tr><td data-label="ID:">#${b.id}</td><td data-label="Retador">${b.j1Nombre} ${b.j1Tag}</td><td data-label="Oponente">${b.j2Nombre} ${b.j2Tag}</td><td data-label="Estado"><span class='badge ${badgeEstado}'>${b.estado}</span></td><td data-label="Ganador">${b.ganador === 'J1' ? b.j1Nombre : b.ganador === 'J2' ? b.j2Nombre : '-'}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-batallas').innerHTML = html;
}

function renderDisputasAdmin(disputas) {
  let html = '';
  if (disputas.length > 0) {
    html += `<h4>Disputas pendientes por trampa</h4><div class='table-wrapper'><table><thead><tr><th>ID</th><th>J1</th><th>J2</th><th>Acción</th></tr></thead><tbody>`;
    disputas.forEach(b => {
      html += `<tr><td data-label="ID:">#${b.id}</td><td data-label="J1">${b.j1Nombre} (${b.j1Tag})</td><td data-label="J2">${b.j2Nombre} (${b.j2Tag})</td><td data-label="Acción"><button class='btn btn-blue btn-sm' onclick='declararGanadorAdmin(${b.id}, 1)'>J1 ganó</button> <button class='btn btn-blue btn-sm' onclick='declararGanadorAdmin(${b.id}, 2)'>J2 ganó</button></td></tr>`;
    });
    html += '</tbody></table></div>';
  } else {
    html = '<p style="color:var(--text-secondary);">No hay disputas abiertas en este momento.</p>';
  }
  document.getElementById('panel-disputas').innerHTML = html;
}

async function declararGanadorAdmin(batallaId, jugador) {
  const res = await apiCall({ action: 'declararGanador', batallaId, ganador: jugador });
  if (res.success) {
    toast('Ganador actualizado');
    cacheBatallasAdmin = await apiCall({ action: 'getBatallas' });
    renderBatallasAdmin();
    renderDisputasAdmin(cacheBatallasAdmin.filter(b => b.estado === 'Disputa'));
    updateSidebarStatsAdmin();
  }
}

function renderUsuariosAdmin(users) {
  if (!users) users = cacheUsuarios || [];
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Email</th><th>Nombre</th><th>Tag</th><th>Supercell ID</th><th>Teléfono</th><th>Rol</th><th>Saldo</th></tr></thead><tbody>`;
  users.forEach(u => {
    html += `<tr><td data-label="ID:">${u.id}</td><td data-label="Email">${u.email}</td><td data-label="Nombre">${u.nombreJuego}</td><td data-label="Tag">${u.tag}</td><td data-label="Supercell">${u.supercellId}</td><td data-label="Teléfono">${u.telefono}</td><td data-label="Rol">${u.rol}</td><td data-label="Saldo">$${parseFloat(u.saldo || 0).toFixed(2)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-jugadores').innerHTML = html;
}

function renderRecargasAdmin() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Referencia</th><th>Acciones</th></tr></thead><tbody>`;
  cacheRecargas.forEach(r => {
    html += `<tr><td data-label="ID:">#${r.id}</td><td data-label="Usuario">${r.nombre} (${r.tag})</td><td data-label="Monto">$${r.monto}</td><td data-label="Referencia">${r.referencia}</td><td data-label="Acciones">
      <button class='btn btn-green btn-sm' onclick='verificarRecarga(${r.id})'>✓</button>
      <button class='btn btn-red btn-sm' onclick='rechazarRecarga(${r.id})'>✗</button>
    </td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!cacheRecargas.length) html = '<p>No hay recargas pendientes.</p>';
  document.getElementById('panel-recargas').innerHTML = html;
}

function renderRetirosAdmin() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Referencia</th><th>Acciones</th></tr></thead><tbody>`;
  cacheRetiros.forEach(r => {
    html += `<tr><td data-label="ID:">#${r.id}</td><td data-label="Usuario">${r.nombre} (${r.tag})</td><td data-label="Monto">$${r.monto}</td><td data-label="Referencia">${r.referencia}</td><td data-label="Acciones">
      <button class='btn btn-green btn-sm' onclick='verificarRetiro(${r.id})'>✓</button>
      <button class='btn btn-red btn-sm' onclick='rechazarRetiro(${r.id})'>✗</button>
    </td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!cacheRetiros.length) html = '<p>No hay retiros pendientes.</p>';
  document.getElementById('panel-retiros').innerHTML = html;
}

function renderMovimientosAdmin() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Usuario</th><th>Tipo</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMovimientosAdmin.forEach(m => {
    const badge = m.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td data-label="ID:">#${m.id}</td><td data-label="Usuario">${m.nombre} (${m.tag})</td><td data-label="Tipo">${m.tipo}</td><td data-label="Monto">$${m.monto}</td><td data-label="Referencia">${m.referencia}</td><td data-label="Estado"><span class='badge ${badge}'>${m.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-movimientos').innerHTML = html;
}

async function verificarRecarga(id) {
  const res = await apiCall({ action: 'verificarRecarga', movimientoId: id });
  if (res.success) {
    toast('Recarga verificada');
    const todosMovs = await apiCall({ action: 'getMovimientos' });
    cacheRecargas = todosMovs.filter(m => m.tipo === 'Recarga' && m.estado === 'Pendiente');
    cacheMovimientosAdmin = todosMovs.filter(m => m.estado !== 'Pendiente');
    pendingRecargas = cacheRecargas.length;
    updateBadges();
    renderRecargasAdmin();
    renderMovimientosAdmin();
    updateSidebarStatsAdmin();
  } else toast(res.error, 'error');
}

async function rechazarRecarga(id) {
  const res = await apiCall({ action: 'rechazarRecarga', movimientoId: id });
  if (res.success) {
    toast('Recarga rechazada');
    const todosMovs = await apiCall({ action: 'getMovimientos' });
    cacheRecargas = todosMovs.filter(m => m.tipo === 'Recarga' && m.estado === 'Pendiente');
    cacheMovimientosAdmin = todosMovs.filter(m => m.estado !== 'Pendiente');
    pendingRecargas = cacheRecargas.length;
    updateBadges();
    renderRecargasAdmin();
    renderMovimientosAdmin();
    updateSidebarStatsAdmin();
  } else toast(res.error, 'error');
}

async function verificarRetiro(id) {
  const res = await apiCall({ action: 'verificarRetiro', movimientoId: id });
  if (res.success) {
    toast('Retiro verificado');
    const todosMovs = await apiCall({ action: 'getMovimientos' });
    cacheRetiros = todosMovs.filter(m => m.tipo === 'Retiro' && m.estado === 'Pendiente');
    cacheMovimientosAdmin = todosMovs.filter(m => m.estado !== 'Pendiente');
    pendingRetiros = cacheRetiros.length;
    updateBadges();
    renderRetirosAdmin();
    renderMovimientosAdmin();
    updateSidebarStatsAdmin();
  } else toast(res.error, 'error');
}

async function rechazarRetiro(id) {
  const res = await apiCall({ action: 'rechazarRetiro', movimientoId: id });
  if (res.success) {
    toast('Retiro rechazado');
    const todosMovs = await apiCall({ action: 'getMovimientos' });
    cacheRetiros = todosMovs.filter(m => m.tipo === 'Retiro' && m.estado === 'Pendiente');
    cacheMovimientosAdmin = todosMovs.filter(m => m.estado !== 'Pendiente');
    pendingRetiros = cacheRetiros.length;
    updateBadges();
    renderRetirosAdmin();
    renderMovimientosAdmin();
    updateSidebarStatsAdmin();
  } else toast(res.error, 'error');
}

function renderAjustes() {
  const a = window.ajustes || {};
  const p = cachePerfil || {};

  // ✅ V1.26: LISTA COMPLETA DE BANCOS
  const allBanks = [
    '0102 - BANCO DE VENEZUELA',
    '0104 - BANCO VENEZOLANO DE CREDITO',
    '0105 - BANCO MERCANTIL',
    '0108 - BBVA PROVINCIAL',
    '0114 - BANCARIBE',
    '0115 - BANCO EXTERIOR',
    '0128 - BANCO CARONÍ',
    '0134 - BANESCO',
    '0137 - BANCO SOFITASA',
    '0138 - BANCO PLAZA',
    '0146 - BANGENTE',
    '0151 - BANCO FONDO COMÚN',
    '0156 - 100% BANCO',
    '0157 - DELSUR BANCO UNIVERSAL',
    '0163 - BANCO DEL TESORO',
    '0168 - BANCRECER',
    '0169 - R4 BANCO MICROFINANCIERO C.A.',
    '0171 - BANCO ACTIVO',
    '0172 - BANCAMIGA BANCO UNIVERSAL, C.A.',
    '0174 - BANPLUS',
    '0175 - BANCO DIGITAL DE LOS TRABAJADORES',
    '0177 - BANFANB',
    '0178 - N58 BANCO DIGITAL',
    '0191 - BANCO NACIONAL DE CREDITO',
    '0601 - INSTITUTO MUNICIPAL DE CREDITO POPULAR'
  ];

  const activeBanks = a.bancos_activos ? a.bancos_activos.split(',') : [];
  
  let myBankOptions = `<option value="">Selecciona un banco</option>`;
  if (activeBanks.length > 0) {
    myBankOptions = activeBanks.map(b => `<option value="${b}" ${a.pagoBanco === b ? 'selected' : ''}>${b}</option>`).join('');
  } else {
    myBankOptions = `<option value="" disabled>Primero activa bancos abajo</option>`;
  }

  let bankCheckboxes = allBanks.map(b => `
    <label class="bank-option">
      <input type="checkbox" class="bank-checkbox" value="${b}" ${activeBanks.includes(b) ? 'checked' : ''} />
      <span>${b}</span>
    </label>
  `).join('');

  document.getElementById('panel-ajustes').innerHTML = `
    <div style='display:grid; grid-template-columns:1fr 1fr; gap:16px;'>
      <div class='input-group'><label>Comisión casa ($)</label><input id='ajComision' value='${a.comisionCasa || 0.30}'/></div>
      <div class='input-group'><label>Premio ganador ($)</label><input id='ajPremio' value='${a.premioGanador || 1.70}'/></div>
      <div class='input-group'><label>Costo inscripción ($)</label><input id='ajCosto' value='${a.costoInscripcion || 1.00}'/></div>
      <div class='input-group'><label>Recarga mínima ($)</label><input id='ajMinRecarga' value='${a.minRecarga || 2}'/></div>
      <div class='input-group'><label>Recarga máxima ($)</label><input id='ajMaxRecarga' value='${a.maxRecarga || 50}'/></div>
      <div class='input-group'><label>Retiro mínimo ($)</label><input id='ajMinRetiro' value='${a.minRetiro || 2}'/></div>
      <div class='input-group'><label>Retiro máximo ($)</label><input id='ajMaxRetiro' value='${a.maxRetiro || 50}'/></div>
      <div class='input-group'><label>Mi Banco</label><select id='ajBanco'>${myBankOptions}</select></div>
      <div class='input-group'><label>Teléfono Pago</label><input id='ajTel' value='${a.pagoTelefono || ''}'/></div>
      <div class='input-group'><label>Cédula</label><input id='ajCedula' value='${a.pagoCedula || ''}'/></div>
      <div class='input-group'><label>Cuenta</label><input id='ajCuenta' value='${a.pagoCuenta || ''}'/></div>
      <div class='input-group'><label>Tasa $ (Recargas) [Bs]</label><input id='ajTasaRecarga' value='${a.tasaRecarga || 0}'/></div>
      <div class='input-group'><label>Tasa $ (Retiros) [Bs]</label><input id='ajTasaRetiro' value='${a.tasaRetiro || 0}'/></div>
    </div>
    <div style='margin-top:16px; border-top: 1px solid var(--border); padding-top:16px;'>
      <div class='input-group'>
         <label>Gestión de Bancos Activos (Marca y desmarca para activar/desactivar)</label>
         <div class="banks-checkbox-list">${bankCheckboxes}</div>
      </div>
    </div>
    <button class='btn btn-gold' onclick='guardarAjustes()' style='margin-top:16px;'>Guardar Ajustes</button>`;
}

async function guardarAjustes() {
  const checkedBoxes = document.querySelectorAll('.bank-checkbox:checked');
  const selectedBanks = Array.from(checkedBoxes).map(el => el.value);
  
  const a = {
    comisionCasa: document.getElementById('ajComision').value,
    premioGanador: document.getElementById('ajPremio').value,
    costoInscripcion: document.getElementById('ajCosto').value,
    minRecarga: document.getElementById('ajMinRecarga').value,
    maxRecarga: document.getElementById('ajMaxRecarga').value,
    minRetiro: document.getElementById('ajMinRetiro').value,
    maxRetiro: document.getElementById('ajMaxRetiro').value,
    pagoBanco: document.getElementById('ajBanco').value,
    pagoTelefono: document.getElementById('ajTel').value,
    pagoCedula: document.getElementById('ajCedula').value,
    pagoCuenta: document.getElementById('ajCuenta').value,
    tasaRecarga: document.getElementById('ajTasaRecarga').value,
    tasaRetiro: document.getElementById('ajTasaRetiro').value,
    bancos_activos: selectedBanks.join(',')
  };
  await apiCall({ action: 'saveAjustes', ajustes: a });
  window.ajustes = await apiCall({ action: 'getAjustes' });
  toast('Ajustes guardados');
}

let cachePerfilJugador = null, cacheMisBatallas = null, cacheBatallasAbiertas = null;
let cacheMisRecargas = [], cacheMisRetiros = [], cacheMiHistorial = [];

async function initJugador() {
  await updateSidebarStatsJugador();
  cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
  cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
  const todas = await apiCall({ action: 'getBatallas' });
  cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
  const todosMovs = await apiCall({ action: 'getMovimientos' });
  const misMovs = todosMovs.filter(m => m.userId == userId);
  cacheMisRecargas = misMovs.filter(m => m.tipo === 'Recarga');
  cacheMisRetiros = misMovs.filter(m => m.tipo === 'Retiro');
  cacheMiHistorial = misMovs.filter(m => m.estado !== 'Pendiente');
  renderDesafios();
  renderMisRecargas();
  renderMisRetiros();
  renderMiHistorial();
  renderPerfil();
}

async function updateSidebarStatsJugador() {
  const perfil = await apiCall({ action: 'getPerfil', userId });
  const mis = await apiCall({ action: 'getMisBatallas', userId });
  const ganadas = mis.filter(b => b.estado === 'Finalizada' && ((b.j1Id == userId && b.ganador === 'J1') || (b.j2Id == userId && b.ganador === 'J2'))).length;
  document.getElementById('statSaldo').textContent = '$' + parseFloat(perfil.saldo || 0).toFixed(2);
  document.getElementById('statGanadas').textContent = ganadas;
  document.getElementById('statActivas').textContent = mis.filter(b => b.estado !== 'Finalizada' && b.estado !== 'Disputa').length;
  document.getElementById('statFinalizadas').textContent = mis.filter(b => b.estado === 'Finalizada').length;
  document.getElementById('statGanancia').textContent = '$' + (ganadas * 1.70).toFixed(2);
}

function renderDesafios() {
  const misBatallas = cacheMisBatallas || [];
  const abiertas = cacheBatallasAbiertas || [];
  let all = [...abiertas, ...misBatallas];
  const uniqueIds = new Set();
  all = all.filter(b => { if (uniqueIds.has(b.id)) return false; uniqueIds.add(b.id); return true; });
  all.sort((a,b) => b.id - a.id);

  let html = `<div style='display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;'>
    <button class='btn btn-gold btn-sm' onclick='mostrarCrearBatallaAbierta()'><i class="fa-solid fa-plus"></i> Crear Desafío</button>
  </div>
  <div class='table-wrapper'><table><thead><tr>
    <th data-label="ID:">ID</th>
    <th data-label="Retador / Oponente">Retador / Oponente</th>
    <th data-label="Estado">Estado</th>
    <th data-label="Ganador">Ganador</th>
    <th data-label="Acción">Acción</th>
  </tr></thead><tbody>`;

  all.forEach(b => {
    const soyCreador = b.j1Id == userId;
    const soyOponente = b.j2Id == userId;
    
    let p1Name = b.j1Nombre || '?';
    let p2Name = b.j2Nombre || '';
    if (soyCreador) p1Name = '<strong>Tú</strong>';
    if (soyOponente) p2Name = '<strong>Tú</strong>';

    let vsHtml = '';
    if (b.j2Id) {
        vsHtml = `<div class="vs-box">
            <div class="vs-header"><span>Retador</span><span>🆚</span><span>Oponente</span></div>
            <div class="vs-body">
                <span class="vs-player">${p1Name}</span>
                <span class="vs-icon">🆚</span>
                <span class="vs-player">${p2Name}</span>
            </div>
        </div>`;
    } else {
        let emptyLabel = (b.j1Id == userId) ? 'Esperando oponente...' : 'Esperando...';
        vsHtml = `<div class="vs-box">
            <div class="vs-header"><span>Retador</span><span>🆚</span><span>Oponente</span></div>
            <div class="vs-body">
                <span class="vs-player">${p1Name}</span>
                <span class="vs-icon">🆚</span>
                <span class="vs-empty">${emptyLabel}</span>
            </div>
        </div>`;
    }

    let estadoTexto = b.estado;
    let badgeClass = 'badge-pending';
    if (b.estado === 'Pendiente de pago' && !b.j2Id) {
       estadoTexto = '🔓 Desafío abierto';
       badgeClass = 'badge-ready';
    } else if (b.estado === 'Lista para jugar') {
       estadoTexto = '⚔️ En juego';
       badgeClass = 'badge-review';
    } else if (b.estado === 'Disputa') {
       estadoTexto = '⚠️ Disputa';
       badgeClass = 'badge-pending';
    } else if (b.estado === 'Finalizada') {
       estadoTexto = '✅ Finalizada';
       badgeClass = 'badge-done';
    }

    let ganadorDisplay = b.ganador || '-';
    let accion = '';
    if (b.estado === 'Pendiente de pago' && !b.j2Id && b.j1Id != userId) {
       accion = `<button class='btn btn-blue btn-sm' onclick='mostrarModalUnion(${b.id})'>Aceptar Desafío</button>`;
    } else if (b.estado === 'Lista para jugar' && (soyCreador || soyOponente)) {
       const yaDeclaro = soyCreador ? b.declaracionJ1 : b.declaracionJ2;
       if (!yaDeclaro) {
         accion = `<button class='btn btn-gold btn-sm' onclick='mostrarDeclararResultado(${b.id})'>Declarar Resultado</button>`;
       } else {
         accion = '⏳ Esperando al oponente...';
       }
    } else if (b.estado === 'Pendiente de pago' && !b.j2Id && soyCreador) {
       accion = '⏳ Esperando oponente...';
    } else if (b.estado === 'Disputa' && (soyCreador || soyOponente)) {
      accion = `<span style='color:#FF4655; font-weight:bold;'>En revisión por admin</span>`;
    } else if (b.estado === 'Finalizada') {
      const soyGanador = b.ganador === (soyCreador ? 'J1' : 'J2');
      accion = soyGanador ? '🏆 Ganaste' : '😞 Perdiste';
      if (b.ganador === 'J1') ganadorDisplay = b.j1Nombre + ' 🏆';
      else if (b.ganador === 'J2') ganadorDisplay = b.j2Nombre + ' 🏆';
    }

    html += `<tr>
      <td data-label="ID:">#${b.id}</td>
      <td class="vs-row">${vsHtml}</td>
      <td data-label="Estado"><span class='badge ${badgeClass}'>${estadoTexto}</span></td>
      <td data-label="Ganador">${ganadorDisplay}</td>
      <td data-label="Acción">${accion}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  if (!all.length) html += '<p style="color:var(--text-secondary); text-align:center; margin-top:16px;">No hay desafíos activos en este momento. ¡Crea uno!</p>';
  document.getElementById('panel-desafios').innerHTML = html;
}

function renderPerfil() {
  const p = cachePerfilJugador || {};
  const a = window.ajustes || {};
  const activeBanks = a.bancos_activos ? a.bancos_activos.split(',') : [];

  let bankOptions = `<option value="">Selecciona un banco</option>`;
  if (activeBanks.length > 0) {
    bankOptions = activeBanks.map(b => `<option value="${b}" ${p.banco === b ? 'selected' : ''}>${b}</option>`).join('');
  } else {
    bankOptions = `<option value="" disabled>No hay bancos disponibles</option>`;
  }

  document.getElementById('panel-perfil').innerHTML = `
    <div class='balance-card'>
      <div class='balance-icon'>$</div>
      <div>
        <div style='font-size:0.8rem; color:var(--text-secondary);'>SALDO DISPONIBLE</div>
        <div style='font-size:1.8rem; font-weight:900; white-space:nowrap; text-shadow: 0 2px 4px rgba(0,0,0,0.5);'>$${parseFloat(p.saldo || 0).toFixed(2)}</div>
      </div>
      <div class='balance-actions'>
        <button class='btn btn-gold btn-sm' onclick='recargarSaldoUI()'>Recargar</button>
        <button class='btn btn-red btn-sm' onclick='retirarSaldoUI()'>Retirar</button>
      </div>
    </div>
    
    <h3 style='margin-bottom:16px; color:var(--gold); text-shadow: 0 2px 4px rgba(0,0,0,0.5);'>Mis Datos</h3>
    <div class='perfil-grid' style='margin-bottom:24px;'>
      <div class='input-group'><label>Nombre en el juego</label><input id='perfilNombre' value='${p.nombreJuego || ''}'/></div>
      <div class='input-group'><label>Tag (#)</label><input id='perfilTag' value='${p.tag || ''}'/></div>
      <div class='input-group'><label>Supercell ID</label><input id='perfilSupercell' value='${p.supercellId || ''}'/></div>
      <div class='input-group'><label>WhatsApp</label><input id='perfilTel' value='${p.telefono || ''}'/></div>
    </div>

    <h3 style='margin-bottom:16px; color:var(--gold); text-shadow: 0 2px 4px rgba(0,0,0,0.5);'>Datos de retiro</h3>
    <div class='perfil-grid'>
      <div class='input-group'>
        <label>Banco</label>
        <select id='perfilBanco'>${bankOptions}</select>
      </div>
      <div class='input-group'><label>Teléfono de pago</label><input id='perfilTelefonoPago' value='${p.telefonoPago || ''}'/></div>
      <div class='input-group'><label>Cédula</label><input id='perfilCedula' value='${p.cedula || ''}'/></div>
      <div class='input-group'><label>Número de cuenta</label><input id='perfilCuenta' value='${p.cuenta || ''}'/></div>
    </div>
    
    <button class='btn btn-gold' onclick='guardarPerfil()' style='margin-top:16px;'>Guardar Cambios</button>`;
}

async function guardarPerfil() {
  await apiCall({
    action: 'editarPerfil', userId,
    nombreJuego: document.getElementById('perfilNombre').value,
    tag: document.getElementById('perfilTag').value,
    supercellId: document.getElementById('perfilSupercell').value,
    telefono: document.getElementById('perfilTel').value,
    banco: document.getElementById('perfilBanco').value,
    telefonoPago: document.getElementById('perfilTelefonoPago').value,
    cedula: document.getElementById('perfilCedula').value,
    cuenta: document.getElementById('perfilCuenta').value
  });
  toast('Perfil actualizado');
  cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
  renderPerfil();
  updateSidebarStatsJugador();
}

function recargarSaldoUI() {
  const a = window.ajustes || {};
  const min = parseFloat(a.minRecarga || 2);
  const max = parseFloat(a.maxRecarga || 50);
  document.getElementById('rangoRecarga').textContent = `(mín $${min} - máx $${max})`;
  document.getElementById('montoRecarga').min = min;
  document.getElementById('montoRecarga').max = max;
  document.getElementById('pagoBanco').textContent = a.pagoBanco || '';
  document.getElementById('pagoTelefono').textContent = a.pagoTelefono || '';
  document.getElementById('pagoCedula').textContent = a.pagoCedula || '';
  document.getElementById('pagoCuenta').textContent = a.pagoCuenta || '';
  
  const montoInput = document.getElementById('montoRecarga');
  const bsOutput = document.getElementById('montoRecargaBs');
  const tasa = parseFloat(a.tasaRecarga || 0);
  montoInput.oninput = function() {
    const amount = parseFloat(this.value) || 0;
    bsOutput.textContent = formatVES(amount * tasa);
  };
  if(montoInput.value) montoInput.oninput();

  document.getElementById('modalRecarga').classList.remove('hidden');
}

async function enviarRecarga() {
  const monto = document.getElementById('montoRecarga').value;
  const ref = document.getElementById('refRecarga').value.trim();
  if (!monto || !ref) return toast('Completa todos los campos', 'error');
  const res = await apiCall({ action: 'solicitarRecarga', monto, referencia: ref });
  if (res.success) {
    toast('Solicitud enviada. El admin la verificará.');
    closeModal('modalRecarga');
  } else toast(res.error, 'error');
}

function retirarSaldoUI() {
  const a = window.ajustes || {};
  const min = parseFloat(a.minRetiro || 2);
  const max = parseFloat(a.maxRetiro || 50);
  document.getElementById('rangoRetiro').textContent = `(mín $${min} - máx $${max})`;
  document.getElementById('montoRetiro').min = min;
  document.getElementById('montoRetiro').max = max;
  
  document.getElementById('retiroBanco').textContent = a.pagoBanco || 'No definido';
  document.getElementById('retiroTelefono').textContent = a.pagoTelefono || 'No definido';
  document.getElementById('retiroCedula').textContent = a.pagoCedula || 'No definido';
  document.getElementById('retiroCuenta').textContent = a.pagoCuenta || 'No definido';

  const montoInput = document.getElementById('montoRetiro');
  const bsOutput = document.getElementById('montoRetiroBs');
  const tasa = parseFloat(a.tasaRetiro || 0);
  montoInput.oninput = function() {
    const amount = parseFloat(this.value) || 0;
    bsOutput.textContent = formatVES(amount * tasa);
  };
  if(montoInput.value) montoInput.oninput();

  document.getElementById('modalRetiro').classList.remove('hidden');
}

async function enviarRetiro() {
  const monto = document.getElementById('montoRetiro').value;
  const perfil = cachePerfilJugador || {};
  const datos = [perfil.banco, perfil.telefonoPago, perfil.cedula, perfil.cuenta].filter(Boolean).join(' - ');
  
  if (!monto) return toast('Ingresa un monto válido', 'error');
  if (!datos) return toast('Faltan tus datos bancarios en tu perfil.', 'error');
  
  const res = await apiCall({ action: 'solicitarRetiro', monto, referencia: datos });
  if (res.success) {
    toast('Solicitud de retiro enviada. El admin la procesará.');
    closeModal('modalRetiro');
    cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
    renderPerfil();
    updateSidebarStatsJugador();
  } else toast(res.error, 'error');
}

function renderMisRecargas() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMisRecargas.forEach(r => {
    const badge = r.estado === 'Pendiente' ? 'badge-pending' : r.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td data-label="ID:">#${r.id}</td><td data-label="Monto">$${r.monto}</td><td data-label="Referencia">${r.referencia}</td><td data-label="Estado"><span class='badge ${badge}'>${r.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!cacheMisRecargas.length) html = '<p>No tienes recargas.</p>';
  document.getElementById('panel-misRecargas').innerHTML = html;
}

function renderMisRetiros() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMisRetiros.forEach(r => {
    const badge = r.estado === 'Pendiente' ? 'badge-pending' : r.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td data-label="ID:">#${r.id}</td><td data-label="Monto">$${r.monto}</td><td data-label="Referencia">${r.referencia}</td><td data-label="Estado"><span class='badge ${badge}'>${r.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!cacheMisRetiros.length) html = '<p>No tienes retiros.</p>';
  document.getElementById('panel-misRetiros').innerHTML = html;
}

function renderMiHistorial() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Tipo</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMiHistorial.forEach(m => {
    const badge = m.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td data-label="ID:">#${m.id}</td><td data-label="Tipo">${m.tipo}</td><td data-label="Monto">$${m.monto}</td><td data-label="Referencia">${m.referencia}</td><td data-label="Estado"><span class='badge ${badge}'>${m.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-miHistorial').innerHTML = html;
}

let batallaDeclaracionId = null;
function mostrarDeclararResultado(batallaId) {
  batallaDeclaracionId = batallaId;
  document.getElementById('modalDeclararResultado').classList.remove('hidden');
}

async function enviarDeclaracion(resultado) {
  if (!batallaDeclaracionId) return;
  const res = await apiCall({ action: 'declararResultado', batallaId: batallaDeclaracionId, resultado });
  closeModal('modalDeclararResultado');
  if (res.success) {
    if (res.estado === 'Disputa') {
      toast('⚠️ ¡Alerta de trampa detectada! Se ha abierto un proceso de verificación.', 'error');
      document.getElementById('disputaBatallaId').textContent = batallaDeclaracionId;
      document.getElementById('modalDisputa').classList.remove('hidden');
    } else if (res.estado === 'Finalizada') {
      toast('🏆 Batalla finalizada. ¡Revisa tu saldo!');
    } else {
      toast('Declaración enviada. Esperando al oponente.');
    }
    cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
    const todas = await apiCall({ action: 'getBatallas' });
    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
    renderDesafios();
    updateSidebarStatsJugador();
  } else {
    toast(res.error, 'error');
  }
}

function enviarPruebasDisputa() {
  const batallaId = document.getElementById('disputaBatallaId').textContent;
  const motivo = document.getElementById('disputaMotivo').value.trim();
  
  if (!motivo) {
    toast('Por favor, escribe el motivo por el que estás verificando.', 'error');
    return;
  }

  const p = cachePerfilJugador || {};
  const mensaje = `Motivo de verificación: ${motivo}\n\nDatos del jugador:\nNombre en el juego: ${p.nombreJuego || 'No definido'}\nTag: ${p.tag || 'No definido'}\nSupercell ID: ${p.supercellId || 'No definido'}\nTeléfono: ${p.telefono || 'No definido'}\n\nCaptura de pantalla adjunta de mi victoria 🏆 o derrota ❌: (el usuario debe colocar una imagen también en el mensaje o captura en WhatsApp)`;

  const waLink = `https://wa.me/message/XFDNKJWMVY2VC1?text=${encodeURIComponent(mensaje)}`;
  
  window.open(waLink, '_blank');
  closeModal('modalDisputa');
  toast('📩 Verificación enviada al Admin.');
}

function mostrarCrearBatallaAbierta() {
  document.getElementById('modalCrearBatallaAbierta').classList.remove('hidden');
}

async function crearBatallaAbierta() {
  const res = await apiCall({ action: 'crearBatallaAbierta' });
  if (res.success) {
    toast('Desafío creado');
    closeModal('modalCrearBatallaAbierta');
    cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
    const todas = await apiCall({ action: 'getBatallas' });
    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
    cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
    renderDesafios();
    updateSidebarStatsJugador();
  } else toast(res.error || 'Error', 'error');
}

let batallaSeleccionadaUnion = null;
function mostrarModalUnion(batallaId) {
  const b = cacheBatallasAbiertas.find(x => x.id == batallaId) || {};
  batallaSeleccionadaUnion = batallaId;
  document.getElementById('unirseInfo').innerHTML = `
    <p>Te unirás a la batalla <strong>#${b.id}</strong> contra <strong>${b.j1Nombre || b.j2Nombre}</strong>.</p>
    <p>Se descontará <strong>$1.00</strong> de tu saldo.</p>`;
  document.getElementById('modalUnirseBatalla').classList.remove('hidden');
}

async function confirmarUnion() {
  if (!batallaSeleccionadaUnion) return;
  const res = await apiCall({ action: 'tomarBatalla', batallaId: batallaSeleccionadaUnion });
  if (res.success) {
    toast('Te has unido a la batalla.');
    closeModal('modalUnirseBatalla');
    cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
    const todas = await apiCall({ action: 'getBatallas' });
    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
    cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
    renderDesafios();
    updateSidebarStatsJugador();
  } else toast(res.error || 'Error', 'error');
}

async function initApp() {
  window.ajustes = await apiCall({ action: 'getAjustes' });
  
  const adminIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const playerIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>';
  const roleIcon = rol === 'admin' ? adminIcon : playerIcon;
  
  document.getElementById('sidebarUser').innerHTML = `${roleIcon} <span style='font-weight:700; color:var(--gold); text-shadow: 0 2px 4px rgba(0,0,0,0.5);'>${nombreJuego || (rol==='admin'?'admin':'Jugador')}</span><button class='btn btn-red btn-sm' onclick='logout()' style='margin-left:auto;'>Cerrar sesión</button>`;
  
  let navItems = '';
  if (rol === 'admin') {
    navItems = `
      <button class='nav-item active' onclick='switchTab("batallas",this)'><i class="fa-solid fa-crosshairs"></i> Batallas 1C1</button>
      <button class='nav-item' onclick='switchTab("disputas",this)'><i class="fa-solid fa-triangle-exclamation" style="color:var(--red);"></i> Disputas</button>
      <button class='nav-item' onclick='switchTab("recargas",this)'><i class="fa-solid fa-sack-dollar" style="color:var(--green);"></i> Recargas <span class='admin-badge' id='badgeRecargas' style='display:none'>0</span></button>
      <button class='nav-item' onclick='switchTab("retiros",this)'><i class="fa-solid fa-money-bill-1-wave" style="color: var(--green);"></i> Retiros <span class='admin-badge' id='badgeRetiros' style='display:none'>0</span></button>
      <button class='nav-item' onclick='switchTab("movimientos",this)'><i class="fa-solid fa-clipboard-list"></i> Movimientos</button>
      <button class='nav-item' onclick='switchTab("jugadores",this)'><i class="fa-solid fa-users"></i> Jugadores</button>
      <button class='nav-item' onclick='switchTab("ajustes",this)'><i class="fa-solid fa-gears"></i> Ajustes</button>`;
    initAdmin();
  } else {
    navItems = `
      <button class='nav-item active' onclick='switchTab("desafios",this)'><i class="fa-solid fa-crosshairs"></i> Desafíos 1C1</button>
      <button class='nav-item' onclick='switchTab("misRecargas",this)'><i class="fa-solid fa-sack-dollar" style="color:var(--green);"></i> Recargas</button>
      <button class='nav-item' onclick='switchTab("misRetiros",this)'><i class="fa-solid fa-money-bill-1-wave" style="color: var(--green);"></i> Retiros</button>
      <button class='nav-item' onclick='switchTab("miHistorial",this)'><i class="fa-solid fa-clipboard-list"></i> Historial</button>
      <button class='nav-item' onclick='switchTab("perfil",this)'><i class="fa-regular fa-user"></i> Perfil</button>`;
    initJugador();
  }
  document.getElementById('sidebarNav').innerHTML = navItems;
  document.getElementById('heroSection').classList.add('hidden');
  document.getElementById('featuresSection').classList.add('hidden');

  document.getElementById('menuBtn').classList.add('active');
  const firstNavItem = document.querySelector('#sidebarNav .nav-item.active');
  if (firstNavItem) firstNavItem.click();
}

function onTabSwitch(tab) {
  if (tab === 'batallas' && rol === 'admin') renderBatallasAdmin();
  if (tab === 'disputas') renderDisputasAdmin(cacheBatallasAdmin.filter(b => b.estado === 'Disputa'));
  if (tab === 'recargas') renderRecargasAdmin();
  if (tab === 'retiros') renderRetirosAdmin();
  if (tab === 'movimientos') renderMovimientosAdmin();
  if (tab === 'jugadores') renderUsuariosAdmin();
  if (tab === 'ajustes') renderAjustes();
  if (tab === 'desafios') renderDesafios();
  if (tab === 'misRecargas') renderMisRecargas();
  if (tab === 'misRetiros') renderMisRetiros();
  if (tab === 'miHistorial') renderMiHistorial();
  if (tab === 'perfil') renderPerfil();
}

if (token && rol) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('authBox').classList.add('hidden');
    document.getElementById('appMain').classList.remove('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('featuresSection').classList.add('hidden');
    initApp();
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('authBox').classList.contains('hidden')) {
    if (!document.getElementById('authFormLogin').classList.contains('hidden')) login();
    else register();
  }
});
