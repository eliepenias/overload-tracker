import { useState } from 'react';

export default function ExerciseFormSheet({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [sets, setSets] = useState(initial?.sets ?? 3);
  const [repMin, setRepMin] = useState(initial?.repMin ?? 8);
  const [repMax, setRepMax] = useState(initial?.repMax ?? 12);

  const valid = name.trim().length > 0 && sets > 0 && repMin > 0 && repMax >= repMin;

  const submit = () => {
    if (!valid) return;
    onSave({
      name: name.trim(),
      sets: Number(sets),
      repMin: Number(repMin),
      repMax: Number(repMax),
    });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{initial ? 'Edit Exercise' : 'Add Exercise'}</div>

        <div className="form-field">
          <label>Exercise name</label>
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bench Press"
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Sets</label>
            <input
              className="text-input"
              type="number"
              inputMode="numeric"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Min reps</label>
            <input
              className="text-input"
              type="number"
              inputMode="numeric"
              value={repMin}
              onChange={(e) => setRepMin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Max reps</label>
            <input
              className="text-input"
              type="number"
              inputMode="numeric"
              value={repMax}
              onChange={(e) => setRepMax(e.target.value)}
            />
          </div>
        </div>

        <div className="sheet-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={!valid} onClick={submit}>
            {initial ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
}
