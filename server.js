import 'dotenv/config.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_TOKEN;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Rate limiting: simple in-memory store
const requestLog = new Map();

function getRateLimitKey(ip) {
  return ip;
}

function isRateLimited(ip) {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Clean old entries
  if (!requestLog.has(key)) {
    requestLog.set(key, []);
  }

  const timestamps = requestLog.get(key).filter(t => t > oneMinuteAgo);
  requestLog.set(key, timestamps);

  if (timestamps.length >= 100) {
    return true;
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}

// Rate limiting middleware
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Maximum 100 requests per minute.' });
  }
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https://image.tmdb.org; frame-src https://www.youtube.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;"
  );
  next();
});

// Serve static files from public/
app.use(express.static('public'));

// Helper to make TMDB requests with auth
async function fetchTMDB(endpoint) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${TMDB_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${TMDB_TOKEN}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw { status: response.status, message: error.status_message || 'TMDB API error', isError: true };
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw { status: 504, message: 'Service temporarily unavailable', isError: true };
    }

    // If it's already our error object, re-throw it
    if (error.isError) {
      throw error;
    }

    // For unexpected errors, wrap them
    throw { status: 500, message: error.message, isError: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

// GET /api/trending
app.get('/api/trending', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/trending/movie/week?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/popular
app.get('/api/popular', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/movie/popular?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/top-rated
app.get('/api/top-rated', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/movie/top_rated?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/search?q=
app.get('/api/search', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = ['q'];
  const queryKeys = Object.keys(req.query);
  if (!queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { q } = req.query;

    // Validate q is not empty
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter q is required and cannot be empty' });
    }

    // Limit search query to 200 characters
    if (q.length > 200) {
      return res.status(400).json({ error: 'Query parameter q must be 200 characters or less' });
    }

    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(q)}&language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/movie/:id
app.get('/api/movie/:id', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Movie ID must be a numeric value' });
    }

    // Validate id is positive and max 10 digits
    if (id.length > 10) {
      return res.status(400).json({ error: 'Movie ID must be a maximum of 10 digits' });
    }

    const data = await fetchTMDB(`/movie/${id}?append_to_response=credits,videos&language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/genres
app.get('/api/genres', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/genre/movie/list?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/discover?genre=X
app.get('/api/discover', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = ['genre', 'page'];
  const queryKeys = Object.keys(req.query);
  if (!queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { genre, page } = req.query;

    // Validate genre is required
    if (!genre) {
      return res.status(400).json({ error: 'Query parameter genre is required' });
    }

    // Validate genre is numeric
    if (!/^\d+$/.test(genre)) {
      return res.status(400).json({ error: 'Genre ID must be a numeric value' });
    }

    // Validate page if provided
    if (page !== undefined) {
      if (!/^\d+$/.test(page)) {
        return res.status(400).json({ error: 'Page must be a numeric value' });
      }
      if (parseInt(page) < 1 || parseInt(page) > 500) {
        return res.status(400).json({ error: 'Page must be between 1 and 500' });
      }
    }

    const pageParam = page ? `&page=${encodeURIComponent(page)}` : '';
    const data = await fetchTMDB(`/discover/movie?with_genres=${encodeURIComponent(genre)}&language=pt-BR${pageParam}`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/upcoming
app.get('/api/upcoming', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/movie/upcoming?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/now-playing
app.get('/api/now-playing', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/movie/now_playing?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/movie/:id/similar
app.get('/api/movie/:id/similar', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Movie ID must be a numeric value' });
    }

    // Validate id is max 10 digits
    if (id.length > 10) {
      return res.status(400).json({ error: 'Movie ID must be a maximum of 10 digits' });
    }

    const data = await fetchTMDB(`/movie/${id}/similar?language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/movie/:id/reviews
app.get('/api/movie/:id/reviews', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Movie ID must be a numeric value' });
    }

    // Validate id is max 10 digits
    if (id.length > 10) {
      return res.status(400).json({ error: 'Movie ID must be a maximum of 10 digits' });
    }

    const data = await fetchTMDB(`/movie/${id}/reviews?language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/tv/trending
app.get('/api/tv/trending', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/trending/tv/week?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/tv/popular
app.get('/api/tv/popular', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/tv/popular?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/tv/top-rated
app.get('/api/tv/top-rated', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/tv/top_rated?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/tv/search?q= (MUST be before /api/tv/:id to avoid wildcard match)
app.get('/api/tv/search', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = ['q'];
  const queryKeys = Object.keys(req.query);
  if (!queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { q } = req.query;

    // Validate q is not empty
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter q is required and cannot be empty' });
    }

    // Limit search query to 200 characters
    if (q.length > 200) {
      return res.status(400).json({ error: 'Query parameter q must be 200 characters or less' });
    }

    const data = await fetchTMDB(`/search/tv?query=${encodeURIComponent(q)}&language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/tv/:id
app.get('/api/tv/:id', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Series ID must be a numeric value' });
    }

    // Validate id is max 10 digits
    if (id.length > 10) {
      return res.status(400).json({ error: 'Series ID must be a maximum of 10 digits' });
    }

    const data = await fetchTMDB(`/tv/${id}?append_to_response=credits,videos&language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/top-list
app.get('/api/top-list', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    // Fetch both movie and TV top-rated in parallel
    const [movieData, tvData] = await Promise.all([
      fetchTMDB('/movie/top_rated?language=pt-BR'),
      fetchTMDB('/tv/top_rated?language=pt-BR')
    ]);

    // Add media_type to each result
    const moviesWithType = (movieData.results || []).map(item => ({
      ...item,
      media_type: 'movie'
    }));

    const seriesWithType = (tvData.results || []).map(item => ({
      ...item,
      media_type: 'tv'
    }));

    // Merge and sort by vote_average descending
    const merged = [...moviesWithType, ...seriesWithType];
    merged.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

    // Return top 20
    res.json({ results: merged.slice(0, 20) });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/people/popular
app.get('/api/people/popular', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/person/popular?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/person/:id
app.get('/api/person/:id', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Person ID must be a numeric value' });
    }

    // Validate id is max 10 digits
    if (id.length > 10) {
      return res.status(400).json({ error: 'Person ID must be a maximum of 10 digits' });
    }

    const data = await fetchTMDB(`/person/${id}?append_to_response=movie_credits,tv_credits&language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/trending/day
app.get('/api/trending/day', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const data = await fetchTMDB('/trending/all/day?language=pt-BR');
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// GET /api/collection/:id
app.get('/api/collection/:id', async (req, res) => {
  // Reject unexpected query parameters
  const allowedParams = [];
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 0 && !queryKeys.every(k => allowedParams.includes(k))) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Collection ID must be a numeric value' });
    }

    // Validate id is max 10 digits
    if (id.length > 10) {
      return res.status(400).json({ error: 'Collection ID must be a maximum of 10 digits' });
    }

    const data = await fetchTMDB(`/collection/${id}?language=pt-BR`);
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'Erro interno do servidor' });
    }
    res.status(status).json({ error: error.message });
  }
});

// Start server only when run directly (not imported by tests)
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  app.listen(PORT, () => {
    console.log(`MovieFlix proxy running on http://localhost:${PORT}`);
  });
}

export default app;
