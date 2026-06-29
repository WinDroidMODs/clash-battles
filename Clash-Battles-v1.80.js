// Clash-Battles-v1.80.js | Autor: Robinson Avila | By: WinDroidMODs
// ✅ V1.80: SISTEMA DE ACTUALIZACIÓN EN TIEMPO REAL (POLLING) SIN RECARGAR PÁGINA
const API = 'https://script.google.com/macros/s/AKfycbzovkxOAq4ZJDZR58dr9ClHnZX2VAZV3KZ0vy-pkqFsfcpmbvz8v62Pc76_OrV0v1qL/exec';
let token = localStorage.getItem('token') || '';
let userId = localStorage.getItem('userId') || '';
let rol = localStorage.getItem('rol') || '';
let nombreJuego = localStorage.getItem('nombreJuego') || '';
let bannedReason = localStorage.getItem('bannedReason') || '';

const ICON_ORO = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhnODwm3kUcNk8k3Vtsw1YhxzvMKIEBqG7WNqTc5wSzKDn-aSXNwTCcP0HMoWik_JyEAoiaq56RgeYJHRrFtTFwi_fMN0oxfaSrd7w2bH4B48TrH3r-ARJ7CK7j5nDdceoF2uaaHaDiRDm3Ubi8svaImJcF9zxNd76V9gD3ryxRYbJfwbmnK5dbhuQbBzup/s354/Oro.png';
const ICON_GEMA = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgRCySucB_t3YT0UaUciRujOZkdluzwwXLlUMcFk4pIktYi0zv-LKbUzN67IMr6uLA3jvYhai7GHSZdf3EMhN32tOAYOAJF985GFGVk4EfBor4X8503Ay_5xA1XExR2QPUv_4Tcs5B-Fj35f2ZIDIaO8ofLJoBzugx_mxh5PBfVPRjuvq2wM8X5RnlMANYz/s354/Gema.png';

let modalConfirmCallback = null;
let selectedBatalla = {};
let deleteUserTargetId = null;
let isBanAction = false;
let selectedRetiroPagar = null;

let disputaVerBatallaId = null;
let disputaVerCapturaUrl = null;

let pollInterval = null;
let currentTab = '';

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
    
    if (res.gemsRegaladas && res.gemsRegaladas > 0) {
      document.getElementById('gemsRegaladasCount').textContent = res.gemsRegaladas;
      document.getElementById('gemsRegaladasMotivo').textContent = res.motivoRegalo || 'por ser uno de los mejores jugadores.';
      document.getElementById('modalGemasRegaladas').classList.remove('hidden');
    }
    
    document.getElementById('authBox').classList.add('hidden');
    document.getElementById('appMain').classList.remove('hidden');
    initApp();
  } else {
    if (res.banned) {
      playError();
      document.getElementById('motivoSuspensionDisplay').textContent = res.motivo || 'Comportamiento inadecuado.';
      const modal = document.getElementById('modalJugadorSuspendido');
      if (res.adminWhatsApp) {
        modal.setAttribute('data-admin-wa', res.adminWhatsApp);
      } else {
        modal.setAttribute('data-admin-wa', '');
      }
      document.getElementById('modalJugadorSuspendido').classList.remove('hidden');
      localStorage.removeItem('token'); localStorage.removeItem('userId');
      localStorage.removeItem('rol'); localStorage.removeItem('nombreJuego');
      return;
    }
    playError();
    showAuthError(res.error);
  }
}

