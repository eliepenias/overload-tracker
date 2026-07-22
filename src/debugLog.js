// TEMPORARY diagnostic helper for tracking down the iOS home-screen sign-in
// bounce-back. Logs persist to localStorage (not just console) specifically
// because signInWithRedirect does a full page navigation away and back --
// anything only in memory or console is gone by the time we return.
// Safe to delete this file (and its two call sites in App.jsx / SignIn.jsx)
// once sign-in is confirmed working.

const KEY = 'debug-auth-log';
const MAX_ENTRIES = 40;

export function pushLog(msg) {
  let entries;
  try {
    entries = JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    entries = [];
  }
  const time = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  entries.push(`${time}  ${msg}`);
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors, this is just a diagnostic
  }
}

export function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearLogs() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
