// =====================================================================
// PracTrack — Módulo Estudiante
// Consultas reales a Supabase + cálculo de compatibilidad explicable
// =====================================================================
import { supabase } from './supabase-client.js';

// ---------- Helpers ----------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escape = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const irA = (view) => {
  // Reutiliza el router del app.js sin importarlo (evita dependencia circular)
  const link = $(`#nav a[data-view="${view}"]`);
  if (link) link.click();
  else location.hash = view;
};

// ---------- Cálculo de compatibilidad (explicable) ----------
function calcularCompatibilidad(perfil, misCompIds, vacante, pesos) {
  const razones = [];
  let score = 0;

  // 1) Área
  const areaEst = perfil?.carreras?.area?.toLowerCase();
  const areaVac = vacante?.area?.toLowerCase();
  if (areaEst && areaVac && areaEst === areaVac) {
    score += pesos.peso_area;
    razones.push(`✓ Área compatible (${vacante.area})`);
  } else if (areaVac) {
    razones.push(`· Área: ${vacante.area}`);
  }

  // 2) Competencias
  const compsVac = (vacante.vacante_competencias || []).map((vc) => vc.competencia_id);
  if (compsVac.length > 0) {
    const coinc = compsVac.filter((id) => misCompIds.includes(id)).length;
    score += pesos.peso_competencias * (coinc / compsVac.length);
    razones.push(`✓ ${coinc}/${compsVac.length} competencias en común`);
  }

  // 3) Modalidad
  if (perfil?.modalidad_pref && perfil.modalidad_pref === vacante.modalidad) {
    score += pesos.peso_modalidad;
    razones.push(`✓ Modalidad ${vacante.modalidad}`);
  }

  // 4) Disponibilidad
  if (perfil?.disponibilidad && perfil.disponibilidad === vacante.disponibilidad) {
    score += pesos.peso_disponibilidad;
    razones.push('✓ Disponibilidad compatible');
  }

  return { score: Math.round(score), razones };
}

// ---------- Render de tarjetas ----------
function renderVacanteCard(v, { conScore = false } = {}) {
  const empresa = v.empresas?.nombre_legal ?? 'Empresa';
  const razones = v.razones ?? [];
  return `
    <article class="vacante-card">
      <header>
        <h4>${escape(v.titulo)}</h4>
        <p class="muted small">${escape(empresa)}</p>
      </header>
      ${conScore ? `<div class="reco-score">Compatibilidad: ${v.score}%</div>` : ''}
      <div class="reco-reasons">
        ${razones.map((r) => `<span>${escape(r)}</span>`).join('')}
      </div>
      <p class="small">${escape((v.descripcion || '').slice(0, 110))}…</p>
      <div class="actions">
        <button class="btn" data-ver-vacante="${v.id}">Ver</button>
        <button class="btn btn-primary" data-postular="${v.id}">Postularme</button>
      </div>
    </article>`;
}

