(function () {
  if (window.__A12_VTON_WIDGET_LOADED__) return;
  window.__A12_VTON_WIDGET_LOADED__ = true;
  var script = document.currentScript;
  // The bookmark preview has no script tag, so it sets __A12_ORIGIN__ before running this code
  var ORIGIN = window.__A12_ORIGIN__ || (script && script.src ? new URL(script.src).origin : 'https://a12.uz');
  // Shop key from the dashboard: <script src=".../a12.js" data-store="KEY">; counts try-ons against its plan
  var STORE = (script && script.getAttribute('data-store')) || window.__A12_STORE__ || '';
  var MIN_SIZE = 120;
  var scanTimer = null;

  function garmentUrl(img) {
    var src = img.currentSrc || img.src || '';
    return /^https:\/\//i.test(src) ? src : '';
  }

  function openTryOn(img, e) {
    e.preventDefault();
    e.stopPropagation();
    var url = ORIGIN + '/?try=1&garment=' + encodeURIComponent(garmentUrl(img)) + (STORE ? '&store=' + encodeURIComponent(STORE) : '');
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function injectButtons() {
    scanTimer = null;
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.dataset.a12Pinned || img.width < MIN_SIZE || img.height < MIN_SIZE || !garmentUrl(img)) continue;
      var parent = img.parentElement;
      if (!parent) continue;
      img.dataset.a12Pinned = '1';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '✨ Try-On';
      btn.setAttribute('aria-label', 'Try this on with your camera');
      btn.style.cssText =
        'position:absolute;top:10px;right:10px;z-index:999;padding:6px 12px;margin:0;border-radius:999px;background:#fffffc;color:#170404;border:1px solid rgba(23,4,4,0.18);font:500 12px/1 sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.15);';
      btn.addEventListener('click', openTryOn.bind(null, img));
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      parent.appendChild(btn);
    }
  }

  // Product grids load lazily and change on client-side navigation, so rescan when the page changes
  function scheduleScan() {
    if (!scanTimer) scanTimer = setTimeout(injectButtons, 300);
  }

  function start() {
    injectButtons();
    new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('load', scheduleScan, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
