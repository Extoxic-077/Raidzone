/**
 * makeDraggable — enables click-and-drag horizontal scrolling on an element.
 *
 * Usage:
 *   import { makeDraggable } from '../utils/dragScroll.js';
 *   makeDraggable(document.getElementById('deals-scroll'));
 *
 * Adds `.dragging` class while dragging (cursor: grabbing).
 * Suppresses click events on children when the user actually dragged
 * (prevents accidental link/card clicks after a drag gesture).
 */
export function makeDraggable(el) {
  if (!el) return;

  let isDown   = false;
  let startX   = 0;
  let scrollLeft = 0;
  let didDrag  = false;          // true when mouse moved enough to count as a drag

  const DRAG_THRESHOLD = 5;      // px — less than this is treated as a click

  el.addEventListener('mousedown', e => {
    // Ignore right-clicks
    if (e.button !== 0) return;
    isDown     = true;
    didDrag    = false;
    startX     = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    el.classList.add('drag-active');
    e.preventDefault();          // prevent text selection while dragging
  });

  el.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    el.classList.remove('drag-active');
  });

  el.addEventListener('mouseup', () => {
    isDown = false;
    el.classList.remove('drag-active');
  });

  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    const x     = e.pageX - el.offsetLeft;
    const delta = x - startX;

    if (Math.abs(delta) > DRAG_THRESHOLD) {
      didDrag = true;
      el.classList.add('dragging');
    }

    el.scrollLeft = scrollLeft - delta;
  });

  // Suppress click on children when user dragged (not just clicked)
  el.addEventListener('click', e => {
    if (didDrag) {
      e.preventDefault();
      e.stopPropagation();
      didDrag = false;
      el.classList.remove('dragging');
    }
  }, true);  // capture phase so it fires before link handlers
}

/**
 * makeDraggableAll — apply makeDraggable to every matching element.
 *
 * @param {string} selector  CSS selector for scroll containers
 * @param {Element} root     Optional root to search within (default: document)
 */
export function makeDraggableAll(selector, root = document) {
  root.querySelectorAll(selector).forEach(makeDraggable);
}
