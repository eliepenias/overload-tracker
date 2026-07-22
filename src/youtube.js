// YouTube Shorts search for exercise demo videos.
//
// ---------------------------------------------------------------------------
// Fill this in with your own YouTube Data API v3 key.
// Google Cloud Console -> APIs & Services -> Credentials -> Create Credentials -> API Key,
// with the "YouTube Data API v3" enabled on the project. See README for the full walkthrough.
// Unlike the Firebase config, THIS KEY SHOULD BE KEPT PRIVATE where possible (restrict it to
// the YouTube Data API + your deployed domain's HTTP referrers in the Cloud Console).
// ---------------------------------------------------------------------------
const YOUTUBE_API_KEY = "AIzaSyCy51YTi4nPd5RntkC0GyXJtJ6D_7DES0U";

export const youtubeConfigured = YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY';

const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Shorts can run up to 3 minutes as of YouTube's 2024 expansion; give a little
// headroom above that to avoid being overly strict about edge cases.
const MAX_SHORT_SECONDS = 200;

function parseIsoDurationSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return Infinity;
  const [, h, min, s] = m;
  return (Number(h) || 0) * 3600 + (Number(min) || 0) * 60 + (Number(s) || 0);
}

// Searches for short-form videos matching an exercise name. Returns
// { results, nextPageToken }. Pass a previous nextPageToken in to page further.
export async function searchExerciseShorts(exerciseName, pageToken) {
  if (!youtubeConfigured) {
    const err = new Error('YouTube API key not configured');
    err.code = 'not-configured';
    throw err;
  }

  const searchParams = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: 'snippet',
    type: 'video',
    videoDuration: 'short',
    safeSearch: 'moderate',
    maxResults: '12',
    q: `${exerciseName} shorts`,
  });
  if (pageToken) searchParams.set('pageToken', pageToken);

  const searchRes = await fetch(`${SEARCH_URL}?${searchParams.toString()}`);
  if (!searchRes.ok) {
    const err = new Error(`YouTube search failed (${searchRes.status})`);
    err.code = 'search-failed';
    throw err;
  }
  const searchJson = await searchRes.json();
  const items = (searchJson.items || []).filter((it) => it.id?.videoId);
  if (items.length === 0) return { results: [], nextPageToken: null };

  // search.list's "short" duration filter tops out under 4 minutes, which is
  // looser than an actual Short — confirm real length via videos.list so we
  // don't surface long-form clips.
  const ids = items.map((it) => it.id.videoId).join(',');
  const detailsParams = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: 'contentDetails,snippet',
    id: ids,
  });
  const detailsRes = await fetch(`${VIDEOS_URL}?${detailsParams.toString()}`);
  if (!detailsRes.ok) {
    const err = new Error(`YouTube video lookup failed (${detailsRes.status})`);
    err.code = 'details-failed';
    throw err;
  }
  const detailsJson = await detailsRes.json();

  const results = (detailsJson.items || [])
    .filter((v) => parseIsoDurationSeconds(v.contentDetails?.duration) <= MAX_SHORT_SECONDS)
    .map((v) => ({
      videoId: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || '',
    }));

  return { results, nextPageToken: searchJson.nextPageToken || null };
}
