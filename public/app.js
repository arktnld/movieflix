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
 * Validates and sanitizes image URLs from TMDB API
 */
function validateImageUrl(url) {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'image.tmdb.org') {
            return url;
        }
    } catch (e) {
        // Invalid URL
    }
    return null;
}

/**
 * Validates YouTube embed URLs
 */
function validateYouTubeKey(key) {
    if (!key) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(key)) {
        return key;
    }
    return null;
}

/**
 * Validates movie ID (must be positive integer)
 */
function validateMovieId(id) {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed.toString() === id) {
        return parsed;
    }
    return null;
}

/**
 * Validates and sanitizes search query
 */
function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') return null;
    const trimmed = query.trim();
    if (trimmed.length === 0 || trimmed.length > 200) return null;
    if (/<[^>]*>/g.test(trimmed)) {
        return null;
    }
    return trimmed;
}

/**
 * Logs messages only in development
 */
function devLog(...args) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error(...args);
    }
}

/**
 * Fetch wrapper with error handling
 */
async function apiFetch(url) {
    showLoadingBar();
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        hideLoadingBar();
        return data;
    } catch (error) {
        hideLoadingBar();
        devLog('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

/**
 * Show loading bar
 */
function showLoadingBar() {
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) {
        loadingBar.classList.remove('complete');
        loadingBar.classList.add('active');
    }
}

/**
 * Hide loading bar
 */
function hideLoadingBar() {
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) {
        loadingBar.classList.remove('active');
        loadingBar.classList.add('complete');
    }
}

/**
 * Announce to screen readers
 */
function announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
        liveRegion.textContent = message;
    }
}

/**
 * Set focus to main content area
 */
function focusMainContent() {
    const app = document.getElementById('app');
    if (app) {
        app.focus();
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'error') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" aria-label="Fechar notificação">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

/**
 * Setup scroll-to-top button
 */
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scroll-to-top');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Setup smart navbar that hides on scroll down
 */
function setupSmartNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollY = 0;
    let scrollDirection = 'up';

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            scrollDirection = 'down';
            navbar.classList.add('hidden');
        } else {
            scrollDirection = 'up';
            navbar.classList.remove('hidden');
        }

        lastScrollY = currentScrollY;
    }, { passive: true });
}

/**
 * Setup lazy loading for images
 */
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
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

/**
 * Generate CSS star rating display
 */
function renderStarRating(rating) {
    if (!rating) return 'Sem avaliação';

    const normalizedRating = Math.min(rating / 2, 5);
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '◐';
    if (emptyStars > 0) stars += '☆'.repeat(emptyStars);

    return `${stars} ${rating.toFixed(1)}`;
}

/**
 * Transition page with fade effect
 */
async function transitionPage() {
    const container = document.getElementById('app');
    container.classList.add('fade-out');
    await new Promise(resolve => setTimeout(resolve, 300));
    container.classList.remove('fade-out');
}

/**
 * Setup parallax scrolling for hero banner
 */
function setupParallax() {
    const heroBanner = document.querySelector('.hero-banner-image');
    if (!heroBanner) return;

    const handleScroll = () => {
        const scrollY = window.scrollY;
        heroBanner.style.transform = `translateY(${scrollY * 0.3}px)`;
    };

    window.addEventListener('scroll', handleScroll);
}

/**
 * Setup staggered animation delays for movie cards
 */
function setupCardAnimationDelays() {
    document.querySelectorAll('.movie-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 80}ms`;
    });
}

/**
 * Setup staggered animation delays for cast members
 */
function setupCastAnimationDelays() {
    document.querySelectorAll('.cast-member').forEach((member, index) => {
        member.style.animationDelay = `${index * 100}ms`;
    });
}

/**
 * Render breadcrumb navigation
 */
