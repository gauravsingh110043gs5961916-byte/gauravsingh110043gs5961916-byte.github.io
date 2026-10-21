/* ============================================================
   FitLife 360 — app.js
   Core shell: routing, onboarding, home dashboard, profile,
   water, sleep, journal, progress, settings, reminders.
   ============================================================ */
'use strict';

const App = (() => {

  /* ---------- tiny helpers ---------- */
  const $ = sel => document.querySelector(sel);
  const esc = s => String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function toast(msg, ms) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), ms || 2200);
  }

  function modal(title, bodyHTML, actions) {
    closeModal();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay'; ov.id = 'modalOverlay';
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3>
      <button class="icon-btn" data-act="close" aria-label="Close">✕</button></div>
      <div class="modal-body">${bodyHTML}</div>
      <div class="modal-actions"></div></div>`;
    const actBox = ov.querySelector('.modal-actions');
    (actions || [{ label: 'Close', kind: 'ghost' }]).forEach(a => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.kind || 'ghost');
      b.textContent = a.label;
      b.onclick = () => { if (a.onClick) a.onClick(); if (!a.keepOpen) closeModal(); };
      actBox.appendChild(b);
    });
    ov.querySelector('[data-act="close"]').onclick = closeModal;
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
    return ov;
  }
  function closeModal() {
    const ov = $('#modalOverlay');
    if (ov) ov.remove();
  }

  function confirmDialog(title, message, onYes, yesLabel) {
    modal(title, `<p>${esc(message)}</p>`, [
      { label: 'Cancel', kind: 'ghost' },
      { label: yesLabel || 'Delete', kind: 'danger', onClick: onYes }
    ]);
  }

  /* ---------- unit helpers ---------- */
  function units() { return Storage.getSettings().units; }
  function fmtWeight(kg) {
    if (units() === 'imperial') return (kg * 2.20462).toFixed(1) + ' lb';
    return (+kg).toFixed(1) + ' kg';
  }
  function fmtHeight(cm) {
    if (units() === 'imperial') {
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inch = Math.round(totalIn % 12);
      return `${ft}'${inch}"`;
    }
    return Math.round(cm) + ' cm';
  }
  function fmtDist(km) {
    if (units() === 'imperial') return (km * 0.621371).toFixed(2) + ' mi';
    return km.toFixed(2) + ' km';
  }
  function fmtPace(secPerKm) {
    if (!secPerKm || !isFinite(secPerKm)) return '—';
    let s = secPerKm;
    let unit = '/km';
    if (units() === 'imperial') { s = secPerKm * 1.60934; unit = '/mi'; }
    const m = Math.floor(s / 60), sec = Math.round(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}${unit}`;
  }

  /* ---------- router ---------- */
  const TABS = ['home', 'workout', 'nutrition', 'run', 'profile'];
  let currentView = 'home';
  let viewParams = {};

  function go(view, params) {
    currentView = view;
    viewParams = params || {};
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    const main = $('#view');
    const inOnboarding = currentView === 'onboarding';
    document.querySelectorAll('.bottom-nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === currentView);
    });
    document.querySelectorAll('#desktopNav button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === currentView);
    });
    const bn = document.querySelector('.bottom-nav');
    if (bn) bn.classList.toggle('hidden-nav', inOnboarding);
    const dn = document.querySelector('#desktopNav');
    if (dn) dn.classList.toggle('hidden-nav', inOnboarding);
    const V = Views[currentView] || Views.home;
    main.innerHTML = '';
    V.render(main, viewParams);
    if (V.after) V.after(main, viewParams);
  }

  function applyTheme() {
    const s = Storage.getSettings();
    document.documentElement.setAttribute('data-theme', s.theme === 'light' ? 'light' : 'dark');
  }

  /* ============================================================
     VIEWS
     ============================================================ */
  const Views = {};

  /* ---------------- ONBOARDING ---------------- */
  Views.onboarding = {
    render(main) {
      const step = viewParams.step || 0;
      const draft = viewParams.draft || {};
      const steps = [
        { key: 'name', title: 'Welcome to FitLife 360 💪', sub: 'What should we call you?' },
        { key: 'body', title: 'About you', sub: 'Used only for calorie estimates. Stored on your device.' },
        { key: 'lifestyle', title: 'Your lifestyle', sub: 'Activity level and fitness goal.' },
        { key: 'diet', title: 'Food preferences', sub: 'We will tailor food suggestions.' },
      ];
      const s = steps[step];
      let body = '';
      if (s.key === 'name') {
        body = `<label class="field">Your name
          <input id="ob_name" type="text" maxlength="40" placeholder="e.g. Gaurav" value="${esc(draft.name || '')}"></label>`;
      } else if (s.key === 'body') {
        body = `
          <label class="field">Age<input id="ob_age" type="number" min="10" max="100" value="${esc(draft.age || 25)}"></label>
          <label class="field">Gender
            <select id="ob_gender">
              <option value="male" ${draft.gender !== 'female' ? 'selected' : ''}>Male</option>
              <option value="female" ${draft.gender === 'female' ? 'selected' : ''}>Female</option>
            </select></label>
          <div class="row2">
            <label class="field">Height (cm)<input id="ob_height" type="number" min="100" max="230" value="${esc(draft.heightCm || 170)}"></label>
            <label class="field">Weight (kg)<input id="ob_weight" type="number" min="25" max="300" step="0.5" value="${esc(draft.weightKg || 70)}"></label>
          </div>
          <p class="hint">Under 18? Use this app with a parent/coach. No unsupervised weight-loss plans for minors.</p>`;
      } else if (s.key === 'lifestyle') {
        body = `
          <label class="field">Activity level
            <select id="ob_activity">
              ${[['sedentary', 'Sedentary (desk job, little exercise)'], ['light', 'Light (1–3 days/week)'], ['moderate', 'Moderate (3–5 days/week)'], ['active', 'Active (6–7 days/week)'], ['athlete', 'Athlete (2x/day training)']]
                .map(o => `<option value="${o[0]}" ${draft.activity === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
            </select></label>
          <label class="field">Fitness experience
            <select id="ob_exp">
              ${[['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']]
                .map(o => `<option value="${o[0]}" ${draft.experience === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
            </select></label>
          <label class="field">Primary goal
            <select id="ob_goal">
              ${[['health', 'General health'], ['lose', 'Lose weight (steady & safe)'], ['muscle', 'Build muscle'], ['strength', 'Get stronger'], ['endurance', 'Endurance / running'], ['flexibility', 'Flexibility']]
                .map(o => `<option value="${o[0]}" ${draft.goal === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
            </select></label>`;
      } else {
        body = `
          <label class="field">Diet preference
            <select id="ob_diet">
              ${[['veg', 'Vegetarian'], ['vegan', 'Vegan'], ['nonveg', 'Non-vegetarian'], ['egg', 'Eggetarian']]
                .map(o => `<option value="${o[0]}" ${draft.diet === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
            </select></label>
          <label class="field">Food allergies (optional, comma separated)
            <input id="ob_allergy" type="text" placeholder="e.g. peanuts, lactose" value="${esc(draft.allergies || '')}"></label>
          <label class="field">Available equipment
            <select id="ob_equip">
              ${[['none', 'No equipment (home)'], ['basic', 'Basic (dumbbells / resistance band)'], ['gym', 'Full gym']]
                .map(o => `<option value="${o[0]}" ${draft.equipment === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
            </select></label>
          <label class="field">Preferred workout location
            <select id="ob_loc">
              ${[['home', 'Home'], ['gym', 'Gym'], ['outdoors', 'Outdoors']]
                .map(o => `<option value="${o[0]}" ${draft.location === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
            </select></label>`;
      }
      main.innerHTML = `
        <div class="onboard">
          <div class="ob-progress">${steps.map((_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>
          <h2>${esc(s.title)}</h2>
          <p class="muted">${esc(s.sub)}</p>
          <div class="card">${body}</div>
          <div class="ob-nav">
            ${step > 0 ? `<button class="btn ghost" id="obBack">← Back</button>` : `<span></span>`}
            <button class="btn primary" id="obNext">${step === steps.length - 1 ? 'Finish ✓' : 'Next →'}</button>
          </div>
          <p class="fine">Your data never leaves this device.</p>
        </div>`;
      const collect = () => {
        const v = id => { const el = document.getElementById(id); return el ? el.value : ''; };
        return Object.assign({}, draft, {
          name: v('ob_name') || draft.name || 'Friend',
          age: +v('ob_age') || draft.age || 25,
          gender: v('ob_gender') || draft.gender || 'male',
          heightCm: +v('ob_height') || draft.heightCm || 170,
          weightKg: +v('ob_weight') || draft.weightKg || 70,
          activity: v('ob_activity') || draft.activity || 'light',
          experience: v('ob_exp') || draft.experience || 'beginner',
          goal: v('ob_goal') || draft.goal || 'health',
          diet: v('ob_diet') || draft.diet || 'veg',
          allergies: v('ob_allergy') || draft.allergies || '',
          equipment: v('ob_equip') || draft.equipment || 'none',
          location: v('ob_loc') || draft.location || 'home',
        });
      };
      const back = $('#obBack');
      if (back) back.onclick = () => go('onboarding', { step: step - 1, draft: collect() });
      $('#obNext').onclick = () => {
        const d = collect();
        if (step === steps.length - 1) {
          Storage.saveProfile(Object.assign({ id: Storage.uid('user'), createdAt: new Date().toISOString() }, d));
          Storage.write(Storage.KEYS.onboarding, true);
          Storage.push(Storage.KEYS.weightLogs, { id: Storage.uid('w'), date: Storage.todayKey(), kg: d.weightKg });
          toast('Welcome, ' + d.name + '! 🎉');
          go('home');
        } else {
          go('onboarding', { step: step + 1, draft: d });
        }
      };
    }
  };

  /* ---------------- HOME ---------------- */
  function sumNutrients(entries) {
    return entries.reduce((a, e) => ({
      kcal: a.kcal + (e.kcal || 0), p: a.p + (e.p || 0),
      c: a.c + (e.c || 0), f: a.f + (e.f || 0)
    }), { kcal: 0, p: 0, c: 0, f: 0 });
  }

  function todayWaterMl() {
    const t = Storage.todayKey();
    return Storage.list(Storage.KEYS.waterLogs)
      .filter(w => w.date === t).reduce((a, w) => a + (w.ml || 0), 0);
  }

  Views.home = {
    render(main) {
      const profile = Storage.getProfile();
      if (!profile) { go('onboarding'); return; }
      const calc = DB.calcTargets(profile);
      const t = Storage.todayKey();
      const eaten = sumNutrients(Storage.list(Storage.KEYS.foodEntries).filter(e => e.date === t));
      const waterMl = todayWaterMl();
      const waterGoal = Storage.getSettings().waterGoalMl;
      const sleep = Storage.list(Storage.KEYS.sleepLogs).find(s => s.date === t);
      const workoutsToday = Storage.list(Storage.KEYS.workouts).filter(w => w.date === t).length;
      const runsToday = Storage.list(Storage.KEYS.runs).filter(r => r.date === t);
      const runKm = runsToday.reduce((a, r) => a + (r.distanceKm || 0), 0);

      main.innerHTML = `
        <header class="app-head">
          <div><h2>Namaste, ${esc(profile.name)} 👋</h2>
          <p class="muted">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
          <button class="icon-btn" id="homeSettings" aria-label="Settings">⚙️</button>
        </header>

        <div class="rings">
          <div class="card ring-card"><canvas id="ringKcal"></canvas><p>Calories</p><small class="muted">${Math.round(eaten.kcal)} / ${calc.targets.kcal} kcal</small></div>
          <div class="card ring-card"><canvas id="ringWater"></canvas><p>Water</p><small class="muted">${(waterMl / 1000).toFixed(1)} / ${(waterGoal / 1000).toFixed(1)} L</small></div>
          <div class="card ring-card"><canvas id="ringProtein"></canvas><p>Protein</p><small class="muted">${Math.round(eaten.p)} / ${calc.targets.proteinG} g</small></div>
        </div>

        <div class="quick">
          <button class="qbtn" data-go="nutrition" data-sub="scan">📸<span>Scan Food</span></button>
          <button class="qbtn" data-go="nutrition">🍎<span>Add Meal</span></button>
          <button class="qbtn" data-go="run">🏃<span>Start Run</span></button>
          <button class="qbtn" data-go="workout">💪<span>Workout</span></button>
          <button class="qbtn" data-go="water">💧<span>Log Water</span></button>
          <button class="qbtn" data-go="sleep">😴<span>Log Sleep</span></button>
        </div>

        <div class="card today-strip">
          <div><strong>Today</strong>
            <p class="muted small">🏋️ ${workoutsToday} workout${workoutsToday === 1 ? '' : 's'} · 🏃 ${runKm.toFixed(1)} km · 😴 ${sleep ? sleep.hours.toFixed(1) + 'h' : '—'}</p></div>
          <button class="btn ghost" data-go="progress">Details →</button>
        </div>

        <h3 class="sec-title">This week</h3>
        <div class="card"><canvas id="weekChart"></canvas></div>

        <h3 class="sec-title">Trackers</h3>
        <div class="menu-grid">
          <button class="menu-item" data-go="water">💧<span>Water</span></button>
          <button class="menu-item" data-go="sleep">😴<span>Sleep</span></button>
          <button class="menu-item" data-go="progress">📊<span>Progress</span></button>
          <button class="menu-item" data-go="journal">📝<span>Journal</span></button>
          <button class="menu-item" data-go="dietplan">🥗<span>Diet Plan</span></button>
          <button class="menu-item" data-go="settings">⚙️<span>Settings</span></button>
        </div>
        <footer class="app-foot">Created by Gaurav · FitLife 360</footer>`;
    },
    after() {
      document.querySelectorAll('[data-go]').forEach(b => {
        b.onclick = () => go(b.dataset.go, b.dataset.sub ? { sub: b.dataset.sub } : {});
      });
      const goEl = $('#homeSettings');
      if (goEl) goEl.onclick = () => go('settings');
      const profile = Storage.getProfile();
      const calc = DB.calcTargets(profile);
      const t = Storage.todayKey();
      const eaten = sumNutrients(Storage.list(Storage.KEYS.foodEntries).filter(e => e.date === t));
      Charts.ring($('#ringKcal'), calc.targets.kcal ? eaten.kcal / calc.targets.kcal : 0, { color: '#f59e0b', sub: 'eaten' });
      Charts.ring($('#ringWater'), todayWaterMl() / Storage.getSettings().waterGoalMl, { color: '#3b82f6', sub: 'drunk' });
      Charts.ring($('#ringProtein'), calc.targets.proteinG ? eaten.p / calc.targets.proteinG : 0, { color: '#34c759', sub: 'protein' });
      const days = Storage.lastNDays(7);
      const vals = days.map(d => Math.round(Storage.list(Storage.KEYS.foodEntries).filter(e => e.date === d).reduce((a, e) => a + (e.kcal || 0), 0)));
      const labels = days.map(d => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' }));
      if (vals.some(v => v > 0)) Charts.bars($('#weekChart'), labels, vals, { height: 150 });
      else Charts.emptyState($('#weekChart'), 'Log meals to see your week here.');
    }
  };

  /* ---------------- WATER ---------------- */
  Views.water = {
    render(main) {
      const goal = Storage.getSettings().waterGoalMl;
      const t = Storage.todayKey();
      const logs = Storage.list(Storage.KEYS.waterLogs).filter(w => w.date === t).sort((a, b) => b.at.localeCompare(a.at));
      const total = logs.reduce((a, w) => a + w.ml, 0);
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-go="home">←</button><h2>💧 Water</h2><span></span></header>
        <div class="card center"><canvas id="waterRing"></canvas>
          <p class="muted">${(total / 1000).toFixed(2)} L of ${(goal / 1000).toFixed(1)} L</p></div>
        <div class="card"><h3>Quick add</h3>
          <div class="chip-row">
            ${[150, 250, 500, 750].map(ml => `<button class="chip" data-ml="${ml}">+${ml} ml</button>`).join('')}
          </div>
          <div class="row2" style="margin-top:10px">
            <input id="wCustom" type="number" min="1" max="3000" placeholder="Custom ml">
            <button class="btn primary" id="wAddCustom">Add</button>
          </div></div>
        <h3 class="sec-title">Today's entries</h3>
        <div id="waterList">${logs.length ? logs.map(w => `
          <div class="list-item"><span>🥛 ${w.ml} ml <small class="muted">${new Date(w.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></span>
          <button class="icon-btn danger" data-del="${w.id}" aria-label="Delete">🗑️</button></div>`).join('')
          : '<p class="muted">No water logged today yet.</p>'}</div>
        <button class="btn ghost full" id="wGoalBtn">Change daily goal (${(goal / 1000).toFixed(1)} L)</button>`;
      document.querySelector('[data-go="home"]').onclick = () => go('home');
    },
    after() {
      const add = ml => {
        ml = Math.round(+ml);
        if (!ml || ml <= 0 || ml > 5000) { toast('Enter a valid amount'); return; }
        Storage.push(Storage.KEYS.waterLogs, { id: Storage.uid('w'), date: Storage.todayKey(), ml, at: new Date().toISOString() });
        toast(`+${ml} ml 💧`); go('water');
      };
      document.querySelectorAll('[data-ml]').forEach(b => b.onclick = () => add(b.dataset.ml));
      $('#wAddCustom').onclick = () => add($('#wCustom').value);
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
        confirmDialog('Delete entry?', 'Remove this water entry?', () => { Storage.removeById(Storage.KEYS.waterLogs, b.dataset.del); go('water'); }));
      $('#wGoalBtn').onclick = () => {
        modal('Daily water goal', `<label class="field">Goal (ml)<input id="wgInput" type="number" value="${Storage.getSettings().waterGoalMl}" min="500" max="8000" step="100"></label>
          <p class="hint">General guidance is ~30–35 ml per kg body weight. Adjust to your climate and activity.</p>`,
          [{ label: 'Cancel', kind: 'ghost' }, {
            label: 'Save', kind: 'primary', onClick: () => {
              const v = Math.min(8000, Math.max(500, +$('#wgInput').value || 2500));
              const s = Storage.getSettings(); s.waterGoalMl = v; Storage.saveSettings(s);
              toast('Goal updated'); go('water');
            }
          }]);
      };
      const total = todayWaterMl();
      Charts.ring($('#waterRing'), total / Storage.getSettings().waterGoalMl, { color: '#3b82f6', size: 150, label: Math.round(total / Storage.getSettings().waterGoalMl * 100) + '%' });
    }
  };

  /* ---------------- SLEEP ---------------- */
  Views.sleep = {
    render(main) {
      const logs = Storage.list(Storage.KEYS.sleepLogs).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-go="home">←</button><h2>😴 Sleep</h2><span></span></header>
        <div class="card"><h3>Log last night</h3>
          <div class="row2">
            <label class="field">Bedtime<input id="sBed" type="time" value="23:00"></label>
            <label class="field">Wake up<input id="sWake" type="time" value="07:00"></label>
          </div>
          <label class="field">Quality
            <select id="sQ">${['Poor', 'Fair', 'Good', 'Great'].map((q, i) => `<option value="${i + 1}">${q}</option>`).join('')}</select></label>
          <label class="field">Notes (optional)<input id="sNote" type="text" placeholder="e.g. woke up once"></label>
          <button class="btn primary full" id="sSave">Save sleep</button>
          <p class="hint">Manual entry. This app does not measure sleep automatically.</p></div>
        <h3 class="sec-title">Last 7 nights</h3>
        <div class="card"><canvas id="sleepChart"></canvas></div>
        <h3 class="sec-title">History</h3>
        <div>${logs.map(s => `
          <div class="list-item"><span>🌙 ${s.date} — <strong>${s.hours.toFixed(1)}h</strong> <small class="muted">${'⭐'.repeat(s.quality)}</small></span>
          <button class="icon-btn danger" data-del="${s.id}">🗑️</button></div>`).join('') || '<p class="muted">No sleep logs yet.</p>'}</div>`;
      document.querySelector('[data-go="home"]').onclick = () => go('home');
    },
    after() {
      $('#sSave').onclick = () => {
        const bed = $('#sBed').value, wake = $('#sWake').value;
        if (!bed || !wake) { toast('Set both times'); return; }
        const [bh, bm] = bed.split(':').map(Number), [wh, wm] = wake.split(':').map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins <= 0) mins += 24 * 60;
        const hours = mins / 60;
        Storage.push(Storage.KEYS.sleepLogs, {
          id: Storage.uid('s'), date: Storage.todayKey(), bedtime: bed, wakeup: wake,
          hours: Math.round(hours * 10) / 10, quality: +$('#sQ').value, note: $('#sNote').value.trim()
        });
        toast(`Logged ${hours.toFixed(1)}h of sleep 😴`); go('sleep');
      };
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
        confirmDialog('Delete?', 'Delete this sleep log?', () => { Storage.removeById(Storage.KEYS.sleepLogs, b.dataset.del); go('sleep'); }));
      const days = Storage.lastNDays(7);
      const vals = days.map(d => { const s = Storage.list(Storage.KEYS.sleepLogs).find(x => x.date === d); return s ? s.hours : 0; });
      if (vals.some(v => v > 0)) Charts.bars($('#sleepChart'), days.map(d => d.slice(5)), vals, { height: 140, colors: vals.map(() => '#8b5cf6') });
      else Charts.emptyState($('#sleepChart'), 'Log sleep to see trends.');
    }
  };

  /* ---------------- JOURNAL ---------------- */
  Views.journal = {
    render(main) {
      const entries = Storage.list(Storage.KEYS.journal).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-go="home">←</button><h2>📝 Health Journal</h2><span></span></header>
        <div class="card"><h3>Today's check-in</h3>
          <div class="row2">
            <label class="field">Energy (1–5)<select id="jEnergy">${[1, 2, 3, 4, 5].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="field">Mood (1–5)<select id="jMood">${[1, 2, 3, 4, 5].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          </div>
          <div class="row2">
            <label class="field">Stress (1–5)<select id="jStress">${[1, 2, 3, 4, 5].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="field">Soreness (1–5)<select id="jSore">${[1, 2, 3, 4, 5].map(n => `<option ${n === 2 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          </div>
          <label class="field">Notes<textarea id="jNote" rows="2" placeholder="How do you feel today? (private)"></textarea></label>
          <button class="btn primary full" id="jSave">Save entry 🔒</button>
          <p class="hint">Private to this device. This is not medical advice — see a doctor for health concerns.</p></div>
        <h3 class="sec-title">Recent entries</h3>
        <div>${entries.map(j => `
          <div class="card small"><strong>${new Date(j.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
          <p class="small">⚡${j.energy} · 😊${j.mood} · 😰${j.stress} · 💪${j.soreness}</p>
          ${j.note ? `<p class="small">${esc(j.note)}</p>` : ''}
          <button class="icon-btn danger" data-del="${j.id}">🗑️</button></div>`).join('') || '<p class="muted">No entries yet.</p>'}</div>`;
      document.querySelector('[data-go="home"]').onclick = () => go('home');
    },
    after() {
      $('#jSave').onclick = () => {
        Storage.push(Storage.KEYS.journal, {
          id: Storage.uid('j'), at: new Date().toISOString(), date: Storage.todayKey(),
          energy: +$('#jEnergy').value, mood: +$('#jMood').value,
          stress: +$('#jStress').value, soreness: +$('#jSore').value,
          note: $('#jNote').value.trim()
        });
        toast('Journal saved 🔒'); go('journal');
      };
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
        confirmDialog('Delete?', 'Delete this journal entry?', () => { Storage.removeById(Storage.KEYS.journal, b.dataset.del); go('journal'); }));
    }
  };

  /* ---------------- PROGRESS ---------------- */
  Views.progress = {
    render(main) {
      const range = viewParams.range || 7;
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-go="home">←</button><h2>📊 Progress</h2><span></span></header>
        <div class="chip-row" style="margin-bottom:12px">
          ${[7, 14, 30].map(n => `<button class="chip ${range === n ? 'on' : ''}" data-range="${n}">${n} days</button>`).join('')}
        </div>
        <div class="card"><h3>Calories eaten (kcal)</h3><canvas id="chKcal"></canvas></div>
        <div class="card"><h3>Protein (g)</h3><canvas id="chProtein"></canvas></div>
        <div class="card"><h3>Water (L)</h3><canvas id="chWater"></canvas></div>
        <div class="card"><h3>Sleep (hours)</h3><canvas id="chSleep"></canvas></div>
        <div class="card"><h3>Workouts + runs</h3><canvas id="chAct"></canvas></div>
        <div class="card"><h3>Weight (${units() === 'imperial' ? 'lb' : 'kg'})</h3><canvas id="chWeight"></canvas>
          <div class="row2" style="margin-top:8px"><input id="wtInput" type="number" step="0.5" placeholder="Today's weight">
          <button class="btn primary" id="wtSave">Log</button></div></div>
        <button class="btn ghost full" id="csvExport">⬇ Export all data (CSV)</button>
        <p class="fine">Charts use your real logged data. No appearance scores here — consistency matters, not looks.</p>`;
      document.querySelector('[data-go="home"]').onclick = () => go('home');
      document.querySelectorAll('[data-range]').forEach(b => b.onclick = () => go('progress', { range: +b.dataset.range }));
    },
    after() {
      const range = viewParams.range || 7;
      const days = Storage.lastNDays(range);
      const labels = days.map(d => d.slice(5));
      const foods = Storage.list(Storage.KEYS.foodEntries);
      const kcal = days.map(d => Math.round(foods.filter(e => e.date === d).reduce((a, e) => a + (e.kcal || 0), 0)));
      const prot = days.map(d => Math.round(foods.filter(e => e.date === d).reduce((a, e) => a + (e.p || 0), 0)));
      const water = days.map(d => Math.round(Storage.list(Storage.KEYS.waterLogs).filter(w => w.date === d).reduce((a, w) => a + w.ml, 0) / 100) / 10);
      const sleep = days.map(d => { const s = Storage.list(Storage.KEYS.sleepLogs).find(x => x.date === d); return s ? s.hours : 0; });
      const acts = days.map(d => Storage.list(Storage.KEYS.workouts).filter(w => w.date === d).length + Storage.list(Storage.KEYS.runs).filter(r => r.date === d).length);
      const wlogs = Storage.list(Storage.KEYS.weightLogs).sort((a, b) => a.date.localeCompare(b.date));
      const wByDay = {};
      wlogs.forEach(w => wByDay[w.date] = w.kg);
      const wvals = days.map(d => wByDay[d] ? (units() === 'imperial' ? wByDay[d] * 2.20462 : wByDay[d]) : null).filter(v => v !== null);

      const draw = (id, vals, color, msg) => {
        if (vals.some(v => v > 0)) Charts.lines($('#' + id), labels, [{ name: '', values: vals, color }], { height: 140 });
        else Charts.emptyState($('#' + id), msg);
      };
      draw('chKcal', kcal, '#f59e0b', 'No meals logged in this period.');
      draw('chProtein', prot, '#34c759', 'No meals logged in this period.');
      draw('chWater', water, '#3b82f6', 'No water logged in this period.');
      draw('chSleep', sleep, '#8b5cf6', 'No sleep logged in this period.');
      draw('chAct', acts, '#ef4444', 'No workouts/runs in this period.');
      if (wvals.length >= 2) {
        const wdays = days.filter(d => wByDay[d]);
        Charts.lines($('#chWeight'), wdays.map(d => d.slice(5)),
          [{ name: 'weight', values: wdays.map(d => units() === 'imperial' ? wByDay[d] * 2.20462 : wByDay[d]), color: '#3b82f6' }], { height: 140 });
      } else Charts.emptyState($('#chWeight'), 'Log weight 2+ times to see the trend.');

      $('#wtSave').onclick = () => {
        const v = +$('#wtInput').value;
        if (!v || v < 20 || v > 400) { toast('Enter a valid weight'); return; }
        const kg = units() === 'imperial' ? v / 2.20462 : v;
        Storage.push(Storage.KEYS.weightLogs, { id: Storage.uid('w'), date: Storage.todayKey(), kg: Math.round(kg * 10) / 10 });
        const p = Storage.getProfile(); p.weightKg = Math.round(kg * 10) / 10; Storage.saveProfile(p);
        toast('Weight logged'); go('progress', { range });
      };
      $('#csvExport').onclick = () => {
        const rows = [['type', 'date', 'detail1', 'detail2', 'detail3']];
        Storage.list(Storage.KEYS.foodEntries).forEach(e => rows.push(['food', e.date, e.name, e.qty + e.unit, e.kcal + ' kcal']));
        Storage.list(Storage.KEYS.waterLogs).forEach(w => rows.push(['water', w.date, w.ml + ' ml', '', '']));
        Storage.list(Storage.KEYS.sleepLogs).forEach(s => rows.push(['sleep', s.date, s.hours + 'h', 'quality ' + s.quality, '']));
        Storage.list(Storage.KEYS.workouts).forEach(w => rows.push(['workout', w.date, w.name, w.durationMin + ' min', '']));
        Storage.list(Storage.KEYS.runs).forEach(r => rows.push(['run', r.date, r.distanceKm.toFixed(2) + ' km', r.durationSec + 's', '']));
        Storage.list(Storage.KEYS.weightLogs).forEach(w => rows.push(['weight', w.date, w.kg + ' kg', '', '']));
        DB.downloadFile('fitlife360-export.csv', DB.toCSV(rows), 'text/csv');
        toast('CSV downloaded ⬇');
      };
    }
  };

  /* ---------------- PROFILE ---------------- */
  Views.profile = {
    render(main) {
      const p = Storage.getProfile();
      if (!p) { go('onboarding'); return; }
      const calc = DB.calcTargets(p);
      main.innerHTML = `
        <header class="app-head"><h2>👤 Profile</h2><span></span></header>
        <div class="card"><h3>${esc(p.name)}</h3>
          <p class="muted small">${p.age} yrs · ${fmtHeight(p.heightCm)} · ${fmtWeight(p.weightKg)}</p>
          <div class="tag-row">
            <span class="tag">${esc(p.goal)}</span><span class="tag">${esc(p.diet)}</span>
            <span class="tag">${esc(p.activity)}</span><span class="tag">${esc(p.experience)}</span>
          </div></div>
        <div class="card"><h3>🎯 Daily targets <small class="muted">(estimates)</small></h3>
          <div class="target-grid">
            <div><strong>${calc.targets.kcal}</strong><small>kcal</small></div>
            <div><strong>${calc.targets.proteinG}g</strong><small>protein</small></div>
            <div><strong>${calc.targets.carbsG}g</strong><small>carbs</small></div>
            <div><strong>${calc.targets.fatG}g</strong><small>fat</small></div>
          </div>
          <p class="hint">BMR ~${calc.bmr} · TDEE ~${calc.tdee}. ${esc(calc.note)}</p>
          <p class="fine">${esc(calc.disclaimer)}</p></div>
        <div class="menu-list">
          <button class="menu-row" data-go="editprofile">✏️ Edit profile <span>→</span></button>
          <button class="menu-row" data-go="journal">📝 Health journal <span>→</span></button>
          <button class="menu-row" data-go="progress">📊 Progress & reports <span>→</span></button>
          <button class="menu-row" data-go="settings">⚙️ Settings <span>→</span></button>
        </div>
        <footer class="app-foot">Created by Gaurav · FitLife 360<br><small class="muted">Estimates only — not medical advice.</small></footer>`;
    },
    after() {
      document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    }
  };

  Views.editprofile = {
    render(main) {
      const p = Storage.getProfile();
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-go="profile">←</button><h2>Edit profile</h2><span></span></header>
        <div class="card">
          <label class="field">Name<input id="ep_name" value="${esc(p.name)}"></label>
          <div class="row2">
            <label class="field">Age<input id="ep_age" type="number" value="${p.age}"></label>
            <label class="field">Gender<select id="ep_gender">
              <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Female</option></select></label>
          </div>
          <div class="row2">
            <label class="field">Height (cm)<input id="ep_h" type="number" value="${p.heightCm}"></label>
            <label class="field">Weight (kg)<input id="ep_w" type="number" step="0.5" value="${p.weightKg}"></label>
          </div>
          <label class="field">Activity<select id="ep_act">
            ${['sedentary', 'light', 'moderate', 'active', 'athlete'].map(a => `<option ${p.activity === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label class="field">Goal<select id="ep_goal">
            ${['health', 'lose', 'muscle', 'strength', 'endurance', 'flexibility'].map(a => `<option ${p.goal === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label class="field">Diet<select id="ep_diet">
            ${['veg', 'vegan', 'nonveg', 'egg'].map(a => `<option ${p.diet === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label class="field">Allergies<input id="ep_al" value="${esc(p.allergies || '')}"></label>
          <button class="btn primary full" id="epSave">Save changes</button>
        </div>`;
      document.querySelector('[data-go="profile"]').onclick = () => go('profile');
    },
    after() {
      $('#epSave').onclick = () => {
        const p = Storage.getProfile();
        const v = id => document.getElementById(id).value;
        p.name = v('ep_name').trim() || p.name;
        p.age = Math.min(100, Math.max(10, +v('ep_age') || p.age));
        p.gender = v('ep_gender');
        p.heightCm = Math.min(230, Math.max(100, +v('ep_h') || p.heightCm));
        p.weightKg = Math.min(300, Math.max(25, +v('ep_w') || p.weightKg));
        p.activity = v('ep_act'); p.goal = v('ep_goal'); p.diet = v('ep_diet');
        p.allergies = v('ep_al').trim();
        Storage.saveProfile(p);
        toast('Profile updated ✓'); go('profile');
      };
    }
  };

  /* ---------------- SETTINGS ---------------- */
  Views.settings = {
    render(main) {
      const s = Storage.getSettings();
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-back>←</button><h2>⚙️ Settings</h2><span></span></header>
        <div class="card"><h3>Appearance</h3>
          <div class="chip-row">
            <button class="chip ${s.theme !== 'light' ? 'on' : ''}" data-theme="dark">🌙 Dark</button>
            <button class="chip ${s.theme === 'light' ? 'on' : ''}" data-theme="light">☀️ Light</button>
          </div></div>
        <div class="card"><h3>Units</h3>
          <div class="chip-row">
            <button class="chip ${s.units === 'metric' ? 'on' : ''}" data-units="metric">kg / cm / km</button>
            <button class="chip ${s.units === 'imperial' ? 'on' : ''}" data-units="imperial">lb / ft / mi</button>
          </div></div>
        <div class="card"><h3>🤖 AI features</h3>
          <label class="field">Gemini API key (for Food Scanner & AI diet enhance)
            <input id="setKey" type="password" placeholder="Paste free key from Google AI Studio" value="${esc(s.geminiApiKey)}"></label>
          <p class="hint">Get a free key at <strong>aistudio.google.com</strong> → Get API Key. Stored only on this device, sent only to Google's API when you scan food.</p>
          <label class="check"><input type="checkbox" id="setNotif" ${s.notifications ? 'checked' : ''}> Enable reminder notifications</label>
          <p class="hint">Browser will ask for permission. Works only while the page is open.</p></div>
        <div class="card"><h3>💾 Your data</h3>
          <button class="btn ghost full" id="expJson">⬇ Export all data (JSON backup)</button>
          <button class="btn ghost full" id="impJson" style="margin-top:8px">⬆ Import data (JSON)</button>
          <input type="file" id="impFile" accept=".json" style="display:none">
          <button class="btn danger full" id="wipeBtn" style="margin-top:8px">🗑 Delete ALL my data</button></div>
        <div class="card"><h3>🔒 Privacy</h3>
          <p class="small">FitLife 360 stores everything in your browser's local storage on this device. Nothing is uploaded anywhere. Your Gemini API key (if you add one) is sent only to Google's Gemini API when you use the food scanner. Location data from runs is stored only if you save a run, and you can delete routes anytime.</p></div>
        <div class="card"><h3>ℹ️ About</h3>
          <p class="small"><strong>FitLife 360</strong> v1.0.0<br>Created by <strong>Gaurav</strong><br>
          Health estimates only — not medical advice. For minors: use with a parent or coach; no unsupervised weight-loss plans.</p></div>`;
      document.querySelector('[data-back]').onclick = () => go(currentView === 'settings' ? 'profile' : 'home');
    },
    after() {
      document.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => {
        const s = Storage.getSettings(); s.theme = b.dataset.theme; Storage.saveSettings(s);
        applyTheme(); go('settings');
      });
      document.querySelectorAll('[data-units]').forEach(b => b.onclick = () => {
        const s = Storage.getSettings(); s.units = b.dataset.units; Storage.saveSettings(s);
        toast('Units updated'); go('settings');
      });
      $('#setKey').onchange = e => {
        const s = Storage.getSettings(); s.geminiApiKey = e.target.value.trim(); Storage.saveSettings(s);
        toast(s.geminiApiKey ? 'API key saved ✓' : 'API key removed');
      };
      $('#setNotif').onchange = async e => {
        const s = Storage.getSettings();
        if (e.target.checked) {
          if (!('Notification' in window)) { toast('Notifications not supported here'); e.target.checked = false; return; }
          const perm = await Notification.requestPermission();
          s.notifications = perm === 'granted';
          if (!s.notifications) { toast('Permission denied'); e.target.checked = false; }
          else { toast('Reminders enabled 🔔'); scheduleReminders(); }
        } else s.notifications = false;
        Storage.saveSettings(s);
      };
      $('#expJson').onclick = () => {
        DB.downloadFile('fitlife360-backup.json', JSON.stringify(Storage.exportAll(), null, 2), 'application/json');
        toast('Backup downloaded ⬇');
      };
      $('#impJson').onclick = () => $('#impFile').click();
      $('#impFile').onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const data = JSON.parse(r.result);
            if (Storage.importAll(data)) { toast('Data imported ✓'); applyTheme(); go('home'); }
            else toast('Import failed');
          } catch (err) { toast('Invalid file'); }
        };
        r.readAsText(f);
      };
      $('#wipeBtn').onclick = () => confirmDialog('Delete everything?',
        'This permanently deletes ALL your FitLife 360 data on this device. This cannot be undone.',
        () => { Storage.wipeAll(); applyTheme(); toast('All data deleted'); go('onboarding'); }, 'Delete everything');
    }
  };

  /* ---------- reminders ---------- */
  function scheduleReminders() {
    const s = Storage.getSettings();
    if (!s.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    const defs = Storage.list(Storage.KEYS.reminders);
    const defaults = [
      { id: 'rm_water', label: '💧 Time to drink water', hour: 11 },
      { id: 'rm_workout', label: '💪 Time for your workout', hour: 18 },
      { id: 'rm_sleep', label: '😴 Wind down for bed', hour: 22 },
    ];
    defaults.forEach(d => {
      if (defs.find(x => x.id === d.id)) return;
      const now = new Date();
      const at = new Date(now); at.setHours(d.hour, 0, 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);
      const ms = at - now;
      if (ms > 24 * 3600 * 1000) return;
      setTimeout(() => {
        try { new Notification('FitLife 360', { body: d.label }); } catch (e) { /* noop */ }
        scheduleReminders();
      }, ms);
      Storage.push(Storage.KEYS.reminders, { id: d.id, at: at.toISOString() });
    });
  }

  /* ---------- boot ---------- */
  function init() {
    applyTheme();
    const shell = document.getElementById('app');
    shell.innerHTML = `
      <main id="view"></main>
      <nav class="bottom-nav" aria-label="Main navigation">
        <button data-view="home">🏠<span>Home</span></button>
        <button data-view="workout">💪<span>Workout</span></button>
        <button data-view="nutrition">🍎<span>Nutrition</span></button>
        <button data-view="run">🏃<span>Run</span></button>
        <button data-view="profile">👤<span>Profile</span></button>
      </nav>`;
    document.querySelectorAll('.bottom-nav button').forEach(b => {
      b.onclick = () => go(b.dataset.view);
    });
    if (!Storage.read(Storage.KEYS.onboarding, false) || !Storage.getProfile()) {
      currentView = 'onboarding';
      render();
    } else {
      go('home');
      scheduleReminders();
    }
    // Register views from feature modules (loaded after app.js)
    window.addEventListener('fitlife:views-ready', render);
  }

  return {
    $, esc, toast, modal, closeModal, confirmDialog,
    go, render, applyTheme, units, fmtWeight, fmtHeight, fmtDist, fmtPace,
    sumNutrients, todayWaterMl, Views, scheduleReminders, init
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
