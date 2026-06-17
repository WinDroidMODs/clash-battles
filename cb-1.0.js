// ==================== CONFIG ====================
const API = 'https://script.google.com/macros/s/AKfycbx8M5471anm7kRCBrMDJzm3dUpEpLkusmQOQxKG_vXfALmDZyGFKbzYCXmVRkMxZCXo/exec';
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
let cacheBatallas = null, cacheUsuarios = null, cacheMovimientos = [];
let pendingCount = 0;

async function initAdmin() {
  await updateSidebarStats();
  cacheBatallas = await apiCall({ action: 'getBatallas' });
  cacheUsuarios = await apiCall({ action: 'getUsuarios' });
  cacheMovimientos = await apiCall({ action: 'getMovimientos' });
  pendingCount = cacheMovimientos.filter(m => m.estado === 'Pendiente').length;
  updatePendingBadge();
  renderBatallasAdmin();
  renderUsuariosAdmin();
  renderMovimientosAdmin();
  renderHistorial();
  renderAjustes();
}

async function updateSidebarStats() {
  const batallas = await apiCall({ action: 'getBatallas' });
  const activas = batallas.filter(b => b.estado !== 'Finalizada').length;
  const pendientes = batallas.filter(b => b.estado === 'Pendiente de pago').length;
  const finalizadas = batallas.filter(b => b.estado === 'Finalizada').length;
  document.getElementById('statActivas').textContent = activas;
  document.getElementById('statPendientes').textContent = pendientes;
  document.getElementById('statFinalizadas').textContent = finalizadas;
  document.getElementById('statGanancia').textContent = '$' + (finalizadas * 0.30).toFixed(2);
}

function updatePendingBadge() {
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? 'inline' : 'none';
  }
}

