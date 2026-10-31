(function () {
  if (window.__A12_VTON_WIDGET_LOADED__) return;
  window.__A12_VTON_WIDGET_LOADED__ = true;
  var ORIGIN = 'https://a12.uz';
  function injectButtons() {
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.dataset.a12Pinned || img.width < 120 || img.height < 120) continue;
      img.dataset.a12Pinned = '1';
      var btn = document.createElement('a');
      btn.href = ORIGIN + '/?try=1';
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.textContent = '✨ A12 Try-On';
      btn.style.cssText =
        'position:absolute;top:10px;right:10px;z-index:999;padding:6px 12px;border-radius:999px;background:#fffffc;color:#170404;border:1px solid rgba(23,4,4,0.18);font:500 12px/1 sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);';
      var parent = img.parentElement;
      if (parent) {
        if (getComputedStyle(parent).position === 'static') {
          parent.style.position = 'relative';
        }
        parent.appendChild(btn);
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButtons);
  } else {
    injectButtons();
  }
})();
