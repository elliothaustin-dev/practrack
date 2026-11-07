// =====================================================================
// PracTrack — app.js (DEMO sin backend, datos mock)
// Mantiene: auth-shell, app-shell, router por hash, NAV por rol
// =====================================================================

// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// const SUPABASE_URL      = 'https://TU-PROYECTO.supabase.co';
// const SUPABASE_ANON_KEY = 'TU_ANON_KEY_PUBLICA';
// const AI_FUNCTION_URL   = `${SUPABASE_URL}/functions/v1/gemini-email`;
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ Datos mock ============
const MOCK = {
  estudiante: {
    nombre: 'Ana Pérez',
    carrera: 'Licenciatura en Tecnología de la Información',
    area: 'Tecnología',
    semestre: 6,
    modalidad_pref: 'remota',
    disponibilidad: 'flexible',
    competencias: ['Programación web', 'Bases de datos', 'Análisis de datos'],
    bio: 'Estudiante de 6to semestre interesada en desarrollo web y análisis de datos.',
  },
  vacantes: [
    { id: 'v1', titulo: 'Desarrollador Web Jr', empresa: 'TechCorp S.A.', area: 'Tecnología', modalidad: 'remota', disponibilidad: 'flexible', descripcion: 'Desarrollo de interfaces con JavaScript y consumo de APIs REST.', competencias: ['Programación web', 'Bases de datos'], ubicacion: 'Remoto' },
    { id: 'v2', titulo: 'Soporte Técnico', empresa: 'InnovaGroup', area: 'Tecnología', modalidad: 'remota', disponibilidad: 'tarde', descripcion: 'Atención a usuarios y resolución de incidencias de primer nivel.', competencias: ['Bases de datos'], ubicacion: 'Remoto' },
    { id: 'v3', titulo: 'Analista de Datos', empresa: 'DataCorp', area: 'Tecnología', modalidad: 'hibrida', disponibilidad: 'manana', descripcion: 'Limpieza de datos, reportes y dashboards para el área comercial.', competencias: ['Análisis de datos', 'Bases de datos'], ubicacion: 'Híbrido' },
    { id: 'v4', titulo: 'Asistente de TI', empresa: 'BancoXYZ', area: 'Tecnología', modalidad: 'presencial', disponibilidad: 'jornada_completa', descripcion: 'Mantenimiento de equipos, redes y gestión de tickets internos.', competencias: ['Bases de datos'], ubicacion: 'Ciudad de Panamá' },
    { id: 'v5', titulo: 'Desarrollador Backend', empresa: 'StartupXYZ', area: 'Tecnología', modalidad: 'remota', disponibilidad: 'flexible', descripcion: 'Desarrollo de APIs con Node.js y modelado de datos.', competencias: ['Programación web', 'Bases de datos', 'Análisis de datos'], ubicacion: 'Remoto' },
  ],
  postulaciones: [
    { id: 'p1', vacante_id: 'v1', estado: 'en_revision', fecha: '2024-11-01' },
    { id: 'p2', vacante_id: 'v2', estado: 'postulada',   fecha: '2024-10-28' },
    { id: 'p3', vacante_id: 'v3', estado: 'aceptada',    fecha: '2024-10-20' },
  ],
  practica: { empresa: 'DataCorp', estado: 'en_curso', fecha_inicio: '2024-11-05', horas_completadas: 40, profesor: 'Prof. Luis Gómez' },
  pesos: { area: 40, competencias: 30, modalidad: 15, disponibilidad: 15 },
};

// ============ Estado global ============
const state = { session: null, user: null, rol: null, perfil: null };

// ============ Helpers ============
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const show = (el) => el?.classList.remove('hidden');
const hide = (el) => el?.classList.add('hidden');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const buscarVacante = (id) => MOCK.vacantes.find((v) => v.id === id);