function renderBatallasAdmin(filtro = '') {
  let batallas = cacheBatallas || [];
  if (filtro) batallas = batallas.filter(b => b.estado === filtro);
  let html = `<div style='margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap;'>
    <select onchange='renderBatallasAdmin(this.value)' style='padding:8px 12px; border-radius:8px; background:#1a1a3e; color:white; border:1px solid #2a2a5a;'>
      <option value=''>Todos</option>
      <option value='Pendiente de pago'>Pendiente de pago</option>
      <option value='Lista para jugar'>Lista para jugar</option>
      <option value='En revisión'>En revisión</option>
      <option value='Finalizada'>Finalizada</option>
    </select>
    <button class='btn btn-gold btn-sm' onclick='abrirCrearBatallaAdmin()'>+ Nueva Batalla</button>
  </div>`;
  html += `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>J1</th><th>Pago</th><th>J2</th><th>Pago</th><th>Estado</th><th>Ganador</th><th>Acc</th></tr></thead><tbody>`;
  batallas.forEach(b => {
    const badgeEstado = b.estado === 'Pendiente de pago' ? 'badge-pending' : b.estado === 'Lista para jugar' ? 'badge-ready' : b.estado === 'En revisión' ? 'badge-review' : 'badge-done';
    let acc = '';
    if (b.estado === 'Pendiente de pago') acc = `<button class='btn btn-blue btn-sm' onclick='verificarPagos(${b.id})'>Verificar</button>`;
    if (b.estado === 'En revisión') acc = `<button class='btn btn-gold btn-sm' onclick='verificarVictoria(${b.id})'>Revisar</button>`;
    if (b.estado === 'Finalizada' && b.ganador && !b.premioEntregado) acc = `<button class='btn btn-green btn-sm' onclick='entregarPremio(${b.id})'>Entregar</button>`;
    if (b.estado === 'Finalizada' && b.premioEntregado) acc = '✓';
    const p1 = b.pagoJ1 ? '✅' : '❌';
    const p2 = b.pagoJ2 ? '✅' : '❌';
    html += `<tr><td>#${b.id}</td><td>${b.j1Nombre} ${b.j1Tag}</td><td>${p1}</td><td>${b.j2Nombre} ${b.j2Tag}</td><td>${p2}</td><td><span class='badge ${badgeEstado}'>${b.estado}</span></td><td>${b.ganador === 'J1' ? b.j1Nombre : b.ganador === 'J2' ? b.j2Nombre : '-'}</td><td>${acc}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-batallas').innerHTML = html;
}

async function abrirCrearBatallaAdmin() {
  const users = cacheUsuarios || await apiCall({ action: 'getUsuarios' });
  const jugadores = users.filter(u => u.rol === 'jugador');
  document.getElementById('selJ1').innerHTML = jugadores.map(u => `<option value='${u.id}'>${u.nombreJuego} (${u.tag})</option>`).join('');
  document.getElementById('selJ2').innerHTML = document.getElementById('selJ1').innerHTML;
  document.getElementById('modalCrearBatallaAdmin').classList.remove('hidden');
}

async function crearBatallaAdmin() {
  const j1 = document.getElementById('selJ1').value;
  const j2 = document.getElementById('selJ2').value;
  if (j1 === j2) return toast('Los jugadores deben ser diferentes', 'error');
  const res = await apiCall({ action: 'crearBatalla', j1Id: j1, j2Id: j2 });
  if (res.success) {
    toast('Batalla creada');
    closeModal('modalCrearBatallaAdmin');
    cacheBatallas = await apiCall({ action: 'getBatallas' });
    renderBatallasAdmin();
    updateSidebarStats();
  }
}

let batallaVerificandoId = null;
async function verificarPagos(batallaId) {
  batallaVerificandoId = batallaId;
  const b = cacheBatallas.find(x => x.id == batallaId);
  if (!b) return;
  document.getElementById('modalBatallaId').textContent = batallaId;
  document.getElementById('verifyColumns').innerHTML = `
    <div class='verify-player'>
      <h4>${b.j1Nombre} (${b.j1Tag})</h4>
      <p>${b.pagoJ1 ? '✅ Verificado' : '❌ Pendiente'}</p>
      ${b.capturaPagoJ1 ? `<img src='${b.capturaPagoJ1}' onclick='ampliar("${b.capturaPagoJ1}")'/>` : '<p>Sin captura</p>'}
      ${!b.pagoJ1 ? `<button class='btn btn-green btn-sm' onclick='confirmarPago(1)'>Verificar Pago</button>` : ''}
    </div>
    <div class='verify-player'>
      <h4>${b.j2Nombre} (${b.j2Tag})</h4>
      <p>${b.pagoJ2 ? '✅ Verificado' : '❌ Pendiente'}</p>
      ${b.capturaPagoJ2 ? `<img src='${b.capturaPagoJ2}' onclick='ampliar("${b.capturaPagoJ2}")'/>` : '<p>Sin captura</p>'}
      ${!b.pagoJ2 ? `<button class='btn btn-green btn-sm' onclick='confirmarPago(2)'>Verificar Pago</button>` : ''}
    </div>`;
  document.getElementById('verifyStatus').textContent = '';
  document.getElementById('modalBatalla').classList.remove('hidden');
}

async function confirmarPago(jugador) {
  const res = await apiCall({ action: 'confirmarPago', batallaId: batallaVerificandoId, jugador });
  if (res.success) {
    toast('Pago confirmado');
    if (res.batallaActivada) {
      toast('¡Batalla activada! Ambos pagos confirmados.');
      document.getElementById('verifyStatus').innerHTML = '<span class="badge badge-ready">Batalla lista para jugar</span>';
    }
    cacheBatallas = await apiCall({ action: 'getBatallas' });
    renderBatallasAdmin();
    verificarPagos(batallaVerificandoId);
  }
}

async function verificarVictoria(batallaId) {
  batallaVerificandoId = batallaId;
  const b = cacheBatallas.find(x => x.id == batallaId);
  document.getElementById('modalVictoriaBatallaId').textContent = batallaId;
  document.getElementById('victoryColumns').innerHTML = `
    <div class='verify-player'>
      <h4>${b.j1Nombre}</h4>
      ${b.capturaVictoriaJ1 ? `<img src='${b.capturaVictoriaJ1}' onclick='ampliar("${b.capturaVictoriaJ1}")'/>` : '<p>Sin captura</p>'}
    </div>
    <div class='verify-player'>
      <h4>${b.j2Nombre}</h4>
      ${b.capturaVictoriaJ2 ? `<img src='${b.capturaVictoriaJ2}' onclick='ampliar("${b.capturaVictoriaJ2}")'/>` : '<p>Sin captura</p>'}
    </div>`;
  document.getElementById('modalVerificarVictoria').classList.remove('hidden');
}

async function declararGanador(jugador) {
  const res = await apiCall({ action: 'declararGanador', batallaId: batallaVerificandoId, ganador: jugador });
  if (res.success) {
    toast('Ganador declarado');
    closeModal('modalVerificarVictoria');
    cacheBatallas = await apiCall({ action: 'getBatallas' });
    renderBatallasAdmin();
    updateSidebarStats();
  }
}

async function entregarPremio(batallaId) {
  const res = await apiCall({ action: 'entregarPremio', batallaId });
  if (res.success) {
    toast('Premio entregado');
    cacheBatallas = await apiCall({ action: 'getBatallas' });
    renderBatallasAdmin();
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

function renderMovimientosAdmin(movs) {
  if (!movs) movs = cacheMovimientos || [];
  pendingCount = movs.filter(m => m.estado === 'Pendiente').length;
  updatePendingBadge();
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Usuario</th><th>Tipo</th><th>Monto</th><th>Referencia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
  movs.forEach(m => {
    const badge = m.estado === 'Pendiente' ? 'badge-pending' : m.estado === 'Verificado' ? 'badge-done' : 'badge-review';
    let acciones = '';
    if (m.estado === 'Pendiente') {
      acciones = `<button class='btn btn-green btn-sm' onclick='verificarMovimiento("${m.tipo}", ${m.id})'>✓ Verificar</button>
                  <button class='btn btn-red btn-sm' onclick='rechazarMovimiento("${m.tipo}", ${m.id})'>✗ Rechazar</button>`;
    }
    html += `<tr><td>#${m.id}</td><td>${m.nombre} (${m.tag})</td><td>${m.tipo}</td><td>$${m.monto}</td><td>${m.referencia}</td><td><span class='badge ${badge}'>${m.estado}</span></td><td>${acciones}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-movimientos').innerHTML = html;
}

async function verificarMovimiento(tipo, id) {
  const action = tipo === 'Recarga' ? 'verificarRecarga' : 'verificarRetiro';
  const res = await apiCall({ action, movimientoId: id });
  if (res.success) {
    toast(`${tipo} verificado.`);
    cacheMovimientos = await apiCall({ action: 'getMovimientos' });
    renderMovimientosAdmin(cacheMovimientos);
  } else toast(res.error, 'error');
}

async function rechazarMovimiento(tipo, id) {
  const action = tipo === 'Recarga' ? 'rechazarRecarga' : 'rechazarRetiro';
  const res = await apiCall({ action, movimientoId: id });
  if (res.success) {
    toast(`${tipo} rechazado.`);
    cacheMovimientos = await apiCall({ action: 'getMovimientos' });
    renderMovimientosAdmin(cacheMovimientos);
  } else toast(res.error, 'error');
}

async function renderHistorial() {
  const hist = await apiCall({ action: 'getHistorial' });
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Jugador 1</th><th>Jugador 2</th><th>Ganador</th><th>Premio Entregado</th><th>Fecha</th></tr></thead><tbody>`;
  hist.forEach(h => {
    html += `<tr><td>#${h.id}</td><td>${h.j1}</td><td>${h.j2}</td><td>${h.ganador}</td><td>${h.premioEntregado ? '✅' : '❌'}</td><td>${new Date(h.fecha).toLocaleDateString()}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-historial').innerHTML = html;
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
    pagoCuenta: document.getElementById('ajCuenta').value
  };
  await apiCall({ action: 'saveAjustes', ajustes: a });
  window.ajustes = await apiCall({ action: 'getAjustes' });
  toast('Ajustes guardados');
}

// ==================== JUGADOR ====================
let cachePerfil = null, cacheMisBatallas = null, cacheBatallasAbiertas = [];

async function initJugador() {
  await updateSidebarStatsJugador();
  cachePerfil = await apiCall({ action: 'getPerfil', userId });
  cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
  const todas = await apiCall({ action: 'getBatallas' });
  cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && ((b.pagoJ1 && !b.j2Id) || (b.pagoJ2 && !b.j1Id)));
  renderPerfil();
  renderMisBatallas();
  renderBatallasAbiertas();
}

