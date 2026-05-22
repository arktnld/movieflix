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
});