// ============ Navegación por rol ============
const NAV = {
  estudiante: [
    ['dashboard',      'Dashboard'],
    ['vacantes',       'Vacantes'],
    ['recomendaciones','Recomendaciones'],
    ['postulaciones',  'Mis postulaciones'],
    ['correo-ia',      'Asistente IA'],
    ['perfil',         'Mi perfil'],
  ],
  empresa: [
    ['dashboard',              'Dashboard'],
    ['mis-vacantes',           'Mis vacantes'],
    ['postulaciones-recibidas','Postulaciones recibidas'],
    ['perfil',                 'Perfil de empresa'],
  ],
  profesor: [
    ['dashboard', 'Dashboard'],
    ['practicas', 'Prácticas asignadas'],
    ['perfil',    'Mi perfil'],
  ],
  admin: [
    ['dashboard',       'Dashboard'],
    ['admin-empresas',  'Empresas pendientes'],
    ['admin-usuarios',  'Usuarios'],
    ['admin-reportes',  'Reportes'],
  ],
};

// ============ Router ============
const routes = {};

function navigate(view) {
  if (!state.rol) return;
  $$('.view').forEach(hide);
  const target = $(`#view-${view}`);
  if (target) show(target);

  $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));

  // Título
  let title = 'PracTrack';
  if (view === 'vacante-detalle') title = 'Detalle de vacante';
  else {
    const item = NAV[state.rol]?.find(([v]) => v === view);
    if (item) title = item[1];
  }
  $('#view-title').textContent = title;

  routes[view]?.();
  location.hash = view;
}

function renderNav() {
  const nav = $('#nav');
  nav.innerHTML = '';
  (NAV[state.rol] || []).forEach(([view, label]) => {
    const a = document.createElement('a');
    a.href = `#${view}`;
    a.dataset.view = view;
    a.textContent = label;
    a.addEventListener('click', (e) => { e.preventDefault(); navigate(view); });
    nav.appendChild(a);
  });
}

// ============ Cálculo de compatibilidad ============
function calcularCompatibilidad(vacante) {
  const e = MOCK.estudiante;
  const p = MOCK.pesos;
  let score = 0;
  const razones = [];

  if (vacante.area === e.area) {
    score += p.area;
    razones.push(`✓ Área: ${vacante.area}`);
  } else {
    razones.push(`· Área: ${vacante.area}`);
  }

  if (vacante.competencias.length > 0) {
    const coinc = vacante.competencias.filter((c) => e.competencias.includes(c)).length;
    score += p.competencias * (coinc / vacante.competencias.length);
    razones.push(`✓ ${coinc}/${vacante.competencias.length} competencias en común`);
  }

  if (vacante.modalidad === e.modalidad_pref) {
    score += p.modalidad;
    razones.push(`✓ Modalidad ${vacante.modalidad}`);
  }

  if (vacante.disponibilidad === e.disponibilidad) {
    score += p.disponibilidad;
    razones.push('✓ Disponibilidad compatible');
  }

  return { ...vacante, score: Math.round(score), razones };
}

const recomendaciones = () =>
  MOCK.vacantes.map(calcularCompatibilidad).sort((a, b) => b.score - a.score);

// ============ Auth (demo) ============
const Auth = {
  async login(email, password) {
    alert('Login real pendiente. Usa el botón "Entrar como demo".');
  },
  async register() {
    alert('Registro real pendiente.');
  },
  async logout() {
    state.session = null;
    state.user = null;
    state.rol = null;
    state.perfil = null;
    hide($('#app-shell'));
    show($('#auth-shell'));
    show($('#view-login'));
    hide($('#view-register'));
    location.hash = '';
  },
  async loadSession() { return null; },
  async loadPerfil() { return null; },
};

function entrarDemo() {
  state.session = { access_token: 'demo' };
  state.user = { email: 'ana@demo.com', nombre: MOCK.estudiante.nombre };
  state.rol = 'estudiante';
  state.perfil = MOCK.estudiante;

  $('#user-email').textContent = state.user.email;
  $('#role-badge').textContent = state.rol;
  $('#role-badge').className = 'badge';

  hide($('#auth-shell'));
  show($('#app-shell'));
  renderNav();
  navigate('dashboard');
}

