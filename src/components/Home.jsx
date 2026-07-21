import { EditIcon, LogoutIcon } from '../icons';

export default function Home({ data, user, onStart, onBuild, onSignOut }) {
  const days = Object.values(data.days);

  const lastDone = (dayKey) => {
    const sessions = data.sessions
      .filter((s) => s.dayKey === dayKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sessions.length === 0) return 'Not logged yet';
    const d = new Date(sessions[0].date);
    return `Last: ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  return (
    <>
      <div className="topbar">
        <div className="brand">OVERLOAD<span className="dot">.</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Account'}
              style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--iron)' }}
              referrerPolicy="no-referrer"
            />
          )}
          <button className="icon-btn" onClick={onSignOut} title="Sign out">
            <LogoutIcon width={16} height={16} />
          </button>
        </div>
      </div>
      <main>
        <div className="page-title stencil">Today's Lift</div>
        <div className="page-sub">Pick a day. Push the weight up.</div>

        {days.map((day) => (
          <div className="day-card" key={day.key}>
            <div className="bar" style={{ background: day.color }} />
            <div className="label stencil">{day.label}</div>
            <div className="meta">
              {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''} · {lastDone(day.key)}
            </div>
            <div className="cta">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={day.exercises.length === 0}
                onClick={() => onStart(day.key)}
              >
                Start Workout
              </button>
              <button className="btn btn-ghost" onClick={() => onBuild(day.key)}>
                <EditIcon width={15} height={15} /> Build
              </button>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
