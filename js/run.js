/* ============================================================
   FitLife 360 — run.js
   GPS running tracker: real navigator.geolocation tracking,
   Haversine distance, pace math, Leaflet/OSM map with graceful
   fallback when the map CDN is unreachable.
   ============================================================ */
'use strict';

const Run = (() => {
  const { $, esc, toast, modal, confirmDialog, go, fmtDist, fmtPace } = App;

  let watchId = null;
  let track = null;   // {points:[{lat,lon,at,acc}], pausedMs, pauseStart, startedAt}
  let map = null, routeLine = null, startMarker = null, posMarker = null;
  let leafletLoading = false;

  /* Haversine distance in km */
  function havKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function totalKm(points) {
    let d = 0;
    for (let i = 1; i < points.length; i++) {
      const seg = havKm(points[i - 1], points[i]);
      // filter GPS jumps: ignore segments implying > 40 km/h
      const dtH = (points[i].at - points[i - 1].at) / 3600000;
      if (dtH > 0 && seg / dtH < 40) d += seg;
    }
    return d;
  }

  function activeSec() {
    if (!track) return 0;
    const paused = track.pausedMs + (track.pauseStart ? Date.now() - track.pauseStart : 0);
    return Math.max(0, Math.floor((Date.now() - track.startedAt - paused) / 1000));
  }

  App.Views.run = {
    render(main, params) {
      const sub = (params && params.sub) || 'track';
      main.innerHTML = `
        <header class="app-head"><h2>🏃 Run</h2><span></span></header>
        <div class="chip-row" style="margin-bottom:12px">
          <button class="chip ${sub === 'track' ? 'on' : ''}" data-sub="track">Track</button>
          <button class="chip ${sub === 'history' ? 'on' : ''}" data-sub="history">History</button>
          <button class="chip ${sub === 'goals' ? 'on' : ''}" data-sub="goals">Goals</button>
        </div>
        <div id="rBody"></div>`;
      document.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => go('run', { sub: b.dataset.sub }));
      const body = $('#rBody');
      if (sub === 'history') renderHistory(body, params);
      else if (sub === 'goals') renderGoals(body);
      else renderTrack(body);
    }
  };

  /* ---------------- TRACK VIEW ---------------- */
  function renderTrack(body) {
    const geoOK = 'geolocation' in navigator;
    const secure = window.isSecureContext;
    body.innerHTML = `
      <div class="card">
        <h3>GPS status: <span id="gpsState" class="muted">checking…</span></h3>
        <p class="hint">Location is used <strong>only while you run</strong> to measure distance and draw your route.
        ${!geoOK ? '<br><span class="warn">⚠ This browser/device does not support geolocation — use manual entry below.</span>' : ''}
        ${!secure ? '<br><span class="warn">⚠ GPS needs HTTPS (or localhost). You are on an insecure page — use manual entry below.</span>' : ''}</p>
        <div id="mapWrap"><div id="runMap" class="map"></div>
          <p id="mapNote" class="fine hidden">Map unavailable offline — stats below still work.</p></div>
      </div>
      <div class="card run-stats">
        <div class="big-stat"><span id="rsTime">00:00:00</span><small>time</small></div>
        <div class="big-stat"><span id="rsDist">0.00 km</span><small>distance</small></div>
        <div class="big-stat"><span id="rsPace">—</span><small>avg pace</small></div>
        <div class="big-stat"><span id="rsKcal">0</span><small>kcal (est.)</small></div>
      </div>
      <div class="run-controls">
        <button class="btn primary big" id="runStart" ${(!geoOK || !secure) ? 'disabled' : ''}>▶ Start Run</button>
        <button class="btn ghost hidden" id="runPause">⏸ Pause</button>
        <button class="btn ghost hidden" id="runResume">▶ Resume</button>
        <button class="btn danger hidden" id="runFinish">⏹ Finish</button>
        <button class="btn ghost hidden" id="runDiscard">Discard</button>
      </div>
      <div class="card"><h3>✍️ Manual entry</h3>
        <div class="row2">
          <label class="field">Distance (km)<input id="mDist" type="number" step="0.1" min="0.1"></label>
          <label class="field">Duration (min)<input id="mDur" type="number" step="1" min="1"></label>
        </div>
        <button class="btn ghost full" id="mSave">Save manual run</button></div>`;
    initMap();
    checkGps();
    $('#runStart').onclick = startRun;
    $('#runPause').onclick = pauseRun;
    $('#runResume').onclick = resumeRun;
    $('#runFinish').onclick = finishRun;
    $('#runDiscard').onclick = () => confirmDialog('Discard run?', 'Delete this untracked run?', stopAll, 'Discard');
    $('#mSave').onclick = () => {
      const km = +$('#mDist').value, min = +$('#mDur').value;
      if (!km || !min || km <= 0 || min <= 0) { toast('Enter distance and duration'); return; }
      saveRun({ distanceKm: km, durationSec: Math.round(min * 60), points: [], manual: true });
      toast('Run saved ✓'); go('run', { sub: 'history' });
    };
    if (track) { // re-rendered mid-run
      setButtons('running');
      tickStats();
    }
  }

  function checkGps() {
    const el = $('#gpsState');
    if (!el) return;
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      el.textContent = 'unavailable'; el.className = 'warn'; return;
    }
    el.textContent = 'waiting for fix…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (!$('#gpsState')) return;
        const acc = Math.round(pos.coords.accuracy || 0);
        $('#gpsState').textContent = `locked ✓ (±${acc} m)`;
        $('#gpsState').className = 'ok';
        centerMap(pos.coords.latitude, pos.coords.longitude);
      },
      () => { const g = $('#gpsState'); if (g) { g.textContent = 'permission denied'; g.className = 'warn'; } },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  /* ---------------- map (Leaflet, optional) ---------------- */
  function ensureLeaflet(cb) {
    if (window.L) return cb(true);
    if (leafletLoading) { setTimeout(() => ensureLeaflet(cb), 800); return; }
    leafletLoading = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => { leafletLoading = false; cb(true); };
    s.onerror = () => { leafletLoading = false; cb(false); };
    document.head.appendChild(s);
    setTimeout(() => { if (!window.L && leafletLoading) { leafletLoading = false; cb(false); } }, 8000);
  }

  function initMap() {
    const el = $('#runMap');
    if (!el) return;
    ensureLeaflet(ok => {
      if (!ok || !$('#runMap')) {
        const n = $('#mapNote');
        if (n) n.classList.remove('hidden');
        return;
      }
      try {
        map = L.map('runMap', { zoomControl: true }).setView([28.6139, 77.2090], 13); // default: New Delhi
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        routeLine = L.polyline([], { color: '#34c759', weight: 4 }).addTo(map);
        setTimeout(() => map.invalidateSize(), 300);
      } catch (e) { console.warn('[FitLife360] map init failed', e); }
    });
  }

  function centerMap(lat, lon) {
    if (map) map.setView([lat, lon], 16);
  }

  function updateMap() {
    if (!map || !track || !track.points.length) return;
    try {
      const latlngs = track.points.map(p => [p.lat, p.lon]);
      routeLine.setLatLngs(latlngs);
      const last = track.points[track.points.length - 1];
      if (!posMarker) {
        posMarker = L.circleMarker([last.lat, last.lon], { radius: 7, color: '#3b82f6', fillOpacity: 1 }).addTo(map);
        startMarker = L.marker([track.points[0].lat, track.points[0].lon]).addTo(map).bindPopup('Start');
      } else posMarker.setLatLng([last.lat, last.lon]);
      map.panTo([last.lat, last.lon], { animate: false });
    } catch (e) { /* map optional */ }
  }

  /* ---------------- tracking ---------------- */
  function startRun() {
    if (!('geolocation' in navigator)) { toast('Geolocation not supported'); return; }
    track = { startedAt: Date.now(), pausedMs: 0, pauseStart: null, points: [] };
    setButtons('running');
    toast('GPS tracking… get a clear sky view for best accuracy');
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const acc = pos.coords.accuracy || 999;
        if (acc > 60) return; // ignore low-accuracy fixes
        track.points.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, at: Date.now(), acc: Math.round(acc) });
        updateMap();
      },
      err => { console.warn('[FitLife360] geo error', err); toast('GPS signal issue — keep the app open'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    tickStats();
  }

  function pauseRun() {
    if (!track || track.pauseStart) return;
    track.pauseStart = Date.now();
    setButtons('paused');
    toast('Paused ⏸ — paused time is not counted');
  }
  function resumeRun() {
    if (!track || !track.pauseStart) return;
    track.pausedMs += Date.now() - track.pauseStart;
    track.pauseStart = null;
    setButtons('running');
    toast('Resumed ▶');
    tickStats();
  }

  function stopAll() {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    track = null; map = null; routeLine = null; posMarker = null; startMarker = null;
    go('run', { sub: 'track' });
  }

  function estKcal(km) {
    const w = (Storage.getProfile() || {}).weightKg || 70;
    return Math.round(km * w * 1.03); // ~1.03 kcal per kg per km
  }

  function tickStats() {
    if (!track) return;
    const km = totalKm(track.points);
    const sec = activeSec();
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    const hh = Math.floor(sec / 3600), mm = Math.floor(sec % 3600 / 60), ss = sec % 60;
    set('#rsTime', `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`);
    set('#rsDist', App.units() === 'imperial' ? (km * 0.621371).toFixed(2) + ' mi' : km.toFixed(2) + ' km');
    set('#rsPace', km > 0.01 ? fmtPace(sec / km) : '—');
    set('#rsKcal', estKcal(km));
    setTimeout(tickStats, 1000);
  }

  function setButtons(state) {
    const show = (id, on) => { const el = $(id); if (el) el.classList.toggle('hidden', !on); };
    show('#runStart', state === 'idle');
    show('#runPause', state === 'running');
    show('#runResume', state === 'paused');
    show('#runFinish', state === 'running' || state === 'paused');
    show('#runDiscard', state === 'running' || state === 'paused');
  }

  function finishRun() {
    if (!track) return;
    const km = totalKm(track.points);
    const sec = activeSec();
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    if (km < 0.05 || sec < 10) {
      confirmDialog('Very short run', 'This run is under 50 m / 10 s. Save anyway?', () => {
        saveRun({ distanceKm: km, durationSec: sec, points: track.points, manual: false });
        track = null; toast('Run saved ✓'); go('run', { sub: 'history' });
      }, 'Save anyway');
      return;
    }
    modal('Run summary', `
      <div class="sum-grid">
        <div><strong>${km.toFixed(2)} km</strong><small>distance</small></div>
        <div><strong>${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}</strong><small>active time</small></div>
        <div><strong>${fmtPace(km ? sec / km : 0)}</strong><small>avg pace</small></div>
        <div><strong>${estKcal(km)}</strong><small>kcal (est.)</small></div>
      </div>
      <label class="field">Notes (optional)<input id="runNote" placeholder="e.g. easy morning run"></label>
      <label class="check"><input type="checkbox" id="runKeepRoute" checked> Save route map with this run</label>`,
      [
        { label: 'Discard', kind: 'danger', onClick: () => { track = null; stopAll(); } },
        {
          label: 'Save run ✓', kind: 'primary', onClick: () => {
            const keep = $('#runKeepRoute').checked;
            saveRun({
              distanceKm: Math.round(km * 100) / 100,
              durationSec: sec,
              points: keep ? track.points : [],
              manual: false,
              note: $('#runNote').value.trim()
            });
            track = null; toast('Run saved! 🎉'); go('run', { sub: 'history' });
          }
        }
      ]);
  }

  function saveRun(r) {
    Storage.push(Storage.KEYS.runs, Object.assign({
      id: Storage.uid('run'), date: Storage.todayKey(), at: new Date().toISOString()
    }, r));
  }

  /* ---------------- HISTORY ---------------- */
  function renderHistory(body, params) {
    const runs = Storage.list(Storage.KEYS.runs).sort((a, b) => b.at.localeCompare(a.at));
    const totalKm = runs.reduce((a, r) => a + (r.distanceKm || 0), 0);
    body.innerHTML = `
      <div class="card"><h3>${runs.length} runs · ${totalKm.toFixed(1)} km total</h3>
        <button class="btn ghost small" id="runCsv">⬇ Export CSV</button></div>
      ${runs.slice(0, 40).map(r => `
        <div class="card small"><strong>${r.date}</strong> — ${r.distanceKm.toFixed(2)} km in ${Math.floor(r.durationSec / 60)}m ${r.durationSec % 60}s
          <p class="small muted">pace ${fmtPace(r.durationSec / (r.distanceKm || 1))} ${r.manual ? '· manual entry' : ''} ${r.note ? '· ' + esc(r.note) : ''}</p>
          <div class="row-btns">
            ${r.points && r.points.length ? `<button class="btn ghost small" data-view="${r.id}">🗺 View route</button>` : ''}
            <button class="icon-btn danger" data-del="${r.id}">🗑️</button>
          </div></div>`).join('') || '<p class="muted">No runs yet. Hit Track and go! 🏃</p>'}`;
    $('#runCsv').onclick = () => {
      const rows = [['date', 'distance_km', 'duration_sec', 'avg_pace_sec_per_km', 'manual', 'note']];
      runs.forEach(r => rows.push([r.date, r.distanceKm.toFixed(2), r.durationSec,
        Math.round(r.durationSec / (r.distanceKm || 1)), r.manual ? 'yes' : 'no', r.note || '']));
      DB.downloadFile('fitlife360-runs.csv', DB.toCSV(rows), 'text/csv');
      toast('CSV downloaded ⬇');
    };
    body.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
      confirmDialog('Delete run?', 'Delete this run and its route?', () => {
        Storage.removeById(Storage.KEYS.runs, b.dataset.del); go('run', { sub: 'history' });
      }));
    body.querySelectorAll('[data-view]').forEach(b => b.onclick = () => viewRoute(b.dataset.view));
  }

  function viewRoute(id) {
    const r = Storage.list(Storage.KEYS.runs).find(x => x.id === id);
    if (!r || !r.points || !r.points.length) { toast('No route saved'); return; }
    modal(`Route — ${r.date} (${r.distanceKm.toFixed(2)} km)`,
      '<div id="routeMap" class="map" style="height:300px"></div>',
      [{ label: 'Close', kind: 'ghost' }]);
    ensureLeaflet(ok => {
      const el = $('#routeMap');
      if (!ok || !el || !window.L) { el.innerHTML = '<p class="muted">Map unavailable offline.</p>'; return; }
      try {
        const m = L.map('routeMap').setView([r.points[0].lat, r.points[0].lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
        L.polyline(r.points.map(p => [p.lat, p.lon]), { color: '#34c759', weight: 4 }).addTo(m);
        L.marker([r.points[0].lat, r.points[0].lon]).addTo(m).bindPopup('Start');
        const last = r.points[r.points.length - 1];
        L.marker([last.lat, last.lon]).addTo(m).bindPopup('Finish');
        m.fitBounds(L.polyline(r.points.map(p => [p.lat, p.lon])).getBounds().pad(0.2));
        setTimeout(() => m.invalidateSize(), 300);
      } catch (e) { el.innerHTML = '<p class="muted">Map failed to load.</p>'; }
    });
  }

  /* ---------------- GOALS ---------------- */
  function renderGoals(body) {
    const profile = Storage.getProfile() || {};
    const goals = profile.runGoals || { weeklyKm: 10, perRunKm: 5 };
    const weekStart = Storage.addDays(Storage.todayKey(), -6);
    const weekKm = Storage.list(Storage.KEYS.runs)
      .filter(r => r.date >= weekStart).reduce((a, r) => a + (r.distanceKm || 0), 0);
    body.innerHTML = `
      <div class="card"><h3>🎯 Running goals</h3>
        <div class="row2">
          <label class="field">Weekly distance (km)<input id="gWeek" type="number" step="1" value="${goals.weeklyKm}"></label>
          <label class="field">Per-run target (km)<input id="gRun" type="number" step="1" value="${goals.perRunKm}"></label>
        </div>
        <button class="btn primary" id="gSave">Save goals</button>
        <p class="hint">Increase weekly distance by max ~10% per week. Rest days matter — pain is a stop signal, not a badge.</p></div>
      <div class="card"><h3>This week: ${weekKm.toFixed(1)} / ${goals.weeklyKm} km</h3>
        <div class="pbar big"><div style="width:${Math.min(100, weekKm / goals.weeklyKm * 100)}%"></div></div></div>`;
    $('#gSave').onclick = () => {
      const p = Storage.getProfile();
      p.runGoals = { weeklyKm: Math.max(1, +$('#gWeek').value || 10), perRunKm: Math.max(1, +$('#gRun').value || 5) };
      Storage.saveProfile(p);
      toast('Goals saved 🎯'); go('run', { sub: 'goals' });
    };
  }

  return { havKm, totalKm };
})();
