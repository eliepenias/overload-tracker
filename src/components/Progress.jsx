import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot } from 'recharts';
import { getExerciseHistory, getLoggedExerciseNamesByDay, DAY_META } from '../db';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function CustomDot(props) {
  const { cx, cy, index, dataLength } = props;
  const isLast = index === dataLength - 1;
  return (
    <Dot cx={cx} cy={cy} r={isLast ? 5 : 3.5} fill={isLast ? '#ff5a36' : '#35d0a0'} stroke="none" />
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{
      background: '#1e1c19', border: '1px solid #3a3733', borderRadius: 8,
      padding: '8px 10px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12,
    }}>
      <div style={{ color: '#9a938a' }}>{fmtDate(p.date)}</div>
      <div style={{ color: '#f0ede6', fontWeight: 600 }}>{p.weight} lbs × {p.reps}</div>
    </div>
  );
}

export default function Progress({ data }) {
  const grouped = useMemo(() => getLoggedExerciseNamesByDay(data), [data]);
  const exerciseNames = useMemo(
    () => Object.keys(DAY_META).flatMap((key) => grouped[key]),
    [grouped]
  );
  const [selected, setSelected] = useState(exerciseNames[0] || null);

  const active = selected && exerciseNames.includes(selected) ? selected : exerciseNames[0];
  const history = active ? getExerciseHistory(data, active) : [];
  const chartData = history.map((h) => ({ ...h, dataLength: history.length }));

  const best = history.length ? Math.max(...history.map((h) => h.weight)) : null;
  const first = history[0];
  const last = history[history.length - 1];
  const trendUp = first && last && last.weight > first.weight;

  return (
    <>
      <div className="topbar">
        <div className="brand">Progress<span className="dot">.</span></div>
      </div>
      <main>
        <div className="page-title stencil">The Climb</div>
        <div className="page-sub">Track strength gains, exercise by exercise.</div>

        {exerciseNames.length === 0 ? (
          <div className="empty">
            <div className="stencil">No data yet</div>
            <div>Log a few workouts to see your progress graph.</div>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label>Exercise</label>
              <select
                className="select-input"
                value={active || ''}
                onChange={(e) => setSelected(e.target.value)}
              >
                {Object.keys(DAY_META).map((key) => (
                  grouped[key].length > 0 && (
                    <optgroup key={key} label={DAY_META[key].label}>
                      {grouped[key].map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>
            </div>

            <div className="chart-wrap">
              <div className="chart-head">
                <div className="name stencil">{active}</div>
                {best !== null && <div className="best mono">PR: {best} lbs</div>}
              </div>

              {history.length < 2 ? (
                <div className="prev-empty" style={{ padding: '30px 8px 20px' }}>
                  Log this exercise at least twice to see a trend line.
                </div>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 10, right: 14, bottom: 0, left: -14 }}>
                      <CartesianGrid stroke="#2a2825" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        stroke="#635d55"
                        tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#3a3733' }}
                      />
                      <YAxis
                        stroke="#635d55"
                        tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={38}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3a3733' }} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#ff5a36"
                        strokeWidth={2.5}
                        dot={<CustomDot />}
                        activeDot={{ r: 6, fill: '#ff5a36' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {first && last && history.length >= 2 && (
                <div style={{ padding: '4px 8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="eyebrow">{fmtDate(first.date)} &rarr; {fmtDate(last.date)}</span>
                  <span className={`delta ${trendUp ? 'up' : last.weight < first.weight ? 'down' : 'flat'}`}>
                    {last.weight > first.weight ? '+' : ''}{(last.weight - first.weight).toFixed(1)} lbs
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
