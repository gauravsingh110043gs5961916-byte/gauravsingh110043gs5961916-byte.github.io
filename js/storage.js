/* ============================================================
   FitLife 360 — storage.js
   localStorage persistence layer. All data stays on the user's
   own device. No servers, no tracking.
   ============================================================ */
'use strict';

const Storage = (() => {
  const PREFIX = 'fitlife360_';

  const KEYS = {
    profile:      'profile',
    foodEntries:  'food_entries',
    customFoods:  'custom_foods',
    favorites:    'favorite_meals',
    waterLogs:    'water_logs',
    sleepLogs:    'sleep_logs',
    workouts:     'workout_sessions',
    runs:         'run_sessions',
    weightLogs:   'weight_logs',
    journal:      'journal_entries',
    dietPlans:    'diet_plans',
    reminders:    'reminders',
    settings:     'settings',
    onboarding:   'onboarding_done'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[FitLife360] storage read failed for', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[FitLife360] storage write failed for', key, e);
      return false;
    }
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8);
  }

  function todayKey(d) {
    const dt = d instanceof Date ? d : new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return todayKey(d);
  }

  function lastNDays(n) {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push(todayKey(d));
    }
    return out;
  }

  /* ---------- typed helpers ---------- */

  function getProfile() {
    return read(KEYS.profile, null);
  }
  function saveProfile(p) {
    return write(KEYS.profile, p);
  }

  function getSettings() {
    return Object.assign({
      theme: 'dark',
      units: 'metric',        // 'metric' | 'imperial'
      waterGoalMl: 2500,
      geminiApiKey: '',
      notifications: false,
      keepFoodImages: false
    }, read(KEYS.settings, {}));
  }
  function saveSettings(s) {
    return write(KEYS.settings, s);
  }

  function list(key) {
    return read(key, []);
  }
  function push(key, item) {
    const arr = list(key);
    arr.push(item);
    write(key, arr);
    return item;
  }
  function replace(key, arr) {
    return write(key, arr);
  }
  function removeById(key, id) {
    const arr = list(key).filter(x => x.id !== id);
    return write(key, arr);
  }
  function updateById(key, id, patch) {
    const arr = list(key).map(x => x.id === id ? Object.assign({}, x, patch) : x);
    return write(key, arr);
  }

  /* ---------- export / import / wipe ---------- */

  function exportAll() {
    const data = { app: 'FitLife 360', exportedAt: new Date().toISOString(), version: 1 };
    Object.keys(KEYS).forEach(k => { data[k] = read(KEYS[k], null); });
    return data;
  }

  function importAll(data) {
    if (!data || typeof data !== 'object') return false;
    Object.keys(KEYS).forEach(k => {
      if (data[k] !== undefined) write(KEYS[k], data[k]);
    });
    return true;
  }

  function wipeAll() {
    Object.keys(KEYS).forEach(k => {
      try { localStorage.removeItem(PREFIX + KEYS[k]); } catch (e) { /* noop */ }
    });
  }

  return {
    KEYS, read, write, uid, todayKey, addDays, lastNDays,
    getProfile, saveProfile, getSettings, saveSettings,
    list, push, replace, removeById, updateById,
    exportAll, importAll, wipeAll
  };
})();
