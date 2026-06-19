// ==================== CONFIG ====================
const API = 'https://script.google.com/macros/s/AKfycbz103R2_VjDIpNge-cl7yfDoG7_cSADINhnwMaqkqUYA3bwRsfPAU-7X55hIjqJSXRF/exec';
let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';
let rol = localStorage.getItem('rol') || '';
let nombreJuego = localStorage.getItem('nombreJuego') || '';

// ==================== API ====================
async function apiCall(body) {
  if (token) body.token = token;
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) });
  return await r.json();
}

// ==================== AUTH ====================
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

// ==================== UI ====================
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

// ==================== ADMIN ====================
let cacheBatallasAdmin = null, cacheUsuarios = null;
let cacheRecargas = [], cacheRetiros = [], cacheMovimientosAdmin = [];
let pendingRecargas = 0, pendingRetiros = 0;

async function initAdmin() {
  await updateSidebarStatsAdmin();
  await renderAdminStats(); // Nuevos KPIs de plataforma
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

async function renderAdminStats() {
  const stats = await apiCall({ action: 'getAdminStats' });
  if (stats.totalSaldo !== undefined) {
    document.getElementById('kpi-total-saldo').textContent = '$' + stats.totalSaldo.toFixed(2);
    document.getElementById('kpi-total-recargas').textContent = '$' + stats.totalRecargas.toFixed(2);
    document.getElementById('kpi-total-retiros').textContent = '$' + stats.totalRetiros.toFixed(2);
    document.getElementById('kpi-total-comisiones').textContent = '$' + stats.gananciasCasa.toFixed(2);
  }
}

async function updateSidebarStatsAdmin() {
  const batallas = await apiCall({ action: 'getBatallas' });
  const activas = batallas.filter(b => b.estado !== 'Finalizada' && b.estado !== 'Disputa').length;
  const finalizadas = batallas.filter(b => b.estado === 'Finalizada').length;
  document.getElementById('statActivas').textContent = activas;
  document.getElementById('statFinalizadas').textContent = finalizadas;
  document.getElementById('statGanancia').textContent = '$' + (finalizadas * 0.30).toFixed(2);
  document.getElementById('statSaldo').parentElement.style.display = 'none';
  document.getElementById('statGanadas').parentElement.style.display = 'none';
  document.getElementById('statPendientes').parentElement.style.display = 'none';
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
    <select onchange='renderBatallasAdmin(this.value)' style='padding:8px 12px; border-radius:8px; background:#1a1a3e; color:white; border:1px solid #2a2a5a;'>
      <option value=''>Todos</option>
      <option value='Pendiente de pago'>Pendiente de pago</option>
      <option value='Lista para jugar'>Lista para jugar</option>
      <option value='En revisión'>En revisión</option>
      <option value='Disputa'>Disputa</option>
      <option value='Finalizada'>Finalizada</option>
    </select>
  </div>`;
  html += `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>J1</th><th>J2</th><th>Estado</th><th>Ganador</th></tr></thead><tbody>`;
  batallas.forEach(b => {
    const badgeEstado = b.estado === 'Pendiente de pago' ? 'badge-pending' : b.estado === 'Lista para jugar' ? 'badge-ready' : b.estado === 'En revisión' ? 'badge-review' : b.estado === 'Disputa' ? 'badge-pending' : 'badge-done';
    html += `<tr><td>#${b.id}</td><td>${b.j1Nombre} ${b.j1Tag}</td><td>${b.j2Nombre} ${b.j2Tag}</td><td><span class='badge ${badgeEstado}'>${b.estado}</span></td><td>${b.ganador === 'J1' ? b.j1Nombre : b.ganador === 'J2' ? b.j2Nombre : '-'}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-batallas').innerHTML = html;
}

function renderDisputasAdmin(disputas) {
  let html = '';
  if (disputas.length > 0) {
    html += `<h4>Disputas pendientes</h4><div class='table-wrapper'><table><thead><tr><th>ID</th><th>J1</th><th>J2</th><th>Acción</th></tr></thead><tbody>`;
    disputas.forEach(b => {
      html += `<tr><td>#${b.id}</td><td>${b.j1Nombre} (${b.j1Tag})</td><td>${b.j2Nombre} (${b.j2Tag})</td><td><button class='btn btn-blue btn-sm' onclick='declararGanadorAdmin(${b.id}, 1)'>J1 ganó</button> <button class='btn btn-blue btn-sm' onclick='declararGanadorAdmin(${b.id}, 2)'>J2 ganó</button></td></tr>`;
    });
    html += '</tbody></table></div>';
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
    renderAdminStats();
  }
}

function renderUsuariosAdmin(users) {
  if (!users) users = cacheUsuarios || [];
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Email</th><th>Nombre</th><th>Tag</th><th>Supercell ID</th><th>Teléfono</th><th>Rol</th><th>Saldo</th></tr></thead><tbody>`;
  users.forEach(u => {
    html += `<tr><td>${u.id}</td><td>${u.email}</td><td>${u.nombreJuego}</td><td>${u.tag}</td><td>${u.supercellId}</td><td>${u.telefono}</td><td>${u.rol}</td><td>$${parseFloat(u.saldo || 0).toFixed(2)}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-jugadores').innerHTML = html;
}

function renderRecargasAdmin() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Referencia</th><th>Acciones</th></tr></thead><tbody>`;
  cacheRecargas.forEach(r => {
    html += `<tr><td>#${r.id}</td><td>${r.nombre} (${r.tag})</td><td>$${r.monto}</td><td>${r.referencia}</td><td>
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
    html += `<tr><td>#${r.id}</td><td>${r.nombre} (${r.tag})</td><td>$${r.monto}</td><td>${r.referencia}</td><td>
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
    html += `<tr><td>#${m.id}</td><td>${m.nombre} (${m.tag})</td><td>${m.tipo}</td><td>$${m.monto}</td><td>${m.referencia}</td><td><span class='badge ${badge}'>${m.estado}</span></td></tr>`;
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
    renderAdminStats();
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
    renderAdminStats();
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
    renderAdminStats();
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
    renderAdminStats();
  } else toast(res.error, 'error');
}

