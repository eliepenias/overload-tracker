import { useEffect, useRef } from 'react';

// Wraps a "pushed" screen (Start Workout / Build) with an iOS-style slide-in
// from the right, and plays the reverse slide-out before actually unmounting
// it — driven by the `closing` flag rather than removing children immediately.
export default function PushScreen({ closing, onClosed, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!closing) return;
    const el = ref.current;
    if (!el) { onClosed(); return; }
    let finished = false;
    const finish = () => { if (finished) return; finished = true; onClosed(); };
    el.addEventListener('animationend', finish, { once: true });
    // Safety net in case the animation event doesn't fire (e.g. tab backgrounded mid-close).
    const t = setTimeout(finish, 400);
    return () => { el.removeEventListener('animationend', finish); clearTimeout(t); };
  }, [closing, onClosed]);

  return (
    <div ref={ref} className={`push-screen${closing ? ' push-screen-closing' : ' push-screen-opening'}`}>
      {children}
    </div>
  );
}
