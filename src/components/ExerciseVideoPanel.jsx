import { useState } from 'react';
import { YoutubeIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { searchExerciseShorts, youtubeConfigured } from '../youtube';

// Expandable "watch a demo" panel for one exercise. Favorited videos for this
// exercise always load first; Previous/Next then walks through fresh search
// results, paging the YouTube API for more as needed.
export default function ExerciseVideoPanel({ exerciseName, favorites, onToggleFavorite }) {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const fetchMore = async (knownIds, pageToken) => {
    setLoading(true);
    setError(null);
    try {
      const { results, nextPageToken: nextToken } = await searchExerciseShorts(exerciseName, pageToken);
      const fresh = results.filter((v) => !knownIds.has(v.videoId));
      setQueue((prev) => [...prev, ...fresh]);
      setNextPageToken(nextToken);
      setSearchedOnce(true);
      return fresh.length;
    } catch (err) {
      console.error('YouTube search failed:', err);
      setError(err.code === 'not-configured' ? 'not-configured' : 'search-failed');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const loadFresh = async () => {
    setIndex(0);
    setError(null);
    setSearchedOnce(false);
    const favIds = new Set(favorites.map((v) => v.videoId));
    setQueue(favorites.map((v) => ({ ...v })));
    setNextPageToken(null);
    if (!youtubeConfigured) { setError('not-configured'); return; }
    await fetchMore(favIds, undefined);
  };

  const handleToggleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    await loadFresh();
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  const goNext = async () => {
    if (index < queue.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    if (!nextPageToken && searchedOnce) return; // no more results
    const knownIds = new Set(queue.map((v) => v.videoId));
    const added = await fetchMore(knownIds, nextPageToken || undefined);
    if (added > 0) setIndex((i) => i + 1);
  };

  const current = queue[index];
  const isFavorited = current ? favorites.some((v) => v.videoId === current.videoId) : false;
  const atEnd = index >= queue.length - 1 && searchedOnce && !nextPageToken;

  return (
    <div className="yt-panel-wrap">
      <button className="icon-btn yt-toggle" onClick={handleToggleOpen} title="Watch a demo">
        <YoutubeIcon width={18} height={18} />
      </button>

      {open && (
        <div className="yt-panel">
          {loading && !current && <div className="yt-status mono">Searching for shorts&hellip;</div>}

          {error === 'not-configured' && (
            <div className="yt-status yt-status-warn mono">
              Add a YouTube Data API key in <code>src/youtube.js</code> to enable video search (see README).
            </div>
          )}

          {error === 'search-failed' && (
            <div className="yt-status yt-status-warn mono">
              Couldn&rsquo;t load videos right now.
              <button className="link-btn" onClick={loadFresh}>Retry</button>
            </div>
          )}

          {!error && !loading && !current && searchedOnce && (
            <div className="yt-status mono">No shorts found for &ldquo;{exerciseName}&rdquo;.</div>
          )}

          {current && (
            <>
              <div className="yt-frame-wrap">
                <iframe
                  key={current.videoId}
                  src={`https://www.youtube.com/embed/${current.videoId}?playsinline=1`}
                  title={current.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="yt-title">{current.title}</div>
              <div className="yt-controls">
                <button className="icon-btn" onClick={goPrev} disabled={index === 0} title="Previous">
                  <ChevronLeftIcon width={18} height={18} />
                </button>
                <button
                  className={`icon-btn yt-fav${isFavorited ? ' active' : ''}`}
                  onClick={() => onToggleFavorite(current)}
                  title={isFavorited ? 'Remove favorite' : 'Save favorite'}
                >
                  <StarIcon width={18} height={18} filled={isFavorited} />
                </button>
                <button className="icon-btn" onClick={goNext} disabled={loading || atEnd} title="Next">
                  {loading ? <span className="yt-spinner" /> : <ChevronRightIcon width={18} height={18} />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
