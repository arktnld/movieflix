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
 * Setup carousel navigation arrows
 */
function setupCarouselNavigation() {
    document.querySelectorAll('.carousel-section').forEach(section => {
        const carousel = section.querySelector('.carousel-container');
        const navLeft = section.querySelector('.carousel-nav-left');
        const navRight = section.querySelector('.carousel-nav-right');

        if (!carousel || !navLeft || !navRight) return;

        const scrollAmount = 720; // 4 cards at 180px

        const updateArrowState = () => {
            const isAtStart = carousel.scrollLeft <= 0;
            const isAtEnd = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 10;

            navLeft.disabled = isAtStart;
            navRight.disabled = isAtEnd;
        };

        const scrollCarousel = (direction) => {
            const target = carousel.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            carousel.scrollTo({ left: target, behavior: 'smooth' });
        };

        navLeft.addEventListener('click', () => scrollCarousel('left'));
        navRight.addEventListener('click', () => scrollCarousel('right'));

        carousel.addEventListener('scroll', updateArrowState, { passive: true });
        window.addEventListener('resize', updateArrowState);

        updateArrowState();
    });
}

/**
 * Setup touch/swipe support for carousels
 */
function setupCarouselTouch() {
    document.querySelectorAll('.carousel-container').forEach(carousel => {
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                const scrollAmount = 360;
                const direction = diff > 0 ? 1 : -1;
                const target = carousel.scrollLeft + (scrollAmount * direction);
                carousel.scrollTo({ left: target, behavior: 'smooth' });
            }
        };
    });
}

/**
 * Setup hero slideshow
 */
function setupHeroSlideshow() {
    const slideshow = document.querySelector('.hero-slideshow');
    if (!slideshow) return;

    const slides = slideshow.querySelectorAll('.hero-slide');
    const dots = slideshow.querySelectorAll('.hero-dot');
    const prevBtn = slideshow.querySelector('.hero-nav-prev');
    const nextBtn = slideshow.querySelector('.hero-nav-next');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let autoplayInterval;

    const showSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    };

    const nextSlide = () => {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
        resetAutoplay();
    };

    const prevSlide = () => {
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
        resetAutoplay();
    };

    const startAutoplay = () => {
        autoplayInterval = setInterval(nextSlide, 5000);
    };

    const stopAutoplay = () => {
        clearInterval(autoplayInterval);
    };

    const resetAutoplay = () => {
        stopAutoplay();
        startAutoplay();
    };

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetAutoplay();
        });
    });

    slideshow.addEventListener('mouseenter', stopAutoplay);
    slideshow.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
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
 * Render TV series detail page
 */
function renderTVDetail(tv) {
    if (!tv || !tv.name || typeof tv.id !== 'number') {
        return renderError('Série não encontrada ou dados inválidos');
    }

    const backdrop = tv.backdrop_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`)
        : null;

    const poster = tv.poster_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w500${tv.poster_path}`)
        : null;

    const backdropImg = backdrop
        ? `<img src="${backdrop}" alt="Cena de ${escapeHtml(tv.name)}" class="detail-backdrop-image" loading="lazy">`
        : `<div class="detail-backdrop-image" style="background-color: var(--bg-tertiary);"></div>`;

    const posterImg = poster
        ? `<img src="${poster}" alt="Poster de ${escapeHtml(tv.name)}" class="detail-poster" loading="lazy">`
        : `<div class="detail-poster" style="background-color: var(--bg-tertiary);"></div>`;

    const rating = renderStarRating(tv.vote_average);

    const genres = Array.isArray(tv.genres)
        ? tv.genres
            .filter(g => g && g.name)
            .map(g => `<span class="genre-tag">${escapeHtml(g.name)}</span>`)
            .join('')
        : '';

    const seasons = tv.number_of_seasons || 0;
    const episodes = tv.number_of_episodes || 0;
    const seriesInfo = `<div class="series-info"><span>${seasons} ${seasons === 1 ? 'Temporada' : 'Temporadas'} • ${episodes} ${episodes === 1 ? 'Episódio' : 'Episódios'}</span></div>`;

    const castMembers = Array.isArray(tv.credits?.cast)
        ? tv.credits.cast
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
    const videoKey = getVideoKey(tv.videos?.results);
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

    return `
        ${renderBreadcrumb(tv.name)}

        <button class="back-button" id="back-button" aria-label="Voltar para página anterior"><span style="display: inline-block;">←</span> Voltar</button>

        <div class="detail-backdrop">
            ${backdropImg}
        </div>

        <div class="detail-container">
            <div>${posterImg}</div>
            <div class="detail-info">
                <h1>${escapeHtml(tv.name)}</h1>
                <div class="detail-meta">
                    <div class="detail-rating">${rating}</div>
                    <div class="detail-genres">${genres}</div>
                </div>
                ${seriesInfo}
                <div class="detail-overview">${escapeHtml(tv.overview || 'Sem sinopse disponível')}</div>
                ${castHtml}
                ${videoHtml}
            </div>
        </div>
    `;
}

