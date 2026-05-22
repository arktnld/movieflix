import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

let server;
let baseUrl;

describe('MovieFlix API Proxy', () => {
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

  test('GET /api/trending should return 200 with results array', async () => {
    const response = await fetch(`${baseUrl}/api/trending`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert(Array.isArray(data.results), 'response should have results array');
  });

  test('GET /api/popular should return 200 with results array', async () => {
    const response = await fetch(`${baseUrl}/api/popular`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert(Array.isArray(data.results), 'response should have results array');
  });

  test('GET /api/top-rated should return 200 with results array', async () => {
    const response = await fetch(`${baseUrl}/api/top-rated`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert(Array.isArray(data.results), 'response should have results array');
  });

  test('GET /api/search?q=matrix should return 200 with results array', async () => {
    const response = await fetch(`${baseUrl}/api/search?q=matrix`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert(Array.isArray(data.results), 'response should have results array');
  });

  test('GET /api/search without query should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/search`);
    assert.strictEqual(response.status, 400);
  });

  test('GET /api/search with empty query should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/search?q=`);
    assert.strictEqual(response.status, 400);
  });

  test('GET /api/movie/550 should return 200 with title', async () => {
    const response = await fetch(`${baseUrl}/api/movie/550`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert(data.title, 'response should have title property');
  });

  test('GET /api/movie/abc should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/movie/abc`);
    assert.strictEqual(response.status, 400);
  });

  test('GET /api/movie/999999999 should respond with TMDB response', async () => {
    const response = await fetch(`${baseUrl}/api/movie/999999999`);
    assert(response.status === 404 || response.status >= 400, 'should be error response');
  });

  test('Security headers: Should include required headers', async () => {
    const response = await fetch(`${baseUrl}/api/trending`);
    assert.strictEqual(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.strictEqual(response.headers.get('X-Frame-Options'), 'DENY');
    assert.strictEqual(response.headers.get('X-XSS-Protection'), '1; mode=block');
    assert(response.headers.get('Content-Security-Policy'), 'CSP header should be present');
  });

  test('Search query length: 201+ chars should return 400', async () => {
    const longQuery = 'a'.repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(longQuery)}`);
    assert.strictEqual(response.status, 400);
  });

  test('Movie ID max digits: 11 digits should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/movie/12345678901`);
    assert.strictEqual(response.status, 400);
  });

  test('Movie ID zero: /api/movie/0 should respond', async () => {
    const response = await fetch(`${baseUrl}/api/movie/0`);
    // 0 is valid numeric, so it should pass validation and reach TMDB
    assert(response.status === 200 || response.status === 404 || response.status >= 400, 'should be valid response or error');
  });

  test('Movie ID negative: /api/movie/-1 should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/movie/-1`);
    assert.strictEqual(response.status, 400);
  });

  test('Special characters in search: XSS attempt should be handled safely', async () => {
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('<script>alert(1)</script>')}`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert(Array.isArray(data.results), 'response should have results array');
  });

  test('Unexpected query params on /api/trending: Should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/trending?foo=bar`);
    assert.strictEqual(response.status, 400);
  });

  test('Search with unexpected extra params: Should return 400', async () => {
    const response = await fetch(`${baseUrl}/api/search?q=test&extra=bad`);
    assert.strictEqual(response.status, 400);
  });

  test('Content-Type header: All JSON responses should have application/json', async () => {
    const response = await fetch(`${baseUrl}/api/trending`);
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  });
});