function renderBreadcrumb(movieTitle) {
    return `
        <div class="breadcrumb">
            <a class="breadcrumb-link" onclick="window.location.hash='#/'; return false;">Home</a>
            <span>›</span>
            <span>${escapeHtml(movieTitle)}</span>
        </div>
    `;
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
 * Render 404 not found page
 */
function render404Page() {
    return `
        <div class="not-found-page">
            <div class="not-found-content">
                <div class="not-found-number">404</div>
                <h1 class="not-found-title">Página não encontrada</h1>
                <p class="not-found-description">Desculpe, a página que você está procurando não existe.</p>
                <a href="#/" class="not-found-link">Voltar para Home</a>
            </div>
        </div>
    `;
}

/**
 * Render a single movie card
 */
function renderMovieCard(movie, isTrending = false) {
    if (!movie || typeof movie.id !== 'number' || !movie.title) {
        return '';
    }

    const poster = movie.poster_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
        : null;

    const posterImg = poster
        ? `<img src="${poster}" alt="${escapeHtml(movie.title)}" class="movie-poster" loading="lazy">`
        : `<div class="movie-poster" style="background-color: var(--bg-tertiary);"></div>`;

    const rating = renderStarRating(movie.vote_average);
    const trendingBadge = isTrending ? '<span class="movie-badge">Em Alta</span>' : '';

    return `
        <div class="movie-card" data-movie-id="${movie.id}" tabindex="0" role="button" aria-label="${escapeHtml(movie.title)}, classificação ${rating}">
            ${trendingBadge}
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
function renderHome(trendingData, popularData, topRatedData, genresData, nowPlayingData, upcomingData) {
    if (!trendingData || !Array.isArray(trendingData.results)) {
        return renderError('Dados inválidos recebidos do servidor');
    }

    const trendingMovie = trendingData.results?.[0];

    let heroBanner = '';
    if (trendingMovie && trendingMovie.backdrop_path && trendingMovie.title) {
        const backdropUrl = validateImageUrl(`https://image.tmdb.org/t/p/w1280${trendingMovie.backdrop_path}`);
        if (backdropUrl) {
            heroBanner = `
                <div class="hero-banner">
                    <img src="${backdropUrl}" alt="Cena de ${escapeHtml(trendingMovie.title)}" class="hero-banner-image" loading="lazy">
                    <div class="hero-overlay">
                        <div class="hero-info">
                            <div class="hero-title">${escapeHtml(trendingMovie.title)}</div>
                            <div class="hero-rating">★ ${(trendingMovie.vote_average || 0).toFixed(1)}</div>
                            <div class="hero-overview">${escapeHtml(trendingMovie.overview || '')}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    let genresHtml = '';
    if (genresData && Array.isArray(genresData.genres)) {
        const genreTags = genresData.genres.slice(0, 15).map(g =>
            `<button class="genre-pill" data-genre-id="${g.id}" role="button" tabindex="0">${escapeHtml(g.name)}</button>`
        ).join('');

        genresHtml = `
            <div class="genres-section">
                <div class="section-title">Explorar por Gênero</div>
                <div class="genres-container">
                    ${genreTags}
                </div>
            </div>
        `;
    }

    const trendingMovies = Array.isArray(trendingData.results) ? trendingData.results.slice(0, 20) : [];
    const popularMovies = Array.isArray(popularData?.results) ? popularData.results.slice(0, 20) : [];
    const topRatedMovies = Array.isArray(topRatedData?.results) ? topRatedData.results.slice(0, 20) : [];
    const nowPlayingMovies = Array.isArray(nowPlayingData?.results) ? nowPlayingData.results.slice(0, 20) : [];
    const upcomingMovies = Array.isArray(upcomingData?.results) ? upcomingData.results.slice(0, 20) : [];

    return `
        ${heroBanner}

        ${genresHtml}

        <div class="carousel-section">
            <div class="section-title">Em Cartaz</div>
            <div class="carousel-container">
                ${nowPlayingMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
        </div>

        <div class="carousel-section">
            <div class="section-title">Tendência da Semana</div>
            <div class="carousel-container">
                ${trendingMovies.map(m => renderMovieCard(m, true)).join('')}
            </div>
        </div>

        <div class="carousel-section">
            <div class="section-title">Próximos Lançamentos</div>
            <div class="carousel-container">
                ${upcomingMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
        </div>

        <div class="carousel-section">
            <div class="section-title">Populares Agora</div>
            <div class="carousel-container">
                ${popularMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
        </div>

        <div class="carousel-section">
            <div class="section-title">Melhor Avaliados</div>
            <div class="carousel-container">
                ${topRatedMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
        </div>
    `;
}

/**
 * Render search results page
 */
function renderSearchResults(query, results, page = 1) {
    if (!results || !Array.isArray(results.results)) {
        return renderError('Resposta inválida do servidor');
    }

    const movies = results.results || [];
    const sanitizedQuery = escapeHtml(query);
    const totalPages = results.total_pages || 1;

    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = `
            <div class="pagination">
                ${page > 1 ? `<button class="pagination-btn" data-page="${page - 1}" data-search-query="${sanitizedQuery}">← Anterior</button>` : ''}
                <span class="pagination-info">Página ${page} de ${totalPages}</span>
                ${page < totalPages ? `<button class="pagination-btn" data-page="${page + 1}" data-search-query="${sanitizedQuery}">Próxima →</button>` : ''}
            </div>
        `;
    }

    if (movies.length === 0) {
        return `
            <div class="search-page-title">Resultados para "${sanitizedQuery}"</div>
            <div class="no-results">Nenhum filme encontrado</div>
        `;
    }

    return `
        <div class="search-page-title">Resultados para "${sanitizedQuery}"</div>
        <div class="search-results">
            ${movies.map(m => renderMovieCard(m)).join('')}
        </div>
        ${paginationHtml}
    `;
}

/**
 * Render genre page with movies
 */
function renderGenrePage(genreId, genreName, movies, page = 1) {
    if (!movies || !Array.isArray(movies.results)) {
        return renderError('Resposta inválida do servidor');
    }

    const movieList = movies.results || [];
    const totalPages = movies.total_pages || 1;
    const escapedGenreName = escapeHtml(genreName);

    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = `
            <div class="pagination">
                ${page > 1 ? `<button class="pagination-btn" data-page="${page - 1}" data-genre-id="${genreId}">← Anterior</button>` : ''}
                <span class="pagination-info">Página ${page} de ${totalPages}</span>
                ${page < totalPages ? `<button class="pagination-btn" data-page="${page + 1}" data-genre-id="${genreId}">Próxima →</button>` : ''}
            </div>
        `;
    }

    if (movieList.length === 0) {
        return `
            <div class="genre-page-title">${escapedGenreName}</div>
            <div class="no-results">Nenhum filme encontrado neste gênero</div>
        `;
    }

    return `
        <div class="genre-page-title">${escapedGenreName}</div>
        <div class="genre-results">
            ${movieList.map(m => renderMovieCard(m)).join('')}
        </div>
        ${paginationHtml}
    `;
}

/**
 * Render movie detail page
 */
function renderMovieDetail(movie) {
    if (!movie || !movie.title || typeof movie.id !== 'number') {
        return renderError('Filme não encontrado ou dados inválidos');
    }

    const backdrop = movie.backdrop_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`)
        : null;

    const poster = movie.poster_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
        : null;

    const backdropImg = backdrop
        ? `<img src="${backdrop}" alt="Cena de ${escapeHtml(movie.title)}" class="detail-backdrop-image" loading="lazy">`
        : `<div class="detail-backdrop-image" style="background-color: var(--bg-tertiary);"></div>`;

    const posterImg = poster
        ? `<img src="${poster}" alt="Poster de ${escapeHtml(movie.title)}" class="detail-poster" loading="lazy">`
        : `<div class="detail-poster" style="background-color: var(--bg-tertiary);"></div>`;

    const rating = renderStarRating(movie.vote_average);

    const genres = Array.isArray(movie.genres)
        ? movie.genres
            .filter(g => g && g.name)
            .map(g => `<span class="genre-tag">${escapeHtml(g.name)}</span>`)
            .join('')
        : '';

    const castMembers = Array.isArray(movie.credits?.cast)
        ? movie.credits.cast
            .slice(0, 10)
            .filter(a => a && a.name)
            .map(actor => {
                const photo = actor.profile_path
                    ? validateImageUrl(`https://image.tmdb.org/t/p/w185${actor.profile_path}`)
                    : null;

                const photoImg = photo
                    ? `<img src="${photo}" alt="${escapeHtml(actor.name)}" class="cast-photo" loading="lazy">`
                    : `<div class="cast-photo" style="background-color: var(--bg-tertiary);"></div>`;

                return `
                    <div class="cast-member">
                        ${photoImg}
                        <div class="cast-name">${escapeHtml(actor.name)}</div>
                        <div class="cast-character">${escapeHtml(actor.character || '')}</div>
                    </div>
                `;
            })
            .join('')
        : '';

    let videoHtml = '';
    const videoKey = getVideoKey(movie.videos?.results);
    if (videoKey) {
        const validatedKey = validateYouTubeKey(videoKey);
        if (validatedKey) {
            videoHtml = `
                <div class="videos-section">
                    <div class="videos-title">Trailer</div>
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/${validatedKey}"
                                title="Trailer"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                        </iframe>
                    </div>
                </div>
            `;
        }
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

    let reviewsHtml = '';
    if (Array.isArray(movie.reviews?.results) && movie.reviews.results.length > 0) {
        const reviews = movie.reviews.results.slice(0, 5);
        const reviewCards = reviews.map(review => {
            const authorName = escapeHtml(review.author || 'Anônimo');
            const rating = review.author_details?.rating ? `★ ${review.author_details.rating.toFixed(1)}` : '';
            const content = review.content || '';
            const excerpt = content.length > 300
                ? `${escapeHtml(content.substring(0, 300))}...`
                : escapeHtml(content);

            return `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-author">${authorName}</div>
                        ${rating ? `<div class="review-rating">${rating}</div>` : ''}
                    </div>
                    <div class="review-text">${excerpt}</div>
                    <button class="review-expand-btn" data-review-content="${content.replace(/"/g, '&quot;')}" aria-label="Expandir resenha">Leia mais</button>
                </div>
            `;
        }).join('');

        reviewsHtml = `
            <div class="reviews-section">
                <div class="reviews-title">Resenhas</div>
                <div class="reviews-container">
                    ${reviewCards}
                </div>
            </div>
        `;
    }

    let similarHtml = '';
    if (Array.isArray(movie.similar?.results) && movie.similar.results.length > 0) {
        const similarMovies = movie.similar.results.slice(0, 10);
        similarHtml = `
            <div class="similar-section">
                <div class="similar-title">Filmes Similares</div>
                <div class="carousel-container">
                    ${similarMovies.map(m => renderMovieCard(m)).join('')}
                </div>
            </div>
        `;
    }

    return `
        ${renderBreadcrumb(movie.title)}

        <button class="back-button" id="back-button" aria-label="Voltar para página anterior"><span style="display: inline-block;">←</span> Voltar</button>

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
                ${reviewsHtml}
                ${similarHtml}
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
        await transitionPage();
        const [trending, popular, topRated, genres, nowPlaying, upcoming] = await Promise.all([
            apiFetch('/api/trending'),
            apiFetch('/api/popular'),
            apiFetch('/api/top-rated'),
            apiFetch('/api/genres'),
            apiFetch('/api/now-playing'),
            apiFetch('/api/upcoming')
        ]);

        app.innerHTML = renderHome(trending, popular, topRated, genres, nowPlaying, upcoming);
        attachMovieCardListeners();
        attachGenrePillListeners();
        setupCardAnimationDelays();
        setupParallax();
        focusMainContent();
        announceToScreenReader('Página inicial carregada');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'home';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro: ${error.message}`);
    }
}

/**
 * Load and render search results
 */
async function loadSearch(query, page = 1) {
    const validatedQuery = validateSearchQuery(query);

    if (!validatedQuery) {
        loadHome();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const results = await apiFetch(`/api/search?q=${encodeURIComponent(validatedQuery)}&page=${page}`);
        app.innerHTML = renderSearchResults(validatedQuery, results, page);
        attachMovieCardListeners();
        attachPaginationListeners();
        focusMainContent();
        announceToScreenReader(`Resultados de busca para ${validatedQuery}`);
        currentPage = 'search';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao buscar: ${error.message}`);
    }
}

/**
 * Load and render genre page
 */
async function loadGenre(genreId, page = 1) {
    const validatedId = parseInt(genreId, 10);
    if (isNaN(validatedId) || validatedId <= 0) {
        app.innerHTML = renderError('ID de gênero inválido');
        focusMainContent();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const [movies, genres] = await Promise.all([
            apiFetch(`/api/discover?genre=${validatedId}&page=${page}`),
            apiFetch('/api/genres')
        ]);

        const genreName = genres.genres?.find(g => g.id === validatedId)?.name || 'Desconhecido';
        app.innerHTML = renderGenrePage(validatedId, genreName, movies, page);
        attachMovieCardListeners();
        attachPaginationListeners();
        focusMainContent();
        announceToScreenReader(`Filmes do gênero ${genreName}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'genre';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar gênero: ${error.message}`);
    }
}

/**
 * Load and render movie detail page
 */
async function loadMovieDetail(movieId) {
    const validatedId = validateMovieId(movieId);

    if (validatedId === null) {
        app.innerHTML = renderError('ID de filme inválido');
        focusMainContent();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const [movie, similar, reviews] = await Promise.all([
            apiFetch(`/api/movie/${validatedId}`),
            apiFetch(`/api/movie/${validatedId}/similar`),
            apiFetch(`/api/movie/${validatedId}/reviews`)
        ]);

        const enrichedMovie = {
            ...movie,
            similar,
            reviews
        };

        app.innerHTML = renderMovieDetail(enrichedMovie);

        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.hash = '#/';
            });
        }

        attachMovieCardListeners();
        attachReviewExpandListeners();
        focusMainContent();
        announceToScreenReader(`Detalhes do filme: ${movie.title}`);
        currentPage = 'detail';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar filme: ${error.message}`);
    }
}

/**
 * Attach click and keyboard listeners to movie cards
 */
function attachMovieCardListeners() {
    document.querySelectorAll('.movie-card').forEach(card => {
        const handleCardActivation = () => {
            const movieId = card.dataset.movieId;
            window.location.hash = `#/movie/${movieId}`;
        };

        card.addEventListener('click', handleCardActivation);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardActivation();
            }
        });
    });
}

