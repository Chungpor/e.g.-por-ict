/**
 * Por ICT - Forex Factory Live JSON API & Web Server
 * Runs at: http://localhost:3000
 * Requires Node 18+ (global fetch and AbortSignal.timeout).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Never serve server code, dependency files, env files or dotfiles,
// even though express.static(__dirname) would otherwise expose them.
// Safer long-term fix: move frontend files into a ./public folder
// and serve only that folder.
const BLOCKED_PATH = /^\/(server\.js|package(-lock)?\.json|node_modules(\/|$)|\.|.*\.(env|log|md)$)/i;
app.use((req, res, next) => {
  if (BLOCKED_PATH.test(decodeURIComponent(req.path))) return res.status(404).end();
  next();
});

// Serve static frontend assets (index.html, script.js, style.css, por.jpg)
app.use(express.static(__dirname, { dotfiles: 'deny' }));

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Forex Factory CDN endpoint
const FF_FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

const CACHE_TTL_MS = 5 * 60 * 1000;     // fresh for 5 minutes
const RETRY_BACKOFF_MS = 60 * 1000;     // after a failure, wait 1 minute before retrying
const FETCH_TIMEOUT_MS = 10 * 1000;     // never hang on the upstream feed

let cachedCalendar = null;
let lastFetchTimestamp = 0;
let lastFailureTimestamp = 0;
let inflightFetch = null;               // shares one upstream request between concurrent callers

async function fetchFeed() {
  const response = await fetch(FF_FEED_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (PorICT Market Analytics Engine; contact@porict.com)'
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`ForexFactory CDN error: ${response.status}`);
  const rawEvents = await response.json();
  if (!Array.isArray(rawEvents)) throw new Error('ForexFactory CDN returned an unexpected format');
  return rawEvents;
}

/**
 * Returns { events, source }.
 * source: 'live' (fresh feed), 'stale_cache' (feed failed, older real data),
 *         'synthetic' (feed failed and nothing cached: sample data, NOT real).
 */
async function getEnrichedForexFactoryData() {
  const now = Date.now();

  if (cachedCalendar && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return { events: enrichLiveCountdowns(cachedCalendar), source: 'live' };
  }

  // Recently failed: don't hammer the upstream, use what we have.
  if (now - lastFailureTimestamp < RETRY_BACKOFF_MS) {
    return fallbackData();
  }

  try {
    if (!inflightFetch) {
      inflightFetch = fetchFeed().finally(() => { inflightFetch = null; });
    }
    const rawEvents = await inflightFetch;
    cachedCalendar = rawEvents;
    lastFetchTimestamp = Date.now();
    return { events: enrichLiveCountdowns(rawEvents), source: 'live' };
  } catch (error) {
    console.error('Forex Factory fetch error:', error.message);
    lastFailureTimestamp = Date.now();
    return fallbackData();
  }
}

function fallbackData() {
  if (cachedCalendar) return { events: enrichLiveCountdowns(cachedCalendar), source: 'stale_cache' };
  return { events: getSyntheticUpcomingEvents(), source: 'synthetic' };
}