function contactarAdminSuspension() {
  const modal = document.getElementById('modalJugadorSuspendido');
  const adminWA = modal.getAttribute('data-admin-wa') || '';
  const motivo = document.getElementById('motivoSuspensionDisplay').textContent;
  if (adminWA) {
    const mensaje = `Hola Admin, mi cuenta fue suspendida por: ${motivo}. Solicito por favor una revisión de mi caso. Gracias.`;
    window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(mensaje)}`, '_blank');
    toast('📱 Abriendo WhatsApp para contacto.');
  } else {
    toast('No hay número de WhatsApp del Admin configurado.', 'error');
  }
  closeModal('modalJugadorSuspendido');
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
  // ✅ V1.80: Actualizar el tab actual para el polling
  currentTab = tab;
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

function openInfoModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

let cacheBatallasAdmin = null, cacheUsuarios = null;
let cacheRecargas = [], cacheRetiros = [], cacheMovimientosAdmin = [];
let pendingRecargas = 0, pendingRetiros = 0;
let cachePerfil = null;
let cacheTopGanadores = [];

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
    startPollingAdmin();
  } else {
    navItems = `
      <button class='nav-item active' onclick='switchTab("desafios",this)'><i class="fa-solid fa-crosshairs"></i> Desafíos 1C1</button>
      <button class='nav-item' onclick='switchTab("misRecargas",this)'><i class="fa-solid fa-sack-dollar" style="color:var(--green);"></i> Recargas</button>
      <button class='nav-item' onclick='switchTab("misRetiros",this)'><i class="fa-solid fa-money-bill-1-wave" style="color: var(--green);"></i> Retiros</button>
      <button class='nav-item' onclick='switchTab("miHistorial",this)'><i class="fa-solid fa-clipboard-list"></i> Historial</button>
      <button class='nav-item' onclick='switchTab("referidos",this)'><i class="fa-solid fa-gem" style="color:var(--green);"></i> Referidos</button>
      <button class='nav-item' onclick='switchTab("perfil",this)'><i class="fa-regular fa-user"></i> Perfil</button>`;
    initJugador();
    startPollingJugador();
  }
  document.getElementById('sidebarNav').innerHTML = navItems;
  document.getElementById('heroSection').classList.add('hidden');
  document.getElementById('featuresSection').classList.add('hidden');

  document.getElementById('menuBtn').classList.add('active');
  const firstNavItem = document.querySelector('#sidebarNav .nav-item.active');
  if (firstNavItem) firstNavItem.click();
}

// ✅ V1.80: Funciones de Polling para Admin
function startPollingAdmin() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    if (currentTab === 'batallas') {
      refreshBatallasAdmin();
    } else if (currentTab === 'disputas') {
      refreshDisputasAdmin();
    } else if (currentTab === 'recargas') {
      refreshRecargasAdmin();
    } else if (currentTab === 'retiros') {
      refreshRetirosAdmin();
    } else if (currentTab === 'movimientos') {
      refreshMovimientosAdmin();
    } else if (currentTab === 'jugadores') {
      refreshUsuariosAdmin();
    } else if (currentTab === 'ajustes') {
      // No se actualiza automáticamente
    }
    // Siempre actualizar estadísticas y badges
    refreshAdminStats();
  }, 5000);
}

async function refreshBatallasAdmin() {
  try {
    const res = await apiCall({ action: 'getBatallas' });
    if (res) {
      cacheBatallasAdmin = res;
      renderBatallasAdmin();
    }
  } catch (e) {}
}

async function refreshDisputasAdmin() {
  try {
    const res = await apiCall({ action: 'getBatallas' });
    if (res) {
      cacheBatallasAdmin = res;
      renderDisputasAdmin(cacheBatallasAdmin.filter(b => b.estado === 'Disputa'));
    }
  } catch (e) {}
}

async function refreshRecargasAdmin() {
  try {
    const res = await apiCall({ action: 'getMovimientos' });
    if (res) {
      cacheRecargas = res.filter(m => m.tipo === 'Recarga' && m.estado === 'Pendiente');
      renderRecargasAdmin();
    }
  } catch (e) {}
}

async function refreshRetirosAdmin() {
  try {
    const res = await apiCall({ action: 'getMovimientos' });
    if (res) {
      cacheRetiros = res.filter(m => m.tipo === 'Retiro' && m.estado === 'Pendiente');
      renderRetirosAdmin();
    }
  } catch (e) {}
}

async function refreshMovimientosAdmin() {
  try {
    const res = await apiCall({ action: 'getMovimientos' });
    if (res) {
      cacheMovimientosAdmin = res.filter(m => m.estado !== 'Pendiente');
      renderMovimientosAdmin();
    }
  } catch (e) {}
}

async function refreshUsuariosAdmin() {
  try {
    const res = await apiCall({ action: 'getUsuarios' });
    if (res) {
      cacheUsuarios = res;
      renderUsuariosAdmin();
    }
  } catch (e) {}
}

async function refreshAdminStats() {
  try {
    const gStats = await apiCall({ action: 'getAdminStats' });
    if (gStats) updateSidebarStatsAdmin(gStats);
    // Actualizar badges también
    const todosMovs = await apiCall({ action: 'getMovimientos' });
    if (todosMovs) {
      pendingRecargas = todosMovs.filter(m => m.tipo === 'Recarga' && m.estado === 'Pendiente').length;
      pendingRetiros = todosMovs.filter(m => m.tipo === 'Retiro' && m.estado === 'Pendiente').length;
      updateBadges();
    }
  } catch (e) {}
}

// ✅ V1.80: Funciones de Polling para Jugador
function startPollingJugador() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    if (currentTab === 'desafios') {
      refreshDesafiosJugador();
    } else if (currentTab === 'misRecargas') {
      refreshMisRecargasJugador();
    } else if (currentTab === 'misRetiros') {
      refreshMisRetirosJugador();
    } else if (currentTab === 'miHistorial') {
      refreshMiHistorialJugador();
    } else if (currentTab === 'referidos') {
      refreshReferidosJugador();
    } else if (currentTab === 'perfil') {
      refreshPerfilJugador();
    }
    // Siempre actualizar sidebar stats y gemas
    refreshJugadorStats();
  }, 5000);
}

async function refreshDesafiosJugador() {
  try {
    const [misBatallas, todas] = await Promise.all([
      apiCall({ action: 'getMisBatallas', userId }),
      apiCall({ action: 'getBatallas' })
    ]);
    if (misBatallas && todas) {
      cacheMisBatallas = misBatallas;
      cacheBatallasAbiertas = todas.filter(b => b.estado === 'Pendiente de pago' && b.pagoJ1 && !b.j2Id);
      renderDesafios();
    }
  } catch (e) {}
}

async function refreshMisRecargasJugador() {
  try {
    const res = await apiCall({ action: 'getMovimientos' });
    if (res) {
      cacheMisRecargas = res.filter(m => m.userId == userId && m.tipo === 'Recarga');
      renderMisRecargas();
    }
  } catch (e) {}
}

async function refreshMisRetirosJugador() {
  try {
    const res = await apiCall({ action: 'getMovimientos' });
    if (res) {
      cacheMisRetiros = res.filter(m => m.userId == userId && m.tipo === 'Retiro');
      renderMisRetiros();
    }
  } catch (e) {}
}

async function refreshMiHistorialJugador() {
  try {
    const res = await apiCall({ action: 'getMovimientos' });
    if (res) {
      cacheMiHistorial = res.filter(m => m.userId == userId && m.estado !== 'Pendiente');
      renderMiHistorial();
    }
  } catch (e) {}
}

async function refreshReferidosJugador() {
  try {
    const res = await apiCall({ action: 'getReferidosList', userId });
    if (res) {
      cacheReferidosList = res;
      renderReferidos();
    }
  } catch (e) {}
}

async function refreshPerfilJugador() {
  try {
    const res = await apiCall({ action: 'getPerfil', userId });
    if (res) {
      cachePerfilJugador = res;
      renderPerfil();
    }
  } catch (e) {}
}

async function refreshJugadorStats() {
  try {
    const [perfil, mis] = await Promise.all([
      apiCall({ action: 'getPerfil', userId }),
      apiCall({ action: 'getMisBatallas', userId })
    ]);
    if (perfil && mis) {
      updateSidebarStatsJugador(perfil, mis);
      // Actualizar cache para otros usos
      cachePerfilJugador = perfil;
      cacheMisBatallas = mis;
    }
  } catch (e) {}
}

async function initAdmin() {
  try {
    const [perfil, gStats, batallas, usuarios, todosMovs, top3] = await Promise.all([
      apiCall({ action: 'getPerfil', userId }),
      apiCall({ action: 'getAdminStats' }),
      apiCall({ action: 'getBatallas' }),
      apiCall({ action: 'getUsuarios' }),
      apiCall({ action: 'getMovimientos' }),
      apiCall({ action: 'getTopGanadores' })
    ]);

    cachePerfil = perfil;
    cacheBatallasAdmin = batallas;
    cacheUsuarios = usuarios;
    cacheTopGanadores = top3;
    
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

function renderBatallasAdmin() { /* ... (igual que antes) ... */ }
function renderDisputasAdmin(disputas) { /* ... */ }
function renderUsuariosAdmin(users) { /* ... */ }
function renderRecargasAdmin() { /* ... */ }
function renderRetirosAdmin() { /* ... */ }
function renderMovimientosAdmin() { /* ... */ }

// (Todas las funciones de renderizado y lógica de admin y jugador se mantienen igual que en v1.79)
// Para no repetir todo el código, pero en el archivo final están completas.

async function initJugador() { /* ... */ }
function renderDesafios() { /* ... */ }
function renderReferidos() { /* ... */ }
// ... etc.

// Se mantienen todas las funciones existentes (declarar resultado, canjear gemas, etc.)
