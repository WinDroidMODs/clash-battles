// Clash-Battles-v1.70.js | Autor: Robinson Avila | By: WinDroidMODs
// ✅ V1.70: SISTEMA DE VALIDACIÓN POR IMAGEN EN RECARGAS (Anti-estafa)
const API = 'https://script.google.com/macros/s/AKfycbzXGgHc3DwZ-ktycTUUR1teC6xCliDGP4bLlNupZj190x3nHuN3EvSvdZbaji9n3a2d/exec';
let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';
let rol = localStorage.getItem('rol') || '';
let nombreJuego = localStorage.getItem('nombreJuego') || '';

const ICON_ORO = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhnODwm3kUcNk8k3Vtsw1YhxzvMKIEBqG7WNqTc5wSzKDn-aSXNwTCcP0HMoWik_JyEAoiaq56RgeYJHRrFtTFwi_fMN0oxfaSrd7w2bH4B48TrH3r-ARJ7CK7j5nDdceoF2uaaHaDiRDm3Ubi8svaImJcF9zxNd76V9gD3ryxRYbJfwbmnK5dbhuQbBzup/s354/Oro.png';
const ICON_GEMA = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgRCySucB_t3YT0UaUciRujOZkdluzwwXLlUMcFk4pIktYi0zv-LKbUzN67IMr6uLA3jvYhai7GHSZdf3EMhN32tOAYOAJF985GFGVk4EfBor4X8503Ay_5xA1XExR2QPUv_4Tcs5B-Fj35f2ZIDIaO8ofLJoBzugx_mxh5PBfVPRjuvq2wM8X5RnlMANYz/s354/Gema.png';

let modalConfirmCallback = null;
let selectedBatalla = {};

function showConfirmModal(title, msg, callback) {
    document.getElementById('modalConfirmTitle').textContent = title;
    document.getElementById('modalConfirmMsg').textContent = msg;
    modalConfirmCallback = callback;
    document.getElementById('modalConfirm').classList.remove('hidden');
}

function executeModalConfirm() {
    if (modalConfirmCallback) {
        modalConfirmCallback();
        modalConfirmCallback = null;
    }
    closeModal('modalConfirm');
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    if (refId) {
        localStorage.setItem('pendingRef', refId);
    }
});

async function apiCall(body) {
  if (token) body.token = token;
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(body) });
  return await r.json();
}

function playSound(freq, duration, type='sine', vol=0.2) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}
function playClick() { playSound(800, 0.08); }
function playCoin() { playSound(1200, 0.15); setTimeout(()=>playSound(1600, 0.15), 100); }
function playSuccess() { playSound(523, 0.2); setTimeout(()=>playSound(659, 0.2), 150); setTimeout(()=>playSound(784, 0.3), 300); }
function playError() { playSound(300, 0.4, 'sawtooth', 0.15); }

async function login() {
  playClick();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if (!email || !pass) return showAuthError('Completa todos los campos');
  const res = await apiCall({ action: 'login', email, password: pass });
  if (res.success) {
    playSuccess();
    token = res.token; userId = res.userId; rol = res.rol; nombreJuego = res.nombreJuego;
    localStorage.setItem('token', token); localStorage.setItem('userId', userId);
    localStorage.setItem('rol', rol); localStorage.setItem('nombreJuego', nombreJuego);
    document.getElementById('authBox').classList.add('hidden');
    document.getElementById('appMain').classList.remove('hidden');
    initApp();
  } else {
    playError();
    showAuthError(res.error);
  }
}

async function register() {
  playClick();
  const data = {
    action: 'registro',
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regPass').value.trim(),
    nombreJuego: document.getElementById('regNombre').value.trim(),
    tag: document.getElementById('regTag').value.trim(),
    supercellId: document.getElementById('regSupercell').value.trim(),
    supercellLink: document.getElementById('regSupercellLink').value.trim(),
    telefono: document.getElementById('regTel').value.trim(),
    refId: localStorage.getItem('pendingRef') || ''
  };
  if (!data.email || !data.password || !data.nombreJuego || !data.supercellId || !data.supercellLink || !data.telefono) {
    playError();
    return showAuthError('Todos los campos son obligatorios para registrarte.');
  }
  const res = await apiCall(data);
  if (res.success) {
    playSuccess();
    localStorage.removeItem('pendingRef');
    if (res.isReferral && res.refereeGems > 0) {
      document.getElementById('regGemsCount').textContent = res.refereeGems;
      document.getElementById('modalRegistroGemas').classList.remove('hidden');
    } else {
      toast('Cuenta creada. Inicia sesión.');
      switchAuthTab('login');
    }
  } else {
    playError();
    showAuthError(res.error);
  }
}