/**
 * Render top list page
 */
function renderTopList(items) {
    if (!items || !Array.isArray(items)) {
        return renderError('Dados inválidos recebidos do servidor');
    }

    const topItems = items.slice(0, 20);

    if (topItems.length === 0) {
        return `<div class="top-list-page">
            <h1 class="top-list-title">Top Lista</h1>
            <div class="no-results">Nenhum item encontrado</div>
        </div>`;
    }

    const listHtml = topItems.map((item, index) => {
        const title = item.title || item.name || '';
        const isTV = item.media_type === 'tv';
        const rating = renderStarRating(item.vote_average);

        const poster = item.poster_path
            ? validateImageUrl(`https://image.tmdb.org/t/p/w154${item.poster_path}`)
            : null;

        const posterImg = poster
            ? `<img src="${poster}" alt="${escapeHtml(title)}" class="top-list-poster" loading="lazy">`
            : `<div class="top-list-poster" style="background-color: var(--bg-tertiary);"></div>`;

        const mediaTypeBadge = renderMediaTypeBadge(item.media_type);

        return `
            <div class="top-list-item" data-rank="${index + 1}" data-item-id="${item.id}" data-media-type="${item.media_type || 'movie'}" tabindex="0" role="button">
                <div class="top-list-rank">${index + 1}</div>
                <div class="top-list-poster-container">
                    ${posterImg}
                </div>
                <div class="top-list-content">
                    <div class="top-list-item-title">${escapeHtml(title)}</div>
                    <div class="top-list-item-meta">
                        <div>${rating}</div>
                        ${mediaTypeBadge}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="top-list-page">
            <h1 class="top-list-title">Top 20 Filmes e Séries</h1>
            <div class="top-list-container">
                ${listHtml}
            </div>
        </div>
    `;
}

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
 * Render media type badge
 */
function renderMediaTypeBadge(mediaType) {
    if (mediaType === 'tv') {
        return '<span class="media-badge media-badge-tv">Série</span>';
    }
    return '<span class="media-badge media-badge-movie">Filme</span>';
}

/**
 * Render person card for people page
 */
function renderPersonCard(person) {
    if (!person || typeof person.id !== 'number') {
        return '';
    }

    const name = person.name || '';
    if (!name) return '';

    const photo = person.profile_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w185${person.profile_path}`)
        : null;

    const photoImg = photo
        ? `<img src="${photo}" alt="${escapeHtml(name)}" class="person-photo" loading="lazy">`
        : `<div class="person-photo" style="background-color: var(--bg-tertiary);"></div>`;

    const knownFor = Array.isArray(person.known_for)
        ? person.known_for.slice(0, 2).map(m => escapeHtml(m.title || m.name || '')).join(', ')
        : '';

    return `
        <div class="person-card" data-person-id="${person.id}" tabindex="0" role="button" aria-label="${escapeHtml(name)}">
            ${photoImg}
            <div class="person-info">
                <div class="person-name">${escapeHtml(name)}</div>
                <div class="person-known-for">${escapeHtml(knownFor)}</div>
            </div>
        </div>
    `;
}

/**
 * Render people page (popular people)
 */
function renderPeoplePage(people) {
    if (!people || !Array.isArray(people.results)) {
        return renderError('Dados inválidos recebidos do servidor');
    }

    const peopleList = people.results || [];

    if (peopleList.length === 0) {
        return `<div class="people-page">
            <h1 class="people-title">Pessoas Populares</h1>
            <div class="no-results">Nenhuma pessoa encontrada</div>
        </div>`;
    }

    return `
        <div class="people-page">
            <h1 class="people-title">Pessoas Populares</h1>
            <div class="people-grid">
                ${peopleList.map(p => renderPersonCard(p)).join('')}
            </div>
        </div>
    `;
}

/**
 * Render person detail page
 */
function renderPersonDetail(person) {
    if (!person || !person.name || typeof person.id !== 'number') {
        return renderError('Pessoa não encontrada ou dados inválidos');
    }

    const photo = person.profile_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w500${person.profile_path}`)
        : null;

    const photoImg = photo
        ? `<img src="${photo}" alt="${escapeHtml(person.name)}" class="detail-person-photo" loading="lazy">`
        : `<div class="detail-person-photo" style="background-color: var(--bg-tertiary);"></div>`;

    const birthday = person.birthday ? `Nascimento: ${escapeHtml(person.birthday)}` : '';

    // Movies
    let moviesHtml = '';
    if (Array.isArray(person.movie_credits?.cast) && person.movie_credits.cast.length > 0) {
        const movies = person.movie_credits.cast.slice(0, 10);
        const movieItems = movies.map(m => {
            const title = m.title || '';
            if (!title) return '';
            return `
                <div class="filmography-item" data-movie-id="${m.id}" data-media-type="movie" tabindex="0" role="button">
                    <div class="filmography-title">${escapeHtml(title)}</div>
                    <div class="filmography-character">${escapeHtml(m.character || '')}</div>
                </div>
            `;
        }).join('');

        if (movieItems) {
            moviesHtml = `
                <div class="filmography-section">
                    <h3 class="filmography-section-title">Filmes</h3>
                    <div class="filmography-list">
                        ${movieItems}
                    </div>
                </div>
            `;
        }
    }

    // TV Shows
    let tvHtml = '';
    if (Array.isArray(person.tv_credits?.cast) && person.tv_credits.cast.length > 0) {
        const shows = person.tv_credits.cast.slice(0, 10);
        const tvItems = shows.map(s => {
            const name = s.name || '';
            if (!name) return '';
            return `
                <div class="filmography-item" data-tv-id="${s.id}" data-media-type="tv" tabindex="0" role="button">
                    <div class="filmography-title">${escapeHtml(name)}</div>
                    <div class="filmography-character">${escapeHtml(s.character || '')}</div>
                </div>
            `;
        }).join('');

        if (tvItems) {
            tvHtml = `
                <div class="filmography-section">
                    <h3 class="filmography-section-title">Séries</h3>
                    <div class="filmography-list">
                        ${tvItems}
                    </div>
                </div>
            `;
        }
    }

    return `
        ${renderBreadcrumb(person.name)}

        <button class="back-button" id="back-button" aria-label="Voltar para página anterior"><span style="display: inline-block;">←</span> Voltar</button>

        <div class="person-detail-container">
            <div class="person-detail-photo-wrapper">
                ${photoImg}
            </div>
            <div class="person-detail-info">
                <h1>${escapeHtml(person.name)}</h1>
                <div class="person-detail-meta">
                    ${birthday ? `<div class="person-birthday">${birthday}</div>` : ''}
                </div>
                <div class="person-biography">${escapeHtml(person.biography || 'Biografia não disponível')}</div>
                ${moviesHtml}
                ${tvHtml}
            </div>
        </div>
    `;
}

/**
 * Render trending day page
 */
function renderTrendingDay(items) {
    if (!items || !Array.isArray(items.results)) {
        return renderError('Dados inválidos recebidos do servidor');
    }

    const trendingList = items.results || [];

    if (trendingList.length === 0) {
        return `<div class="trending-day-page">
            <h1 class="trending-day-title">Tendência do Dia</h1>
            <div class="no-results">Nenhum item em tendência</div>
        </div>`;
    }

    return `
        <div class="trending-day-page">
            <h1 class="trending-day-title">Tendência do Dia</h1>
            <div class="trending-day-grid">
                ${trendingList.map(m => {
                    const card = renderMovieCard(m, true);
                    return card;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Render collection page
 */
function renderCollectionPage(collection) {
    if (!collection || !collection.name || typeof collection.id !== 'number') {
        return renderError('Coleção não encontrada ou dados inválidos');
    }

    const parts = Array.isArray(collection.parts) ? collection.parts : [];

    let partsHtml = '';
    if (parts.length > 0) {
        partsHtml = `
            <div class="collection-parts">
                ${parts.map((movie, index) => {
                    const title = movie.title || '';
                    const poster = movie.poster_path
                        ? validateImageUrl(`https://image.tmdb.org/t/p/w342${movie.poster_path}`)
                        : null;

                    const posterImg = poster
                        ? `<img src="${poster}" alt="${escapeHtml(title)}" class="collection-poster" loading="lazy">`
                        : `<div class="collection-poster" style="background-color: var(--bg-tertiary);"></div>`;

                    return `
                        <div class="collection-item" data-movie-id="${movie.id}" tabindex="0" role="button">
                            <div class="collection-number">${index + 1}</div>
                            <div class="collection-poster-container">
                                ${posterImg}
                            </div>
                            <div class="collection-item-info">
                                <div class="collection-item-title">${escapeHtml(title)}</div>
                                ${movie.release_date ? `<div class="collection-item-year">${escapeHtml(movie.release_date.split('-')[0])}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    return `
        ${renderBreadcrumb(collection.name)}

        <button class="back-button" id="back-button" aria-label="Voltar para página anterior"><span style="display: inline-block;">←</span> Voltar</button>

        <div class="collection-detail">
            <h1>${escapeHtml(collection.name)}</h1>
            ${collection.overview ? `<div class="collection-overview">${escapeHtml(collection.overview)}</div>` : ''}
            ${partsHtml}
        </div>
    `;
}

/**
 * Render a single movie card
 */
function renderMovieCard(movie, isTrending = false) {
    if (!movie || typeof movie.id !== 'number') {
        return '';
    }

    const isTV = movie.media_type === 'tv' || !movie.title;
    const title = movie.title || movie.name || '';

    if (!title) {
        return '';
    }

    const poster = movie.poster_path
        ? validateImageUrl(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
        : null;

    const posterImg = poster
        ? `<img src="${poster}" alt="${escapeHtml(title)}" class="movie-poster" loading="lazy">`
        : `<div class="movie-poster" style="background-color: var(--bg-tertiary);"></div>`;

    const rating = renderStarRating(movie.vote_average);
    const trendingBadge = isTrending ? '<span class="movie-badge">Em Alta</span>' : '';
    const mediaTypeBadge = movie.media_type ? renderMediaTypeBadge(movie.media_type) : '';

    return `
        <div class="movie-card" data-movie-id="${movie.id}" data-media-type="${movie.media_type || 'movie'}" tabindex="0" role="button" aria-label="${escapeHtml(title)}, classificação ${rating}">
            ${trendingBadge}
            ${mediaTypeBadge}
            ${posterImg}
            <div class="movie-info">
                <div class="movie-title">${escapeHtml(title)}</div>
                <div class="movie-rating">${rating}</div>
            </div>
        </div>
    `;
}

/**
 * Render hero slideshow
 */
function renderHeroSlideshow(trendingMovies) {
    if (!Array.isArray(trendingMovies) || trendingMovies.length === 0) {
        return '';
    }

    const slides = trendingMovies.slice(0, 5).map((movie, index) => {
        const backdropUrl = movie.backdrop_path
            ? validateImageUrl(`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`)
            : null;

        const slideImage = backdropUrl
            ? `<img src="${backdropUrl}" alt="Cena de ${escapeHtml(movie.title)}" class="hero-slide-image" loading="lazy">`
            : `<div class="hero-slide-image" style="background-color: var(--bg-tertiary);"></div>`;

        return `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
                ${slideImage}
                <div class="hero-overlay">
                    <div class="hero-info">
                        <div class="hero-title">${escapeHtml(movie.title)}</div>
                        <div class="hero-rating">★ ${(movie.vote_average || 0).toFixed(1)}</div>
                        <div class="hero-overview">${escapeHtml(movie.overview || '')}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const dotsHtml = trendingMovies.slice(0, 5).map((_, index) => `
        <button class="hero-dot ${index === 0 ? 'active' : ''}" data-slide-index="${index}" aria-label="Ir para slide ${index + 1}"></button>
    `).join('');

    return `
        <div class="hero-slideshow">
            ${slides}
            <button class="hero-nav-btn hero-nav-prev" aria-label="Slide anterior">‹</button>
            <button class="hero-nav-btn hero-nav-next" aria-label="Próximo slide">›</button>
            <div class="hero-controls">
                ${dotsHtml}
            </div>
        </div>
    `;
}

/**
 * Global state for home page media type
 */
let homeMediaType = 'movie';

/**
 * Render home page with hero banner and carousels
 */
function renderHome(trendingData, popularData, topRatedData, genresData, nowPlayingData, upcomingData) {
    if (!trendingData || !Array.isArray(trendingData.results)) {
        return renderError('Dados inválidos recebidos do servidor');
    }

    const trendingMovies = Array.isArray(trendingData.results) ? trendingData.results.slice(0, 20) : [];
    const heroBanner = renderHeroSlideshow(trendingMovies.slice(0, 5));

    const mediaToggle = `
        <div class="media-toggle-section">
            <div class="media-toggle">
                <button class="media-toggle-btn media-toggle-btn-active" data-media-type="movie">Filmes</button>
                <button class="media-toggle-btn" data-media-type="tv">Séries</button>
            </div>
        </div>
    `;

    const quickLinks = `
        <div class="quick-links-section">
            <a href="#/people" class="quick-link-btn">👥 Pessoas Populares</a>
            <a href="#/trending/day" class="quick-link-btn">🔥 Tendência de Hoje</a>
            <a href="#/top" class="quick-link-btn">⭐ Top 20</a>
        </div>
    `;

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

    const popularMovies = Array.isArray(popularData?.results) ? popularData.results.slice(0, 20) : [];
    const topRatedMovies = Array.isArray(topRatedData?.results) ? topRatedData.results.slice(0, 20) : [];
    const nowPlayingMovies = Array.isArray(nowPlayingData?.results) ? nowPlayingData.results.slice(0, 20) : [];
    const upcomingMovies = Array.isArray(upcomingData?.results) ? upcomingData.results.slice(0, 20) : [];

    return `
        ${heroBanner}

        ${mediaToggle}

        ${quickLinks}

        ${genresHtml}

        <div class="carousel-section is-home-carousel">
            <div class="section-title">Em Cartaz</div>
            <div class="carousel-container">
                ${nowPlayingMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
            <button class="carousel-nav carousel-nav-left" aria-label="Rolar para esquerda">‹</button>
            <button class="carousel-nav carousel-nav-right" aria-label="Rolar para direita">›</button>
        </div>

        <div class="carousel-section is-home-carousel">
            <div class="section-title">Tendência da Semana</div>
            <div class="carousel-container">
                ${trendingMovies.map(m => renderMovieCard(m, true)).join('')}
            </div>
            <button class="carousel-nav carousel-nav-left" aria-label="Rolar para esquerda">‹</button>
            <button class="carousel-nav carousel-nav-right" aria-label="Rolar para direita">›</button>
        </div>

        <div class="carousel-section is-home-carousel">
            <div class="section-title">Próximos Lançamentos</div>
            <div class="carousel-container">
                ${upcomingMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
            <button class="carousel-nav carousel-nav-left" aria-label="Rolar para esquerda">‹</button>
            <button class="carousel-nav carousel-nav-right" aria-label="Rolar para direita">›</button>
        </div>

        <div class="carousel-section is-home-carousel">
            <div class="section-title">Populares Agora</div>
            <div class="carousel-container">
                ${popularMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
            <button class="carousel-nav carousel-nav-left" aria-label="Rolar para esquerda">‹</button>
            <button class="carousel-nav carousel-nav-right" aria-label="Rolar para direita">›</button>
        </div>

        <div class="carousel-section is-home-carousel">
            <div class="section-title">Melhor Avaliados</div>
            <div class="carousel-container">
                ${topRatedMovies.map(m => renderMovieCard(m, false)).join('')}
            </div>
            <button class="carousel-nav carousel-nav-left" aria-label="Rolar para esquerda">‹</button>
            <button class="carousel-nav carousel-nav-right" aria-label="Rolar para direita">›</button>
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
                    <div class="cast-member" data-person-id="${actor.id}" tabindex="0" role="button" aria-label="${escapeHtml(actor.name)}">
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
            <div class="similar-section is-home-carousel">
                <div class="similar-title">Filmes Similares</div>
                <div class="carousel-container">
                    ${similarMovies.map(m => renderMovieCard(m)).join('')}
                </div>
                <button class="carousel-nav carousel-nav-left" aria-label="Rolar para esquerda">‹</button>
                <button class="carousel-nav carousel-nav-right" aria-label="Rolar para direita">›</button>
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
        attachMediaToggleListeners();
        setupCardAnimationDelays();
        setupHeroSlideshow();
        setupCarouselNavigation();
        setupCarouselTouch();
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
        attachPersonCardListeners();
        setupCarouselNavigation();
        setupCarouselTouch();
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
 * Load and render TV series detail page
 */
async function loadTVDetail(tvId) {
    const validatedId = validateMovieId(tvId);

    if (validatedId === null) {
        app.innerHTML = renderError('ID de série inválido');
        focusMainContent();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const tv = await apiFetch(`/api/tv/${validatedId}`);

        app.innerHTML = renderTVDetail(tv);

        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.hash = '#/';
            });
        }

        attachTopListItemListeners();
        setupCarouselNavigation();
        setupCarouselTouch();
        focusMainContent();
        announceToScreenReader(`Detalhes da série: ${tv.name}`);
        currentPage = 'tv-detail';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar série: ${error.message}`);
    }
}

/**
 * Load and render top list page
 */
async function loadTopList() {
    app.innerHTML = renderLoading();

    try {
        const data = await apiFetch('/api/top-list');
        app.innerHTML = renderTopList(data.results);
        attachTopListItemListeners();
        focusMainContent();
        announceToScreenReader('Top 20 Filmes e Séries carregados');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'top-list';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar top lista: ${error.message}`);
    }
}

/**
 * Load popular people page
 */
async function loadPeople() {
    app.innerHTML = renderLoading();

    try {
        const data = await apiFetch('/api/people/popular');
        app.innerHTML = renderPeoplePage(data);
        attachPersonCardListeners();
        focusMainContent();
        announceToScreenReader('Pessoas populares carregadas');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'people';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar pessoas: ${error.message}`);
    }
}

/**
 * Load person detail page
 */
async function loadPersonDetail(personId) {
    const validatedId = validateMovieId(personId);

    if (validatedId === null) {
        app.innerHTML = renderError('ID de pessoa inválido');
        focusMainContent();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const person = await apiFetch(`/api/person/${validatedId}`);
        app.innerHTML = renderPersonDetail(person);

        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.history.back();
            });
        }

        attachFilmographyListeners();
        focusMainContent();
        announceToScreenReader(`Detalhes da pessoa: ${person.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'person-detail';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar pessoa: ${error.message}`);
    }
}

/**
 * Load trending today page
 */
async function loadTrendingDay() {
    app.innerHTML = renderLoading();

    try {
        const data = await apiFetch('/api/trending/day');
        app.innerHTML = renderTrendingDay(data);
        attachMovieCardListeners();
        focusMainContent();
        announceToScreenReader('Tendência do dia carregada');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'trending-day';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar tendência do dia: ${error.message}`);
    }
}

/**
 * Load collection page
 */
async function loadCollectionPage(collectionId) {
    const validatedId = validateMovieId(collectionId);

    if (validatedId === null) {
        app.innerHTML = renderError('ID de coleção inválido');
        focusMainContent();
        return;
    }

    app.innerHTML = renderLoading();

    try {
        const collection = await apiFetch(`/api/collection/${validatedId}`);
        app.innerHTML = renderCollectionPage(collection);

        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.history.back();
            });
        }

        attachCollectionListeners();
        focusMainContent();
        announceToScreenReader(`Coleção carregada: ${collection.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentPage = 'collection';
    } catch (error) {
        app.innerHTML = renderError(error.message);
        focusMainContent();
        announceToScreenReader(`Erro ao carregar coleção: ${error.message}`);
    }
}

/**
 * Attach click and keyboard listeners to movie cards
 */
function attachMovieCardListeners() {
    document.querySelectorAll('.movie-card').forEach(card => {
        const handleCardActivation = () => {
            const movieId = card.dataset.movieId;
            const mediaType = card.dataset.mediaType || 'movie';

            if (mediaType === 'tv') {
                window.location.hash = `#/tv/${movieId}`;
            } else {
                window.location.hash = `#/movie/${movieId}`;
            }
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
 * Attach click and keyboard listeners to top list items
 */
function attachTopListItemListeners() {
    document.querySelectorAll('.top-list-item').forEach(item => {
        const handleItemActivation = () => {
            const itemId = item.dataset.itemId;
            const mediaType = item.dataset.mediaType || 'movie';

            if (mediaType === 'tv') {
                window.location.hash = `#/tv/${itemId}`;
            } else {
                window.location.hash = `#/movie/${itemId}`;
            }
        };

        item.addEventListener('click', handleItemActivation);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemActivation();
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
 * Attach listeners to media toggle buttons
 */
function attachMediaToggleListeners() {
    document.querySelectorAll('.media-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const mediaType = btn.dataset.mediaType;
            homeMediaType = mediaType;

            // Update button states
            document.querySelectorAll('.media-toggle-btn').forEach(b => {
                b.classList.remove('media-toggle-btn-active');
            });
            btn.classList.add('media-toggle-btn-active');

            // Update sliding indicator
            const toggle = document.querySelector('.media-toggle');
            if (toggle) {
                toggle.classList.toggle('tv-active', mediaType === 'tv');
            }

            // Reload home page with different media type
            app.innerHTML = renderLoading();
            try {
                await transitionPage();
                const [trending, popular, topRated, genres, nowPlaying, upcoming] = await Promise.all([
                    mediaType === 'tv' ? apiFetch('/api/tv/trending') : apiFetch('/api/trending'),
                    mediaType === 'tv' ? apiFetch('/api/tv/popular') : apiFetch('/api/popular'),
                    mediaType === 'tv' ? apiFetch('/api/tv/top-rated') : apiFetch('/api/top-rated'),
                    apiFetch('/api/genres'),
                    mediaType === 'tv' ? apiFetch('/api/tv/trending') : apiFetch('/api/now-playing'),
                    mediaType === 'tv' ? apiFetch('/api/tv/popular') : apiFetch('/api/upcoming')
                ]);

                app.innerHTML = renderHome(trending, popular, topRated, genres, nowPlaying, upcoming);
                attachMovieCardListeners();
                attachGenrePillListeners();
                attachMediaToggleListeners();
                setupCardAnimationDelays();
                setupHeroSlideshow();
                setupCarouselNavigation();
                setupCarouselTouch();
                focusMainContent();
                const mediaLabel = mediaType === 'tv' ? 'Séries' : 'Filmes';
                announceToScreenReader(`Exibindo ${mediaLabel}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                app.innerHTML = renderError(error.message);
                focusMainContent();
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

/**
 * Attach click listeners to person cards
 */
function attachPersonCardListeners() {
    document.querySelectorAll('.person-card').forEach(card => {
        const handleCardActivation = () => {
            const personId = card.dataset.personId;
            if (personId) {
                window.location.hash = `#/person/${personId}`;
            }
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
 * Attach click listeners to filmography items
 */
function attachFilmographyListeners() {
    document.querySelectorAll('.filmography-item').forEach(item => {
        const handleItemActivation = () => {
            const movieId = item.dataset.movieId;
            const tvId = item.dataset.tvId;

            if (movieId) {
                window.location.hash = `#/movie/${movieId}`;
            } else if (tvId) {
                window.location.hash = `#/tv/${tvId}`;
            }
        };

        item.addEventListener('click', handleItemActivation);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemActivation();
            }
        });
    });
}

/**
 * Attach click listeners to collection items
 */
function attachCollectionListeners() {
    document.querySelectorAll('.collection-item').forEach(item => {
        const handleItemActivation = () => {
            const movieId = item.dataset.movieId;
            if (movieId) {
                window.location.hash = `#/movie/${movieId}`;
            }
        };

        item.addEventListener('click', handleItemActivation);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemActivation();
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
    } else if (hash === '/top') {
        loadTopList();
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
    } else if (hash.startsWith('/tv/')) {
        const tvId = hash.slice(4);
        const validatedId = validateMovieId(tvId);
        if (validatedId !== null) {
            loadTVDetail(tvId);
        } else {
            app.innerHTML = renderError('Série não encontrada');
        }
    } else if (hash === '/people') {
        loadPeople();
    } else if (hash.startsWith('/person/')) {
        const personId = hash.slice(8);
        const validatedId = validateMovieId(personId);
        if (validatedId !== null) {
            loadPersonDetail(personId);
        } else {
            app.innerHTML = renderError('Pessoa não encontrada');
        }
    } else if (hash === '/trending/day') {
        loadTrendingDay();
    } else if (hash.startsWith('/collection/')) {
        const collectionId = hash.slice(12);
        const validatedId = validateMovieId(collectionId);
        if (validatedId !== null) {
            loadCollectionPage(collectionId);
        } else {
            app.innerHTML = renderError('Coleção não encontrada');
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
