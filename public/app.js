// ============ UTILITY FUNCTIONS ============

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Fetch wrapper with error handling
 */
async function apiFetch(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Debounce function for search input
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Extract video key from videos array (prioritize trailers)
 */
function getVideoKey(videos) {
    if (!videos || videos.length === 0) return null;

    const trailer = videos.find(v => v.type === 'Trailer');
    if (trailer) return trailer.key;

    const teaser = videos.find(v => v.type === 'Teaser');
    if (teaser) return teaser.key;

    return videos[0]?.key || null;
}

// ============ UI RENDERING ============

/**
 * Render loading state
 */
function renderLoading() {
    return `
        <div class="loading">
            <div class="spinner"></div>
            <p class="loading-text">Carregando...</p>
        </div>
    `;
}

/**
 * Render error state
 */
function renderError(message) {
    return `
        <div class="error-message">
            ⚠️ ${escapeHtml(message)}
        </div>
    `;
}

/**
 * Render a single movie card
 */
function renderMovieCard(movie) {
    const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

    const posterImg = poster
        ? `<img src="${poster}" alt="${escapeHtml(movie.title)}" class="movie-poster">`
        : `<div class="movie-poster" style="background-color: var(--bg-tertiary);"></div>`;

    const rating = movie.vote_average
        ? `⭐ ${movie.vote_average.toFixed(1)}`
        : 'Sem avaliação';

    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            ${posterImg}
            <div class="movie-info">
                <div class="movie-title">${escapeHtml(movie.title)}</div>
                <div class="movie-rating">${rating}</div>
            </div>
        </div>
    `;
}

/**
 * Render home page with hero banner and carousels
 */
function renderHome(trendingData, popularData, topRatedData) {
    const trendingMovie = trendingData.results?.[0];

    let heroBanner = '';
    if (trendingMovie && trendingMovie.backdrop_path) {
        const backdropUrl = `https://image.tmdb.org/t/p/w1280${trendingMovie.backdrop_path}`;
        heroBanner = `
            <div class="hero-banner">
                <img src="${backdropUrl}" alt="Hero" class="hero-banner-image">
                <div class="hero-overlay">
                    <div class="hero-info">
                        <div class="hero-title">${escapeHtml(trendingMovie.title)}</div>
                        <div class="hero-rating">⭐ ${(trendingMovie.vote_average || 0).toFixed(1)}</div>
                        <div class="hero-overview">${escapeHtml(trendingMovie.overview || '')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    const trendingMovies = trendingData.results?.slice(0, 20) || [];
    const popularMovies = popularData.results?.slice(0, 20) || [];
    const topRatedMovies = topRatedData.results?.slice(0, 20) || [];

    return `
        ${heroBanner}

        <div class="carousel-section">
            <div class="section-title">Tendência da Semana</div>
            <div class="carousel-container">
                ${trendingMovies.map(m => renderMovieCard(m)).join('')}
            </div>
        </div>

        <div class="carousel-section">
            <div class="section-title">Populares Agora</div>
            <div class="carousel-container">
                ${popularMovies.map(m => renderMovieCard(m)).join('')}
            </div>
        </div>

        <div class="carousel-section">
            <div class="section-title">Melhor Avaliados</div>
            <div class="carousel-container">
                ${topRatedMovies.map(m => renderMovieCard(m)).join('')}
            </div>
        </div>
    `;
}

/**
 * Render search results page
 */
function renderSearchResults(query, results) {
    const movies = results.results || [];

    if (movies.length === 0) {
        return `
            <div class="search-page-title">Resultados para "${escapeHtml(query)}"</div>
            <div class="no-results">Nenhum filme encontrado</div>
        `;
    }

    return `
        <div class="search-page-title">Resultados para "${escapeHtml(query)}"</div>
        <div class="search-results">
            ${movies.map(m => renderMovieCard(m)).join('')}
        </div>
    `;
}

/**
 * Render movie detail page
 */
function renderMovieDetail(movie) {
    const backdrop = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
        : null;

    const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

    const backdropImg = backdrop
        ? `<img src="${backdrop}" alt="Backdrop" class="detail-backdrop-image">`
        : `<div class="detail-backdrop-image" style="background-color: var(--bg-tertiary);"></div>`;

    const posterImg = poster
        ? `<img src="${poster}" alt="Poster" class="detail-poster">`
        : `<div class="detail-poster" style="background-color: var(--bg-tertiary);"></div>`;

    const rating = movie.vote_average
        ? `⭐ ${movie.vote_average.toFixed(1)}`
        : 'Sem avaliação';

    const genres = (movie.genres || [])
        .map(g => `<span class="genre-tag">${escapeHtml(g.name)}</span>`)
        .join('');

    const castMembers = (movie.credits?.cast || [])
        .slice(0, 10)
        .map(actor => {
            const photo = actor.profile_path
                ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                : null;

            const photoImg = photo
                ? `<img src="${photo}" alt="${escapeHtml(actor.name)}" class="cast-photo">`
                : `<div class="cast-photo" style="background-color: var(--bg-tertiary);"></div>`;

            return `
                <div class="cast-member">
                    ${photoImg}
                    <div class="cast-name">${escapeHtml(actor.name)}</div>
                    <div class="cast-character">${escapeHtml(actor.character || '')}</div>
                </div>
            `;
        })
        .join('');

    let videoHtml = '';
    const videoKey = getVideoKey(movie.videos?.results);
    if (videoKey) {
        videoHtml = `
            <div class="videos-section">
                <div class="videos-title">Trailer</div>
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${escapeHtml(videoKey)}"
                            title="Trailer"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
    }

    let castHtml = '';
    if (castMembers) {
        castHtml = `
            <div class="cast-section">
                <div class="cast-title">Elenco</div>
                <div class="cast-grid">
                    ${castMembers}
                </div>
            </div>
        `;
    }

    return `
        <button class="back-button" id="back-button">← Voltar</button>

        <div class="detail-backdrop">
            ${backdropImg}
        </div>

        <div class="detail-container">
            <div>${posterImg}</div>
            <div class="detail-info">
                <h1>${escapeHtml(movie.title)}</h1>
                <div class="detail-meta">
                    <div class="detail-rating">${rating}</div>
                    <div class="detail-genres">${genres}</div>
                </div>
                <div class="detail-overview">${escapeHtml(movie.overview || 'Sem sinopse disponível')}</div>
                ${castHtml}
                ${videoHtml}
            </div>
        </div>
    `;
}

