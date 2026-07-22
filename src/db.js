// Pure data-shape helpers. No persistence here — persistence is handled by
// src/firebase.js (Firestore, synced per signed-in user).
//
// Schema:
// {
//   version: 1,
//   days: {
//     push: { key, label, color, exercises: [{ id, name, sets, repMin, repMax }] },
//     pull: { ... },
//     legs: { ... }
//   },
//   sessions: [
//     { id, dayKey, dayLabel, date (ISO), entries: [
//         { exerciseId, name, repMin, repMax, sets: [{ weight, reps, done }], skipped }
//     ] }
//   ],
//   youtubeFavorites: {
//     [exerciseName]: [ { videoId, title, channelTitle, thumbnail }, ... ]  // most-recent-first
//   }
// }

const DAY_META = {
  push: { label: 'Push', color: '#ff5a36' },
  pull: { label: 'Pull', color: '#35d0a0' },
  legs: { label: 'Legs', color: '#e8c15a' },
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seedExercise(name, sets, repMin, repMax) {
  return { id: uid(), name, sets, repMin, repMax };
}

function defaultData() {
  return {
    version: 1,
    days: {
      push: {
        key: 'push',
        label: 'Push',
        color: DAY_META.push.color,
        exercises: [
          seedExercise('Bench Press', 4, 8, 12),
          seedExercise('Overhead Press', 3, 8, 10),
          seedExercise('Incline Dumbbell Press', 3, 10, 12),
          seedExercise('Tricep Pushdown', 3, 12, 15),
        ],
      },
      pull: {
        key: 'pull',
        label: 'Pull',
        color: DAY_META.pull.color,
        exercises: [
          seedExercise('Deadlift', 3, 5, 8),
          seedExercise('Pull-Up', 4, 6, 10),
          seedExercise('Barbell Row', 3, 8, 12),
          seedExercise('Bicep Curl', 3, 10, 15),
        ],
      },
      legs: {
        key: 'legs',
        label: 'Legs',
        color: DAY_META.legs.color,
        exercises: [
          seedExercise('Back Squat', 4, 6, 10),
          seedExercise('Romanian Deadlift', 3, 8, 12),
          seedExercise('Leg Press', 3, 10, 15),
          seedExercise('Calf Raise', 4, 12, 20),
        ],
      },
    },
    sessions: [],
    youtubeFavorites: {},
  };
}

// guard against a malformed/partial doc coming back from Firestore
function normalize(raw) {
  if (!raw || !raw.days || !raw.sessions) return defaultData();
  if (!raw.youtubeFavorites) raw.youtubeFavorites = {};
  return raw;
}

// ---------- exercise CRUD (pure — return new data, caller persists it) ----------

function addExercise(data, dayKey, exercise) {
  const next = structuredClone(data);
  next.days[dayKey].exercises.push({
    id: uid(),
    name: exercise.name,
    sets: exercise.sets,
    repMin: exercise.repMin,
    repMax: exercise.repMax,
  });
  return next;
}

function updateExercise(data, dayKey, exerciseId, patch) {
  const next = structuredClone(data);
  const ex = next.days[dayKey].exercises.find((e) => e.id === exerciseId);
  if (ex) Object.assign(ex, patch);
  return next;
}

function deleteExercise(data, dayKey, exerciseId) {
  const next = structuredClone(data);
  next.days[dayKey].exercises = next.days[dayKey].exercises.filter((e) => e.id !== exerciseId);
  return next;
}

function reorderExercise(data, dayKey, index, direction) {
  const next = structuredClone(data);
  const list = next.days[dayKey].exercises;
  const target = index + direction;
  if (target < 0 || target >= list.length) return data;
  [list[index], list[target]] = [list[target], list[index]];
  return next;
}

// ---------- sessions ----------

function saveSession(data, session) {
  const next = structuredClone(data);
  const existingIdx = next.sessions.findIndex((s) => s.id === session.id);
  if (existingIdx >= 0) {
    next.sessions[existingIdx] = session;
  } else {
    next.sessions.push(session);
  }
  return next;
}

function deleteSession(data, sessionId) {
  const next = structuredClone(data);
  next.sessions = next.sessions.filter((s) => s.id !== sessionId);
  return next;
}

// Most recent PRIOR session (before `beforeDate`) containing this exercise name,
// so "previous performance" reflects the last time it was actually performed.
function getPreviousPerformance(data, dayKey, exerciseName, beforeDate) {
  const sessions = data.sessions
    .filter((s) => s.dayKey === dayKey)
    .filter((s) => !beforeDate || new Date(s.date) < new Date(beforeDate))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const session of sessions) {
    const entry = session.entries.find((e) => e.name === exerciseName && !e.skipped);
    if (entry) {
      const completedSets = entry.sets.filter((s) => s.weight !== '' && s.reps !== '');
      if (completedSets.length > 0) {
        return { date: session.date, sets: completedSets };
      }
    }
  }
  return null;
}

// All historical points for an exercise (for charts): one point per session, best set by weight.
function getExerciseHistory(data, exerciseName) {
  const points = [];
  const sorted = [...data.sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const session of sorted) {
    const entry = session.entries.find((e) => e.name === exerciseName && !e.skipped);
    if (!entry) continue;
    const completedSets = entry.sets.filter((s) => s.weight !== '' && s.reps !== '');
    if (completedSets.length === 0) continue;
    const best = completedSets.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
    const totalVolume = completedSets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
    points.push({
      date: session.date,
      weight: Number(best.weight),
      reps: Number(best.reps),
      volume: totalVolume,
    });
  }
  return points;
}

// distinct exercise names that have ever appeared in a session
function getLoggedExerciseNames(data) {
  const names = new Set();
  data.sessions.forEach((s) => s.entries.forEach((e) => {
    if (!e.skipped && e.sets.some((set) => set.weight !== '' && set.reps !== '')) names.add(e.name);
  }));
  return Array.from(names).sort();
}

// ---------- YouTube Shorts favorites (per exercise name) ----------

function getFavoriteVideos(data, exerciseName) {
  return (data.youtubeFavorites && data.youtubeFavorites[exerciseName]) || [];
}

function isVideoFavorited(data, exerciseName, videoId) {
  return getFavoriteVideos(data, exerciseName).some((v) => v.videoId === videoId);
}

// Adds the video to the front of that exercise's favorites list, or removes
// it if it's already favorited. Returns new data (caller persists it).
function toggleFavoriteVideo(data, exerciseName, video) {
  const next = structuredClone(data);
  if (!next.youtubeFavorites) next.youtubeFavorites = {};
  const existing = next.youtubeFavorites[exerciseName] || [];
  const already = existing.some((v) => v.videoId === video.videoId);
  next.youtubeFavorites[exerciseName] = already
    ? existing.filter((v) => v.videoId !== video.videoId)
    : [{ videoId: video.videoId, title: video.title, channelTitle: video.channelTitle, thumbnail: video.thumbnail }, ...existing];
  return next;
}

export {
  uid,
  DAY_META,
  defaultData,
  normalize,
  addExercise,
  updateExercise,
  deleteExercise,
  reorderExercise,
  saveSession,
  deleteSession,
  getPreviousPerformance,
  getExerciseHistory,
  getLoggedExerciseNames,
  getFavoriteVideos,
  isVideoFavorited,
  toggleFavoriteVideo,
};
