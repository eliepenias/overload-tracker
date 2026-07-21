import { useRef } from 'react';

// Number input tuned for speed during a workout:
// tapping/focusing selects the whole existing value so typing replaces it immediately.
export default function NumberField({ label, value, placeholder, onChange, filled }) {
  const ref = useRef(null);

  const selectAll = () => {
    // rAF so selection happens after the OS/keyboard focus settles on mobile
    requestAnimationFrame(() => {
      if (ref.current) ref.current.select();
    });
  };

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input
        ref={ref}
        className={`num-input${filled ? ' filled' : ''}`}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onFocus={selectAll}
        onClick={selectAll}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