// ============ PAGE NAVIGATION & LOADING ============

const app = document.getElementById('app');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const logo = document.querySelector('.logo');

let currentPage = null;

/**
 * Load and render home page
 */
async function loadHome() {
    app.innerHTML = renderLoading();

    try {
        const [trending, popular, topRated] = await Promise.all([
            apiFetch('/api/trending'),
            apiFetch('/api/popular'),
            apiFetch('/api/top-rated')
        ]);

        app.innerHTML = renderHome(trending, popular, topRated);
        attachMovieCardListeners();
        currentPage = 'home';
    } catch (error) {
        app.innerHTML = renderError(error.message);
    }
}

/**
 * Load and render search results
 */
async function loadSearch(query) {
    if (!query || query.trim() === '') {
        loadHome();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const results = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
        app.innerHTML = renderSearchResults(query, results);
        attachMovieCardListeners();
        currentPage = 'search';
    } catch (error) {
        app.innerHTML = renderError(error.message);
    }
}

/**
 * Load and render movie detail page
 */
async function loadMovieDetail(movieId) {
    app.innerHTML = renderLoading();

    try {
        const movie = await apiFetch(`/api/movie/${movieId}`);
        app.innerHTML = renderMovieDetail(movie);

        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.hash = '#/';
            });
        }

        currentPage = 'detail';
    } catch (error) {
        app.innerHTML = renderError(error.message);
    }
}

/**
 * Attach click listeners to movie cards
 */
function attachMovieCardListeners() {
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.dataset.movieId;
            window.location.hash = `#/movie/${movieId}`;
        });
    });
}

// ============ ROUTING ============

/**
 * Route handler based on hash
 */
function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    if (hash === '/') {
        loadHome();
        searchInput.value = '';
    } else if (hash.startsWith('/search/')) {
        const query = decodeURIComponent(hash.slice(8));
        searchInput.value = query;
        loadSearch(query);
    } else if (hash.startsWith('/movie/')) {
        const movieId = hash.slice(7);
        loadMovieDetail(movieId);
    } else {
        loadHome();
    }
}

// ============ EVENT LISTENERS ============

/**
 * Handle search with debounce
 */
const debouncedSearch = debounce((query) => {
    if (query.trim()) {
        window.location.hash = `#/search/${encodeURIComponent(query)}`;
    } else {
        window.location.hash = '#/';
    }
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        window.location.hash = `#/search/${encodeURIComponent(query)}`;
    }
});

logo.addEventListener('click', () => {
    window.location.hash = '#/';
});

/**
 * Listen for hash changes and route
 */
window.addEventListener('hashchange', handleRoute);

/**
 * Initial route on page load
 */
document.addEventListener('DOMContentLoaded', handleRoute);
