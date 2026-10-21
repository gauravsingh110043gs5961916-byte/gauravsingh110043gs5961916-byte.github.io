/* ============================================================
   FitLife 360 — diet.js
   AI Diet Plan Generator — honest rule-based smart generator
   built from the user's saved profile (goal, diet, targets,
   budget). Optional Gemini "enhance" when the user saved a key.
   Clearly labeled: generated from your profile, not magic.
   ============================================================ */
'use strict';

const Diet = (() => {
  const { $, esc, toast, modal, confirmDialog, go } = App;

  /* meal templates: [foodId, qty, unit] — budget tiers 1=cheap */
  const T = {
    breakfast: {
      veg: [
        [['f_oats', 60, 'g'], ['f_milk', 200, 'ml'], ['f_banana', 1, 'pc'], ['f_almonds', 10, 'g']],
        [['f_poha', 80, 'g'], ['f_peanuts', 15, 'g'], ['f_milk', 150, 'ml']],
        [['f_idli', 3, 'pc'], ['f_sprouts', 80, 'g']],
        [['f_upma', 120, 'g'], ['f_banana', 1, 'pc']],
        [['f_bread', 2, 'pc'], ['f_peanuts', 20, 'g'], ['f_milk', 200, 'ml']],
        [['f_dosa', 1, 'pc'], ['f_sprouts', 60, 'g']],
        [['f_paratha', 1, 'pc'], ['f_curd', 100, 'g']],
      ],
      vegan: [
        [['f_oats', 60, 'g'], ['f_banana', 1, 'pc'], ['f_peanuts', 20, 'g']],
        [['f_poha', 80, 'g'], ['f_peanuts', 20, 'g']],
        [['f_idli', 3, 'pc'], ['f_sprouts', 80, 'g']],
        [['f_upma', 120, 'g'], ['f_banana', 1, 'pc']],
        [['f_bread', 2, 'pc'], ['f_peanuts', 20, 'g']],
        [['f_makhana', 40, 'g'], ['f_banana', 1, 'pc']],
        [['f_dosa', 1, 'pc'], ['f_sprouts', 60, 'g']],
      ],
      nonveg: [
        [['f_oats', 60, 'g'], ['f_milk', 200, 'ml'], ['f_egg', 2, 'pc']],
        [['f_bread', 2, 'pc'], ['f_egg', 2, 'pc'], ['f_milk', 150, 'ml']],
        [['f_idli', 3, 'pc'], ['f_egg', 2, 'pc']],
        [['f_poha', 80, 'g'], ['f_peanuts', 15, 'g'], ['f_egg', 1, 'pc']],
        [['f_upma', 120, 'g'], ['f_banana', 1, 'pc']],
        [['f_paratha', 1, 'pc'], ['f_egg', 2, 'pc']],
        [['f_dosa', 1, 'pc'], ['f_milk', 200, 'ml']],
      ],
      egg: [
        [['f_oats', 60, 'g'], ['f_milk', 200, 'ml'], ['f_egg', 2, 'pc']],
        [['f_bread', 2, 'pc'], ['f_egg', 2, 'pc']],
        [['f_poha', 80, 'g'], ['f_egg', 2, 'pc']],
        [['f_idli', 3, 'pc'], ['f_sprouts', 60, 'g']],
        [['f_upma', 120, 'g'], ['f_egg', 1, 'pc']],
        [['f_paratha', 1, 'pc'], ['f_curd', 100, 'g']],
        [['f_dosa', 1, 'pc'], ['f_sprouts', 60, 'g']],
      ]
    },
    lunch: {
      veg: [
        [['f_rice', 150, 'g'], ['f_dal', 150, 'g'], ['f_sabzi', 100, 'g'], ['f_roti', 2, 'pc']],
        [['f_roti', 3, 'pc'], ['f_rajma', 150, 'g'], ['f_sabzi', 100, 'g'], ['f_curd', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_chana', 150, 'g'], ['f_palaksabzi', 100, 'g']],
        [['f_khichdi', 250, 'g'], ['f_curd', 100, 'g'], ['f_sabzi', 80, 'g']],
        [['f_roti', 2, 'pc'], ['f_paneer_bhurji', 120, 'g'], ['f_dal', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_moong', 150, 'g'], ['f_sabzi', 100, 'g'], ['f_roti', 1, 'pc']],
        [['f_biryani_veg', 250, 'g'], ['f_curd', 100, 'g']],
      ],
      vegan: [
        [['f_rice', 150, 'g'], ['f_dal', 150, 'g'], ['f_sabzi', 100, 'g'], ['f_roti', 2, 'pc']],
        [['f_roti', 3, 'pc'], ['f_rajma', 150, 'g'], ['f_sabzi', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_chana', 150, 'g'], ['f_palaksabzi', 100, 'g']],
        [['f_khichdi', 250, 'g'], ['f_sabzi', 100, 'g']],
        [['f_roti', 2, 'pc'], ['f_soya', 40, 'g'], ['f_dal', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_moong', 150, 'g'], ['f_sabzi', 100, 'g']],
        [['f_biryani_veg', 250, 'g'], ['f_sprouts', 80, 'g']],
      ],
      nonveg: [
        [['f_rice', 150, 'g'], ['f_chicken', 150, 'g'], ['f_dal', 100, 'g'], ['f_roti', 1, 'pc']],
        [['f_roti', 2, 'pc'], ['f_eggcurry', 150, 'g'], ['f_sabzi', 100, 'g']],
        [['f_biryani_chicken', 300, 'g'], ['f_curd', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_fish', 150, 'g'], ['f_dal', 100, 'g']],
        [['f_roti', 3, 'pc'], ['f_chicken_tandoori', 120, 'g'], ['f_sabzi', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_dal', 150, 'g'], ['f_egg', 2, 'pc']],
        [['f_khichdi', 250, 'g'], ['f_chicken', 100, 'g']],
      ],
      egg: [
        [['f_rice', 150, 'g'], ['f_eggcurry', 150, 'g'], ['f_dal', 100, 'g'], ['f_roti', 1, 'pc']],
        [['f_roti', 3, 'pc'], ['f_dal', 150, 'g'], ['f_egg', 2, 'pc'], ['f_sabzi', 100, 'g']],
        [['f_rice', 150, 'g'], ['f_chana', 150, 'g'], ['f_palaksabzi', 100, 'g']],
        [['f_khichdi', 250, 'g'], ['f_egg', 2, 'pc']],
        [['f_roti', 2, 'pc'], ['f_paneer_bhurji', 120, 'g'], ['f_dal', 100, 'g']],
        [['f_biryani_veg', 250, 'g'], ['f_egg', 2, 'pc']],
        [['f_rice', 150, 'g'], ['f_rajma', 150, 'g'], ['f_curd', 100, 'g']],
      ]
    },
    snacks: {
      veg: [
        [['f_makhana', 30, 'g'], ['f_chai', 100, 'ml']],
        [['f_sprouts', 80, 'g']],
        [['f_banana', 1, 'pc'], ['f_peanuts', 15, 'g']],
        [['f_dhokla', 100, 'g']],
        [['f_buttermilk', 200, 'ml'], ['f_makhana', 20, 'g']],
        [['f_apple', 1, 'pc']],
        [['f_sandwich', 1, 'pc']],
      ],
      vegan: [
        [['f_makhana', 30, 'g'], ['f_nimbu', 200, 'ml']],
        [['f_sprouts', 80, 'g']],
        [['f_banana', 1, 'pc'], ['f_peanuts', 15, 'g']],
        [['f_dhokla', 100, 'g']],
        [['f_grapes', 100, 'g']],
        [['f_apple', 1, 'pc']],
        [['f_orange', 1, 'pc']],
      ],
      nonveg: [
        [['f_egg', 2, 'pc'], ['f_chai', 100, 'ml']],
        [['f_makhana', 30, 'g']],
        [['f_banana', 1, 'pc'], ['f_peanuts', 15, 'g']],
        [['f_chicken_tandoori', 80, 'g']],
        [['f_sprouts', 80, 'g']],
        [['f_apple', 1, 'pc']],
        [['f_buttermilk', 200, 'ml']],
      ],
      egg: [
        [['f_egg', 2, 'pc'], ['f_chai', 100, 'ml']],
        [['f_makhana', 30, 'g']],
        [['f_banana', 1, 'pc'], ['f_peanuts', 15, 'g']],
        [['f_sprouts', 80, 'g']],
        [['f_dhokla', 100, 'g']],
        [['f_apple', 1, 'pc']],
        [['f_buttermilk', 200, 'ml']],
      ]
    },
    dinner: {
      veg: [
        [['f_roti', 2, 'pc'], ['f_dal', 150, 'g'], ['f_sabzi', 120, 'g']],
        [['f_roti', 2, 'pc'], ['f_palaksabzi', 150, 'g'], ['f_curd', 100, 'g']],
        [['f_khichdi', 200, 'g'], ['f_sabzi', 80, 'g']],
        [['f_roti', 2, 'pc'], ['f_chana', 120, 'g'], ['f_sabzi', 100, 'g']],
        [['f_rice', 100, 'g'], ['f_moong', 150, 'g'], ['f_sabzi', 100, 'g']],
        [['f_roti', 2, 'pc'], ['f_paneer_bhurji', 100, 'g'], ['f_dal', 100, 'g']],
        [['f_dal', 200, 'g'], ['f_roti', 1, 'pc'], ['f_sabzi', 100, 'g']],
      ],
      vegan: [
        [['f_roti', 2, 'pc'], ['f_dal', 150, 'g'], ['f_sabzi', 120, 'g']],
        [['f_roti', 2, 'pc'], ['f_palaksabzi', 150, 'g']],
        [['f_khichdi', 200, 'g'], ['f_sabzi', 80, 'g']],
        [['f_roti', 2, 'pc'], ['f_chana', 120, 'g'], ['f_sabzi', 100, 'g']],
        [['f_rice', 100, 'g'], ['f_moong', 150, 'g'], ['f_sabzi', 100, 'g']],
        [['f_roti', 2, 'pc'], ['f_soya', 35, 'g'], ['f_sabzi', 100, 'g']],
        [['f_dal', 200, 'g'], ['f_roti', 1, 'pc'], ['f_sabzi', 100, 'g']],
      ],
      nonveg: [
        [['f_roti', 2, 'pc'], ['f_chicken', 120, 'g'], ['f_sabzi', 100, 'g']],
        [['f_eggcurry', 150, 'g'], ['f_roti', 2, 'pc'], ['f_dal', 80, 'g']],
        [['f_rice', 100, 'g'], ['f_fish', 120, 'g'], ['f_sabzi', 100, 'g']],
        [['f_roti', 2, 'pc'], ['f_dal', 150, 'g'], ['f_egg', 2, 'pc']],
        [['f_chicken_tandoori', 150, 'g'], ['f_sabzi', 120, 'g']],
        [['f_khichdi', 200, 'g'], ['f_egg', 2, 'pc']],
        [['f_roti', 2, 'pc'], ['f_chana', 120, 'g'], ['f_curd', 100, 'g']],
      ],
      egg: [
        [['f_roti', 2, 'pc'], ['f_eggcurry', 150, 'g'], ['f_sabzi', 100, 'g']],
        [['f_roti', 2, 'pc'], ['f_dal', 150, 'g'], ['f_egg', 2, 'pc']],
        [['f_khichdi', 200, 'g'], ['f_sabzi', 80, 'g']],
        [['f_roti', 2, 'pc'], ['f_palaksabzi', 150, 'g'], ['f_curd', 100, 'g']],
        [['f_rice', 100, 'g'], ['f_moong', 150, 'g'], ['f_egg', 1, 'pc']],
        [['f_roti', 2, 'pc'], ['f_paneer_bhurji', 100, 'g']],
        [['f_dal', 200, 'g'], ['f_roti', 1, 'pc'], ['f_sabzi', 100, 'g']],
      ]
    }
  };

  // cost tiers: 1 = cheap daily staple (default), 2 = medium, 3 = pricey.
  // Low budget keeps tier 1 only; medium keeps 1–2; high keeps everything.
  const BUDGET_TIER = {
    f_oats: 2, f_dosa: 2, f_upma: 2, f_paratha: 2, f_bread: 2,
    f_paneer: 2, f_paneer_bhurji: 2, f_tofu: 2,
    f_chicken: 2, f_eggcurry: 2,
    f_dhokla: 2, f_sandwich: 2, f_maggo: 2, f_pavbhaji: 2, f_cholebhature: 2,
    f_lassi: 2, f_coffee: 2,
    f_almonds: 3, f_chicken_tandoori: 3, f_fish: 3, f_biryani_chicken: 3,
    f_samosa: 3, f_pakora: 3
  };
  function tierOf(fid) { return BUDGET_TIER[fid] || 1; }

  /* calorie-dense top-ups used when a scaled day still falls short of target */
  function topUpsFor(dk, tierMax) {
    const all = [
      ['f_peanuts', 30, 'g'], ['f_banana', 1, 'pc'], ['f_makhana', 30, 'g'],
      ['f_roti', 1, 'pc'], ['f_milk', 250, 'ml'], ['f_curd', 100, 'g'], ['f_egg', 1, 'pc']
    ];
    return all.filter(([fid]) => {
      if (tierOf(fid) > tierMax) return false;
      const f = DB.findFood(fid);
      if (!f) return false;
      if (dk === 'vegan' && !f.tags.includes('vegan')) return false;
      else if (dk === 'veg' && !f.tags.includes('veg')) return false;
      else if (dk === 'egg' && !(f.tags.includes('veg') || f.tags.includes('egg'))) return false;
      return true; // nonveg: everything allowed
    });
  }

  function dietKey() {
    const d = (Storage.getProfile() || {}).diet || 'veg';
    return T.breakfast[d] ? d : 'veg';
  }

  function dayTotals(day) {
    const t = { kcal: 0, p: 0, c: 0, f: 0 };
    Object.values(day.meals).flat().forEach(it => {
      const f = DB.findFood(it.foodId);
      if (!f) return;
      const n = DB.foodNutrients(f, it.qty, it.unit);
      t.kcal += n.kcal; t.p += n.p; t.c += n.c; t.f += n.f;
    });
    t.kcal = Math.round(t.kcal); t.p = Math.round(t.p); t.c = Math.round(t.c); t.f = Math.round(t.f);
    return t;
  }

  function scaleToTarget(items, targetKcal) {
    // scale quantities so the day lands near target (±10%)
    let cur = itemsTotalKcal(items);
    if (cur <= 0) return items;
    const factor = Math.min(1.6, Math.max(0.6, targetKcal / cur));
    return items.map(it => Object.assign({}, it, { qty: Math.round(it.qty * factor * 10) / 10 }));
  }

  function itemsTotalKcal(items) {
    return items.reduce((a, it) => {
      const f = DB.findFood(it.foodId);
      return a + (f ? DB.foodNutrients(f, it.qty, it.unit).kcal : 0);
    }, 0);
  }

  function generatePlan(budget) {
    const profile = Storage.getProfile() || {};
    const calc = DB.calcTargets(profile);
    const target = calc.targets.kcal;
    const dk = dietKey();
    const tierMax = budget === 'low' ? 1 : budget === 'medium' ? 2 : 3;
    const days = [];
    for (let d = 0; d < 7; d++) {
      const meals = {};
      ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(mk => {
        let tpl = T[mk][dk][d % 7];
        // budget filter: drop pricier items on lower budgets, keep staples
        tpl = tpl.filter(([fid]) => tierOf(fid) <= tierMax);
        if (!tpl.length) tpl = [['f_roti', 2, 'pc'], ['f_dal', 150, 'g']];
        meals[mk] = tpl.map(([foodId, qty, unit]) => ({ foodId, qty, unit }));
      });
      // scale day toward target, then top up with extra snacks if still short
      let flat = scaleToTarget(Object.values(meals).flat(), target);
      const ups = topUpsFor(dk, tierMax);
      let ui = 0, guard = 0;
      while (guard++ < 8 && ups.length && itemsTotalKcal(flat) < target * 0.92) {
        const [fid, qty, unit] = ups[ui++ % ups.length];
        flat.push({ foodId: fid, qty, unit });
      }
      // re-split into meals in original order; extras land in snacks
      let idx = 0;
      const counts = {};
      Object.keys(meals).forEach(mk => { counts[mk] = meals[mk].length; });
      Object.keys(meals).forEach(mk => {
        meals[mk] = flat.slice(idx, idx + counts[mk]);
        idx += counts[mk];
      });
      if (idx < flat.length) meals.snacks = meals.snacks.concat(flat.slice(idx));
      days.push({ day: d + 1, meals, totals: null, aiEnhanced: false });
      days[d].totals = dayTotals(days[d]);
    }
    return {
      id: Storage.uid('dp'), createdAt: new Date().toISOString(),
      budget, targetKcal: target, diet: dk, days,
      source: 'profile-based smart generator'
    };
  }

  /* ---------------- VIEW ---------------- */
  App.Views.dietplan = {
    render(main, params) {
      const plans = Storage.list(Storage.KEYS.dietPlans);
      const plan = plans[plans.length - 1] || null;
      const dayIdx = (params && params.day) || 0;
      main.innerHTML = `
        <header class="app-head"><button class="icon-btn" data-go="home">←</button><h2>🥗 Diet Plan</h2><span></span></header>
        <div class="card">
          <p class="muted small">Smart 7-day plan built from <strong>your profile</strong> (goal, diet, calorie target${plan ? ', budget: ' + esc(plan.budget) : ''}).
          ${plan ? 'Source: <em>' + esc(plan.source) + '</em>' : ''}</p>
          <div class="row2">
            <label class="field">Budget<select id="dpBudget">
              ${['low', 'medium', 'high'].map(b => `<option ${plan && plan.budget === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select></label>
            <label class="field">&nbsp;<button class="btn primary full" id="dpGen">${plan ? '↻ Regenerate' : '✨ Generate my plan'}</button></label>
          </div>
          ${Storage.getSettings().geminiApiKey && plan
            ? '<button class="btn ghost full" id="dpEnhance">🤖 Enhance with Gemini AI</button>'
            : plan ? '<p class="hint">Add a free Gemini API key in Settings to unlock AI enhancement.</p>' : ''}
        </div>
        <div id="dpBody">${plan ? '' : '<p class="muted">No plan yet — generate one above! 🥗</p>'}</div>`;
      document.querySelector('[data-go="home"]').onclick = () => go('home');
      $('#dpGen').onclick = () => {
        const budget = $('#dpBudget').value;
        const p = generatePlan(budget);
        Storage.push(Storage.KEYS.dietPlans, p);
        toast('7-day diet plan ready! 🥗');
        go('dietplan', { day: 0 });
      };
      const enh = $('#dpEnhance');
      if (enh) enh.onclick = () => enhanceWithGemini(plan);
      if (plan) renderPlan($('#dpBody'), plan, dayIdx);
    }
  };

  function mealName(mk) {
    return { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🍿 Snacks', dinner: '🌙 Dinner' }[mk];
  }

  function renderPlan(body, plan, dayIdx) {
    const day = plan.days[dayIdx];
    body.innerHTML = `
      <div class="chip-row" style="margin:10px 0">
        ${plan.days.map((d, i) => `<button class="chip ${i === dayIdx ? 'on' : ''}" data-day="${i}">Day ${d.day}</button>`).join('')}
      </div>
      <div class="card">
        <div class="meal-head"><h3>Day ${day.day}</h3>
          <span class="muted small">≈ ${day.totals.kcal} kcal · P ${day.totals.p}g · C ${day.totals.c}g · F ${day.totals.f}g</span></div>
        <p class="fine">Target: ${plan.targetKcal} kcal/day</p>
        ${Object.keys(day.meals).map(mk => `
          <h4>${mealName(mk)}</h4>
          ${day.meals[mk].map((it, ii) => {
            const f = DB.findFood(it.foodId);
            const n = f ? DB.foodNutrients(f, it.qty, it.unit) : null;
            return `<div class="list-item"><span>${f ? esc(f.name) : '?'}
              <small class="muted">${it.qty} ${it.unit}${n ? ` · ≈${Math.round(n.kcal)} kcal` : ''}</small></span>
              <span><button class="icon-btn" data-edit="${mk}:${ii}" aria-label="Edit">✏️</button>
              <button class="icon-btn danger" data-rm="${mk}:${ii}" aria-label="Remove">🗑️</button></span></div>`;
          }).join('')}
          <button class="btn ghost small" data-additem="${mk}">+ Add item</button>
        `).join('')}
      </div>
      <div class="row2">
        <button class="btn ghost" id="dpGrocery">🛒 Grocery list</button>
        <button class="btn ghost" id="dpSend">📅 Send today to diary</button>
      </div>
      <p class="fine">Estimates only — adjust portions to your hunger. Not medical advice.</p>`;
    body.querySelectorAll('[data-day]').forEach(b => b.onclick = () => go('dietplan', { day: +b.dataset.day }));
    body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      const [mk, ii] = b.dataset.rm.split(':');
      plan.days[dayIdx].meals[mk].splice(+ii, 1);
      plan.days[dayIdx].totals = dayTotals(plan.days[dayIdx]);
      persist(plan); go('dietplan', { day: dayIdx });
    });
    body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
      const [mk, ii] = b.dataset.edit.split(':');
      const it = plan.days[dayIdx].meals[mk][+ii];
      modal('Edit portion', `<label class="field">Quantity<input id="deQty" type="number" step="0.5" value="${it.qty}"></label>
        <label class="field">Unit<select id="deUnit">${['g', 'ml', 'pc', 'cup', 'bowl', 'tbsp', 'tsp'].map(u => `<option ${it.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label>`,
        [{ label: 'Cancel', kind: 'ghost' }, {
          label: 'Save', kind: 'primary', onClick: () => {
            it.qty = Math.max(0.5, +$('#deQty').value || it.qty);
            it.unit = $('#deUnit').value;
            plan.days[dayIdx].totals = dayTotals(plan.days[dayIdx]);
            persist(plan); go('dietplan', { day: dayIdx });
          }
        }]);
    });
    body.querySelectorAll('[data-additem]').forEach(b => b.onclick = () => {
      const mk = b.dataset.additem;
      const profile = Storage.getProfile() || {};
      modal('Add item', `<input id="daSearch" type="search" placeholder="Search food…"><div id="daRes" class="results"></div>`,
        [{ label: 'Cancel', kind: 'ghost' }]);
      const doS = q => {
        const hits = DB.searchFoods(q, profile.diet === 'nonveg' ? null : profile.diet).slice(0, 8);
        $('#daRes').innerHTML = hits.map(f => `<button class="result-row" data-f="${f.id}">${esc(f.name)}</button>`).join('');
        $('#daRes').querySelectorAll('[data-f]').forEach(rb => rb.onclick = () => {
          plan.days[dayIdx].meals[mk].push({ foodId: rb.dataset.f, qty: 100, unit: 'g' });
          plan.days[dayIdx].totals = dayTotals(plan.days[dayIdx]);
          persist(plan); App.closeModal(); go('dietplan', { day: dayIdx });
        });
      };
      $('#daSearch').oninput = e => doS(e.target.value);
      doS('');
    });
    $('#dpGrocery').onclick = () => showGrocery(plan);
    $('#dpSend').onclick = () => {
      const date = Storage.todayKey();
      Object.keys(day.meals).forEach(mk => {
        day.meals[mk].forEach(it => {
          const f = DB.findFood(it.foodId);
          if (!f) return;
          const n = DB.foodNutrients(f, it.qty, it.unit);
          Storage.push(Storage.KEYS.foodEntries, {
            id: Storage.uid('fe'), date, meal: mk, foodId: f.id, name: f.name + ' (diet plan)',
            qty: it.qty, unit: it.unit, qtyLabel: `${it.qty} ${it.unit}`,
            kcal: n.kcal, p: n.p, c: n.c, f: n.f, fiber: n.fiber
          });
        });
      });
      toast("Day's meals sent to diary ✓"); go('nutrition', { sub: 'diary', date });
    };
  }

  function persist(plan) {
    Storage.updateById(Storage.KEYS.dietPlans, plan.id, plan);
  }

  function showGrocery(plan) {
    const agg = {};
    plan.days.forEach(d => Object.values(d.meals).flat().forEach(it => {
      const f = DB.findFood(it.foodId);
      const name = f ? f.name : it.foodId;
      const key = name + '|' + it.unit;
      agg[key] = agg[key] || { name, unit: it.unit, qty: 0 };
      agg[key].qty += it.qty;
    }));
    const lines = Object.values(agg).map(a => `• ${a.name} — ${Math.round(a.qty * 10) / 10} ${a.unit}`);
    modal('🛒 Weekly grocery list', `<div class="grocery">${lines.join('<br>')}</div>
      <p class="hint">Approximate totals for the full 7-day plan. Buy fresh items in 2 trips.</p>`,
      [
        { label: 'Copy list', kind: 'ghost', keepOpen: true, onClick: () => {
            try { navigator.clipboard.writeText(lines.join('\n')); toast('Copied ✓'); } catch (e) { toast('Copy not available'); }
        }},
        { label: 'Close', kind: 'primary' }
      ]);
  }

  /* -------- optional Gemini enhance -------- */
  async function enhanceWithGemini(plan) {
    const key = Storage.getSettings().geminiApiKey;
    if (!key) { toast('Add API key in Settings first'); return; }
    toast('🤖 Asking Gemini to personalize…');
    const profile = Storage.getProfile() || {};
    const summary = plan.days.map(d =>
      `Day ${d.day}: ` + Object.keys(d.meals).map(mk =>
        mk + ': ' + d.meals[mk].map(it => {
          const f = DB.findFood(it.foodId);
          return (f ? f.name : it.foodId) + ' ' + it.qty + it.unit;
        }).join(', ')).join(' | ')).join('\n');
    const prompt = `You are a nutrition coach. Here is a 7-day Indian diet plan (approx ${plan.targetKcal} kcal/day, ${plan.diet} diet, ${plan.budget} budget):\n${summary}\n\nUser: ${profile.age}y ${profile.gender}, goal=${profile.goal}, allergies=${profile.allergies || 'none'}.\n\nGive 5-8 SHORT practical tips to improve this plan (variety, protein, hydration, prep). Keep under 150 words total. Plain text, no markdown headers. Do not prescribe medical treatment.`;
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(key), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 600 } })
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const json = await res.json();
      const text = json.candidates[0].content.parts[0].text;
      plan.aiTips = text;
      plan.source = 'profile-based smart generator + Gemini AI tips';
      persist(plan);
      modal('🤖 Gemini tips', `<p style="white-space:pre-wrap">${esc(text)}</p><p class="fine">AI suggestions — verify with your needs. Not medical advice.</p>`,
        [{ label: 'Close', kind: 'primary' }]);
      go('dietplan', {});
    } catch (err) {
      console.warn('[FitLife360] enhance failed', err);
      toast('AI enhance failed — check API key');
    }
  }

  return { generatePlan };
})();