async function updateSidebarStatsJugador() {
  const perfil = await apiCall({ action: 'getPerfil', userId });
  const mis = await apiCall({ action: 'getMisBatallas', userId });
  const ganadas = mis.filter(b => b.estado === 'Finalizada' && ((b.j1Id == userId && b.ganador === 'J1') || (b.j2Id == userId && b.ganador === 'J2'))).length;
  document.getElementById('statSaldo').textContent = '$' + parseFloat(perfil.saldo || 0).toFixed(2);
  document.getElementById('statGanadas').textContent = ganadas;
  document.getElementById('statActivas').textContent = mis.filter(b => b.estado !== 'Finalizada').length;
  document.getElementById('statPendientes').textContent = mis.filter(b => b.estado === 'Pendiente de pago').length;
  document.getElementById('statFinalizadas').textContent = mis.filter(b => b.estado === 'Finalizada').length;
  document.getElementById('statGanancia').textContent = '$' + (ganadas * 1.70).toFixed(2);
}

function renderPerfil() {
  const p = cachePerfil || {};
  document.getElementById('panel-perfil').innerHTML = `
    <div class='balance-card'>
      <div class='balance-icon'>$</div>
      <div>
        <div style='font-size:0.8rem; color:var(--text-secondary);'>SALDO DISPONIBLE</div>
        <div style='font-size:1.8rem; font-weight:900;'>$${parseFloat(p.saldo || 0).toFixed(2)}</div>
      </div>
      <div class='balance-actions' style='margin-left:auto;'>
        <button class='btn btn-gold btn-sm' onclick='recargarSaldoUI()'>Recargar</button>
        <button class='btn btn-red btn-sm' onclick='retirarSaldoUI()'>Retirar</button>
      </div>
    </div>
    <h3 style='margin-bottom:16px;'>Mis Datos</h3>
    <div class='perfil-grid'>
      <div class='input-group'><label>Nombre en el juego</label><input id='perfilNombre' value='${p.nombreJuego}'/></div>
      <div class='input-group'><label>Tag (#)</label><input id='perfilTag' value='${p.tag}'/></div>
      <div class='input-group'><label>Supercell ID</label><input id='perfilSupercell' value='${p.supercellId}'/></div>
      <div class='input-group'><label>WhatsApp</label><input id='perfilTel' value='${p.telefono}'/></div>
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
  cachePerfil = null;
  renderPerfil();
}

function recargarSaldoUI() {
  const min = (window.ajustes && window.ajustes.minRecarga) ? window.ajustes.minRecarga : 2;
  const max = (window.ajustes && window.ajustes.maxRecarga) ? window.ajustes.maxRecarga : 50;
  document.getElementById('rangoRecarga').textContent = `(mín $${min} - máx $${max})`;
  document.getElementById('montoRecarga').min = min;
  document.getElementById('montoRecarga').max = max;
  document.getElementById('pagoBanco').textContent = (window.ajustes && window.ajustes.pagoBanco) || '';
  document.getElementById('pagoTelefono').textContent = (window.ajustes && window.ajustes.pagoTelefono) || '';
  document.getElementById('pagoCedula').textContent = (window.ajustes && window.ajustes.pagoCedula) || '';
  document.getElementById('pagoCuenta').textContent = (window.ajustes && window.ajustes.pagoCuenta) || '';
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
  const min = (window.ajustes && window.ajustes.minRetiro) ? window.ajustes.minRetiro : 2;
  const max = (window.ajustes && window.ajustes.maxRetiro) ? window.ajustes.maxRetiro : 50;
  document.getElementById('rangoRetiro').textContent = `(mín $${min} - máx $${max})`;
  document.getElementById('montoRetiro').min = min;
  document.getElementById('montoRetiro').max = max;
  const perfil = cachePerfil || {};
  const datos = [perfil.banco, perfil.telefonoPago, perfil.cuenta].filter(Boolean).join(' - ');
  document.getElementById('datosRetiro').value = datos;
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

function renderMisBatallas() {
  const batallas = cacheMisBatallas || [];
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Oponente</th><th>Estado</th><th>Ganador</th><th>Acción</th></tr></thead><tbody>`;
  batallas.forEach(b => {
    const soyJ1 = b.j1Id == userId;
    const oponente = soyJ1 ? b.j2Nombre : b.j1Nombre;
    let accion = '';
    if (b.estado === 'Lista para jugar') accion = `<button class='btn btn-gold btn-sm' onclick='subirCapturaVictoria(${b.id})'>Subir Victoria</button>`;
    if (b.estado === 'En revisión') accion = '⏳';
    if (b.estado === 'Finalizada') accion = b.ganador === (soyJ1 ? 'J1' : 'J2') ? '🏆 Ganaste' : '😞 Perdiste';
    html += `<tr><td>#${b.id}</td><td>${oponente}</td><td>${b.estado}</td><td>${b.ganador || '-'}</td><td>${accion}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-misBatallas').innerHTML = html;
}

function subirCapturaVictoria(batallaId) {
  const url = prompt('Pega el enlace de la captura de tu victoria (Imgur, Drive, etc.):');
  if (url) {
    apiCall({ action: 'subirCapturaVictoria', batallaId, userId, url }).then(res => {
      if (res.success) { toast('Captura subida. El admin revisará.'); renderMisBatallas(); }
    });
  }
}

function renderBatallasAbiertas() {
  const abiertas = cacheBatallasAbiertas || [];
  let html = '<div class="table-wrapper"><table><thead><tr><th>ID</th><th>Creador</th><th>Pago</th><th>Acción</th></tr></thead><tbody>';
  abiertas.forEach(b => {
    const pagoIcon = b.pagoJ1 ? '✅' : '❌';
    html += `<tr><td>#${b.id}</td><td>${b.j1Nombre || b.j2Nombre} (${b.j1Tag || b.j2Tag})</td><td>${pagoIcon}</td><td><button class='btn btn-blue btn-sm' onclick='mostrarModalUnion(${b.id})'>Unirse</button></td></tr>`;
  });
  html += '</tbody></table></div>';
  if (!abiertas.length) html = '<p>No hay batallas abiertas.</p>';
  html += `<button class='btn btn-gold btn-sm' onclick='mostrarCrearBatallaAbierta()' style='margin-top:12px;'>Crear Desafío</button>`;
  document.getElementById('panel-batallasAbiertas').innerHTML = html;
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
    renderBatallasAbiertas();
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
    renderMisBatallas();
    renderBatallasAbiertas();
    updateSidebarStatsJugador();
  } else toast(res.error || 'Error', 'error');
}