function closeRegGemsModal() {
  closeModal('modalRegistroGemas');
  toast('Cuenta creada. Inicia sesión.');
  switchAuthTab('login');
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
  if(t === 'success') playCoin(); else if(t === 'error') playError();
  setTimeout(() => d.remove(), 3000);
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

function formatVES(amount) {
    if (isNaN(amount)) return '0,00';
    let val = Number(amount).toFixed(2);
    let parts = val.split('.');
    let integerPart = parts[0];
    let decimalPart = parts[1];
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return integerPart + ',' + decimalPart;
}

function copiarTexto(texto, mensaje) {
    navigator.clipboard.writeText(texto).then(() => {
        toast('✅ ' + mensaje);
    }).catch(() => {
        toast('Error al copiar', 'error');
    });
}

function contactarOponente(batallaId, miNombre, miTag, opNombre, opTag, telefono) {
    const mensaje = `Hola! Soy ${miNombre} (Tag: ${miTag}). Estoy en la batalla #${batallaId} contra ${opNombre} (Tag: ${opTag}). Mi Supercell ID es ${cachePerfilJugador.supercellId || 'No definido'}. ¿Cuál es el tuyo para agregarnos y jugar?`;
    const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(waLink, '_blank');
}

let cacheBatallasAdmin = null, cacheUsuarios = null;
let cacheRecargas = [], cacheRetiros = [], cacheMovimientosAdmin = [];
let pendingRecargas = 0, pendingRetiros = 0;
let cachePerfil = null;

async function initApp() {
  window.ajustes = await apiCall({ action: 'getAjustes' });
  
  const adminIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  const playerIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>';
  const roleIcon = rol === 'admin' ? adminIcon : playerIcon;
  
  document.getElementById('sidebarUser').innerHTML = `
      <div style='display:flex; flex-direction:column; gap:10px; width:100%;'>
          <div style='display:flex; align-items:center; gap:10px;'>
              ${roleIcon} <span style='font-weight:700; color:var(--gold); text-shadow: 0 2px 4px rgba(0,0,0,0.5);'>${nombreJuego || (rol==='admin'?'admin':'Jugador')}</span>
          </div>
          <button class='btn btn-red btn-sm' onclick='logout()' style='width:100%; justify-content:center;'>Cerrar sesión</button>
      </div>
  `;
  
  let navItems = '';
  if (rol === 'admin') {
    document.getElementById('sidebarStats').innerHTML = `
      <div class='sidebar-stat'><div class='val gold'>$0.00</div><div class='lbl'>Saldo Total</div></div>
      <div class='sidebar-stat'><div class='val green'>$0.00</div><div class='lbl'>Recargas Totales</div></div>
      <div class='sidebar-stat'><div class='val red'>$0.00</div><div class='lbl'>Retiros Totales</div></div>
      <div class='sidebar-stat'><div class='val gold'>$0.00</div><div class='lbl'>Ganancias Casa</div></div>`;
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
      <button class='nav-item' onclick='switchTab("referidos",this)'><i class="fa-solid fa-gem" style="color:var(--green);"></i> Referidos</button>
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

async function initAdmin() {
  try {
    const [perfil, gStats, batallas, usuarios, todosMovs] = await Promise.all([
      apiCall({ action: 'getPerfil', userId }),
      apiCall({ action: 'getAdminStats' }),
      apiCall({ action: 'getBatallas' }),
      apiCall({ action: 'getUsuarios' }),
      apiCall({ action: 'getMovimientos' })
    ]);

    cachePerfil = perfil;
    cacheBatallasAdmin = batallas;
    cacheUsuarios = usuarios;
    
    updateSidebarStatsAdmin(gStats);

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
  } catch (error) {
    console.error("Error cargando datos admin:", error);
    toast("Error al cargar datos del admin", "error");
  }
}

async function updateSidebarStatsAdmin(gStats = null) {
  if (!gStats) {
    gStats = await apiCall({ action: 'getAdminStats' });
  }
  const totalSaldo = parseFloat(gStats.totalSaldo || 0);
  const totalRecargas = parseFloat(gStats.totalRecargas || 0);
  const totalRetiros = parseFloat(gStats.totalRetiros || 0);
  const gananciasCasa = parseFloat(gStats.gananciasCasa || 0);
  
  const statsContainer = document.getElementById('sidebarStats');
  if (statsContainer) {
      statsContainer.innerHTML = `
          <div class='sidebar-stat'><div class='val gold'>$${totalSaldo.toFixed(2)}</div><div class='lbl'>Saldo Total</div></div>
          <div class='sidebar-stat'><div class='val green'>$${totalRecargas.toFixed(2)}</div><div class='lbl'>Recargas Totales</div></div>
          <div class='sidebar-stat'><div class='val red'>$${totalRetiros.toFixed(2)}</div><div class='lbl'>Retiros Totales</div></div>
          <div class='sidebar-stat'><div class='val gold'>$${gananciasCasa.toFixed(2)}</div><div class='lbl'>Ganancias Casa</div></div>
      `;
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
    <button class='btn btn-red btn-sm' onclick='deleteAllFinalizadas()' style='margin-left:auto;'>🗑️ Limpiar Finalizadas</button>
  </div>`;
  html += `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>J1</th><th>J2</th><th>Estado</th><th>Ganador</th><th></th></tr></thead><tbody>`;
  batallas.forEach(b => {
    const badgeEstado = b.estado === 'Pendiente de pago' ? 'badge-pending' : b.estado === 'Lista para jugar' ? 'badge-ready' : b.estado === 'Disputa' ? 'badge-pending' : 'badge-done';
    let deleteIcon = '';
    if (b.estado === 'Finalizada') {
      deleteIcon = `<button class='btn btn-red btn-sm' style='padding:2px 8px; font-size:0.7rem;' onclick='deleteBatalla(${b.id})'>✕</button>`;
    }
    html += `<tr><td data-label="ID:">#${b.id}</td><td data-label="Retador">${b.j1Nombre} ${b.j1Tag}</td><td data-label="Oponente">${b.j2Nombre} ${b.j2Tag}</td><td data-label="Estado"><span class='badge ${badgeEstado}'>${b.estado}</span></td><td data-label="Ganador">${b.ganador === 'J1' ? b.j1Nombre : b.ganador === 'J2' ? b.j2Nombre : '-'}</td><td style='text-align:right;'>${deleteIcon}</td></tr>`;
  });
  html += '</tbody></table></div>';
  document.getElementById('panel-batallas').innerHTML = html;
}

async function deleteBatalla(batallaId) {
    showConfirmModal('Eliminar batalla', `¿Estás seguro de eliminar la batalla #${batallaId}?`, async () => {
        const res = await apiCall({ action: 'deleteBatalla', batallaIds: [batallaId] });
        if (res.success) {
            toast(`Batalla #${batallaId} eliminada.`);
            cacheBatallasAdmin = await apiCall({ action: 'getBatallas' });
            renderBatallasAdmin();
            updateSidebarStatsAdmin();
        } else {
            toast(res.error || 'Error al eliminar', 'error');
        }
    });
}

async function deleteAllFinalizadas() {
  const finalizadas = cacheBatallasAdmin.filter(b => b.estado === 'Finalizada');
  if (finalizadas.length === 0) return toast('No hay batallas finalizadas para eliminar.', 'error');
  
  showConfirmModal('Limpiar finalizadas', `¿Estás seguro de eliminar TODAS las ${finalizadas.length} batallas finalizadas?`, async () => {
      const ids = finalizadas.map(b => b.id);
      const res = await apiCall({ action: 'deleteBatalla', batallaIds: ids });
      if (res.success) {
        toast(`${res.deletedCount} batallas finalizadas eliminadas.`);
        cacheBatallasAdmin = await apiCall({ action: 'getBatallas' });
        renderBatallasAdmin();
        updateSidebarStatsAdmin();
      } else {
        toast(res.error || 'Error al eliminar', 'error');
      }
  });
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

/* ✅ V1.70: RENDERIZADO DE RECARGAS CON BOTÓN PARA VER LA IMAGEN DEL COMPROBANTE */
function renderRecargasAdmin() {
  let html = `<div class='table-wrapper'><table><thead><tr><th>ID</th><th>Usuario</th><th>Monto</th><th>Referencia</th><th>Comprobante</th><th>Acciones</th></tr></thead><tbody>`;
  cacheRecargas.forEach(r => {
    html += `<tr><td data-label="ID:">#${r.id}</td><td data-label="Usuario">${r.nombre} (${r.tag})</td><td data-label="Monto">$${r.monto}</td><td data-label="Referencia">${r.referencia}</td><td data-label="Comprobante">
      ${r.comprobante ? `<button class='btn btn-blue btn-sm' onclick='window.open("${r.comprobante}", "_blank")'>🖼️ Ver</button>` : 'Sin imagen'}
    </td><td data-label="Acciones">
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
      <div class='input-group'><label>WhatsApp Admin (Para contacto)</label><input id='ajWAdmin' value='${a.adminWhatsApp || ''}' placeholder='+58 4121234567'/></div>
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
  playClick();
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
    adminWhatsApp: document.getElementById('ajWAdmin').value,
    pagoCedula: document.getElementById('ajCedula').value,
    pagoCuenta: document.getElementById('ajCuenta').value,
    tasaRecarga: document.getElementById('ajTasaRecarga').value,
    tasaRetiro: document.getElementById('ajTasaRetiro').value,
    bancos_activos: selectedBanks.join(',')
  };
  await apiCall({ action: 'saveAjustes', ajustes: a });
  window.ajustes = await apiCall({ action: 'getAjustes' });
  playSuccess();
  toast('Ajustes guardados');
}

let cachePerfilJugador = null, cacheMisBatallas = null, cacheBatallasAbiertas = null;
let cacheMisRecargas = [], cacheMisRetiros = [], cacheMiHistorial = [];
let cacheReferidosList = [];

async function initJugador() {
  try {
    const [perfil, misBatallas, todas, todosMovs, referidos] = await Promise.all([
      apiCall({ action: 'getPerfil', userId }),
      apiCall({ action: 'getMisBatallas', userId }),
      apiCall({ action: 'getBatallas' }),
      apiCall({ action: 'getMovimientos' }),
      apiCall({ action: 'getReferidosList', userId })
    ]);

    cachePerfilJugador = perfil;
    cacheMisBatallas = misBatallas;
    cacheReferidosList = referidos;
    updateSidebarStatsJugador(perfil, misBatallas);

    cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
    const misMovs = todosMovs.filter(m => m.userId == userId);
    cacheMisRecargas = misMovs.filter(m => m.tipo === 'Recarga');
    cacheMisRetiros = misMovs.filter(m => m.tipo === 'Retiro');
    cacheMiHistorial = misMovs.filter(m => m.estado !== 'Pendiente');
    renderDesafios();
    renderMisRecargas();
    renderMisRetiros();
    renderMiHistorial();
    renderPerfil();
    renderReferidos();
  } catch (error) {
    console.error("Error cargando datos jugador:", error);
    toast("Error al cargar datos del jugador", "error");
  }
}

async function updateSidebarStatsJugador(perfil = null, mis = null) {
  if (!perfil) perfil = await apiCall({ action: 'getPerfil', userId });
  if (!mis) mis = await apiCall({ action: 'getMisBatallas', userId });
  
  const a = window.ajustes || {};
  const tasa = parseFloat(a.tasaRecarga || 0);
  const oroVES = parseFloat(perfil.saldo || 0) * tasa;
  const gemas = parseInt(perfil.gemas || 0);
  
  const ganadas = mis.filter(b => b.estado === 'Finalizada' && ((b.j1Id == userId && b.ganador === 'J1') || (b.j2Id == userId && b.ganador === 'J2'))).length;
  
  const statsContainer = document.getElementById('sidebarStats');
  
  statsContainer.style.display = 'flex';
  statsContainer.style.flexDirection = 'column';
  statsContainer.style.gap = '8px';
  statsContainer.style.width = '100%';
  statsContainer.style.background = 'var(--bg-card)';
  statsContainer.style.border = '1px solid var(--gold-border)';
  statsContainer.style.borderRadius = '12px';
  statsContainer.style.padding = '12px';

  statsContainer.innerHTML = `
    <div style='display:flex; flex-direction:column; gap:8px; width:100%; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:12px;'>
      <div class='sidebar-stat' style='width:100%; background:rgba(255,215,0,0.1); border:1px solid var(--gold); border-radius:8px; padding:6px 12px; display:flex; align-items:center; justify-content:space-between;'>
        <div style='display:flex; align-items:center; gap:8px;'>
          <img src="${ICON_ORO}" alt="Oro" style="height:20px; width:20px; object-fit:contain;" />
          <span class='lbl' style='color:var(--gold);'>Oro</span>
        </div>
        <div class='val gold'>${formatVES(oroVES)}</div>
      </div>
      <div class='sidebar-stat' style='width:100%; background:rgba(0,230,118,0.1); border:1px solid var(--green); border-radius:8px; padding:6px 12px; display:flex; align-items:center; justify-content:space-between;'>
        <div style='display:flex; align-items:center; gap:8px;'>
          <img src="${ICON_GEMA}" alt="Gema" style="height:20px; width:20px; object-fit:contain;" />
          <span class='lbl' style='color:var(--green);'>Gemas</span>
        </div>
        <div class='val gem'>${gemas}</div>
      </div>
    </div>
    <div style='display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%;'>
      <div class='sidebar-stat' style='background:rgba(255,215,0,0.15); border-radius:8px; padding:6px 4px;'>
        <div class='val gold'>$${parseFloat(perfil.saldo || 0).toFixed(2)}</div>
        <div class='lbl'>Saldo</div>
      </div>
      <div class='sidebar-stat' style='background:rgba(0,230,118,0.15); border-radius:8px; padding:6px 4px;'>
        <div class='val green'>$${(ganadas * 1.70).toFixed(2)}</div>
        <div class='lbl'>Ganancia</div>
      </div>
      <div class='sidebar-stat' style='background:rgba(0,230,118,0.15); border-radius:8px; padding:6px 4px;'>
        <div class='val green'>${ganadas}</div>
        <div class='lbl'>Ganadas</div>
      </div>
      <div class='sidebar-stat' style='background:rgba(187,134,252,0.15); border-radius:8px; padding:6px 4px;'>
        <div class='val purple'>${mis.filter(b => b.estado !== 'Finalizada' && b.estado !== 'Disputa').length}</div>
        <div class='lbl'>Activas</div>
      </div>
      <div class='sidebar-stat' style='background:rgba(255,70,85,0.15); border-radius:8px; padding:6px 4px;'>
        <div class='val red'>${mis.filter(b => b.estado === 'Pendiente de pago' || b.estado === 'Disputa').length}</div>
        <div class='lbl'>Pend.</div>
      </div>
      <div class='sidebar-stat' style='background:rgba(79,142,247,0.15); border-radius:8px; padding:6px 4px;'>
        <div class='val blue'>${mis.filter(b => b.estado === 'Finalizada').length}</div>
        <div class='lbl'>Fin.</div>
      </div>
    </div>
  `;
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
       accion = `<button class='btn btn-blue btn-sm btn-block' onclick='mostrarModalUnion(${b.id})'>Aceptar Desafío</button>`;
    } 
    else if (b.estado === 'Pendiente de pago' && !b.j2Id && soyCreador) {
       accion = `
           <div style='display:flex; flex-direction:column; gap:6px; width:100%;'>
               <span style='font-size:0.8rem; color:var(--text-secondary);'>⏳ Esperando oponente...</span>
               <button class='btn btn-red btn-sm btn-block' onclick='cancelarBatalla(${b.id})'>❌ Cancelar desafío</button>
           </div>
       `;
    } 
    else if (b.estado === 'Lista para jugar' && (soyCreador || soyOponente)) {
       const oponenteId = soyCreador ? b.j2Supercell : b.j1Supercell;
       const oponenteNombre = soyCreador ? b.j2Nombre : b.j1Nombre;
       const oponenteTag = soyCreador ? b.j2Tag : b.j1Tag;
       const oponenteLink = soyCreador ? b.j2SupercellLink : b.j1SupercellLink;
       const oponenteTel = soyCreador ? b.j2Telefono : b.j1Telefono;
       const miTag = cachePerfilJugador ? cachePerfilJugador.tag : '';
       const miNombre = cachePerfilJugador ? cachePerfilJugador.nombreJuego : '';

       accion = `
           <button class='btn btn-gold btn-block btn-sm' onclick='mostrarModalGestionBatalla(${b.id}, "${miNombre}", "${miTag}", "${oponenteNombre}", "${oponenteTag}", "${oponenteId}", "${oponenteLink}", "${oponenteTel}")'>
               ⚙️ Gestionar Batalla
           </button>
       `;
    } 
    else if (b.estado === 'Disputa' && (soyCreador || soyOponente)) {
      accion = `<span style='color:#FF4655; font-weight:bold;'>En revisión por admin</span>`;
    } 
    else if (b.estado === 'Finalizada') {
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

function mostrarModalGestionBatalla(id, miNom, miT, opNom, opT, opId, opLink, opTel) {
    selectedBatalla = { id, miNom, miT, opNom, opT, opId, opLink, opTel };
    document.getElementById('modalGestionBatalla').classList.remove('hidden');
}

function gestionDeclararResultado() {
    closeModal('modalGestionBatalla');
    mostrarDeclararResultado(selectedBatalla.id);
}

function gestionCopiarID() {
    closeModal('modalGestionBatalla');
    if(selectedBatalla.opId) {
        copiarTexto(selectedBatalla.opId, 'ID de Supercell copiado');
    } else {
        toast('El oponente no tiene un Supercell ID registrado.', 'error');
    }
}

function gestionAgregarSC() {
    closeModal('modalGestionBatalla');
    if(selectedBatalla.opLink) {
        window.open(selectedBatalla.opLink, "_blank");
    } else {
        toast('El oponente no tiene un enlace de invitación registrado.', 'error');
    }
}

function gestionContactar() {
    closeModal('modalGestionBatalla');
    if(selectedBatalla.opTel) {
        const mensaje = `Hola! Soy ${selectedBatalla.miNom} (Tag: ${selectedBatalla.miT}). Estoy en la batalla #${selectedBatalla.id} contra ${selectedBatalla.opNom} (Tag: ${selectedBatalla.opT}). Mi Supercell ID es ${cachePerfilJugador.supercellId || 'No definido'}. ¿Cuál es el tuyo para agregarnos y jugar?`;
        const waLink = `https://wa.me/${selectedBatalla.opTel}?text=${encodeURIComponent(mensaje)}`;
        window.open(waLink, '_blank');
    } else {
        toast('El oponente no tiene un número de WhatsApp registrado.', 'error');
    }
}

async function cancelarBatalla(batallaId) {
    if (!confirm('¿Estás seguro de que quieres cancelar este desafío? Recuperarás el dinero de inscripción.')) return;
    const res = await apiCall({ action: 'cancelarBatalla', batallaId });
    if (res.success) {
        toast('Desafío cancelado. Tu dinero ha sido reembolsado.');
        cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
        cacheMisBatallas = await apiCall({ action: 'getMisBatallas', userId });
        const todas = await apiCall({ action: 'getBatallas' });
        cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
        renderDesafios();
        updateSidebarStatsJugador();
    } else {
        toast(res.error || 'Error al cancelar el desafío.', 'error');
    }
}

function renderReferidos() {
    const p = cachePerfilJugador || {};
    const gemas = parseInt(p.gemas || 0);
    const saldoUSD = parseFloat(p.saldo || 0);
    const a = window.ajustes || {};
    const tasa = parseFloat(a.tasaRecarga || 0);
    const oroVES = saldoUSD * tasa;
    const totalReferidos = parseInt(p.totalReferidos || 0);
    const link = window.location.origin + window.location.pathname + '?ref=' + userId;

    let tier = 1, nextTier = 16, gemsPerRef = 7, progress = 0;
    if (totalReferidos >= 31) { 
        tier = 3; nextTier = 0; gemsPerRef = 12; progress = 100; 
    } else if (totalReferidos >= 16) { 
        tier = 2; nextTier = 31; gemsPerRef = 9; progress = ((totalReferidos - 16) / 15) * 100; 
    } else { 
        progress = (totalReferidos / 16) * 100; 
    }

    let canjeBlock = '';
    if (gemas >= 100) {
        canjeBlock = `
            <div style='margin-top:16px; text-align:center;'>
                <button class='btn btn-gold btn-block' onclick='mostrarModalCanje()' style='display:flex; align-items:center; justify-content:center; gap:8px;'>
                    Canjear Gemas <img src="${ICON_GEMA}" alt="Gema" style="height:20px; width:20px; object-fit:contain;" /> por USD
                </button>
            </div>
        `;
    } else {
        const faltan = 100 - gemas;
        canjeBlock = `
            <div style='margin-top:16px; text-align:center; font-size:0.85rem; color:var(--text-secondary);'>
                Te faltan <strong style="color:var(--gold);">${faltan}</strong> gemas para poder canjear (mínimo 100).
            </div>
        `;
    }

    let historyHtml = '';
    if (cacheReferidosList && cacheReferidosList.length > 0) {
        historyHtml = `
            <h4 style='color:var(--blue); margin-top:20px; margin-bottom:10px; text-align:center;'>Historial de referidos</h4>
            <div class='table-wrapper'>
                <table>
                    <thead><tr><th>Nombre</th><th>Supercell ID</th><th>Fecha</th><th>Gemas</th></tr></thead>
                    <tbody>
                        ${cacheReferidosList.map(item => `
                            <tr>
                                <td data-label="Nombre">${item.nombreJuego}</td>
                                <td data-label="Supercell">${item.supercellId || 'N/A'}</td>
                                <td data-label="Fecha">${new Date(item.fecha).toLocaleDateString('es-VE')}</td>
                                <td data-label="Gemas">
                                    ${item.gemsAwarded} <img src="${ICON_GEMA}" alt="Gema" style="height:16px; width:16px; object-fit:contain; vertical-align:middle;" />
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    document.getElementById('panel-referidos').innerHTML = `
        <div class='ref-card ref-top-bar'>
            <div class='ref-stat'>
                <div class='ref-stat-label'>Oro</div>
                <div class='ref-stat-val gold' style='display:flex; align-items:center; justify-content:center; gap:8px;'>
                    <img src="${ICON_ORO}" alt="Oro" style="height:24px; width:24px; object-fit:contain;" />
                    ${formatVES(oroVES)}
                </div>
            </div>
            <div class='ref-stat'>
                <div class='ref-stat-label'>Gemas</div>
                <div class='ref-stat-val gem' style='display:flex; align-items:center; justify-content:center; gap:8px;'>
                    <img src="${ICON_GEMA}" alt="Gema" style="height:24px; width:24px; object-fit:contain;" />
                    ${gemas}
                </div>
            </div>
        </div>

        <div class='ref-card ref-main-card'>
            <h3 class='ref-title'>Invita y gana Gemas</h3>
            <p class='ref-subtitle'>¡Es simple! Invita amigos y gana recompensas exclusivas de Clash Royale.</p>
            
            <div class='ref-link-box'>
                <span class='ref-link-label'>Tu enlace de referido</span>
                <div class='ref-link-wrapper'>
                    <input type="text" id="refLinkInput" value="${link}" readonly>
                    <button class='btn btn-blue btn-sm btn-copy' onclick='copiarEnlace()'>Copiar</button>
                </div>
            </div>

            <div class='ref-info-row'>
                <div class='ref-icon-box'><i class="fa-solid fa-crown" style="color:var(--gold);"></i></div>
                <div class='ref-info-text'>
                    Nivel de referidos: <strong>Nivel ${tier}</strong><br>
                    <span style='font-size:0.75rem;'>Ganas <strong>${gemsPerRef}</strong> <img src="${ICON_GEMA}" alt="Gema" style="height:16px; width:16px; object-fit:contain;" /> por cada nuevo jugador que se registre con tu enlace.</span>
                    <div class='ref-progress-bar'><div class='ref-progress-fill' style='width:${progress}%;'></div></div>
                    ${nextTier > 0 ? `<span style='font-size:0.7rem; color:var(--text-secondary);'>${totalReferidos} / ${nextTier} jugadores para el Nivel ${tier+1}</span>` : '<span style="font-size:0.7rem; color:var(--gold); font-weight:700;">¡Nivel máximo alcanzado!</span>'}
                </div>
            </div>

            <div style='margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.05); border-radius:8px;'>
                <strong style="color:var(--gold);">🏅 Sistema de niveles:</strong><br>
                <span style="font-size:0.8rem; color:var(--text-secondary);">
                    <strong>Nivel 1:</strong> 7 <img src="${ICON_GEMA}" alt="Gema" style="height:14px; width:14px; object-fit:contain;" /> por referido (0 a 15 jugadores)<br>
                    <strong>Nivel 2:</strong> 9 <img src="${ICON_GEMA}" alt="Gema" style="height:14px; width:14px; object-fit:contain;" /> por referido (16 a 30 jugadores)<br>
                    <strong>Nivel 3:</strong> 12 <img src="${ICON_GEMA}" alt="Gema" style="height:14px; width:14px; object-fit:contain;" /> por referido (31+ jugadores)<br>
                </span>
            </div>

            <div class='ref-info-row'>
                <div class='ref-icon-box' style='background:rgba(255,215,0,0.15); color:var(--gold);'>
                    <img src="${ICON_ORO}" alt="Oro" style="height:20px; width:20px; object-fit:contain;" />
                </div>
                <div class='ref-info-text'>Convierte <strong>100</strong> <img src="${ICON_GEMA}" alt="Gema" style="height:16px; width:16px; object-fit:contain;" /> en <strong>Bs ${formatVES(tasa)}</strong> de Oro (equivalente a $1.00 USD).</div>
            </div>

            ${canjeBlock}
            <button class='btn btn-gold btn-block' onclick='compartirEnlace()' style='margin-top:12px;'>Compartir enlace de invitación</button>
        </div>

        ${historyHtml}
        ${cacheReferidosList && cacheReferidosList.length === 0 ? `
            <div class='ref-card ref-empty-card'>
                <h4>¿Sin invitaciones aún?</h4>
                <p>¡Empieza ahora y aumenta tus ganancias! Cada persona que invites se beneficia, y tú también ganas gemas. ¡No te pierdas esta oportunidad!</p>
            </div>
        ` : ''}
    `;
}

function copiarEnlace() {
    const input = document.getElementById('refLinkInput');
    input.select();
    input.setSelectionRange(0, 99999);
    try {
        navigator.clipboard.writeText(input.value).then(() => {
            toast('✅ Enlace copiado al portapapeles!');
        });
    } catch (err) {
        document.execCommand('copy');
        toast('✅ Enlace copiado!');
    }
}

function compartirEnlace() {
    const link = window.location.origin + window.location.pathname + '?ref=' + userId;
    const texto = '¡Únete a Clash Battles! Gana dinero jugando Clash Royale. Usa mi enlace para registrarte y obtén recompensas.';
    if (navigator.share) {
        navigator.share({
            title: '¡Únete a Clash Battles!',
            text: texto,
            url: link
        }).catch(() => toast('Error al compartir', 'error'));
    } else {
        copiarEnlace();
        toast('Enlace copiado. ¡Compártelo manualmente con tus amigos!');
    }
}

function mostrarModalCanje() {
    const gemasActuales = parseInt(cachePerfilJugador.gemas || 0);
    document.getElementById('canjeGemasActual').textContent = gemasActuales;
    document.getElementById('canjeGemasInput').value = '';
    document.getElementById('canjeGemasInput').max = gemasActuales;
    document.getElementById('canjeGemasInput').min = 100;
    document.getElementById('canjeResultadoUSD').textContent = '$0.00';
    document.getElementById('canjeResultadoBs').textContent = 'Bs 0,00';
    document.getElementById('modalCanje').classList.remove('hidden');
}

function actualizarCanjePreview() {
    const input = document.getElementById('canjeGemasInput');
    let gems = parseInt(input.value) || 0;
    const maxGems = parseInt(input.max);
    const a = window.ajustes || {};
    const tasa = parseFloat(a.tasaRecarga || 0);
    
    if (gems > maxGems) {
        input.value = maxGems;
        gems = maxGems;
    }
    if (gems < 100 && gems > 0) {
    }
    
    const montoUSD = gems / 100;
    const montoBs = montoUSD * tasa;
    document.getElementById('canjeResultadoUSD').textContent = `$${montoUSD.toFixed(2)}`;
    document.getElementById('canjeResultadoBs').textContent = `Bs ${formatVES(montoBs)}`;
}

async function ejecutarCanje() {
    const input = document.getElementById('canjeGemasInput');
    const gems = parseInt(input.value) || 0;
    
    if (gems < 100) {
        toast('Debes canjear al menos 100 gemas.', 'error');
        return;
    }
    
    const res = await apiCall({ action: 'canjearGemas', gemas: gems });
    if (res.success) {
        toast(`🎉 ¡Canje exitoso! Se añadió $${res.montoUSD.toFixed(2)} a tu saldo.`);
        closeModal('modalCanje');
        cachePerfilJugador = await apiCall({ action: 'getPerfil', userId });
        renderReferidos();
        updateSidebarStatsJugador();
    } else {
        toast(res.error || 'Error al canjear', 'error');
    }
}

function renderPerfil() {
  const p = cachePerfilJugador || {};
  const a = window.ajustes || {};
  const activeBanks = a.bancos_activos ? a.bancos_activos.split(',') : [];
  const tasaRecarga = parseFloat(a.tasaRecarga || 0);

  let bankOptions = `<option value="">Selecciona un banco</option>`;
  if (activeBanks.length > 0) {
    bankOptions = activeBanks.map(b => `<option value="${b}" ${p.banco === b ? 'selected' : ''}>${b}</option>`).join('');
  } else {
    bankOptions = `<option value="" disabled>No hay bancos disponibles</option>`;
  }

  const usdBalance = parseFloat(p.saldo || 0);
  const bsBalance = usdBalance * tasaRecarga;

  document.getElementById('panel-perfil').innerHTML = `
    <div class='balance-card'>
      <div class='balance-top'>
        <div class='balance-icon' style='background: var(--green); border: 2px solid var(--green-glow); box-shadow: 0 4px 0 #008a4a;'>$</div>
        <div class='balance-info'>
          <div class='balance-label' style='color: var(--text);'>SALDO DISPONIBLE</div>
          <div class='balance-amounts'>
            <span class='usd-amount' style='color: var(--green);'>$${usdBalance.toFixed(2)}</span>
            <span class='bs-amount' style='color: var(--gold);'>Bs: ${formatVES(bsBalance)}</span>
          </div>
        </div>
      </div>
      <div class='balance-actions'>
        <button class='btn btn-gold btn-sm' onclick='recargarSaldoUI()'><i class="fa-solid fa-sack-dollar"></i> Recargar</button>
        <button class='btn btn-green btn-sm' onclick='retirarSaldoUI()'><i class="fa-solid fa-arrow-up-from-bracket"></i> Retirar</button>
      </div>
    </div>
    
    <h3 style='margin-bottom:16px; color:var(--gold); text-shadow: 0 2px 4px rgba(0,0,0,0.5);'>Mis Datos</h3>
    <div class='perfil-grid' style='margin-bottom:24px;'>
      <div class='input-group'><label>Nombre en el juego</label><input id='perfilNombre' value='${p.nombreJuego || ''}'/></div>
      <div class='input-group'><label>Tag (#)</label><input id='perfilTag' value='${p.tag || ''}'/></div>
      <div class='input-group'><label>SUPERCELL ID (ID)</label><input id='perfilSupercell' value='${p.supercellId || ''}'/></div>
      <div class='input-group'><label>SUPERCELL ID (LINK)</label><input id='perfilSupercellLink' value='${p.supercellLink || ''}'/></div>
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
    supercellLink: document.getElementById('perfilSupercellLink').value,
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

/* ✅ V1.70: ENVÍO DE RECARGA CON CONVERSIÓN DE IMAGEN A BASE64 */
async function enviarRecarga() {
  const monto = document.getElementById('montoRecarga').value;
  const ref = document.getElementById('refRecarga').value.trim();
  const fileInput = document.getElementById('comprobanteFile');
  
  if (!monto || !ref) return toast('Completa todos los campos', 'error');
  
  let fileBase64 = '';
  let fileType = '';
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    fileType = file.type;
    fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } else {
    return toast('Debes subir una captura de pantalla del comprobante.', 'error');
  }

  const res = await apiCall({ 
    action: 'solicitarRecarga', 
    monto, 
    referencia: ref, 
    fileBase64: fileBase64, 
    fileType: fileType 
  });
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
  if (tab === 'referidos') renderReferidos();
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
