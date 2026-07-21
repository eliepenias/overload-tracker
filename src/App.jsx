import { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';
import { useCloudData } from './useCloudData';
import * as db from './db';
import Home from './components/Home';
import WorkoutBuilder from './components/WorkoutBuilder';
import ActiveWorkout from './components/ActiveWorkout';
import History from './components/History';
import Progress from './components/Progress';
import SignIn from './SignIn';
import { HomeIcon, HistoryIcon, ChartIcon } from './icons';

// view = { name: 'home' | 'build' | 'active' | 'history' | 'progress', dayKey?, session? }

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  const [authError, setAuthError] = useState(null);
  const [view, setView] = useState({ name: 'home' });
  const [tab, setTab] = useState('home');

  useEffect(() => {
    if (!firebaseConfigured) { setUser(null); return; }

    // Completes the sign-in if we just came back from a redirect (e.g. Google auth).
    // onAuthStateChanged below will also fire once this resolves, but checking the
    // result directly lets us surface a clear error if the redirect itself failed
    // (e.g. the domain isn't in Firebase's authorized domains list).
    getRedirectResult(auth).catch((err) => {
      console.error('Redirect sign-in failed:', err);
      setAuthError(err.code || 'Sign-in failed. Please try again.');
    });

    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const { data, loading, mutate } = useCloudData(user);

  const goTab = (t) => { setTab(t); setView({ name: t }); };

  const handleAddExercise = useCallback((dayKey, ex) => {
    mutate((prev) => db.addExercise(prev, dayKey, ex));
  }, [mutate]);
  const handleUpdateExercise = useCallback((dayKey, id, patch) => {
    mutate((prev) => db.updateExercise(prev, dayKey, id, patch));
  }, [mutate]);
  const handleDeleteExercise = useCallback((dayKey, id) => {
    mutate((prev) => db.deleteExercise(prev, dayKey, id));
  }, [mutate]);
  const handleReorder = useCallback((dayKey, index, dir) => {
    mutate((prev) => db.reorderExercise(prev, dayKey, index, dir));
  }, [mutate]);
  const handleFinishWorkout = useCallback((session) => {
    mutate((prev) => db.saveSession(prev, session));
    setTab('home');
    setView({ name: 'home' });
  }, [mutate]);
  const handleDeleteSession = useCallback((sessionId) => {
    mutate((prev) => db.deleteSession(prev, sessionId));
  }, [mutate]);
  const handleSignOut = useCallback(() => { signOut(auth); }, []);

  // still resolving auth state
  if (user === undefined) {
    return (
      <div className="app-shell">
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="eyebrow">Loading&hellip;</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <SignIn error={authError} />;
  }

  if (loading || !data) {
    return (
      <div className="app-shell">
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="eyebrow">Syncing your data&hellip;</div>
        </main>
      </div>
    );
  }

  let screen;
  if (view.name === 'build') {
    screen = (
      <WorkoutBuilder
        data={data}
        dayKey={view.dayKey}
        onBack={() => { setTab('home'); setView({ name: 'home' }); }}
        onAdd={handleAddExercise}
        onUpdate={handleUpdateExercise}
        onDelete={handleDeleteExercise}
        onReorder={handleReorder}
      />
    );
  } else if (view.name === 'active') {
    screen = (
      <ActiveWorkout
        data={data}
        dayKey={view.dayKey}
        onFinish={handleFinishWorkout}
        onCancel={() => { setTab('home'); setView({ name: 'home' }); }}
      />
    );
  } else if (tab === 'history') {
    screen = <History data={data} onDelete={handleDeleteSession} />;
  } else if (tab === 'progress') {
    screen = <Progress data={data} />;
  } else {
    screen = (
      <Home
        data={data}
        user={user}
        onStart={(dayKey) => setView({ name: 'active', dayKey })}
        onBuild={(dayKey) => setView({ name: 'build', dayKey })}
        onSignOut={handleSignOut}
      />
    );
  }

  const showTabbar = view.name !== 'build' && view.name !== 'active';

  return (
    <div className="app-shell">
      {screen}
      {showTabbar && (
        <nav className="tabbar">
          <button className={`tab${tab === 'home' ? ' active' : ''}`} onClick={() => goTab('home')}>
            <HomeIcon />
            Home
          </button>
          <button className={`tab${tab === 'history' ? ' active' : ''}`} onClick={() => goTab('history')}>
            <HistoryIcon />
            History
          </button>
          <button className={`tab${tab === 'progress' ? ' active' : ''}`} onClick={() => goTab('progress')}>
            <ChartIcon />
            Progress
          </button>
        </nav>
      )}
    </div>
  );
}
