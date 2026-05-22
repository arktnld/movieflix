import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

let server;
let baseUrl;

describe('MovieFlix Frontend - Static Files', () => {
  before(async () => {
    return new Promise((resolve, reject) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Test server listening on ${baseUrl}`);
        resolve();
      });
      server.on('error', reject);
    });
  });

  after(async () => {
    return new Promise((resolve, reject) => {
      if (server) {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  });

  test('GET / serves index.html with 200 status', async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.strictEqual(response.status, 200);
    const contentType = response.headers.get('Content-Type');
    assert(contentType.includes('text/html'), `Content-Type should include text/html, got: ${contentType}`);
  });

  test('GET /app.js serves JavaScript with 200 status', async () => {
    const response = await fetch(`${baseUrl}/app.js`);
    assert.strictEqual(response.status, 200);
    const contentType = response.headers.get('Content-Type');
    assert(contentType.includes('javascript'), `Content-Type should include javascript, got: ${contentType}`);
  });

  test('GET /style.css serves CSS with 200 status', async () => {
    const response = await fetch(`${baseUrl}/style.css`);
    assert.strictEqual(response.status, 200);
    const contentType = response.headers.get('Content-Type');
    assert(contentType.includes('text/css'), `Content-Type should include text/css, got: ${contentType}`);
  });

  test('GET / index.html contains expected elements', async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();
    assert(html.includes('MovieFlix'), 'HTML should contain MovieFlix title');
    assert(html.includes('id="app"'), 'HTML should contain app container with id="app"');
    assert(html.includes('app.js'), 'HTML should reference app.js script');
  });

  test('GET /nonexistent.html returns 404', async () => {
    const response = await fetch(`${baseUrl}/nonexistent.html`);
    assert.strictEqual(response.status, 404);
  });

  test('GET / includes security headers X-Content-Type-Options', async () => {
    const response = await fetch(`${baseUrl}/`);
    const header = response.headers.get('X-Content-Type-Options');
    assert.strictEqual(header, 'nosniff', 'X-Content-Type-Options should be nosniff');
  });

  test('GET / includes security headers X-Frame-Options', async () => {
    const response = await fetch(`${baseUrl}/`);
    const header = response.headers.get('X-Frame-Options');
    assert.strictEqual(header, 'DENY', 'X-Frame-Options should be DENY');
  });

  test('GET / includes Content-Security-Policy header', async () => {
    const response = await fetch(`${baseUrl}/`);
    const header = response.headers.get('Content-Security-Policy');
    assert(header, 'Content-Security-Policy header should be present');
    assert(header.includes('default-src'), 'CSP should include default-src directive');
  });

  test('GET /favicon.ico returns 404 (favicon is inline data URI)', async () => {
    const response = await fetch(`${baseUrl}/favicon.ico`);
    assert.strictEqual(response.status, 404, 'favicon.ico should return 404 since favicon is inline SVG data URI in HTML');
  });

  test('app.js has valid JavaScript syntax', () => {
    const appPath = join(publicDir, 'app.js');
    try {
      execSync(`node -c "${appPath}"`, { stdio: 'pipe' });
    } catch (error) {
      assert.fail(`app.js has syntax errors: ${error.stderr.toString()}`);
    }
  });

  test('app.js does not contain escaped exclamation marks (\\!)', () => {
    const code = readFileSync(join(publicDir, 'app.js'), 'utf8');
    const matches = code.match(/\\\!/g);
    assert.strictEqual(matches, null, `Found ${matches ? matches.length : 0} escaped \\! in app.js — should use ! not \\!`);
  });

  test('app.js functions called in loadHome are defined', () => {
    const code = readFileSync(join(publicDir, 'app.js'), 'utf8');
    const calledFunctions = [
      'renderHome', 'renderLoading', 'renderError', 'renderHeroSlideshow',
      'renderMovieCard', 'renderStarRating', 'escapeHtml', 'apiFetch',
      'attachMovieCardListeners', 'setupCardAnimationDelays',
      'setupHeroSlideshow', 'setupCarouselNavigation', 'setupCarouselTouch',
      'focusMainContent', 'announceToScreenReader', 'showLoadingBar', 'hideLoadingBar'
    ];
    for (const fn of calledFunctions) {
      assert(code.includes(`function ${fn}`), `Function ${fn}() is called but not defined in app.js`);
    }
  });
});