// ============ Helpers de render ============
function tarjeta(v, conScore = false) {
  return `
    <article class="vacante-card">
      <header>
        <h4>${esc(v.titulo)}</h4>
        <p class="muted small">${esc(v.empresa)}</p>
      </header>
      ${conScore && v.score != null ? `<div class="reco-score">Compatibilidad: ${v.score}%</div>` : ''}
      ${v.razones ? `<div class="reco-reasons">${v.razones.map((r) => `<span>${esc(r)}</span>`).join('')}</div>` : ''}
      <p class="small">${esc(v.descripcion.slice(0, 110))}…</p>
      <div class="actions">
        <button class="btn" data-ver="${v.id}">Ver</button>
        <button class="btn btn-primary" data-postular="${v.id}">Postularme</button>
      </div>
    </article>`;
}

function badgeEstado(estado) {
  const cls = { postulada: '', en_revision: 'warning', aceptada: 'success', rechazada: 'danger', retirada: 'danger' }[estado] || '';
  return `<span class="badge ${cls}">${esc(estado.replace('_', ' '))}</span>`;
}

function bindAcciones(root) {
  $$('[data-ver]', root).forEach((btn) =>
    btn.addEventListener('click', () => verVacante(btn.dataset.ver))
  );
  $$('[data-postular]', root).forEach((btn) =>
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.textContent = '✓ Postulado (demo)';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-ghost');
    })
  );
  $$('[data-go]', root).forEach((btn) =>
    btn.addEventListener('click', () => navigate(btn.dataset.go))
  );
}

function verVacante(id) {
  const v = buscarVacante(id);
  if (!v) return;
  const rec = calcularCompatibilidad(v);
  $$('.view').forEach(hide);
  show($('#view-vacante-detalle'));
  $('#view-title').textContent = 'Detalle de vacante';

  $('#vacante-detalle').innerHTML = `
    <button class="btn btn-ghost" id="btn-volver">← Volver</button>
    <h3>${esc(v.titulo)}</h3>
    <p class="muted">${esc(v.empresa)} · ${esc(v.ubicacion)}</p>
    <div class="row">
      <span class="badge">${esc(v.modalidad)}</span>
      <span class="badge">${esc(v.disponibilidad)}</span>
      <span class="badge">${esc(v.area)}</span>
    </div>
    <p>${esc(v.descripcion)}</p>
    <p class="small"><strong>Competencias requeridas:</strong></p>
    <p>${v.competencias.map((c) => `<span class="badge">${esc(c)}</span>`).join(' ')}</p>
    <div class="reco-score">Compatibilidad contigo: ${rec.score}%</div>
    <div class="reco-reasons">${rec.razones.map((r) => `<span>${esc(r)}</span>`).join('')}</div>
    <div class="row"><button class="btn btn-primary" data-postular="${v.id}">Postularme</button></div>
  `;

  $('#btn-volver').addEventListener('click', () => navigate('vacantes'));
  bindAcciones($('#vacante-detalle'));
}

