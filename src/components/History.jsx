import { useState } from 'react';
import { TrashIcon } from '../icons';

export default function History({ data, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  const sessions = [...data.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <div className="topbar">
        <div className="brand">History<span className="dot">.</span></div>
      </div>
      <main>
        <div className="page-title stencil">Logbook</div>
        <div className="page-sub">Every workout you've saved, in one place.</div>

        {sessions.length === 0 && (
          <div className="empty">
            <div className="stencil">Nothing logged yet</div>
            <div>Finish a workout and it'll show up here.</div>
          </div>
        )}

        {sessions.map((session) => {
          const dayColor = data.days[session.dayKey]?.color || 'var(--accent)';
          const loggedEntries = session.entries.filter((e) => !e.skipped && e.sets.some((s) => s.weight !== '' && s.reps !== ''));
          return (
            <div className="history-item" key={session.id}>
              <div className="history-item-head">
                <div>
                  <div className="day stencil" style={{ color: dayColor }}>{session.dayLabel}</div>
                  <div className="date mono">
                    {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                {confirmId === session.id ? (
                  <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#2a0d0d' }} onClick={() => { onDelete(session.id); setConfirmId(null); }}>
                    Confirm Delete
                  </button>
                ) : (
                  <button className="icon-btn" onClick={() => setConfirmId(session.id)}>
                    <TrashIcon width={15} height={15} />
                  </button>
                )}
              </div>

              {loggedEntries.length === 0 ? (
                <div className="prev-empty" style={{ paddingTop: 10 }}>No sets recorded.</div>
              ) : (
                loggedEntries.map((entry, i) => {
                  const completed = entry.sets.filter((s) => s.weight !== '' && s.reps !== '');
                  return (
                    <div className="history-ex" key={i}>
                      <span>{entry.name}</span>
                      <span className="sets">
                        {completed.map((s) => `${s.weight}×${s.reps}`).join('  ')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </main>
    </>
  );
}