function renderAjustes() {
  const a = window.ajustes || {};
  document.getElementById('panel-ajustes').innerHTML = `
    <div style='display:grid; grid-template-columns:1fr 1fr; gap:16px;'>
      <div class='input-group'><label>Comisión casa ($)</label><input id='ajComision' value='${a.comisionCasa || 0.30}'/></div>
      <div class='input-group'><label>Premio ganador ($)</label><input id='ajPremio' value='${a.premioGanador || 1.70}'/></div>
      <div class='input-group'><label>Costo inscripción ($)</label><input id='ajCosto' value='${a.costoInscripcion || 1.00}'/></div>
      <div class='input-group'><label>Recarga mínima ($)</label><input id='ajMinRecarga' value='${a.minRecarga || 2}'/></div>
      <div class='input-group'><label>Recarga máxima ($)</label><input id='ajMaxRecarga' value='${a.maxRecarga || 50}'/></div>
      <div class='input-group'><label>Retiro mínimo ($)</label><input id='ajMinRetiro' value='${a.minRetiro || 2}'/></div>
      <div class='input-group'><label>Retiro máximo ($)</label><input id='ajMaxRetiro' value='${a.maxRetiro || 50}'/></div>
      <div class='input-group'><label>Banco</label><input id='ajBanco' value='${a.pagoBanco || ''}'/></div>
      <div class='input-group'><label>Teléfono Pago</label><input id='ajTel' value='${a.pagoTelefono || ''}'/></div>
      <div class='input-group'><label>Cédula</label><input id='ajCedula' value='${a.pagoCedula || ''}'/></div>
      <div class='input-group'><label>Cuenta</label><input id='ajCuenta' value='${a.pagoCuenta || ''}'/></div>
      <div class='input-group'><label>Tasa $ (Recargas) [Bs]</label><input id='ajTasaRecarga' value='${a.tasaRecarga || 0}'/></div>
      <div class='input-group'><label>Tasa $ (Retiros) [Bs]</label><input id='ajTasaRetiro' value='${a.tasaRetiro || 0}'/></div>
    </div>
    <button class='btn btn-gold' onclick='guardarAjustes()' style='margin-top:16px;'>Guardar Ajustes</button>`;
}

