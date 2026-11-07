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


// ============ Empresa (Con datos mock) ============
const MOCK_EMPRESA = {
  nombre_legal: 'TechCorp S.A.',
  ruc: '123456-1-2023',
  sector: 'Tecnología',
  estado: 'validada', // Cambia a 'pendiente' para ver el otro estado
  vacantes: [
    { id: 'v1', titulo: 'Desarrollador Web Jr', estado: 'publicada', postulaciones: 5, modalidad: 'remota' },
    { id: 'v2', titulo: 'Soporte Técnico', estado: 'publicada', postulaciones: 2, modalidad: 'presencial' },
    { id: 'v3', titulo: 'Practicante QA', estado: 'borrador', postulaciones: 0, modalidad: 'hibrida' },
  ],
  postulaciones: [
    { id: 'p1', estudiante: 'Ana Pérez', carrera: 'Lic. en TI', vacante: 'Desarrollador Web Jr', estado: 'postulada', fecha: '2024-11-01' },
    { id: 'p2', estudiante: 'Carlos Ruiz', carrera: 'Lic. en TI', vacante: 'Desarrollador Web Jr', estado: 'postulada', fecha: '2024-10-30' },
    { id: 'p3', estudiante: 'María Gómez', carrera: 'Ing. de Sistemas', vacante: 'Soporte Técnico', estado: 'aceptada', fecha: '2024-10-25' },
  ]
};

