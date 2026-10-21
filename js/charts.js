/* ============================================================
   FitLife 360 — charts.js
   Canvas-drawn charts: progress rings, bar charts, line charts.
   Zero external dependencies. Respects current theme.
   ============================================================ */
'use strict';

const Charts = (() => {

  function themeColors() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      dark,
      text: dark ? '#e8eaed' : '#1a1d21',
      muted: dark ? '#9aa0a6' : '#5f6368',
      grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      track: dark ? '#2a2e35' : '#e3e6ea',
      green: '#34c759',
      blue: '#3b82f6',
      orange: '#f59e0b',
      red: '#ef4444',
      purple: '#8b5cf6'
    };
  }

  function setupCanvas(canvas, height) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    canvas.style.height = height + 'px';
    canvas.style.width = '100%';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w, h: height };
  }

  /* Progress ring: value 0..1 */
  function ring(canvas, value, opts) {
    opts = opts || {};
    const size = opts.size || 120;
    const line = opts.line || 12;
    const { ctx } = setupCanvas(canvas, size);
    const c = themeColors();
    const cx = canvas.clientWidth / 2, cy = size / 2, r = cy - line - 4;
    const v = Math.max(0, Math.min(1, value));
    ctx.lineWidth = line; ctx.lineCap = 'round';
    ctx.strokeStyle = c.track;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = opts.color || c.green;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(opts.label || Math.round(v * 100) + '%', cx, cy);
    if (opts.sub) {
      ctx.fillStyle = c.muted; ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(opts.sub, cx, cy + 20);
    }
  }

  /* Bar chart: labels[], values[], colors[] */
  function bars(canvas, labels, values, opts) {
    opts = opts || {};
    const { ctx, w, h } = setupCanvas(canvas, opts.height || 180);
    const c = themeColors();
    const padL = 34, padB = 26, padT = 10, padR = 8;
    const max = Math.max(...values, 1);
    ctx.strokeStyle = c.grid; ctx.fillStyle = c.muted;
    ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'right';
    for (let g = 0; g <= 3; g++) {
      const y = padT + (h - padT - padB) * (1 - g / 3);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillText(Math.round(max * g / 3).toString(), padL - 6, y + 3);
    }
    const n = values.length;
    const slot = (w - padL - padR) / Math.max(n, 1);
    const bw = Math.min(34, slot * 0.55);
    ctx.textAlign = 'center';
    values.forEach((v, i) => {
      const bh = (h - padT - padB) * (v / max);
      const x = padL + slot * i + slot / 2 - bw / 2;
      const y = h - padB - bh;
      ctx.fillStyle = (opts.colors && opts.colors[i]) || c.green;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, Math.max(bh, 2), 4); else ctx.rect(x, y, bw, Math.max(bh, 2));
      ctx.fill();
      ctx.fillStyle = c.muted;
      ctx.fillText(String(labels[i]).slice(0, 6), padL + slot * i + slot / 2, h - 8);
    });
  }

  /* Line chart: labels[], series[{name, values, color}] */
  function lines(canvas, labels, series, opts) {
    opts = opts || {};
    const { ctx, w, h } = setupCanvas(canvas, opts.height || 180);
    const c = themeColors();
    const padL = 36, padB = 26, padT = 14, padR = 8;
    const all = series.flatMap(s => s.values);
    const max = Math.max(...all, 1), min = Math.min(...all, 0);
    const span = Math.max(max - min, 1);
    ctx.strokeStyle = c.grid; ctx.fillStyle = c.muted;
    ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'right';
    for (let g = 0; g <= 3; g++) {
      const y = padT + (h - padT - padB) * (1 - g / 3);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillText(Math.round(min + span * g / 3).toString(), padL - 6, y + 3);
    }
    const n = labels.length;
    const xAt = i => padL + (w - padL - padR) * (n === 1 ? 0.5 : i / (n - 1));
    const yAt = v => padT + (h - padT - padB) * (1 - (v - min) / span);
    series.forEach(s => {
      ctx.strokeStyle = s.color || c.green; ctx.lineWidth = 2.5;
      ctx.beginPath();
      s.values.forEach((v, i) => { i ? ctx.lineTo(xAt(i), yAt(v)) : ctx.moveTo(xAt(i), yAt(v)); });
      ctx.stroke();
      ctx.fillStyle = s.color || c.green;
      s.values.forEach((v, i) => { ctx.beginPath(); ctx.arc(xAt(i), yAt(v), 3, 0, Math.PI * 2); ctx.fill(); });
    });
    ctx.fillStyle = c.muted; ctx.textAlign = 'center';
    labels.forEach((l, i) => ctx.fillText(String(l).slice(0, 6), xAt(i), h - 8));
    // legend
    let lx = padL;
    ctx.textAlign = 'left';
    series.forEach(s => {
      ctx.fillStyle = s.color || c.green;
      ctx.fillRect(lx, 2, 10, 10);
      ctx.fillStyle = c.text;
      ctx.fillText(s.name, lx + 14, 11);
      lx += ctx.measureText(s.name).width + 30;
    });
  }

  function emptyState(canvas, message) {
    const { ctx, w, h } = setupCanvas(canvas, 120);
    const c = themeColors();
    ctx.fillStyle = c.muted; ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(message || 'No data yet — log something to see it here.', w / 2, h / 2);
  }

  return { ring, bars, lines, emptyState, themeColors };
})();
