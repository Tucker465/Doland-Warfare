// Print button for the water-hunt sheet.
//
// Its own file rather than the site's main script.js: that file is ~45KB of
// trap blueprints and nav behaviour this page has no use for. Kept out of an
// inline <script> because the site's CSP is script-src 'self'.
//
// The button ships hidden and is only revealed here, so a browser without
// JavaScript never shows a control that would do nothing — the browser's own
// print command still works fine there.
(function () {
  var btn = document.getElementById('printBtn');
  if (!btn || typeof window.print !== 'function') return;
  btn.hidden = false;
  btn.addEventListener('click', function () { window.print(); });
})();
