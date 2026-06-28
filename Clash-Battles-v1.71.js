// Clash-Battles-v1.71.js | Autor: Robinson Avila | By: WinDroidMODs
// ✅ V1.71: VALIDACIONES ESTRICTAS EN RECARGA Y MONTO EN BS PARA EL ADMIN
const API = 'https://script.google.com/macros/s/AKfycbze9C1URYMjiZESFL6PBbDS0EQw5BVVmWPu3jVyDw1WkxliSsgLF7HLWy3CgrHlS2Qx/exec';
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

// ✅ V1.71: Función para abrir el modal de información
function mostrarInfoRecarga() {
  document.getElementById('modalInfoRecarga').classList.remove('hidden');
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

/* ✅ V1.71: RENDERIZADO DE RECARGAS CON MONTO EN BS */
function renderRecargasAdmin() {
  let html = `<div class='table-wrapper'><table><thead><tr>
    <th>ID</th><th>Usuario</th><th>Monto ($)</th><th>Monto (Bs)</th><th>Referencia</th><th>Comprobante</th><th>Acciones</th>
  </tr></thead><tbody>`;
  cacheRecargas.forEach(r => {
    html += `<tr>
      <td data-label="ID:">#${r.id}</td>
      <td data-label="Usuario">${r.nombre} (${r.tag})</td>
      <td data-label="Monto ($)">$${r.monto}</td>
      <td data-label="Monto (Bs)">Bs ${formatVES(r.montoBs || 0)}</td>
      <td data-label="Referencia">${r.referencia}</td>
      <td data-label="Comprobante">
        ${r.comprobante ? `<button class='btn btn-blue btn-sm' onclick='window.open("${r.comprobante}", "_blank")'>🖼️ Ver</button>` : 'Sin imagen'}
      </td>
      <td data-label="Acciones">
        <button class='btn btn-green btn-sm' onclick='verificarRecarga(${r.id})'>✓</button>
        <button class='btn btn-red btn-sm' onclick='rechazarRecarga(${r.id})'>✗</button>
      </td>
    </tr>`;
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

  const allBanks = [ ... ];
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
  
  const a = { ... };
  await apiCall({ action: 'saveAjustes', ajustes: a });
  window.ajustes = await apiCall({ action: 'getAjustes' });
  playSuccess();
  toast('Ajustes guardados');
}

let cachePerfilJugador = null, cacheMisBatallas = null, cacheBatallasAbiertas = null;
let cacheMisRecargas = [], cacheMisRetiros = [], cacheMiHistorial = [];
let cacheReferidosList = [];

async function initJugador() {
  try { ... } catch(error) {}
}

async function updateSidebarStatsJugador(perfil = null, mis = null) {
  const statsContainer = document.getElementById('sidebarStats');
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

function renderDesafios() { ... }

function renderReferidos() {
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
    // ... resto del código ...
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

  // ✅ V1.71: Limpiar campos previos al abrir
  document.getElementById('refRecarga').value = '';
  document.getElementById('comprobanteFile').value = '';

  document.getElementById('modalRecarga').classList.remove('hidden');
}

/* ✅ V1.71: VALIDACIONES ESTRICTAS Y REINICIO DEL MODAL */
async function enviarRecarga() {
  const montoInput = document.getElementById('montoRecarga');
  const refInput = document.getElementById('refRecarga');
  const fileInput = document.getElementById('comprobanteFile');
  const btnSubmit = document.querySelector('#modalRecarga .btn-gold');

  const monto = montoInput.value;
  const ref = refInput.value.trim();
  const file = fileInput.files[0];

  if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
    return toast('Ingresa un monto válido', 'error');
  }
  if (!ref || !/^\d+$/.test(ref)) {
    return toast('La referencia debe ser un número.', 'error');
  }
  if (!file) {
    return toast('Debes subir una captura de pantalla.', 'error');
  }
  if (!file.type.startsWith('image/')) {
    return toast('Solo se permiten imágenes.', 'error');
  }
  if (file.size > 5 * 1024 * 1024) {
    return toast('La imagen no debe pesar más de 5 MB.', 'error');
  }

  // Cambiar el botón a "Enviando..."
  const originalText = btnSubmit.textContent;
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Enviando...';

  let fileBase64 = '';
  let fileType = file.type;
  fileBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await apiCall({ 
    action: 'solicitarRecarga', 
    monto, 
    referencia: ref, 
    fileBase64: fileBase64, 
    fileType: fileType 
  });

  // Restaurar botón
  btnSubmit.disabled = false;
  btnSubmit.textContent = originalText;

  if (res.success) {
    toast('Comprobante enviado correctamente.');
    closeModal('modalRecarga');
    // Reiniciar campos
    montoInput.value = '';
    refInput.value = '';
    fileInput.value = '';
    document.getElementById('montoRecargaBs').textContent = '0,00';
  } else {
    toast(res.error || 'Error al enviar el comprobante', 'error');
  }
}

// ... (Resto de funciones: retirarSaldoUI, enviarRetiro, renderMisRecargas, etc.)