async function guardarAjustes() {
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
    tasaRetiro: document.getElementById('ajTasaRetiro').value
  };
  await apiCall({ action: 'saveAjustes', ajustes: a });
  window.ajustes = await apiCall({ action: 'getAjustes' });
  toast('Ajustes guardados');
}

// ==================== JUGADOR ====================
let cachePerfil = null, cacheMisBatallas = null, cacheBatallasAbiertas = null;
let cacheMisRecargas = [], cacheMisRetiros = [], cacheMiHistorial = [];

async function initJugador() {
  await updateSidebarStatsJugador();
  cachePerfil = await apiCall({ action: 'getPerfil', userId });
  cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
  const todas = await apiCall({ action: 'getBatallas' });
  cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && ((b.pagoJ1 && !b.j2Id) || (b.pagoJ2 && !b.j1Id)));
  const todosMovs = await apiCall({ action: 'getMovimientos' });
  const misMovs = todosMovs.filter(m => m.userId == userId);
  cacheMisRecargas = misMovs.filter(m => m.tipo === 'Recarga');
  cacheMisRetiros = misMovs.filter(m => m.tipo === 'Retiro');
  cacheMiHistorial = misMovs.filter(m => m.estado !== 'Pendiente');
  renderDesafios(); // ✅ Nueva función unificada de desafíos
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

