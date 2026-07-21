import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { defaultData, normalize } from './db';

// One document per user holds the entire workout log (days + sessions).
// Small enough (well under Firestore's 1MB doc limit) for a personal tracker,
// and it lets us reuse the same pure db.js transforms we already had.
function userDocRef(uid) {
  return doc(db, 'users', uid);
}

export function useCloudData(user) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    uidRef.current = user.uid;
    setLoading(true);
    const ref = userDocRef(user.uid);

    // Seed the doc on first-ever sign-in for this user.
    getDoc(ref).then((snap) => {
      if (!snap.exists()) {
        setDoc(ref, defaultData());
      }
    });

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(normalize(snap.data()));
      }
      setLoading(false);
    }, (err) => {
      console.error('Firestore sync error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Apply a pure transform (from db.js) and persist the result.
  // Optimistic local update first so the UI feels instant even before the
  // write round-trips (Firestore's offline cache will queue it if needed).
  const mutate = useCallback((transformFn) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = transformFn(prev);
      if (uidRef.current) {
        setDoc(userDocRef(uidRef.current), next).catch((err) => {
          console.error('Failed to save to Firestore:', err);
        });
      }
      return next;
    });
  }, []);

  return { data, loading, mutate };
}
