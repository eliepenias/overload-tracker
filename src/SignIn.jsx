import { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider, firebaseConfigured } from './firebase';

// True when launched from the home-screen icon (iOS standalone) rather than
// a regular Safari tab. navigator.standalone is the iOS-specific signal;
// the media query is the cross-browser equivalent.
function isStandalone() {
  return (
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
  );
}

export default function SignIn({ error }) {
  const [localError, setLocalError] = useState(null);

  const handleSignIn = async () => {
    setLocalError(null);

    if (isStandalone()) {
      // Installed home-screen app: signInWithPopup's window.open() breaks out
      // to a separate Safari instance on iOS, losing the channel back to this
      // page. signInWithRedirect's plain top-level navigation stays inside
      // the app's own context instead.
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (err) {
        console.error('Sign-in failed:', err);
        setLocalError(err.code || 'Sign-in failed. Please try again.');
      }
      return;
    }

    // Regular browser tab: popup avoids the Safari 16.1+ bug where
    // getRedirectResult() can silently come back empty after a redirect trip.
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed/dismissed it — not a real error, don't show anything.
        return;
      }
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (err2) {
          console.error('Sign-in failed:', err2);
          setLocalError(err2.code || 'Sign-in failed. Please try again.');
        }
        return;
      }
      console.error('Sign-in failed:', err);
      setLocalError(err.code || 'Sign-in failed. Please try again.');
    }
  };

  const shownError = error || localError;

  return (
    <div className="app-shell">
      <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="brand" style={{ justifyContent: 'center', fontSize: 44 }}>OVERLOAD<span className="dot">.</span></div>
          <div className="page-sub" style={{ marginTop: 8 }}>Sign in to sync your workouts across every device.</div>
        </div>

        {shownError && (
          <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, color: 'var(--danger)' }}>
              Sign-in failed: {shownError}. If you're using the home-screen app, make sure this domain is added under Firebase Authentication &rarr; Settings &rarr; Authorized domains.
            </div>
          </div>
        )}

        {!firebaseConfigured ? (
          <div className="card" style={{ borderColor: 'var(--danger)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>Firebase not configured yet</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Add your Firebase project's web config to <code className="mono">src/firebase.js</code>,
              enable Google sign-in and Firestore in the Firebase console, then reload. See the README for step-by-step setup.
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-block" onClick={handleSignIn} style={{ padding: '14px 16px' }}>
            <GoogleIcon />
            Sign in with Google
          </button>
        )}
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 2 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.3C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.3 5.3C39.9 36.5 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}
