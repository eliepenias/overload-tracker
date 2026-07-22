import { useState, useMemo } from 'react';
import { BackIcon } from '../icons';
import NumberField from './NumberField';
import ExerciseVideoPanel from './ExerciseVideoPanel';
import { getPreviousPerformance, getFavoriteVideos, uid } from '../db';

function buildInitialEntries(day) {
  return day.exercises.map((ex) => ({
    exerciseId: ex.id,
    name: ex.name,
    repMin: ex.repMin,
    repMax: ex.repMax,
    skipped: false,
    sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: '' })),
  }));
}

export default function ActiveWorkout({ data, dayKey, existingSession, onFinish, onCancel, onToggleFavoriteVideo }) {
  const day = data.days[dayKey];
  const [entries, setEntries] = useState(() => existingSession?.entries || buildInitialEntries(day));
  const sessionDate = existingSession?.date || new Date().toISOString();
  const sessionId = useMemo(() => existingSession?.id || uid(), [existingSession]);

  const updateSet = (exIdx, setIdx, field, value) => {
    setEntries((prev) => {
      const next = structuredClone(prev);
      next[exIdx].sets[setIdx][field] = value;
      next[exIdx].skipped = false;
      return next;
    });
  };

  const toggleSkip = (exIdx) => {
    setEntries((prev) => {
      const next = structuredClone(prev);
      next[exIdx].skipped = !next[exIdx].skipped;
      return next;
    });
  };

  const applyPrevToSet = (exIdx, setIdx, prevSet) => {
    setEntries((prev) => {
      const next = structuredClone(prev);
      next[exIdx].sets[setIdx].weight = prevSet.weight;
      next[exIdx].sets[setIdx].reps = prevSet.reps;
      next[exIdx].skipped = false;
      return next;
    });
  };

  const loggedSetCount = entries.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.weight !== '' && s.reps !== '').length,
    0
  );

  const handleFinish = () => {
    onFinish({
      id: sessionId,
      dayKey: day.key,
      dayLabel: day.label,
      date: sessionDate,
      entries,
    });
  };

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onCancel}><BackIcon width={18} height={18} /></button>
        <div className="brand">{day.label}<span className="dot">.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <main>
        <div className="page-title stencil">Log It</div>
        <div className="page-sub mono">
          {new Date(sessionDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {loggedSetCount} set{loggedSetCount !== 1 ? 's' : ''} logged
        </div>

        {entries.map((entry, exIdx) => {
          const prev = getPreviousPerformance(data, dayKey, entry.name, existingSession ? sessionDate : undefined);
          return (
            <div className={`ex-card${entry.skipped ? ' skipped' : ''}`} key={entry.exerciseId}>
              <div className="ex-card-head">
                <div>
                  <div className="name stencil">{entry.name}</div>
                  <div className="target">Target: {entry.repMin}-{entry.repMax} reps</div>
                </div>
                <ExerciseVideoPanel
                  exerciseName={entry.name}
                  favorites={getFavoriteVideos(data, entry.name)}
                  onToggleFavorite={(video) => onToggleFavoriteVideo(entry.name, video)}
                />
              </div>

              <div className="eyebrow" style={{ marginBottom: 6 }}>Previous</div>
              {prev ? (
                <div className="prev-strip">
                  {prev.sets.map((s, i) => (
                    <button
                      key={i}
                      className="prev-chip"
                      onClick={() => applyPrevToSet(exIdx, i, s)}
                      title="Tap to copy into today's set"
                    >
                      <span className="w">{s.weight}</span> lbs × {s.reps}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="prev-empty" style={{ marginBottom: 14 }}>No previous data yet — this is set one.</div>
              )}

              {!entry.skipped && entry.sets.map((set, setIdx) => (
                <div className="set-row" key={setIdx}>
                  <div className="set-idx mono">{setIdx + 1}</div>
                  <NumberField
                    label="Weight"
                    value={set.weight}
                    placeholder="0"
                    filled={set.weight !== ''}
                    onChange={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                  />
                  <NumberField
                    label="Reps"
                    value={set.reps}
                    placeholder="0"
                    filled={set.reps !== ''}
                    onChange={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                  />
                </div>
              ))}

              <div className="ex-card-foot">
                <button className="link-btn" onClick={() => toggleSkip(exIdx)}>
                  {entry.skipped ? 'Include this exercise' : 'Skip this exercise'}
                </button>
              </div>
            </div>
          );
        })}

        <button className="btn btn-primary btn-block" onClick={handleFinish} style={{ marginTop: 6 }}>
          Save Workout
        </button>
        <div className="page-sub" style={{ textAlign: 'center', marginTop: 10 }}>
          You can save without finishing every exercise.
        </div>
      </main>
    </>
  );
}