/**
 * Attach listeners to genre pills
 */
function attachGenrePillListeners() {
    document.querySelectorAll('.genre-pill').forEach(pill => {
        const handleGenreActivation = () => {
            const genreId = pill.dataset.genreId;
            window.location.hash = `#/genre/${genreId}`;
        };

        pill.addEventListener('click', handleGenreActivation);
        pill.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGenreActivation();
            }
        });
    });
}

/**
 * Attach listeners to pagination buttons
 */
function attachPaginationListeners() {
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            const genreId = btn.dataset.genreId;
            const searchQuery = btn.dataset.searchQuery;

            if (genreId) {
                window.location.hash = `#/genre/${genreId}?page=${page}`;
            } else if (searchQuery) {
                window.location.hash = `#/search/${encodeURIComponent(searchQuery)}?page=${page}`;
            }
        });
    });
}

/**
 * Attach listeners to review expand buttons
 */
function attachReviewExpandListeners() {
    document.querySelectorAll('.review-expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const content = btn.dataset.reviewContent;
            const reviewCard = btn.closest('.review-card');
            const reviewText = reviewCard.querySelector('.review-text');

            if (reviewText.textContent.includes('...')) {
                reviewText.textContent = content;
                btn.textContent = 'Ler menos';
            } else {
                const excerpt = content.length > 300
                    ? `${content.substring(0, 300)}...`
                    : content;
                reviewText.textContent = excerpt;
                btn.textContent = 'Leia mais';
            }
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
        const parts = hash.slice(8).split('?');
        const encodedQuery = parts[0];
        const pageParam = new URLSearchParams(parts[1] || '').get('page') || '1';
        const page = Math.max(1, parseInt(pageParam, 10));

        let query = '';
        try {
            query = decodeURIComponent(encodedQuery);
        } catch (e) {
            devLog('Invalid search query encoding');
            loadHome();
            return;
        }
        const validatedQuery = validateSearchQuery(query);
        if (validatedQuery) {
            searchInput.value = validatedQuery;
            loadSearch(validatedQuery, page);
        } else {
            loadHome();
        }
    } else if (hash.startsWith('/genre/')) {
        const parts = hash.slice(7).split('?');
        const genreId = parts[0];
        const pageParam = new URLSearchParams(parts[1] || '').get('page') || '1';
        const page = Math.max(1, parseInt(pageParam, 10));

        loadGenre(genreId, page);
    } else if (hash.startsWith('/movie/')) {
        const movieId = hash.slice(7);
        const validatedId = validateMovieId(movieId);
        if (validatedId !== null) {
            loadMovieDetail(movieId);
        } else {
            app.innerHTML = renderError('Filme não encontrado');
        }
    } else {
        app.innerHTML = render404Page();
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

/**
 * Handle Enter key for immediate search (bypass debounce)
 */
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            window.location.hash = `#/search/${encodeURIComponent(query)}`;
        }
    }
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
 * Handle Escape key to navigate home
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.location.hash = '#/';
    }
});

/**
 * Listen for hash changes and route
 */
window.addEventListener('hashchange', handleRoute);

/**
 * Setup online/offline detection
 */
function setupOfflineDetection() {
    window.addEventListener('online', () => {
        showToast('Conexão restaurada', 'success');
    });

    window.addEventListener('offline', () => {
        showToast('Você está offline', 'error');
    });
}

/**
 * Setup placeholder animation
 */
function setupPlaceholderAnimation() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const placeholders = [
        'Buscar filmes...',
        'Tente: Matrix',
        'Tente: Interestelar'
    ];

    let currentIndex = 0;

    setInterval(() => {
        if (!document.activeElement || document.activeElement !== searchInput) {
            currentIndex = (currentIndex + 1) % placeholders.length;
            searchInput.placeholder = placeholders[currentIndex];
        }
    }, 3000);
}

/**
 * Initial route on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    setupScrollToTop();
    setupSmartNavbar();
    setupLazyLoading();
    setupOfflineDetection();
    setupPlaceholderAnimation();
    handleRoute();
});
