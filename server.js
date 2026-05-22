import 'dotenv/config.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_TOKEN;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Serve static files from public/
app.use(express.static('public'));

// Helper to make TMDB requests with auth
async function fetchTMDB(endpoint) {
  const response = await fetch(`${TMDB_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${TMDB_TOKEN}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, message: error.status_message || 'TMDB API error' };
  }

  return response.json();
}

// GET /api/trending
app.get('/api/trending', async (req, res) => {
  try {
    const data = await fetchTMDB('/trending/movie/week?language=pt-BR');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/popular
app.get('/api/popular', async (req, res) => {
  try {
    const data = await fetchTMDB('/movie/popular?language=pt-BR');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/top-rated
app.get('/api/top-rated', async (req, res) => {
  try {
    const data = await fetchTMDB('/movie/top_rated?language=pt-BR');
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/search?q=
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    // Validate q is not empty
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter q is required and cannot be empty' });
    }

    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(q)}&language=pt-BR`);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/movie/:id
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Movie ID must be a numeric value' });
    }

    const data = await fetchTMDB(`/movie/${id}?append_to_response=credits,videos&language=pt-BR`);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
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
