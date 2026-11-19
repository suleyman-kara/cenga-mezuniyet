/* vote-core.js - saf oylama mantigi. Tarayicida <script> ile (global VoteCore), Node'da require/import ile. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; module.exports.default = api; }
  else { root.VoteCore = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function ms(x) { // number | {toMillis()} | {seconds,nanoseconds} | Date -> ms ya da null
    if (x == null) return null;
    if (typeof x === 'number') return isFinite(x) ? x : null;
    if (typeof x.toMillis === 'function') return x.toMillis();
    if (x instanceof Date) return x.getTime();
    if (typeof x.seconds === 'number') return x.seconds * 1000 + Math.floor((x.nanoseconds || 0) / 1e6);
    return null;
  }

  // votes: [{o, at}] ; sadece 0<=o<n tamsayi ve at<=closesAt olanlar sayilir.
  function tally(votes, n, closesAtMs) {
    var counts = []; for (var i = 0; i < n; i++) counts.push(0);
    var close = ms(closesAtMs);
    (votes || []).forEach(function (v) {
      if (!v || typeof v.o !== 'number' || !Number.isInteger(v.o) || v.o < 0 || v.o >= n) return;
      var at = ms(v.at);
      if (at === null || close === null || at > close) return;
      counts[v.o]++;
    });
    return counts;
  }

  function pick(len, rng) {
    var i = Math.floor((rng || Math.random)() * len);
    return Math.min(Math.max(i, 0), len - 1);
  }

  // forced gecerliyse o; yoksa en cok oy; esitlikte (sifir oy dahil) esit olanlar arasindan rng ile.
  function pickWinner(counts, opts) {
    opts = opts || {};
    var n = counts.length;
    if (Number.isInteger(opts.forced) && opts.forced >= 0 && opts.forced < n) return opts.forced;
    var max = Math.max.apply(null, counts);
    var top = []; counts.forEach(function (c, i) { if (c === max) top.push(i); });
    return top[pick(top.length, opts.rng)];
  }

  function remainingMs(closesAtMs, nowMs, offsetMs) {
    return Math.max(0, ms(closesAtMs) - (nowMs + (offsetMs || 0)));
  }

  // oturum icinde benzersiz: `${index}_${hash}`; hash 8 karakter base36, "__" ve "/" icermez.
  function makeDecKey(index, opts) {
    var rng = (opts && opts.rng) || Math.random, h = '';
    while (h.length < 8) h += Math.floor(rng() * 36).toString(36);
    return index + '_' + h + (opts && opts.rng ? '' : Date.now().toString(36).slice(-3));
  }

  // motordaki paintVotes: yuvarla, toplam 100'e farki en cok oy alana ekle.
  function percents(counts) {
    var t = counts.reduce(function (a, b) { return a + b; }, 0);
    var p = counts.map(function (x) { return t ? Math.round(x / t * 100) : 0; });
    if (t) { var mx = counts.indexOf(Math.max.apply(null, counts)); p[mx] += 100 - p.reduce(function (a, b) { return a + b; }, 0); }
    return p;
  }

  return { tally: tally, pickWinner: pickWinner, remainingMs: remainingMs, makeDecKey: makeDecKey, percents: percents };
});