function enrichLiveCountdowns(events) {
  const now = Date.now();

  return events
    .filter(event => event && !Number.isNaN(new Date(event.date).getTime()))
    .map((event, index) => {
      const releaseDate = new Date(event.date);
      const diffMs = releaseDate.getTime() - now;

      // Whole minutes: rounded up before release, rounded down after,
      // so a release 20 seconds away shows "in 1m", not "Released 0m ago".
      const diffMinutes = diffMs > 0 ? Math.ceil(diffMs / 60000) : (-Math.floor(-diffMs / 60000) || 0);

      let status = 'UPCOMING';
      let countdownDisplay = '';
      let isHot = false;

      if (diffMs > 0) {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        countdownDisplay = hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
        if (diffMinutes <= 60 && (event.impact === 'High' || event.country === 'USD')) {
          isHot = true;
        }
      } else if (diffMinutes >= -15) {
        status = 'JUST_RELEASED';
        countdownDisplay = `Released ${Math.abs(diffMinutes)}m ago`;
        isHot = true;
      } else {
        status = 'PASSED';
        const hoursAgo = Math.floor(Math.abs(diffMinutes) / 60);
        countdownDisplay = hoursAgo > 0 ? `${hoursAgo}h ago` : `${Math.abs(diffMinutes)}m ago`;
      }

      const releaseTimeIct = releaseDate.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const releaseDateIct = releaseDate.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      return {
        id: `ff_${releaseDate.getTime()}_${index}`,
        title: event.title,
        currency: event.country,
        impact: event.impact || 'Low',
        forecast: event.forecast || '-',
        previous: event.previous || '-',
        actual: event.actual || '',
        release_date_iso: event.date,
        release_date_ict: releaseDateIct,
        release_time_ict: `${releaseTimeIct} ICT`,
        diff_minutes: diffMinutes,
        status: status,
        countdown: countdownDisplay,
        is_hot: isHot,
        ict_playbook: getIctStrategyGuidance(event.impact, event.country, diffMinutes)
      };
    });
}

function getIctStrategyGuidance(impact, currency, diffMinutes) {
  if (impact === 'High' && diffMinutes > 0 && diffMinutes <= 30) {
    return 'CRITICAL ICT ALERT: High volatility expected. Avoid entering prior to Judas swing; monitor M15 Liquidity Sweep & displacement.';
  }
  if (impact === 'High' && diffMinutes <= 0 && diffMinutes >= -15) {
    return 'RELEASE IN PLAY: Look for institutional Fair Value Gap (FVG) creation on M5 / M15.';
  }
  if (currency === 'USD') {
    return 'USD Macro Catalyst: Cross-reference DXY displacement with Gold (XAUUSD) & EURUSD order flow.';
  }
  return 'Standard Session Range: Respect session Highs/Lows and internal market structure.';
}

// SAMPLE DATA ONLY: shown when the live feed is down and nothing is cached.
// The API response is marked source: 'synthetic' so the UI can warn users.
function getSyntheticUpcomingEvents() {
  const base = new Date();
  const makeDate = (offsetMins) => new Date(base.getTime() + offsetMins * 60000).toISOString();

  const raw = [
    { title: "Core CPI m/m", country: "USD", impact: "High", forecast: "0.3%", previous: "0.2%", date: makeDate(15) },
    { title: "Unemployment Claims", country: "USD", impact: "High", forecast: "220K", previous: "218K", date: makeDate(45) },
    { title: "Fed Chair Speaks", country: "USD", impact: "High", forecast: "-", previous: "-", date: makeDate(90) },
    { title: "PPI m/m", country: "USD", impact: "Medium", forecast: "0.2%", previous: "0.1%", date: makeDate(135) },
    { title: "Prelim UoM Consumer Sentiment", country: "USD", impact: "Medium", forecast: "70.2", previous: "68.9", date: makeDate(210) }
  ];
  return enrichLiveCountdowns(raw);
}

// API Routes
app.get('/api/forexfactory/live', async (req, res) => {
  try {
    const { events, source } = await getEnrichedForexFactoryData();
    let data = events;
    const { currency, impact, hot_only } = req.query;

    if (currency) data = data.filter(e => String(e.currency).toUpperCase() === String(currency).toUpperCase());
    if (impact) data = data.filter(e => String(e.impact).toLowerCase() === String(impact).toLowerCase());
    if (hot_only === 'true') data = data.filter(e => e.is_hot);

    res.json({
      success: true,
      provider: 'Por ICT Forex Factory Engine',
      source: source,
      warning: source === 'synthetic'
        ? 'Live feed unavailable. These events are SAMPLE DATA, not real releases.'
        : source === 'stale_cache'
          ? 'Live feed unavailable. Showing the last successfully fetched data.'
          : undefined,
      server_time_ict: new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Phnom_Penh' }),
      count: data.length,
      data: data
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Por ICT Dashboard running at: http://localhost:${PORT}`);
});