// ==================== INIT APP ====================
async function initApp() {
  window.ajustes = await apiCall({ action: 'getAjustes' });
  const adminIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const playerIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>';
  const roleIcon = rol === 'admin' ? adminIcon : playerIcon;
  document.getElementById('headerBtns').innerHTML = `<span style='color:#FFD700;'>${roleIcon} ${nombreJuego || (rol==='admin'?'Admin':'Jugador')}</span><button class='btn-header' onclick='logout()'>Cerrar sesión</button>`;
  document.getElementById('sidebarUser').innerHTML = `${roleIcon} <span style='font-weight:700;'>${nombreJuego || (rol==='admin'?'Admin':'Jugador')}</span>`;
  
  let navItems = '';
  if (rol === 'admin') {
    navItems = `
      <button class='nav-item active' onclick='switchTab("batallas",this)'>⚔️ Batallas 1C1</button>
      <button class='nav-item' onclick='switchTab("jugadores",this)'>👥 Jugadores</button>
      <button class='nav-item' onclick='switchTab("movimientos",this)'>💰 Movimientos <span class='admin-badge' id='pendingBadge' style='display:none'>0</span></button>
      <button class='nav-item' onclick='switchTab("historial",this)'>🏆 Historial</button>
      <button class='nav-item' onclick='switchTab("ajustes",this)'>⚙️ Ajustes</button>`;
    initAdmin();
  } else {
    navItems = `
      <button class='nav-item active' onclick='switchTab("misBatallas",this)'>⚔️ Mis Batallas 1C1</button>
      <button class='nav-item' onclick='switchTab("batallasAbiertas",this)'>🔓 Batallas Abiertas</button>
      <button class='nav-item' onclick='switchTab("perfil",this)'>👤 Perfil</button>`;
    initJugador();
  }
  document.getElementById('sidebarNav').innerHTML = navItems;
  document.getElementById('heroSection').classList.add('hidden');
  document.getElementById('featuresSection').classList.add('hidden');
}

function onTabSwitch(tab) {
  if (tab === 'batallas' && rol === 'admin') renderBatallasAdmin();
  if (tab === 'jugadores') renderUsuariosAdmin();
  if (tab === 'movimientos') renderMovimientosAdmin();
  if (tab === 'historial') renderHistorial();
  if (tab === 'ajustes') renderAjustes();
  if (tab === 'misBatallas') renderMisBatallas();
  if (tab === 'batallasAbiertas') renderBatallasAbiertas();
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