// ---------- Módulo ----------
export const Student = {
  // ---- Carga de datos completa (una sola vez por vista) ----
  async cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesión no válida');

    // 1) Perfil del estudiante + carrera
    const { data: perfil, error: errPerfil } = await supabase
      .from('estudiantes')
      .select(`
        id, carrera_id, modalidad_pref, disponibilidad, semestre, bio, cv_url,
        carreras ( nombre, area, facultad )
      `)
      .eq('perfil_id', user.id)
      .single();
    if (errPerfil) throw errPerfil;

    // 2) Competencias del estudiante
    const { data: misCompsRows } = await supabase
      .from('estudiante_competencias')
      .select('competencia_id, competencias ( nombre )')
      .eq('estudiante_id', perfil.id);
    const misCompIds = (misCompsRows || []).map((r) => r.competencia_id);

    // 3) Vacantes publicadas + empresa + competencias requeridas
    const { data: vacantes } = await supabase
      .from('vacantes')
      .select(`
        id, titulo, descripcion, area, modalidad, disponibilidad,
        ubicacion, fecha_cierre, cupos,
        empresas ( nombre_legal, logo_url, sector ),
        vacante_competencias ( competencia_id )
      `)
      .eq('estado', 'publicada')
      .order('created_at', { ascending: false });

    // 4) Mis postulaciones (para contadores y “recientes”)
    const { data: postulaciones } = await supabase
      .from('postulaciones')
      .select(`
        id, estado, fecha_postulacion, vacante_id,
        vacantes ( titulo, empresas ( nombre_legal ) )
      `)
      .eq('estudiante_id', perfil.id)
      .order('fecha_postulacion', { ascending: false });

    // 5) Práctica activa (si existe)
    const { data: practica } = await supabase
      .from('practicas')
      .select(`
        id, estado, fecha_inicio, fecha_fin, horas_completadas,
        empresas ( nombre_legal )
      `)
      .eq('estudiante_id', perfil.id)
      .in('estado', ['pendiente_inicio', 'en_curso'])
      .maybeSingle();

    // 6) Pesos de recomendación (configurable por admin)
    const { data: config } = await supabase
      .from('configuracion_recomendacion')
      .select('peso_area, peso_competencias, peso_modalidad, peso_disponibilidad')
      .eq('activa', true)
      .maybeSingle();
    const pesos = config ?? {
      peso_area: 40, peso_competencias: 30, peso_modalidad: 15, peso_disponibilidad: 15,
    };

    // 7) Calcular recomendaciones
    const recomendaciones = (vacantes || [])
      .map((v) => ({ ...v, ...calcularCompatibilidad(perfil, misCompIds, v, pesos) }))
      .sort((a, b) => b.score - a.score);

    const perfilCompleto = Boolean(
      perfil?.carrera_id &&
      perfil?.modalidad_pref &&
      perfil?.disponibilidad &&
      misCompIds.length > 0
    );

    return {
      user, perfil, misCompIds, vacantes: vacantes || [],
      postulaciones: postulaciones || [], practica,
      recomendaciones, pesos, perfilCompleto,
    };
  },

  // ---- Dashboard ----
  async loadDashboard() {
    const cont = $('#dashboard-cards');
    cont.innerHTML = `<p class="muted">Cargando…</p>`;

    let d;
    try {
      d = await this.cargarDatos();
    } catch (err) {
      console.error('[Student.loadDashboard]', err);
      cont.innerHTML = `<div class="card"><p>No se pudo cargar el dashboard.</p>
        <p class="muted small">${escape(err.message)}</p></div>`;
      return;
    }

    cont.innerHTML = d.perfilCompleto
      ? this.renderDashboardOperativo(d)
      : this.renderOnboarding(d);

    this.bindPostular(cont, d);
  },

  // ---- Estado A: onboarding ----
  renderOnboarding(d) {
    const pasos = [
      { ok: true, text: 'Cuenta creada' },
      { ok: !!d.perfil?.carrera_id, text: 'Selecciona tu carrera', view: 'perfil' },
      { ok: d.misCompIds.length > 0, text: 'Añade tus competencias', view: 'perfil' },
      { ok: !!d.perfil?.modalidad_pref && !!d.perfil?.disponibilidad,
        text: 'Define modalidad y disponibilidad', view: 'perfil' },
      { ok: !!d.perfil?.cv_url, text: 'Sube tu CV', view: 'perfil' },
      { ok: d.postulaciones.length > 0, text: 'Postúlate a tu primera vacante', view: 'vacantes' },
    ];
    const pendientes = pasos.filter((p) => !p.ok).length;

    return `
      <div class="card" style="grid-column: 1 / -1">
        <h3>¡Bienvenido a PracTrack!</h3>
        <p class="muted">Te faltan ${pendientes} paso(s) para activar las recomendaciones personalizadas.</p>
        <div class="checklist">
          ${pasos.map((p) => `
            <div class="checklist-item ${p.ok ? 'done' : ''}">
              <span class="check">${p.ok ? '✓' : ''}</span>
              <span>${escape(p.text)}</span>
              ${!p.ok && p.view ? `<button class="btn btn-ghost small" data-ir="${p.view}">Ir</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`;
  },

  // ---- Estado B: dashboard operativo ----
  renderDashboardOperativo(d) {
    const stats = {
      postuladas: d.postulaciones.filter((p) => p.estado === 'postulada').length,
      en_revision: d.postulaciones.filter((p) => p.estado === 'en_revision').length,
      aceptadas: d.postulaciones.filter((p) => p.estado === 'aceptada').length,
    };
    const top3 = d.recomendaciones.slice(0, 3);
    const recientes = d.postulaciones.slice(0, 3);

    return `
      <div class="metric" style="grid-column: 1 / -1">
        <span class="value">Hola, ${escape(d.perfil?.carreras?.nombre ? d.perfil.carreras.nombre.split(' ')[0] : 'estudiante')}</span>
        <span class="label">
          ${top3.length > 0
            ? `Tienes ${top3.length} vacante(s) compatibles contigo.`
            : 'Aún no hay vacantes publicadas para tu perfil.'}
        </span>
        ${top3.length > 0 ? `<div class="row"><button class="btn btn-primary" data-ir="recomendaciones">Ver recomendaciones</button></div>` : ''}
      </div>

      <div class="metric"><span class="value">${stats.postuladas}</span><span class="label">Postuladas</span></div>
      <div class="metric"><span class="value">${stats.en_revision}</span><span class="label">En revisión</span></div>
      <div class="metric"><span class="value">${stats.aceptadas}</span><span class="label">Aceptadas</span></div>

      ${top3.length > 0 ? `
        <div class="card" style="grid-column: 1 / -1">
          <h3>Recomendadas para ti</h3>
          <div class="grid grid-2">
            ${top3.map((v) => renderVacanteCard(v, { conScore: true })).join('')}
          </div>
        </div>` : ''}

      ${recientes.length > 0 ? `
        <div class="card" style="grid-column: 1 / -1">
          <h3>Postulaciones recientes</h3>
          <ul class="list">
            ${recientes.map((p) => `
              <li>
                <strong>${escape(p.vacantes?.titulo ?? 'Vacante')}</strong>
                · ${escape(p.vacantes?.empresas?.nombre_legal ?? '')}
                <span class="badge ${p.estado === 'aceptada' ? 'success' : p.estado === 'rechazada' ? 'danger' : ''}">${escape(p.estado)}</span>
              </li>`).join('')}
          </ul>
          <button class="btn" data-ir="postulaciones">Ver todas</button>
        </div>` : ''}

      ${d.practica ? `
        <div class="card" style="grid-column: 1 / -1">
          <h3>Mi práctica activa</h3>
          <p><strong>${escape(d.practica.empresas?.nombre_legal ?? '')}</strong></p>
          <p class="muted small">${escape(d.practica.estado)} · Inicio: ${escape(d.practica.fecha_inicio ?? '—')}</p>
        </div>` : ''}
    `;
  },

  // ---- Vista: recomendaciones completas ----
  async loadRecomendaciones() {
    const cont = $('#recomendaciones-list');
    cont.innerHTML = `<p class="muted">Cargando…</p>`;

    let d;
    try { d = await this.cargarDatos(); }
    catch (err) {
      console.error(err);
      cont.innerHTML = `<p class="muted">No se pudieron cargar las recomendaciones.</p>`;
      return;
    }

    if (!d.perfilCompleto) {
      cont.innerHTML = `<p class="muted">Completa tu perfil para ver recomendaciones personalizadas.</p>`;
      return;
    }

    cont.innerHTML = d.recomendaciones.map((v) => renderVacanteCard(v, { conScore: true })).join('');
    this.bindPostular(cont, d);
  },

  // ---- Vista: vacantes (todas) ----
  async loadVacantes() {
    const cont = $('#vacantes-list');
    cont.innerHTML = `<p class="muted">Cargando…</p>`;

    let d;
    try { d = await this.cargarDatos(); }
    catch (err) {
      console.error(err);
      cont.innerHTML = `<p class="muted">No se pudieron cargar las vacantes.</p>`;
      return;
    }

    cont.innerHTML = d.vacantes.length === 0
      ? `<p class="muted">Aún no hay vacantes publicadas.</p>`
      : d.vacantes.map((v) => renderVacanteCard(v)).join('');
    this.bindPostular(cont, d);
  },

  // ---- Acción: postularme ----
  bindPostular(cont, d) {
    cont.querySelectorAll('[data-postular]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const vacanteId = btn.dataset.postular;
        const vac = d.vacantes.find((v) => v.id === vacanteId);
        if (!vac) return;

        btn.disabled = true;
        btn.textContent = 'Enviando…';
        try {
          const { error } = await supabase.from('postulaciones').insert({
            estudiante_id: d.perfil.id,
            vacante_id: vacanteId,
            estado: 'postulada',
          });
          if (error) throw error;
          btn.textContent = '✓ Postulado';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        } catch (err) {
          console.error(err);
          const dup = err.message?.toLowerCase().includes('duplicate') ||
                      err.code === '23505';
          btn.disabled = false;
          btn.textContent = 'Postularme';
          alert(dup ? 'Ya te postulaste a esta vacante.' : 'No se pudo postular: ' + err.message);
        }
      });
    });

    cont.querySelectorAll('[data-ver-vacante]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sessionStorage.setItem('vacanteActual', btn.dataset.verVacante);
        irA('vacante-detalle'); // el router decidirá si existe la vista
      });
    });
  },

  // ---- Vista: perfil ----
  async loadPerfil() {
    const cont = $('#perfil-fields');
    cont.innerHTML = `<p class="muted">Cargando perfil…</p>`;
    try {
      const d = await this.cargarDatos();
      const p = d.perfil || {};
      cont.innerHTML = `
        <label>Carrera
          <select name="carrera_id" id="pf-carrera"><option value="">Selecciona…</option></select>
        </label>
        <label>Semestre
          <input type="number" name="semestre" min="1" max="12" value="${escape(p.semestre ?? '')}">
        </label>
        <label>Modalidad preferida
          <select name="modalidad_pref">
            <option value="">—</option>
            <option value="presencial" ${p.modalidad_pref === 'presencial' ? 'selected' : ''}>Presencial</option>
            <option value="hibrida"    ${p.modalidad_pref === 'hibrida' ? 'selected' : ''}>Híbrida</option>
            <option value="remota"     ${p.modalidad_pref === 'remota' ? 'selected' : ''}>Remota</option>
          </select>
        </label>
        <label>Disponibilidad
          <select name="disponibilidad">
            <option value="">—</option>
            <option value="manana" ${p.disponibilidad === 'manana' ? 'selected' : ''}>Mañana</option>
            <option value="tarde"  ${p.disponibilidad === 'tarde' ? 'selected' : ''}>Tarde</option>
            <option value="jornada_completa" ${p.disponibilidad === 'jornada_completa' ? 'selected' : ''}>Jornada completa</option>
            <option value="flexible" ${p.disponibilidad === 'flexible' ? 'selected' : ''}>Flexible</option>
          </select>
        </label>
        <label>Bio
          <textarea name="bio" rows="3">${escape(p.bio ?? '')}</textarea>
        </label>`;

      // Catálogo de carreras
      const { data: carreras } = await supabase.from('carreras').select('id, nombre').order('nombre');
      const sel = $('#pf-carrera');
      (carreras || []).forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        if (c.id === p.carrera_id) opt.selected = true;
        sel.appendChild(opt);
      });

      // Guardar
      $('#form-perfil').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
          carrera_id: fd.get('carrera_id') || null,
          semestre: Number(fd.get('semestre')) || null,
          modalidad_pref: fd.get('modalidad_pref') || null,
          disponibilidad: fd.get('disponibilidad') || null,
          bio: fd.get('bio') || null,
        };
        const { error } = await supabase
          .from('estudiantes')
          .update(payload)
          .eq('id', d.perfil.id);
        if (error) { alert('No se pudo guardar: ' + error.message); return; }
        alert('Perfil actualizado');
      };
    } catch (err) {
      console.error(err);
      cont.innerHTML = `<p class="muted">No se pudo cargar el perfil.</p>`;
    }
  },
};