const Company = {
  loadDashboard() {
    const e = MOCK_EMPRESA;
    
    // Si la empresa no está validada, mostrar un aviso en el dashboard
    const alerta = e.estado === 'pendiente' ? `
      <div class="card" style="grid-column: 1/-1; border-left: 4px solid var(--warning);">
        <h3>Cuenta en revisión</h3>
        <p class="muted small">Tu empresa está pendiente de validación por la universidad. Podrás publicar vacantes una vez seas aprobado.</p>
      </div>
    ` : '';

    const pendientes = e.postulaciones.filter(p => p.estado === 'postulada').length;

    $('#dashboard-cards').innerHTML = `
      ${alerta}
      <div class="metric hero">
        <span class="value">Panel de ${esc(e.nombre_legal)}</span>
        <span class="label">Estado de la cuenta: <span class="badge ${e.estado === 'validada' ? 'success' : 'warning'}">${e.estado}</span></span>
      </div>
      
      <div class="metric"><span class="value">${e.vacantes.filter(v => v.estado === 'publicada').length}</span><span class="label">Vacantes activas</span></div>
      <div class="metric"><span class="value">${pendientes}</span><span class="label">Postulaciones por revisar</span></div>
      <div class="metric"><span class="value">1</span><span class="label">Prácticas en curso</span></div>

      <div class="card" style="grid-column:1/-1">
        <h3>Últimas postulaciones recibidas</h3>
        <ul class="list">
          ${e.postulaciones.slice(0, 3).map(p => `
            <li>
              <strong>${esc(p.estudiante)}</strong> se postuló a <em>${esc(p.vacante)}</em>
              ${badgeEstado(p.estado)}
            </li>
          `).join('')}
        </ul>
        <div><button class="btn" data-go="postulaciones-recibidas">Ver todas las postulaciones</button></div>
      </div>
    `;
    bindAcciones($('#dashboard-cards'));
  },

  loadMisVacantes() {
    const e = MOCK_EMPRESA;
    $('#mis-vacantes-list').innerHTML = e.vacantes.map(v => `
      <article class="vacante-card">
        <header>
          <h4>${esc(v.titulo)}</h4>
          <span class="badge ${v.estado === 'publicada' ? 'success' : 'warning'}">${esc(v.estado)}</span>
        </header>
        <p class="small muted">Modalidad: ${esc(v.modalidad)}</p>
        <p class="small"><strong>${v.postulaciones}</strong> postulaciones recibidas</p>
        <div class="actions">
          <button class="btn btn-ghost small">Editar</button>
          <button class="btn btn-ghost small" style="color: var(--danger)">Cerrar</button>
        </div>
      </article>
    `).join('');
  },

  loadPostulacionesRecibidas() {
    const e = MOCK_EMPRESA;
    const filas = e.postulaciones.map(p => `
      <tr>
        <td><strong>${esc(p.estudiante)}</strong><br><span class="small muted">${esc(p.carrera)}</span></td>
        <td>${esc(p.vacante)}</td>
        <td>${esc(p.fecha)}</td>
        <td>${badgeEstado(p.estado)}</td>
        <td>
          ${p.estado === 'postulada' ? `
            <button class="btn btn-primary small" data-aceptar="${p.id}">Aceptar</button>
            <button class="btn btn-danger small" data-rechazar="${p.id}">Rechazar</button>
          ` : '—'}
        </td>
      </tr>
    `).join('');

    $('#postulaciones-recibidas-list').innerHTML = `
      <div class="card">
        <h3>Postulaciones Recibidas</h3>
        <table class="table">
          <thead><tr><th>Estudiante</th><th>Vacante</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>${filas || '<tr><td colspan="5" class="muted">No hay postulaciones aún.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    // Lógica de aceptar/rechazar simulada
    $$('[data-aceptar]', $('#postulaciones-recibidas-list')).forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const td = ev.target.parentElement;
        td.innerHTML = '<span class="badge success">Aceptada</span>';
        alert('Postulación aceptada (Demo). Al conectar Supabase, se creará la práctica automáticamente.');
      });
    });

    $$('[data-rechazar]', $('#postulaciones-recibidas-list')).forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const td = ev.target.parentElement;
        td.innerHTML = '<span class="badge danger">Rechazada</span>';
      });
    });
  },

  loadPerfil() {
    const e = MOCK_EMPRESA;
    $('#perfil-fields').innerHTML = `
      <label>Nombre Legal
        <input type="text" value="${esc(e.nombre_legal)}">
      </label>
      <label>RUC
        <input type="text" value="${esc(e.ruc)}">
      </label>
      <label>Sector
        <input type="text" value="${esc(e.sector)}">
      </label>
      <label>Estado de Validación
        <input type="text" value="${esc(e.estado)}" disabled style="text-transform: capitalize; background: var(--bg);">
      </label>
    `;
  },
};

// ============ Admin (Con datos mock) ============
const MOCK_ADMIN = {
  empresas_pendientes: [
    { id: 'e1', nombre: 'Innovatech Solutions', ruc: '888-123', fecha: '2024-11-05' },
    { id: 'e2', nombre: 'Consultores Asociados', ruc: '999-456', fecha: '2024-11-06' }
  ],
  usuarios: [
    { id: 'u1', nombre: 'Ana Pérez', email: 'ana@demo.com', rol: 'estudiante', estado: 'activo' },
    { id: 'u2', nombre: 'TechCorp S.A.', email: 'empresa@demo.com', rol: 'empresa', estado: 'validada' },
    { id: 'u3', nombre: 'Carlos Ruiz', email: 'carlos@demo.com', rol: 'estudiante', estado: 'activo' }
  ]
};

const Admin = {
  loadDashboard() {
    $('#dashboard-cards').innerHTML = `
      <div class="metric hero">
        <span class="value">Panel de Control Administrativo</span>
        <span class="label">Supervisión general de PracTrack</span>
      </div>
      <div class="metric">
        <span class="value" style="color: var(--danger);">${MOCK_ADMIN.empresas_pendientes.length}</span>
        <span class="label">Empresas por validar</span>
      </div>
      <div class="metric"><span class="value">${MOCK_ADMIN.usuarios.length}</span><span class="label">Usuarios registrados</span></div>
      <div class="metric"><span class="value">12</span><span class="label">Vacantes publicadas</span></div>

      <div class="card" style="grid-column: 1/-1; border-left: 4px solid var(--warning);">
        <h3>Acción requerida</h3>
        <p class="muted small">Tienes ${MOCK_ADMIN.empresas_pendientes.length} empresas esperando aprobación para publicar vacantes.</p>
        <div class="row">
          <button class="btn btn-primary" data-go="admin-empresas">Revisar empresas</button>
        </div>
      </div>
    `;
    bindAcciones($('#dashboard-cards'));
  },

  loadEmpresasPendientes() {
    const cont = $('#admin-empresas-list');
    if (MOCK_ADMIN.empresas_pendientes.length === 0) {
      cont.innerHTML = `<div class="card"><p class="muted">No hay empresas pendientes de validación. 🎉</p></div>`;
      return;
    }

    cont.innerHTML = MOCK_ADMIN.empresas_pendientes.map(e => `
      <div class="card">
        <h3>${esc(e.nombre)}</h3>
        <p class="small muted">RUC: ${esc(e.ruc)} · Solicitó: ${esc(e.fecha)}</p>
        <div class="row">
          <button class="btn btn-primary" data-validar="${e.id}">Aprobar</button>
          <button class="btn btn-danger" data-rechazar-empresa="${e.id}">Rechazar</button>
        </div>
      </div>
    `).join('');

    // Lógica de validación simulada
    $$('[data-validar]', cont).forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.target.closest('.card').innerHTML = `<p class="badge success">Empresa Aprobada</p>`;
        alert('Empresa aprobada. Ahora puede publicar vacantes.');
      });
    });

    $$('[data-rechazar-empresa]', cont).forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.target.closest('.card').innerHTML = `<p class="badge danger">Empresa Rechazada</p>`;
      });
    });
  },

  loadUsuarios() {
    const tbody = $('#admin-usuarios-table tbody');
    tbody.innerHTML = MOCK_ADMIN.usuarios.map(u => `
      <tr>
        <td><strong>${esc(u.nombre)}</strong></td>
        <td>${esc(u.email)}</td>
        <td><span class="badge">${esc(u.rol)}</span></td>
        <td><span class="badge ${u.estado === 'activo' || u.estado === 'validada' ? 'success' : 'warning'}">${esc(u.estado)}</span></td>
      </tr>
    `).join('');
  },

  loadReportes() {
    $('#reportes-cards').innerHTML = `
      <div class="metric"><span class="value">45</span><span class="label">Postulaciones totales</span></div>
      <div class="metric"><span class="value">12</span><span class="label">Prácticas en curso</span></div>
      <div class="metric"><span class="value">156</span><span class="label">Correos generados con IA</span></div>
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
  
  $('#btn-demo-empresa')?.addEventListener('click', () => {
  state.session = { access_token: 'demo-empresa' };
  state.user = { email: 'empresa@demo.com', nombre: MOCK_EMPRESA.nombre_legal };
  state.rol = 'empresa';
  
  $('#user-email').textContent = state.user.email;
  $('#role-badge').textContent = 'Empresa';
  $('#role-badge').className = 'badge warning'; // Color amarillo para diferenciar
  
  hide($('#auth-shell'));
  show($('#app-shell'));
  renderNav();
  navigate('dashboard');
});
  
  $('#btn-demo-admin')?.addEventListener('click', () => {
  state.session = { access_token: 'demo-admin' };
  state.user = { email: 'admin@unachi.ac.pa', nombre: 'Administrador UNACHI' };
  state.rol = 'admin';
  
  $('#user-email').textContent = state.user.email;
  $('#role-badge').textContent = 'Admin';
  $('#role-badge').className = 'badge danger'; // Color rojo para el admin
  
  hide($('#auth-shell'));
  show($('#app-shell'));
  renderNav();
  navigate('dashboard');
});

  // Sin sesión → mostrar login
  hide($('#app-shell'));
  show($('#auth-shell'));
  show($('#view-login'));
  hide($('#view-register'));
});