// ============ Estudiante ============
const Student = {
  loadDashboard() {
    const d = MOCK;
    const recs = recomendaciones().slice(0, 3);
    const stats = {
      postuladas: d.postulaciones.filter((p) => p.estado === 'postulada').length,
      revision:   d.postulaciones.filter((p) => p.estado === 'en_revision').length,
      aceptadas:  d.postulaciones.filter((p) => p.estado === 'aceptada').length,
    };
    const recientes = d.postulaciones.slice(0, 3);

    $('#dashboard-cards').innerHTML = `
      <div class="metric hero">
        <span class="value">Hola, ${esc(d.estudiante.nombre.split(' ')[0])} 👋</span>
        <span class="label">Tienes ${recs.length} vacante(s) compatibles contigo.</span>
        <div class="row"><button class="btn btn-primary" data-go="recomendaciones">Ver recomendaciones</button></div>
      </div>
      <div class="metric"><span class="value">${stats.postuladas}</span><span class="label">Postuladas</span></div>
      <div class="metric"><span class="value">${stats.revision}</span><span class="label">En revisión</span></div>
      <div class="metric"><span class="value">${stats.aceptadas}</span><span class="label">Aceptadas</span></div>
      <div class="card" style="grid-column:1/-1">
        <h3>Recomendadas para ti</h3>
        <div class="grid grid-2">${recs.map((v) => tarjeta(v, true)).join('')}</div>
      </div>
      ${d.practica ? `
        <div class="card" style="grid-column:1/-1">
          <h3>Mi práctica activa</h3>
          <p><strong>${esc(d.practica.empresa)}</strong> · ${esc(d.practica.estado)}</p>
          <p class="muted small">Inicio: ${esc(d.practica.fecha_inicio)} · Horas: ${d.practica.horas_completadas} · Profesor: ${esc(d.practica.profesor)}</p>
        </div>` : ''}
      <div class="card" style="grid-column:1/-1">
        <h3>Postulaciones recientes</h3>
        <ul class="list">
          ${recientes.map((p) => {
            const v = buscarVacante(p.vacante_id);
            return `<li><strong>${esc(v.titulo)}</strong> · ${esc(v.empresa)} ${badgeEstado(p.estado)}</li>`;
          }).join('')}
        </ul>
        <div><button class="btn" data-go="postulaciones">Ver todas</button></div>
      </div>
    `;
    bindAcciones($('#dashboard-cards'));
  },

  loadVacantes() {
    // Pinta el contenedor y luego rellena
    const sec = $('#view-vacantes');
    const cont = $('#vacantes-list');
    cont.innerHTML = `<p class="muted">Cargando…</p>`;

    const pintar = () => {
      const q = $('#search-vacantes').value.toLowerCase().trim();
      const m = $('#filter-modalidad').value;
      const lista = MOCK.vacantes.filter((v) => {
        const mq = !q || v.titulo.toLowerCase().includes(q) || v.empresa.toLowerCase().includes(q);
        return mq && (!m || v.modalidad === m);
      });
      cont.innerHTML = lista.length === 0
        ? `<p class="muted">Sin resultados.</p>`
        : lista.map((v) => tarjeta(v)).join('');
      bindAcciones(cont);
    };

    // Asignamos listeners una sola vez (removeEventListener implícito al reemplazar)
    const search = $('#search-vacantes');
    const filter = $('#filter-modalidad');
    if (!search.dataset.bound) {
      search.addEventListener('input', pintar);
      filter.addEventListener('change', pintar);
      search.dataset.bound = '1';
    }

    // Rellenar opciones del filtro si está vacío
    if (filter.options.length <= 1) {
      [['remota','Remota'],['hibrida','Híbrida'],['presencial','Presencial']].forEach(([val, txt]) => {
        const o = document.createElement('option');
        o.value = val; o.textContent = txt; filter.appendChild(o);
      });
    }

    pintar();
  },

  loadRecomendaciones() {
    const cont = $('#recomendaciones-list');
    const recs = recomendaciones();
    cont.innerHTML = recs.map((v) => tarjeta(v, true)).join('');
    bindAcciones(cont);
  },

  loadPostulaciones() {
    const tbody = $('#postulaciones-table tbody');
    const filas = MOCK.postulaciones.map((p) => {
      const v = buscarVacante(p.vacante_id);
      return `<tr>
        <td><strong>${esc(v.titulo)}</strong></td>
        <td>${esc(v.empresa)}</td>
        <td>${esc(p.fecha)}</td>
        <td>${badgeEstado(p.estado)}</td>
        <td><button class="btn btn-ghost small" data-ver="${v.id}">Ver vacante</button></td>
      </tr>`;
    }).join('');
    tbody.innerHTML = filas || `<tr><td colspan="5" class="muted">Aún no te has postulado.</td></tr>`;
    bindAcciones(tbody);
  },

  loadPerfil() {
    const e = MOCK.estudiante;
    $('#perfil-fields').innerHTML = `
      <label>Nombre
        <input type="text" value="${esc(e.nombre)}" disabled>
      </label>
      <label>Carrera
        <input type="text" value="${esc(e.carrera)}" disabled>
      </label>
      <label>Semestre
        <input type="number" value="${e.semestre}" min="1" max="12">
      </label>
      <label>Modalidad preferida
        <select>
          <option value="remota" ${e.modalidad_pref === 'remota' ? 'selected' : ''}>Remota</option>
          <option value="hibrida" ${e.modalidad_pref === 'hibrida' ? 'selected' : ''}>Híbrida</option>
          <option value="presencial" ${e.modalidad_pref === 'presencial' ? 'selected' : ''}>Presencial</option>
        </select>
      </label>
      <label>Disponibilidad
        <select>
          <option value="manana" ${e.disponibilidad === 'manana' ? 'selected' : ''}>Mañana</option>
          <option value="tarde" ${e.disponibilidad === 'tarde' ? 'selected' : ''}>Tarde</option>
          <option value="jornada_completa" ${e.disponibilidad === 'jornada_completa' ? 'selected' : ''}>Jornada completa</option>
          <option value="flexible" ${e.disponibilidad === 'flexible' ? 'selected' : ''}>Flexible</option>
        </select>
      </label>
      <label>Bio
        <textarea rows="3">${esc(e.bio)}</textarea>
      </label>
    `;
  },

  loadCorreoIA() {
    // Rellenar el select de vacantes
    const sel = $('#ia-vacante');
    if (sel.options.length <= 1) {
      MOCK.vacantes.forEach((v) => {
        const o = document.createElement('option');
        o.value = v.id;
        o.textContent = `${v.titulo} — ${v.empresa}`;
        sel.appendChild(o);
      });
    }
  },
};

