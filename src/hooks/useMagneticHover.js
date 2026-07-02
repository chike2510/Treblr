import { useRef, useCallback, useEffect } from 'react';

// Magnetic hover: element gently pulls toward the pointer, springs back on leave.
// Pointer-only (mouse/pen) — mobile touch just skips it gracefully, no listeners fire.
// Usage: const m = useMagneticHover(14); <div ref={m.ref} {...m.handlers}>
export function useMagneticHover(strength = 14) {
  const ref = useRef(null);

  const onPointerMove = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left - rect.width / 2) / rect.width) * strength;
    const py = ((e.clientY - rect.top - rect.height / 2) / rect.height) * strength;
    el.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
  }, [strength]);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0px, 0px)';
  }, []);

  return { ref, handlers: { onPointerMove, onPointerLeave } };
}

// Lightweight count-up for headline numbers. Animates from the previous
// numeric value to the next whenever `value` changes. Pass `format` to
// render the eased intermediate number (e.g. with K/M suffixes).
export function useCountUp(value, { duration = 700, format } = {}) {
  const ref = useRef(null);
  const prevRef = useRef(value);
  const rafRef = useRef(null);
  const fmtFn = format || ((n) => String(n));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = prevRef.current ?? value;
    const to = value;
    if (from === to) { node.textContent = fmtFn(to); return undefined; }
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(from + (to - from) * eased);
      node.textContent = fmtFn(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return ref;
}
