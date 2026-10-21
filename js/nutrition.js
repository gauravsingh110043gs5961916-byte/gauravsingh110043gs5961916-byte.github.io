/* ============================================================
   FitLife 360 — nutrition.js
   Food diary, portion calculator, custom foods, favorites,
   and the AI food scanner (Gemini vision — buyer's own key).
   ============================================================ */
'use strict';

const Nutrition = (() => {
  const { $, esc, toast, modal, confirmDialog, go, sumNutrients } = App;
  const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const MEAL_ICON = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍿' };

  App.Views.nutrition = {
    render(main, params) {
      const sub = (params && params.sub) || 'diary';
      const date = (params && params.date) || Storage.todayKey();
      main.innerHTML = `
        <header class="app-head"><h2>🍎 Nutrition</h2><span></span></header>
        <div class="chip-row" style="margin-bottom:12px">
          <button class="chip ${sub === 'diary' ? 'on' : ''}" data-sub="diary">Diary</button>
          <button class="chip ${sub === 'scan' ? 'on' : ''}" data-sub="scan">📸 Scan</button>
          <button class="chip ${sub === 'custom' ? 'on' : ''}" data-sub="custom">My Foods</button>
        </div>
        <div id="nBody"></div>`;
      document.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => go('nutrition', { sub: b.dataset.sub, date }));
      const body = $('#nBody');
      if (sub === 'scan') renderScanner(body);
      else if (sub === 'custom') renderCustom(body);
      else renderDiary(body, date);
    }
  };

  /* ---------------- DIARY ---------------- */
  function renderDiary(body, date) {
    const profile = Storage.getProfile() || {};
    const calc = DB.calcTargets(profile);
    const entries = Storage.list(Storage.KEYS.foodEntries).filter(e => e.date === date);
    const total = sumNutrients(entries);
    const prev = Storage.addDays(date, -1), next = Storage.addDays(date, 1);
    const isToday = date === Storage.todayKey();
    body.innerHTML = `
      <div class="date-nav">
        <button class="icon-btn" id="dPrev">←</button>
        <strong>${isToday ? 'Today' : date}</strong>
        <button class="icon-btn" id="dNext" ${isToday ? 'disabled' : ''}>→</button>
      </div>
      <div class="macro-bar">
        <div class="macro"><span>🔥 ${Math.round(total.kcal)}</span><small>/ ${calc.targets.kcal} kcal</small>
          <div class="pbar"><div style="width:${Math.min(100, total.kcal / calc.targets.kcal * 100)}%"></div></div></div>
        <div class="macro"><span>🥩 ${Math.round(total.p)}g</span><small>/ ${calc.targets.proteinG}g protein</small></div>
        <div class="macro"><span>🍚 ${Math.round(total.c)}g</span><small>/ ${calc.targets.carbsG}g carbs</small></div>
        <div class="macro"><span>🥑 ${Math.round(total.f)}g</span><small>/ ${calc.targets.fatG}g fat</small></div>
      </div>
      <p class="fine">Values are estimates. Remaining: ${Math.max(0, Math.round(calc.targets.kcal - total.kcal))} kcal</p>
      ${MEALS.map(m => {
        const items = entries.filter(e => e.meal === m);
        const mt = sumNutrients(items);
        return `<div class="card">
          <div class="meal-head"><strong>${MEAL_ICON[m]} ${m[0].toUpperCase() + m.slice(1)}</strong>
          <span class="muted small">${Math.round(mt.kcal)} kcal</span></div>
          ${items.map(e => `
            <div class="list-item"><span>${esc(e.name)} <small class="muted">${esc(e.qtyLabel)} · ${Math.round(e.kcal)} kcal (est.)</small></span>
            <button class="icon-btn danger" data-del="${e.id}">🗑️</button></div>`).join('') || '<p class="muted small">Nothing logged.</p>'}
          <button class="btn ghost small" data-addmeal="${m}">+ Add food</button>
        </div>`;
      }).join('')}
      <button class="btn ghost full" id="repeatY">↩ Repeat yesterday's meals</button>`;
    $('#dPrev').onclick = () => go('nutrition', { sub: 'diary', date: prev });
    const nx = $('#dNext');
    if (nx && !isToday) nx.onclick = () => go('nutrition', { sub: 'diary', date: next });
    body.querySelectorAll('[data-addmeal]').forEach(b => b.onclick = () => addFoodDialog(b.dataset.addmeal, date));
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirmDialog('Delete?', 'Remove this food entry?', () => {
        Storage.removeById(Storage.KEYS.foodEntries, b.dataset.del);
        go('nutrition', { sub: 'diary', date });
      }));
    $('#repeatY').onclick = () => {
      const y = Storage.list(Storage.KEYS.foodEntries).filter(e => e.date === prev);
      if (!y.length) { toast('Nothing logged yesterday'); return; }
      y.forEach(e => Storage.push(Storage.KEYS.foodEntries,
        Object.assign({}, e, { id: Storage.uid('fe'), date })));
      toast(`Repeated ${y.length} items ↩`); go('nutrition', { sub: 'diary', date });
    };
  }

  function addFoodDialog(meal, date) {
    const profile = Storage.getProfile() || {};
    modal('Add food — ' + meal, `
      <input id="afSearch" type="search" placeholder="Search foods… (e.g. roti, dal, banana)" autocomplete="off">
      <div id="afResults" class="results"></div>
      <div id="afDetail"></div>`,
      [{ label: 'Cancel', kind: 'ghost' }]);
    const results = $('#afResults'), detail = $('#afDetail');
    const doSearch = q => {
      const hits = DB.searchFoods(q, profile.diet === 'nonveg' ? null : profile.diet);
      results.innerHTML = hits.slice(0, 12).map(f => `
        <button class="result-row" data-fid="${f.id}"><strong>${esc(f.name)}</strong>
        <small class="muted">${Math.round(f.kcal)} kcal / ${f.per}${f.unit} (est.)</small></button>`).join('')
        || '<p class="muted small">No matches. Try "My Foods" to add a custom food.</p>';
      results.querySelectorAll('[data-fid]').forEach(b => b.onclick = () => portionForm(DB.findFood(b.dataset.fid), meal, date, detail));
    };
    $('#afSearch').oninput = e => doSearch(e.target.value);
    doSearch('');
    setTimeout(() => $('#afSearch').focus(), 100);
  }

  function portionForm(food, meal, date, detail) {
    if (!food) return;
    detail.innerHTML = `
      <div class="card" style="margin-top:10px"><h4>${esc(food.name)}</h4>
      <div class="row2">
        <label class="field">Quantity<input id="pfQty" type="number" min="0.1" step="0.1" value="${food.unit === 'pc' ? 2 : 100}"></label>
        <label class="field">Unit<select id="pfUnit">
          ${['g', 'ml', 'pc', 'cup', 'bowl', 'tbsp', 'tsp'].map(u => `<option ${food.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
        </select></label>
      </div>
      <div id="pfCalc" class="nutri-line"></div>
      <button class="btn primary full" id="pfAdd">Add to ${esc(meal)} ✓</button>
      <p class="fine">Estimate — adjust quantity to match your portion.</p></div>`;
    const recalc = () => {
      const n = DB.foodNutrients(food, +$('#pfQty').value || 0, $('#pfUnit').value);
      $('#pfCalc').innerHTML = `≈ <strong>${Math.round(n.kcal)} kcal</strong> · P ${n.p}g · C ${n.c}g · F ${n.f}g · ~${n.grams}g`;
      return n;
    };
    $('#pfQty').oninput = recalc; $('#pfUnit').onchange = recalc;
    recalc();
    $('#pfAdd').onclick = () => {
      const qty = +$('#pfQty').value, unit = $('#pfUnit').value;
      if (!qty || qty <= 0) { toast('Enter quantity'); return; }
      const n = DB.foodNutrients(food, qty, unit);
      Storage.push(Storage.KEYS.foodEntries, {
        id: Storage.uid('fe'), date, meal, foodId: food.id, name: food.name,
        qty, unit, qtyLabel: `${qty} ${unit}`,
        kcal: n.kcal, p: n.p, c: n.c, f: n.f, fiber: n.fiber
      });
      App.closeModal(); toast(`Added ${food.name} ✓`); go('nutrition', { sub: 'diary', date });
    };
  }

  /* ---------------- CUSTOM FOODS ---------------- */
  function renderCustom(body) {
    const customs = Storage.list(Storage.KEYS.customFoods);
    const favs = Storage.list(Storage.KEYS.favorites);
    body.innerHTML = `
      <div class="card"><h3>+ New custom food</h3>
        <label class="field">Name<input id="cfName" placeholder="e.g. Mom's khichdi"></label>
        <div class="row2">
          <label class="field">kcal / 100g<input id="cfKcal" type="number" min="0"></label>
          <label class="field">Protein g / 100g<input id="cfP" type="number" min="0" step="0.1"></label>
        </div>
        <div class="row2">
          <label class="field">Carbs g / 100g<input id="cfC" type="number" min="0" step="0.1"></label>
          <label class="field">Fat g / 100g<input id="cfF" type="number" min="0" step="0.1"></label>
        </div>
        <label class="field">Suitable for<select id="cfDiet">
          <option value="veg">Vegetarian</option><option value="vegan">Vegan</option>
          <option value="nonveg">Non-veg</option><option value="egg">Eggetarian</option></select></label>
        <button class="btn primary full" id="cfSave">Save food</button></div>
      <h3 class="sec-title">My foods (${customs.length})</h3>
      ${customs.map(f => `<div class="list-item"><span>${esc(f.name)} <small class="muted">${f.kcal} kcal/100g (your entry)</small></span>
        <button class="icon-btn danger" data-del="${f.id}">🗑️</button></div>`).join('') || '<p class="muted">No custom foods yet.</p>'}
      <h3 class="sec-title">⭐ Favorite meals</h3>
      <p class="muted small">Save a whole day's template from the diary to repeat it in one tap. (Coming from diary: use "Repeat yesterday".)</p>
      ${favs.map(f => `<div class="list-item"><span>${esc(f.name)}</span><button class="icon-btn danger" data-delfav="${f.id}">🗑️</button></div>`).join('')}`;
    $('#cfSave').onclick = () => {
      const name = $('#cfName').value.trim();
      const kcal = +$('#cfKcal').value;
      if (!name || !(kcal >= 0)) { toast('Name + calories required'); return; }
      const diet = $('#cfDiet').value;
      Storage.push(Storage.KEYS.customFoods, {
        id: Storage.uid('cf'), name, per: 100, unit: 'g',
        kcal, p: +$('#cfP').value || 0, c: +$('#cfC').value || 0, f: +$('#cfF').value || 0, fiber: 0,
        tags: diet === 'vegan' ? ['veg', 'vegan'] : diet === 'veg' ? ['veg'] : diet === 'egg' ? ['veg', 'egg'] : ['nonveg'],
        custom: true
      });
      toast('Custom food saved ✓'); go('nutrition', { sub: 'custom' });
    };
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirmDialog('Delete?', 'Delete this custom food?', () => {
        Storage.removeById(Storage.KEYS.customFoods, b.dataset.del); go('nutrition', { sub: 'custom' });
      }));
    body.querySelectorAll('[data-delfav]').forEach(b => b.onclick = () => {
      Storage.removeById(Storage.KEYS.favorites, b.dataset.delfav); go('nutrition', { sub: 'custom' });
    });
  }

  /* ---------------- AI FOOD SCANNER ----------------
     HONEST DESIGN: real recognition ONLY via the user's own
     Gemini API key. Without a key → clear "key required" state.
     Never fabricate results.                                    */
  function renderScanner(body) {
    const key = Storage.getSettings().geminiApiKey;
    body.innerHTML = `
      <div class="card"><h3>📸 AI Food Scanner</h3>
        <p class="muted small">Snap your meal → review what the AI found → correct quantities → save to diary.</p>
        ${key ? '<p class="ok small">✓ API key configured</p>'
              : `<p class="warn small">⚠ No API key yet. Real food recognition needs your <strong>free</strong> Gemini API key.
                 <br>Get one at <strong>aistudio.google.com</strong> → paste it in <a href="#" id="scanGoSettings">Settings → AI features</a>.</p>`}
        <div class="row2">
          <label class="btn ghost full" style="text-align:center">📷 Camera<input id="scanCam" type="file" accept="image/*" capture="environment" hidden></label>
          <label class="btn ghost full" style="text-align:center">🖼 Gallery<input id="scanGal" type="file" accept="image/*" hidden></label>
        </div>
        <div id="scanPreview"></div>
        <div id="scanResults"></div>
      </div>
      <p class="fine">A photo cannot measure exact calories or weight — always confirm quantities. Estimates only.</p>`;
    const goS = $('#scanGoSettings');
    if (goS) goS.onclick = e => { e.preventDefault(); go('settings'); };
    const handle = file => {
      if (!file) return;
      if (!Storage.getSettings().geminiApiKey) {
        toast('Add your free Gemini API key in Settings first');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        $('#scanPreview').innerHTML = `<img src="${reader.result}" class="scan-img" alt="Meal photo">`;
        runGeminiScan(reader.result, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    };
    $('#scanCam').onchange = e => handle(e.target.files[0]);
    $('#scanGal').onchange = e => handle(e.target.files[0]);
  }

  async function runGeminiScan(dataUrl, mime) {
    const box = $('#scanResults');
    box.innerHTML = '<p class="muted">🔍 Analyzing with Gemini… (this may take a few seconds)</p>';
    const key = Storage.getSettings().geminiApiKey;
    const base64 = dataUrl.split(',')[1];
    const prompt = `You are a nutrition assistant. Look at this meal photo and list each distinct food item you can identify.
For each item return: name, estimated quantity in grams (best guess, be conservative), and confidence (high/medium/low).
Respond ONLY with valid JSON: {"items":[{"name":"...","grams":120,"confidence":"medium"}]}
If you cannot identify anything, respond {"items":[]}. Do not invent foods you cannot see.`;
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
          generationConfig: { response_mime_type: 'application/json', maxOutputTokens: 1024 }
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(res.status === 400 ? 'Invalid API key or request.' : 'API error ' + res.status + '. ' + t.slice(0, 120));
      }
      const json = await res.json();
      const text = json.candidates && json.candidates[0] && json.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(text || '{"items":[]}');
      const items = (parsed.items || []).filter(i => i && i.name);
      if (!items.length) {
        box.innerHTML = '<p class="warn">Could not identify any food in this photo. Try a clearer, well-lit picture — or add foods manually.</p>';
        return;
      }
      renderScanReview(box, items);
    } catch (err) {
      console.warn('[FitLife360] scan failed', err);
      box.innerHTML = `<p class="warn">Scan failed: ${esc(err.message)}<br>Check your API key in Settings, or add foods manually.</p>`;
    }
  }

  function renderScanReview(box, items) {
    // match each item to closest DB food for nutrient math
    const rows = items.map((it, i) => {
      const match = matchFood(it.name);
      return { i, name: it.name, grams: Math.max(10, Math.round(it.grams || 100)),
               confidence: it.confidence || 'low', match };
    });
    const draw = () => {
      box.innerHTML = `<h4>Review & correct <small class="muted">(AI guesses — verify!)</small></h4>` +
        rows.map(r => {
          const n = r.match ? DB.foodNutrients(r.match, r.grams, 'g') : null;
          return `<div class="card small">
            <input data-r="${r.i}" data-f="name" value="${esc(r.name)}" aria-label="Food name">
            <div class="row2">
              <label class="field">Grams (est.)<input type="number" data-r="${r.i}" data-f="grams" value="${r.grams}" min="1"></label>
              <span class="tag ${r.confidence}">${esc(r.confidence)} confidence</span>
            </div>
            <p class="small">${r.match ? `Matched: <strong>${esc(r.match.name)}</strong> → ≈ <strong>${Math.round(n.kcal)} kcal</strong> (P ${n.p}g · C ${n.c}g · F ${n.f}g)` : '<span class="warn">No database match — add as custom food or pick manually.</span>'}</p>
            <button class="icon-btn danger" data-rm="${r.i}">Remove 🗑️</button>
          </div>`;
        }).join('') +
        `<label class="field">Save to meal<select id="scanMeal">
          ${['breakfast', 'lunch', 'dinner', 'snacks'].map(m => `<option>${m}</option>`).join('')}</select></label>
        <button class="btn primary full" id="scanSave">Save ${rows.length} item(s) to diary ✓</button>
        <p class="fine">AI estimates only. Correct anything that looks wrong.</p>`;
      box.querySelectorAll('[data-r]').forEach(inp => inp.oninput = () => {
        const r = rows[+inp.dataset.r];
        r[inp.dataset.f] = inp.dataset.f === 'grams' ? Math.max(1, +inp.value || 1) : inp.value;
        if (inp.dataset.f === 'name') r.match = matchFood(r.name);
        draw();
      });
      box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
        rows.splice(+b.dataset.rm, 1);
        rows.forEach((r, i) => r.i = i);
        if (!rows.length) { box.innerHTML = '<p class="muted">All items removed.</p>'; return; }
        draw();
      });
      $('#scanSave').onclick = () => {
        const meal = $('#scanMeal').value, date = Storage.todayKey();
        let added = 0;
        rows.forEach(r => {
          if (!r.match) return;
          const n = DB.foodNutrients(r.match, r.grams, 'g');
          Storage.push(Storage.KEYS.foodEntries, {
            id: Storage.uid('fe'), date, meal, foodId: r.match.id,
            name: r.name + ' (AI scan)', qty: r.grams, unit: 'g', qtyLabel: `~${r.grams} g (AI est.)`,
            kcal: n.kcal, p: n.p, c: n.c, f: n.f, fiber: n.fiber, aiConfidence: r.confidence
          });
          added++;
        });
        toast(`Saved ${added} item(s) to ${meal} ✓`);
        go('nutrition', { sub: 'diary', date });
      };
    };
    draw();
  }

  function matchFood(name) {
    const q = name.toLowerCase();
    const words = q.split(/[^a-z]+/).filter(w => w.length > 2);
    let best = null, bestScore = 0;
    DB.FOODS.concat(Storage.list(Storage.KEYS.customFoods)).forEach(f => {
      const fn = f.name.toLowerCase();
      let score = 0;
      words.forEach(w => { if (fn.includes(w)) score += w.length; });
      if (score > bestScore) { bestScore = score; best = f; }
    });
    return bestScore >= 3 ? best : null;
  }

  return {};
})();