// ============ Empresa (aún sin demo) ============
const Company = {
  loadDashboard() {
    $('#dashboard-cards').innerHTML = `
      <div class="metric"><span class="value">—</span><span class="label">Vacantes activas</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Postulaciones recibidas</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Prácticas en curso</span></div>
    `;
  },
  loadMisVacantes() { $('#mis-vacantes-list').innerHTML = `<p class="muted">Aún no has publicado vacantes.</p>`; },
  loadPostulacionesRecibidas() { $('#postulaciones-recibidas-list').innerHTML = `<p class="muted">Sin postulaciones.</p>`; },
  loadPerfil() { $('#perfil-fields').innerHTML = `<p class="muted">Perfil de empresa pendiente.</p>`; },
};

// ============ Profesor (aún sin demo) ============
const Professor = {
  loadDashboard() {
    $('#dashboard-cards').innerHTML = `
      <div class="metric"><span class="value">—</span><span class="label">Prácticas asignadas</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Estudiantes</span></div>
    `;
  },
  loadPracticas() { $('#practicas-list').innerHTML = `<p class="muted">Sin prácticas asignadas.</p>`; },
  loadPerfil() { $('#perfil-fields').innerHTML = `<p class="muted">Perfil pendiente.</p>`; },
};

// ============ Admin (aún sin demo) ============
const Admin = {
  loadDashboard() {
    $('#dashboard-cards').innerHTML = `
      <div class="metric"><span class="value">—</span><span class="label">Empresas por validar</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Usuarios activos</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Vacantes publicadas</span></div>
    `;
  },
  loadEmpresasPendientes() { $('#admin-empresas-list').innerHTML = `<p class="muted">Sin empresas pendientes.</p>`; },
  loadUsuarios() { $('#admin-usuarios-table tbody').innerHTML = `<tr><td colspan="4" class="muted">Cargando usuarios…</td></tr>`; },
  loadReportes() {
    $('#reportes-cards').innerHTML = `
      <div class="metric"><span class="value">—</span><span class="label">Postulaciones por área</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Prácticas en curso</span></div>
      <div class="metric"><span class="value">—</span><span class="label">Uso del módulo IA</span></div>
    `;
  },
};

