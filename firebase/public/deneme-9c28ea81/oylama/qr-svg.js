/* qr-svg.js - qrSvg(url) -> SVG string. Tarayici: <script src="vendor/qr.js"> sonra bu dosya (global QrSvg). Node: require. */
(function (root, factory) {
  var qrcode = (typeof module === 'object' && module.exports) ? require('./vendor/qr.js') : root.qrcode;
  var api = factory(qrcode);
  if (typeof module === 'object' && module.exports) { module.exports = api; module.exports.default = api; }
  else { root.QrSvg = api; }
})(typeof self !== 'undefined' ? self : this, function (qrcode) {
  'use strict';
  // Hata duzeltme M: projektor/telefon kamerasi icin dengeli; sessiz bolge 4 modul; siyah modul beyaz zeminde.
  function qrSvg(url, opts) {
    if (typeof url !== 'string' || !url) throw new Error('qrSvg: url gerekli');
    var quiet = (opts && opts.quiet != null) ? opts.quiet : 4;
    var qr = qrcode(0, (opts && opts.ecc) || 'M');
    qr.addData(url); qr.make();
    var n = qr.getModuleCount(), S = n + quiet * 2, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (qr.isDark(y, x)) d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + S + ' ' + S + '" shape-rendering="crispEdges">' +
      '<rect width="' + S + '" height="' + S + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }
  return { qrSvg: qrSvg };
});
