/**
 * A12 Anywear Chrome/Edge Universal Drag-and-Drop Content Script
 * Detects dragged product images on any e-commerce store and streams them
 * directly into the floating A12 Live Video Mirror overlay.
 */
(() => {
  if (window.__A12_ANYWEAR_INJECTED__) return;
  window.__A12_ANYWEAR_INJECTED__ = true;

  document.addEventListener('dragstart', (event) => {
    const target = event.target;
    if (target && target.tagName === 'IMG' && target.src) {
      event.dataTransfer?.setData('application/x-a12-garment-img', target.src);
      event.dataTransfer?.setData('application/x-a12-source-url', window.location.href);
    }
  });
})();