// ✅ NUEVA FUNCIÓN UNIFICADA: Desafíos 1C1 (Reemplaza a misBatallas y batallasAbiertas)
function renderDesafios() {
  const misBatallas = cacheMisBatallas || [];
  const abiertas = cacheBatallasAbiertas || [];
  // Combinar ambas listas en una sola
  let combined = [...abiertas, ...misBatallas];
  const uniqueIds = new Set();
  combined = combined.filter(b => {
    if (uniqueIds.has(b.id)) return false;
    uniqueIds.add(b.id); return true;
  });
  // Ordenar: Desafíos abiertos primero, luego activos, luego finalizados
  combined.sort((a,b) => a.estado.localeCompare(b.estado));

  let html = `<div style='display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;'>
    <button class='btn btn-gold btn-sm' onclick='mostrarCrearBatallaAbierta()'><i class="fa-solid fa-plus"></i> Crear Desafío</button>
  </div>`;
  html += `<div class="table-wrapper"><table><thead><tr><th>ID</th><th>Retador / Oponente</th><th>Estado</th><th>Ganador</th><th>Acción</th></tr></thead><tbody>`;

  combined.forEach(b => {
    const soyCreador = b.j1Id == userId;
    const soyOponente = b.j2Id == userId;
    let oponente = soyCreador ? b.j2Nombre : b.j1Nombre;
    if (!oponente) oponente = 'En espera...';

    let estadoTexto = b.estado;
    let badgeClass = 'badge-pending';
    if (b.estado === 'Pendiente de pago' && !b.j2Id && b.pagoJ1) {
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

    let accion = '';
    if (b.estado === 'Pendiente de pago' && !b.j2Id && b.j1Id && b.j1Id != userId) {
       accion = `<button class='btn btn-blue btn-sm' onclick='mostrarModalUnion(${b.id})'>Aceptar Desafío</button>`;
    } else if (b.estado === 'Lista para jugar' && (soyCreador || soyOponente)) {
       const yaDeclaro = soyCreador ? b.declaracionJ1 : b.declaracionJ2;
       if (!yaDeclaro) {
         accion = `<button class='btn btn-gold btn-sm' onclick='mostrarDeclararResultado(${b.id})'>Declarar Resultado</button>`;
       } else {
         accion = '⏳ Esperando al oponente...';
       }
    } else if (b.estado === 'Disputa' && (soyCreador || soyOponente)) {
      accion = `<a href='https://wa.me/584120000000?text=Disputa batalla #${b.id}' target='_blank' class='btn btn-red btn-sm'>Contactar admin</a>`;
    } else if (b.estado === 'Finalizada') {
      const soyGanador = b.ganador === (soyCreador ? 'J1' : 'J2');
      accion = soyGanador ? '🏆 Ganaste' : '😞 Perdiste';
    }

    // Caso especial: El creador ve su propio desafío abierto
    if (b.estado === 'Pendiente de pago' && !b.j2Id && b.j1Id == userId) {
       accion = '⏳ Esperando oponente...';
    }

    // Mostrar nombres
    let nombres = soyCreador ? `<strong>Tú</strong>` : b.j1Nombre || '?';
    if (soyOponente) nombres += ` vs <strong>Tú</strong>`;
    else if (b.j2Id) nombres += ` vs ${b.j2Nombre}`;
    else nombres += ` está desafiando`;

    html += `<tr><td>#${b.id}</td><td>${nombres}</td><td><span class='badge ${badgeClass}'>${estadoTexto}</span></td><td>${b.ganador || '-'}</td><td>${accion}</td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!combined.length) html += '<p style="color:var(--text-secondary); text-align:center;">No hay desafíos activos en este momento. ¡Crea uno!</p>';
  document.getElementById('panel-desafios').innerHTML = html;
}

// ✅ CORRECCIÓN DEL GUARDADO DE PERFIL (Evita que los campos queden vacíos)
function renderPerfil() {
  const p = cachePerfil || {};
  document.getElementById('panel-perfil').innerHTML = `
    <div class='balance-card'>
      <div class='balance-icon'>$</div>
      <div>
        <div style='font-size:0.8rem; color:var(--text-secondary);'>SALDO DISPONIBLE</div>
        <div style='font-size:1.8rem; font-weight:900;'>$${parseFloat(p.saldo || 0).toFixed(2)}</div>
      </div>
      <div class='balance-actions'>
        <button class='btn btn-gold btn-sm' onclick='recargarSaldoUI()'>Recargar</button>
        <button class='btn btn-red btn-sm' onclick='retirarSaldoUI()'>Retirar</button>
      </div>
    </div>
    <h3 style='margin-bottom:16px;'>Mis Datos</h3>
    <div class='perfil-grid'>
      <div class='input-group'><label>Nombre en el juego</label><input id='perfilNombre' value='${p.nombreJuego || ''}'/></div>
      <div class='input-group'><label>Tag (#)</label><input id='perfilTag' value='${p.tag || ''}'/></div>
      <div class='input-group'><label>Supercell ID</label><input id='perfilSupercell' value='${p.supercellId || ''}'/></div>
      <div class='input-group'><label>WhatsApp</label><input id='perfilTel' value='${p.telefono || ''}'/></div>
      <div class='input-group'><label>Banco para pagos</label><input id='perfilBanco' value='${p.banco || ''}'/></div>
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
  // ✅ Clave: Volver a pedir los datos a Google Sheets para que no queden vacíos
  cachePerfil = await apiCall({ action: 'getPerfil', userId });
  renderPerfil();
  updateSidebarStatsJugador();
}

// ✅ NUEVO: Tasa de cambio automática en Recarga
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
  
  // Lógica para calcular en Bs
  const montoInput = document.getElementById('montoRecarga');
  const bsOutput = document.getElementById('montoRecargaBs');
  const tasa = parseFloat(a.tasaRecarga || 0);
  montoInput.oninput = function() {
    const amount = parseFloat(this.value) || 0;
    bsOutput.textContent = (amount * tasa).toFixed(2);
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

// ✅ NUEVO: Tasa de cambio automática en Retiro
function retirarSaldoUI() {
  const a = window.ajustes || {};
  const min = parseFloat(a.minRetiro || 2);
  const max = parseFloat(a.maxRetiro || 50);
  document.getElementById('rangoRetiro').textContent = `(mín $${min} - máx $${max})`;
  document.getElementById('montoRetiro').min = min;
  document.getElementById('montoRetiro').max = max;
  const perfil = cachePerfil || {};
  const datos = [perfil.banco, perfil.telefonoPago, perfil.cuenta].filter(Boolean).join(' - ');
  document.getElementById('datosRetiro').value = datos;

  // Lógica para calcular en Bs
  const montoInput = document.getElementById('montoRetiro');
  const bsOutput = document.getElementById('montoRetiroBs');
  const tasa = parseFloat(a.tasaRetiro || 0);
  montoInput.oninput = function() {
    const amount = parseFloat(this.value) || 0;
    bsOutput.textContent = (amount * tasa).toFixed(2);
  };
  if(montoInput.value) montoInput.oninput();

  document.getElementById('modalRetiro').classList.remove('hidden');
}

async function enviarRetiro() {
  const monto = document.getElementById('montoRetiro').value;
  const datos = document.getElementById('datosRetiro').value.trim();
  if (!monto || !datos) return toast('Completa todos los campos', 'error');
  const res = await apiCall({ action: 'solicitarRetiro', monto, referencia: datos });
  if (res.success) {
    toast('Solicitud de retiro enviada. El admin la procesará.');
    closeModal('modalRetiro');
    cachePerfil = await apiCall({ action: 'getPerfil', userId });
    renderPerfil();
    updateSidebarStatsJugador();
  } else toast(res.error, 'error');
}

function renderMisRecargas() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMisRecargas.forEach(r => {
    const badge = r.estado === 'Pendiente' ? 'badge-pending' : r.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td>#${r.id}</td><td>$${r.monto}</td><td>${r.referencia}</td><td><span class='badge ${badge}'>${r.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!cacheMisRecargas.length) html = '<p>No tienes recargas.</p>';
  document.getElementById('panel-misRecargas').innerHTML = html;
}

function renderMisRetiros() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMisRetiros.forEach(r => {
    const badge = r.estado === 'Pendiente' ? 'badge-pending' : r.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td>#${r.id}</td><td>$${r.monto}</td><td>${r.referencia}</td><td><span class='badge ${badge}'>${r.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!cacheMisRetiros.length) html = '<p>No tienes retiros.</p>';
  document.getElementById('panel-misRetiros').innerHTML = html;
}

function renderMiHistorial() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Tipo</th><th>Monto</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>`;
  cacheMiHistorial.forEach(m => {
    const badge = m.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    html += `<tr><td>#${m.id}</td><td>${m.tipo}</td><td>$${m.monto}</td><td>${m.referencia}</td><td><span class='badge ${badge}'>${m.estado}</span></td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-miHistorial').innerHTML = html;
}

// ---------- Lógica de Batallas (Ahora usada por renderDesafios) ----------
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
    toast('Declaración enviada');
    cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
    const todas = await apiCall({ action: 'getBatallas' });
    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && ((b.pagoJ1 && !b.j2Id) || (b.pagoJ2 && !b.j1Id)));
    renderDesafios();
    updateSidebarStatsJugador();
  } else {
    toast(res.error, 'error');
  }
}

function mostrarCrearBatallaAbierta() {
  document.getElementById('modalCrearBatallaAbierta').classList.remove('hidden');
}

async function crearBatallaAbierta() {
  const res = await apiCall({ action: 'crearBatallaAbierta' });
  if (res.success) {
    toast('Desafío creado');
    closeModal('modalCrearBatallaAbierta');
    cachePerfil = await apiCall({ action: 'getPerfil', userId });
    const todas = await apiCall({ action: 'getBatallas' });
    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && ((b.pagoJ1 && !b.j2Id) || (b.pagoJ2 && !b.j1Id)));
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
    cachePerfil = await apiCall({ action: 'getPerfil', userId });
    const todas = await apiCall({ action: 'getBatallas' });
    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && ((b.pagoJ1 && !b.j2Id) || (b.pagoJ2 && !b.j1Id)));
    cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
    renderDesafios();
    updateSidebarStatsJugador();
  } else toast(res.error || 'Error', 'error');
}

// ==================== INIT APP ====================
async function initApp() {
  window.ajustes = await apiCall({ action: 'getAjustes' });
  
  // Sidebar User
  const adminIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const playerIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>';
  const roleIcon = rol === 'admin' ? adminIcon : playerIcon;
  document.getElementById('sidebarUser').innerHTML = `${roleIcon} <span style='font-weight:700;'>${nombreJuego || (rol==='admin'?'Admin':'Jugador')}</span><button class='btn btn-red btn-sm' onclick='logout()' style='margin-left:auto;'>Cerrar sesión</button>`;
  
  // Navigation Items
  let navItems = '';
  if (rol === 'admin') {
    navItems = `
      <button class='nav-item active' onclick='switchTab("batallas",this)'><i class="fa-solid fa-crosshairs"></i> Batallas 1C1</button>
      <button class='nav-item' onclick='switchTab("disputas",this)'><i class="fa-solid fa-triangle-exclamation"></i> Disputas</button>
      <button class='nav-item' onclick='switchTab("recargas",this)'><i class="fa-solid fa-sack-dollar"></i> Recargas <span class='admin-badge' id='badgeRecargas' style='display:none'>0</span></button>
      <button class='nav-item' onclick='switchTab("retiros",this)'><i class="fa-solid fa-money-bill-1-wave"></i> Retiros <span class='admin-badge' id='badgeRetiros' style='display:none'>0</span></button>
      <button class='nav-item' onclick='switchTab("movimientos",this)'><i class="fa-solid fa-clipboard-list"></i> Movimientos</button>
      <button class='nav-item' onclick='switchTab("jugadores",this)'><i class="fa-solid fa-users"></i> Jugadores</button>
      <button class='nav-item' onclick='switchTab("ajustes",this)'><i class="fa-solid fa-gears"></i> Ajustes</button>`;
    initAdmin();
  } else {
    // ✅ Sección UNIFICADA para jugadores: Desafíos 1C1
    navItems = `
      <button class='nav-item active' onclick='switchTab("desafios",this)'><i class="fa-solid fa-crosshairs"></i> Desafíos 1C1</button>
      <button class='nav-item' onclick='switchTab("misRecargas",this)'><i class="fa-solid fa-sack-dollar"></i> Recargas</button>
      <button class='nav-item' onclick='switchTab("misRetiros",this)'><i class="fa-solid fa-money-bill-1-wave"></i> Retiros</button>
      <button class='nav-item' onclick='switchTab("miHistorial",this)'><i class="fa-solid fa-clipboard-list"></i> Historial</button>
      <button class='nav-item' onclick='switchTab("perfil",this)'><i class="fa-regular fa-user"></i> Perfil</button>`;
    initJugador();
  }
  document.getElementById('sidebarNav').innerHTML = navItems;
  document.getElementById('heroSection').classList.add('hidden');
  document.getElementById('featuresSection').classList.add('hidden');

  // Mostrar menú hamburguesa en sesión iniciada
  document.getElementById('menuBtn').classList.add('active');

  // Cargar la primera pestaña automáticamente
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
  if (tab === 'desafios') renderDesafios(); // Nueva pestaña unificada
  if (tab === 'misRecargas') renderMisRecargas();
  if (tab === 'misRetiros') renderMisRetiros();
  if (tab === 'miHistorial') renderMiHistorial();
  if (tab === 'perfil') renderPerfil();
}

// Auto-login
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