// ============ Asistencia IA (mock) ============
const AI = {
  async generarCorreo() {
    const vacanteId = $('#ia-vacante').value;
    if (!vacanteId) { alert('Selecciona una vacante primero.'); return; }
    const v = buscarVacante(vacanteId);
    const e = MOCK.estudiante;

    const btn = $('#btn-generar-correo');
    btn.disabled = true;
    btn.textContent = 'Generando…';

    // Simulamos latencia para que se sienta real
    await new Promise((r) => setTimeout(r, 600));

    $('#ia-correo-texto').value =
      `Estimado equipo de ${v.empresa}:\n\n` +
      `Mi nombre es ${e.nombre}, estudiante de ${e.semestre}° semestre de ${e.carrera}. ` +
      `Me dirijo a ustedes para expresar mi interés en la vacante "${v.titulo}".\n\n` +
      `Cuento con experiencia en ${e.competencias.slice(0, 2).join(' y ')}, y considero que mi formación y motivación encajan con los objetivos del puesto. ` +
      `Mi disponibilidad es ${e.disponibilidad} y prefiero modalidad ${e.modalidad_pref}.\n\n` +
      `Quedo atenta a cualquier información adicional que requieran.\n\n` +
      `Saludos cordiales,\n${e.nombre}`;

    btn.disabled = false;
    btn.textContent = 'Generar borrador';
  },
};

// ============ Rutas ============
Object.assign(routes, {
  'dashboard': () => {
    if (state.rol === 'estudiante') Student.loadDashboard();
    else if (state.rol === 'empresa') Company.loadDashboard();
    else if (state.rol === 'profesor') Professor.loadDashboard();
    else if (state.rol === 'admin') Admin.loadDashboard();
  },
  'vacantes':        () => Student.loadVacantes(),
  'recomendaciones': () => Student.loadRecomendaciones(),
  'postulaciones':   () => Student.loadPostulaciones(),
  'correo-ia':       () => Student.loadCorreoIA(),
  'mis-vacantes':    () => Company.loadMisVacantes(),
  'postulaciones-recibidas': () => Company.loadPostulacionesRecibidas(),
  'practicas':       () => Professor.loadPracticas(),
  'admin-empresas':  () => Admin.loadEmpresasPendientes(),
  'admin-usuarios':  () => Admin.loadUsuarios(),
  'admin-reportes':  () => Admin.loadReportes(),
  'perfil': () => {
    if (state.rol === 'estudiante') Student.loadPerfil();
    else if (state.rol === 'empresa') Company.loadPerfil();
    else if (state.rol === 'profesor') Professor.loadPerfil();
  },
  'vacante-detalle': () => { /* renderizado por verVacante */ },
});

// ============ Eventos ============
function bindEvents() {
  $('#form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    Auth.login(fd.get('email'), fd.get('password'));
  });

  $('#form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    Auth.register({
      nombre:   fd.get('nombre'),
      email:    fd.get('email'),
      password: fd.get('password'),
      rol:      fd.get('rol'),
    });
  });

  $('#btn-logout').addEventListener('click', () => Auth.logout());

  // Botón demo — está en la pantalla de login
  $('#btn-demo')?.addEventListener('click', entrarDemo);

  $('#btn-generar-correo').addEventListener('click', () => AI.generarCorreo());
  $('#btn-guardar-correo').addEventListener('click', () => {
    alert('Demo: el guardado real se implementará al conectar la base de datos.');
  });
  $('#btn-copiar-correo').addEventListener('click', async () => {
    const txt = $('#ia-correo-texto').value;
    if (txt) try { await navigator.clipboard.writeText(txt); } catch {}
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (!link) return;
    e.preventDefault();
    const view = link.getAttribute('href').replace('#', '');
    if (view === 'login' || view === 'register') {
      hide($('#view-login'));
      hide($('#view-register'));
      show($(`#view-${view}`));
      history.replaceState(null, '', `#${view}`);
    }
  });

  $('#btn-nueva-vacante').addEventListener('click', () => {
    alert('Demo: formulario de nueva vacante próximamente.');
  });
}

// ============ Bootstrap ============
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();

  // Sin sesión → mostrar login
  hide($('#app-shell'));
  show($('#auth-shell'));
  show($('#view-login'));
  hide($('#view-register'));
});
