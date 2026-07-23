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
import TabSwiper from './components/TabSwiper';
import PushScreen from './components/PushScreen';
import SignIn from './SignIn';
import { HomeIcon, HistoryIcon, ChartIcon } from './icons';

// overlay = { type: 'active' | 'build', dayKey, session? } | null
// A pushed screen (Start Workout / Build) layered on top of the swipeable
// Home/History/Progress tabs, animated in and out like an iOS nav push.

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  const [authError, setAuthError] = useState(null);
  const [tab, setTab] = useState('home');
  const [overlay, setOverlay] = useState(null);
  const [overlayClosing, setOverlayClosing] = useState(false);

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

  const openActive = useCallback((dayKey) => { setOverlayClosing(false); setOverlay({ type: 'active', dayKey }); }, []);
  const openBuild = useCallback((dayKey) => { setOverlayClosing(false); setOverlay({ type: 'build', dayKey }); }, []);
  const requestCloseOverlay = useCallback(() => setOverlayClosing(true), []);
  const handleOverlayClosed = useCallback(() => { setOverlay(null); setOverlayClosing(false); }, []);

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
    requestCloseOverlay();
  }, [mutate, requestCloseOverlay]);
  const handleDeleteSession = useCallback((sessionId) => {
    mutate((prev) => db.deleteSession(prev, sessionId));
  }, [mutate]);
  const handleToggleFavoriteVideo = useCallback((exerciseName, video) => {
    mutate((prev) => db.toggleFavoriteVideo(prev, exerciseName, video));
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

  return (
    <div className="app-shell">
      <TabSwiper
        active={tab}
        onChange={setTab}
        panes={[
          <Home data={data} user={user} onStart={openActive} onBuild={openBuild} onSignOut={handleSignOut} />,
          <History data={data} onDelete={handleDeleteSession} />,
          <Progress data={data} />,
        ]}
      />

      {overlay && (
        <PushScreen closing={overlayClosing} onClosed={handleOverlayClosed}>
          {overlay.type === 'build' && (
            <WorkoutBuilder
              data={data}
              dayKey={overlay.dayKey}
              onBack={requestCloseOverlay}
              onAdd={handleAddExercise}
              onUpdate={handleUpdateExercise}
              onDelete={handleDeleteExercise}
              onReorder={handleReorder}
            />
          )}
          {overlay.type === 'active' && (
            <ActiveWorkout
              data={data}
              dayKey={overlay.dayKey}
              existingSession={overlay.session}
              onFinish={handleFinishWorkout}
              onCancel={requestCloseOverlay}
              onToggleFavoriteVideo={handleToggleFavoriteVideo}
            />
          )}
        </PushScreen>
      )}

      <nav className="tabbar">
        <button className={`tab${tab === 'home' ? ' active' : ''}`} onClick={() => setTab('home')}>
          <HomeIcon />
          Home
        </button>
        <button className={`tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          <HistoryIcon />
          History
        </button>
        <button className={`tab${tab === 'progress' ? ' active' : ''}`} onClick={() => setTab('progress')}>
          <ChartIcon />
          Progress
        </button>
      </nav>
    </div>
  );
}
