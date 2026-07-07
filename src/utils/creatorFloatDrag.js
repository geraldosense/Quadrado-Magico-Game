const POS_KEY = 'quadrado-magico-creator-pos';
const DRAG_THRESHOLD_MOUSE = 6;
const DRAG_THRESHOLD_TOUCH = 10;

function loadPosition() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePosition(x, y) {
  localStorage.setItem(POS_KEY, JSON.stringify({ x, y }));
}

function getViewport() {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    offsetLeft: vv?.offsetLeft ?? 0,
    offsetTop: vv?.offsetTop ?? 0,
  };
}

function getDefaultPosition(el) {
  const rect = el.getBoundingClientRect();
  const { width, height, offsetLeft, offsetTop } = getViewport();
  const pad = 12;
  const bottomOffset = document.body.classList.contains('view-menu') ? 88 : 16;
  const safeBottom = Math.max(bottomOffset, parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || 0, 10) || pad);
  const safeRight = Math.max(pad, parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)') || 0, 10) || pad);

  return {
    x: offsetLeft + width - rect.width - safeRight,
    y: offsetTop + height - rect.height - safeBottom,
  };
}

function clampPosition(x, y, el) {
  const pad = 8;
  const { width, height, offsetLeft, offsetTop } = getViewport();
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  return {
    x: Math.max(offsetLeft + pad, Math.min(offsetLeft + width - w - pad, x)),
    y: Math.max(offsetTop + pad, Math.min(offsetTop + height - h - pad, y)),
  };
}

function applyPosition(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.right = 'auto';
  el.style.bottom = 'auto';
}

function dragThreshold(pointerType) {
  return pointerType === 'touch' ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
}

export function initCreatorFloatDrag(el, { onTap } = {}) {
  if (!el) return;

  el.classList.add('creator-float--draggable');

  const saved = loadPosition();
  if (saved) {
    applyPosition(el, saved.x, saved.y);
  } else {
    el.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      const pos = getDefaultPosition(el);
      applyPosition(el, pos.x, pos.y);
      el.style.visibility = '';
    });
  }

  const dragZone = el.querySelector('[data-drag-handle]') ?? el;
  let dragging = false;
  let moved = false;
  let activePointerId = null;
  let pointerType = 'mouse';
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  const repositionInViewport = () => {
    const rect = el.getBoundingClientRect();
    const clamped = clampPosition(rect.left, rect.top, el);
    applyPosition(el, clamped.x, clamped.y);
    savePosition(clamped.x, clamped.y);
  };

  const lockScroll = () => {
    document.body.classList.add('creator-float-drag-lock');
  };

  const unlockScroll = () => {
    document.body.classList.remove('creator-float-drag-lock');
  };

  const removeWindowListeners = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
  };

  const finishDrag = () => {
    if (!dragging) return;

    dragging = false;
    activePointerId = null;
    el.classList.remove('creator-float--dragging');
    unlockScroll();
    removeWindowListeners();

    const rect = el.getBoundingClientRect();
    savePosition(rect.left, rect.top);

    if (!moved && onTap) {
      onTap();
    }
  };

  const applyDragDelta = (clientX, clientY, type) => {
    const dx = clientX - startX;
    const dy = clientY - startY;
    const threshold = dragThreshold(type);

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      moved = true;
    }

    if (!moved) return;

    const clamped = clampPosition(originX + dx, originY + dy, el);
    applyPosition(el, clamped.x, clamped.y);
  };

  const onPointerMove = (e) => {
    if (!dragging || e.pointerId !== activePointerId) return;
    if (moved) e.preventDefault();
    applyDragDelta(e.clientX, e.clientY, e.pointerType || pointerType);
  };

  const onPointerUp = (e) => {
    if (!dragging || e.pointerId !== activePointerId) return;
    finishDrag();
  };

  const onTouchMove = (e) => {
    if (!dragging || activePointerId !== 'touch') return;
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    if (moved) e.preventDefault();
    applyDragDelta(touch.clientX, touch.clientY, 'touch');
  };

  const onTouchEnd = (e) => {
    if (!dragging || activePointerId !== 'touch') return;
    const touch = e.changedTouches[0];
    if (touch) applyDragDelta(touch.clientX, touch.clientY, 'touch');
    finishDrag();
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    dragging = true;
    moved = false;
    activePointerId = e.pointerId;
    pointerType = e.pointerType || 'mouse';
    startX = e.clientX;
    startY = e.clientY;

    const rect = el.getBoundingClientRect();
    originX = rect.left;
    originY = rect.top;

    el.classList.add('creator-float--dragging');
    lockScroll();
    dragZone.setPointerCapture?.(e.pointerId);
    e.preventDefault();

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const onTouchStart = (e) => {
    if (dragging || e.touches.length !== 1) return;
    const touch = e.touches[0];

    dragging = true;
    moved = false;
    activePointerId = 'touch';
    pointerType = 'touch';
    startX = touch.clientX;
    startY = touch.clientY;

    const rect = el.getBoundingClientRect();
    originX = rect.left;
    originY = rect.top;

    el.classList.add('creator-float--dragging');
    lockScroll();
    e.preventDefault();

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  };

  dragZone.addEventListener('pointerdown', onPointerDown, { passive: false });

  if (!window.PointerEvent) {
    dragZone.addEventListener('touchstart', onTouchStart, { passive: false });
  }

  dragZone.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onTap?.();
  });

  window.addEventListener('resize', repositionInViewport);
  window.visualViewport?.addEventListener('resize', repositionInViewport);
  window.visualViewport?.addEventListener('scroll', repositionInViewport);

  return () => {
    finishDrag();
    window.removeEventListener('resize', repositionInViewport);
    window.visualViewport?.removeEventListener('resize', repositionInViewport);
    window.visualViewport?.removeEventListener('scroll', repositionInViewport);
    dragZone.removeEventListener('pointerdown', onPointerDown);
    if (!window.PointerEvent) {
      dragZone.removeEventListener('touchstart', onTouchStart);
    }
  };
}

export function resetCreatorFloatPosition(el) {
  if (!el) return;
  localStorage.removeItem(POS_KEY);
  const pos = getDefaultPosition(el);
  applyPosition(el, pos.x, pos.y);
}
