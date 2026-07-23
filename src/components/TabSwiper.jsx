import { useEffect, useRef } from 'react';

const TABS = ['home', 'history', 'progress'];
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DURATION = 320;

// Horizontally swipeable container for the three tab-bar screens. All three
// panes stay mounted so switching (by tap or swipe) is instant and stateful —
// this mirrors how native iOS tab-paging apps behave.
export default function TabSwiper({ active, onChange, panes }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, dragging: false, locked: null, dx: 0 });

  const index = TABS.indexOf(active);

  // Animate to the active tab whenever it changes (tap or a completed swipe).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = `transform ${DURATION}ms ${EASE}`;
    track.style.transform = `translate3d(${-index * (100 / TABS.length)}%,0,0)`;
  }, [index]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const width = () => viewport.offsetWidth || 1;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, dragging: true, locked: null, dx: 0 };
    };

    const onTouchMove = (e) => {
      const st = dragRef.current;
      if (!st.dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - st.startX;
      const dy = t.clientY - st.startY;

      if (!st.locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        st.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (st.locked === 'x') track.style.transition = 'none';
      }
      if (st.locked !== 'x') return; // vertical drag — let the pane scroll natively

      e.preventDefault();
      const curIndex = TABS.indexOf(active);
      // Rubber-band past the first/last tab instead of sliding freely.
      let clamped = dx;
      if (curIndex === 0 && dx > 0) clamped = dx * 0.35;
      if (curIndex === TABS.length - 1 && dx < 0) clamped = dx * 0.35;
      st.dx = clamped;

      const basePct = -curIndex * (100 / TABS.length);
      const dragPct = (clamped / width()) * (100 / TABS.length);
      track.style.transform = `translate3d(${basePct + dragPct}%,0,0)`;
    };

    const onTouchEnd = () => {
      const st = dragRef.current;
      if (!st.dragging) return;
      st.dragging = false;
      const curIndex = TABS.indexOf(active);

      if (st.locked === 'x') {
        const threshold = width() * 0.22;
        let nextIndex = curIndex;
        if (st.dx <= -threshold && curIndex < TABS.length - 1) nextIndex = curIndex + 1;
        else if (st.dx >= threshold && curIndex > 0) nextIndex = curIndex - 1;

        track.style.transition = `transform ${DURATION}ms ${EASE}`;
        if (nextIndex !== curIndex) {
          onChange(TABS[nextIndex]);
          return; // the index effect above will land the final transform
        }
        track.style.transform = `translate3d(${-curIndex * (100 / TABS.length)}%,0,0)`;
      }
    };

    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [active, onChange]);

  return (
    <div className="tab-swiper-viewport" ref={viewportRef}>
      <div className="tab-swiper-track" ref={trackRef} style={{ width: `${TABS.length * 100}%` }}>
        {panes.map((pane, i) => (
          <div className="tab-pane" key={TABS[i]} style={{ width: `${100 / TABS.length}%` }}>
            {pane}
          </div>
        ))}
      </div>
    </div>
  );
}
