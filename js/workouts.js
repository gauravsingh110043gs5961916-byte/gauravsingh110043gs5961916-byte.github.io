/* ============================================================
   FitLife 360 — workouts.js
   Workout planner: library, plans, live timer, set logging.
   ============================================================ */
'use strict';

const Workouts = (() => {
  const { $, esc, toast, modal, confirmDialog, go } = App;

  let session = null;   // active workout session
  let restTimer = null;

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /* ---------------- VIEW ---------------- */
  App.Views.workout = {
    render(main, params) {
      const sub = (params && params.sub) || 'plans';
      main.innerHTML = `
        <header class="app-head"><h2>💪 Workout</h2><span></span></header>
        <div class="chip-row" style="margin-bottom:12px">
          <button class="chip ${sub === 'plans' ? 'on' : ''}" data-sub="plans">Plans</button>
          <button class="chip ${sub === 'library' ? 'on' : ''}" data-sub="library">Exercises</button>
          <button class="chip ${sub === 'history' ? 'on' : ''}" data-sub="history">History</button>
        </div>
        <div id="wBody"></div>`;
      document.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => go('workout', { sub: b.dataset.sub }));
      const body = $('#wBody');
      if (sub === 'library') renderLibrary(body, params);
      else if (sub === 'history') renderHistory(body);
      else renderPlans(body, params);
    },
    after(main, params) {
      if (session && params && params.resume) { /* keep session UI */ }
    }
  };

  function muscleFilterHTML(sel) {
    return `<select id="wMuscle" class="inline-select">
      <option value="">All muscles</option>
      ${DB.MUSCLES.map(m => `<option value="${m}" ${sel === m ? 'selected' : ''}>${m}</option>`).join('')}
    </select>`;
  }

  function renderPlans(body, params) {
    const profile = Storage.getProfile() || {};
    const level = profile.experience || 'beginner';
    const plans = DB.PLANS.filter(p => p.level === level || (params && params.all));
    body.innerHTML = `
      <p class="muted small">Showing <strong>${esc(level)}</strong> plans. <a href="#" id="wAll">Show all levels</a></p>
      ${plans.map(p => `
        <div class="card">
          <h3>${esc(p.name)}</h3>
          <p class="muted small">${esc(p.desc)}</p>
          ${p.days.map((d, di) => `
            <div class="plan-day">
              <strong>${esc(d.day)}</strong>
              ${d.exercises.length
                ? `<p class="small muted">${d.exercises.map(id => { const e = DB.exerciseById(id); return e ? esc(e.name) : ''; }).join(' · ')}</p>
                   <button class="btn primary small" data-start="${p.id}:${di}">▶ Start this workout</button>`
                : `<p class="small muted">Rest day 🛌</p>`}
            </div>`).join('')}
        </div>`).join('')}
      <div class="card"><h3>⚡ Quick freestyle workout</h3>
        <p class="muted small">Pick any exercises and train.</p>
        <button class="btn primary" id="wFreestyle">Choose exercises →</button></div>`;
      const all = $('#wAll');
      if (all) all.onclick = e => { e.preventDefault(); go('workout', { sub: 'plans', all: true }); };
      body.querySelectorAll('[data-start]').forEach(b => b.onclick = () => {
        const [pid, di] = b.dataset.start.split(':');
        const plan = DB.PLANS.find(p => p.id === pid);
        startSession(plan.name + ' — ' + plan.days[+di].day, plan.days[+di].exercises);
      });
      $('#wFreestyle').onclick = () => go('workout', { sub: 'library', pick: true });
  }

  function renderLibrary(body, params) {
    const picking = params && params.pick;
    const muscle = (params && params.muscle) || '';
    const list = DB.EXERCISES.filter(e => !muscle || e.muscle === muscle);
    body.innerHTML = `
      <div class="row2" style="margin-bottom:10px">
        <input id="wSearch" type="search" placeholder="Search exercises…" value="${esc((params && params.q) || '')}">
        ${muscleFilterHTML(muscle)}
      </div>
      ${picking ? '<p class="muted small">Tap exercises to add, then start.</p><div id="pickBar" class="pick-bar hidden"><span id="pickCount">0 selected</span><button class="btn primary small" id="pickStart">▶ Start</button></div>' : ''}
      <div id="exList">${list.map(exCard).join('')}</div>`;
    const picked = new Set();
    const refresh = q => {
      const m = $('#wMuscle').value;
      const items = DB.EXERCISES.filter(e =>
        (!m || e.muscle === m) && (!q || e.name.toLowerCase().includes(q.toLowerCase())));
      $('#exList').innerHTML = items.map(exCard).join('');
      bindCards();
    };
    const bindCards = () => {
      body.querySelectorAll('.ex-card').forEach(card => {
        card.onclick = () => {
          if (picking) {
            const id = card.dataset.id;
            if (picked.has(id)) { picked.delete(id); card.classList.remove('picked'); }
            else { picked.add(id); card.classList.add('picked'); }
            $('#pickCount').textContent = picked.size + ' selected';
            $('#pickBar').classList.toggle('hidden', picked.size === 0);
          } else showExercise(card.dataset.id);
        };
      });
    };
    bindCards();
    $('#wSearch').oninput = e => refresh(e.target.value);
    $('#wMuscle').onchange = e => refresh($('#wSearch').value);
    if (picking) $('#pickStart').onclick = () => {
      if (!picked.size) return;
      startSession('Freestyle workout', [...picked]);
    };
  }

  function exCard(e) {
    return `<div class="card ex-card" data-id="${e.id}" role="button" tabindex="0">
      <strong>${esc(e.name)}</strong>
      <p class="small muted">${esc(e.muscle)} · ${esc(e.level)} · ${e.equipment === 'none' ? 'no equipment' : esc(e.equipment)}</p>
      <p class="small">${esc(e.sets)} sets × ${esc(e.reps)} · rest ${e.rest}s</p></div>`;
  }

  function showExercise(id) {
    const e = DB.exerciseById(id);
    if (!e) return;
    modal(e.name, `
      <p><span class="tag">${esc(e.muscle)}</span> <span class="tag">${esc(e.level)}</span>
      <span class="tag">${e.equipment === 'none' ? 'no equipment' : esc(e.equipment)}</span></p>
      <p><strong>${esc(e.sets)} sets × ${esc(e.reps)}</strong> · rest ${e.rest}s between sets</p>
      <h4>How to do it</h4><p>${esc(e.instructions)}</p>
      <p class="hint">Stop if you feel sharp pain. Beginners: start with fewer sets.</p>`,
      [{ label: 'Close', kind: 'ghost' }]);
  }

  function renderHistory(body) {
    const sessions = Storage.list(Storage.KEYS.workouts).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
    const totalMin = sessions.reduce((a, s) => a + (s.durationMin || 0), 0);
    body.innerHTML = `
      <div class="card"><h3>${sessions.length} sessions · ${totalMin} min total</h3></div>
      ${sessions.map(s => `
        <div class="card small"><strong>${esc(s.name)}</strong>
          <p class="small muted">${s.date} · ${s.durationMin} min · ${s.sets} sets</p>
          <button class="icon-btn danger" data-del="${s.id}">🗑️</button></div>`).join('')
        || '<p class="muted">No workouts logged yet. Start one above! 💪</p>'}`;
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirmDialog('Delete?', 'Delete this workout record?', () => {
        Storage.removeById(Storage.KEYS.workouts, b.dataset.del); go('workout', { sub: 'history' });
      }));
  }

  /* ---------------- LIVE SESSION ---------------- */
  function startSession(name, exerciseIds) {
    session = {
      name, startedAt: Date.now(), pausedMs: 0, pauseStart: null,
      exercises: exerciseIds.map(id => {
        const e = DB.exerciseById(id);
        return { id, name: e.name, targetSets: parseInt(e.sets) || 3, reps: e.reps, rest: e.rest, sets: [] };
      })
    };
    renderSession();
  }

  function activeMs() {
    if (!session) return 0;
    const paused = session.pausedMs + (session.pauseStart ? Date.now() - session.pauseStart : 0);
    return Date.now() - session.startedAt - paused;
  }

  function renderSession() {
    let ov = $('#sessionOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'sessionOverlay';
      ov.className = 'session-overlay';
      document.body.appendChild(ov);
    }
    const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
    ov.innerHTML = `
      <div class="session">
        <div class="session-head">
          <div><h3>${esc(session.name)}</h3><p class="muted small" id="sessClock">00:00</p></div>
          <button class="icon-btn" id="sessPause" aria-label="Pause">⏸</button>
        </div>
        <div id="sessRest" class="rest-banner hidden">Rest: <strong id="restClock">0:00</strong>
          <button class="btn small ghost" id="restSkip">Skip</button></div>
        ${session.exercises.map((e, ei) => `
          <div class="card"><strong>${esc(e.name)}</strong>
            <p class="small muted">Target: ${e.targetSets} × ${esc(e.reps)}</p>
            <div class="sets">${e.sets.map((s, si) => `<span class="set-done">✓ ${esc(s)}</span>`).join('')}</div>
            <div class="row2">
              <input id="set_in_${ei}" placeholder="reps / weight, e.g. 12" aria-label="Set value">
              <button class="btn primary small" data-log="${ei}">+ Log set</button>
            </div>
            <button class="btn ghost small" data-rest="${e.rest}" style="margin-top:6px">⏱ Rest ${e.rest}s</button>
          </div>`).join('')}
        <div class="session-foot">
          <button class="btn danger" id="sessCancel">Cancel</button>
          <button class="btn primary" id="sessFinish">Finish workout ✓</button>
        </div>
        <p class="fine">Sets logged: ${totalSets}</p>
      </div>`;
    $('#sessPause').onclick = togglePause;
    $('#sessCancel').onclick = () => confirmDialog('Cancel workout?', 'Discard this session? Nothing will be saved.',
      () => { stopRest(); session = null; ov.remove(); }, 'Discard');
    $('#sessFinish').onclick = finishSession;
    ov.querySelectorAll('[data-log]').forEach(b => b.onclick = () => {
      const ei = +b.dataset.log;
      const inp = $('#set_in_' + ei);
      const v = inp.value.trim() || 'done';
      session.exercises[ei].sets.push(v);
      inp.value = '';
      renderSession();
    });
    ov.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => startRest(+b.dataset.rest));
    tick();
  }

  function tick() {
    const el = $('#sessClock');
    if (!el || !session) return;
    el.textContent = fmtTime(activeMs() / 1000);
    if (!session.pauseStart) setTimeout(tick, 500);
  }

  function togglePause() {
    if (!session) return;
    const btn = $('#sessPause');
    if (session.pauseStart) {
      session.pausedMs += Date.now() - session.pauseStart;
      session.pauseStart = null;
      btn.textContent = '⏸'; toast('Resumed ▶'); tick();
    } else {
      session.pauseStart = Date.now();
      btn.textContent = '▶'; toast('Paused ⏸');
    }
  }

  function startRest(sec) {
    stopRest();
    const banner = $('#sessRest');
    banner.classList.remove('hidden');
    let left = sec;
    const rc = $('#restClock');
    rc.textContent = '0:' + String(left).padStart(2, '0');
    try { navigator.vibrate && navigator.vibrate(100); } catch (e) { /* noop */ }
    restTimer = setInterval(() => {
      left--;
      if (left <= 0) {
        stopRest();
        toast('Rest over — go! 💪');
        try { navigator.vibrate && navigator.vibrate([100, 100, 100]); } catch (e) { /* noop */ }
        return;
      }
      rc.textContent = '0:' + String(left).padStart(2, '0');
    }, 1000);
    $('#restSkip').onclick = stopRest;
  }
  function stopRest() {
    if (restTimer) clearInterval(restTimer);
    restTimer = null;
    const banner = $('#sessRest');
    if (banner) banner.classList.add('hidden');
  }

  function finishSession() {
    if (!session) return;
    const mins = Math.max(1, Math.round(activeMs() / 60000));
    const sets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
    Storage.push(Storage.KEYS.workouts, {
      id: Storage.uid('wo'), date: Storage.todayKey(), at: new Date().toISOString(),
      name: session.name, durationMin: mins, sets,
      detail: session.exercises.map(e => ({ name: e.name, sets: e.sets }))
    });
    stopRest();
    session = null;
    const ov = $('#sessionOverlay');
    if (ov) ov.remove();
    toast(`Workout saved! ${mins} min, ${sets} sets 🎉`);
    go('workout', { sub: 'history' });
  }

  return { startSession, fmtTime };
})();
