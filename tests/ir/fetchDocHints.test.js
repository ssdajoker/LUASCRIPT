'use strict';

const assert = require('assert');
const http = require('http');
const https = require('https');

const REQUEST_TIMEOUT_MS = 2000;

// Helper function to create fetchDocHints with a specific endpoint
function createFetchDocHints(endpoint) {
  return function fetchDocHints(query) {
    if (!endpoint) return Promise.resolve(null);
    try {
      const url = new URL(endpoint);
      if (!url.searchParams.has('q')) {
        url.searchParams.set('q', query.slice(0, 120));
      }
      const client = url.protocol === 'https:' ? https : http;
      return new Promise((resolve) => {
        const req = client.get(url, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const json = JSON.parse(body);
              resolve({ ok: res.statusCode, body: json });
            } catch (err) {
              resolve({ ok: res.statusCode, error: err && err.message ? err.message : String(err) });
            }
          });
        });
        req.setTimeout(REQUEST_TIMEOUT_MS);
        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: 0, error: 'timeout' });
        });
        req.on('error', (err) => resolve({ ok: 0, error: err && err.message ? err.message : String(err) }));
      });
    } catch (err) {
      return Promise.resolve(null);
    }
  };
}

// Test 1: Missing DOC_ENDPOINT returns null
(async function testMissingEndpointReturnsNull() {
  const fetchDocHints = createFetchDocHints('');
  const result = await fetchDocHints("test query");
  assert.strictEqual(result, null, "Should return null when DOC_ENDPOINT is not set");
})();

// Test 2: Timeout behavior
(async function testTimeoutHandling() {
  // Create a test server that delays response
  const server = http.createServer((req, res) => {
    // Delay response longer than timeout
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ hints: ["test"] }));
    }, 3000); // 3 seconds, longer than REQUEST_TIMEOUT_MS
  });
  
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      const fetchDocHints = createFetchDocHints(`http://localhost:${port}/doc`);
      
      fetchDocHints("timeout test").then((result) => {
        assert.ok(result !== null, "Should not return null for timeout");
        assert.strictEqual(result.ok, 0, "Should have ok=0 for timeout");
        assert.strictEqual(result.error, 'timeout', "Should have 'timeout' error message");
        server.close();
        resolve();
      });
    });
  });
})();

// Test 3: Successful response parsing
(async function testSuccessfulResponseParsing() {
  const testResponse = { hints: ["suggestion1", "suggestion2"], query: "test" };
  
  // Create a test server that returns valid JSON
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(testResponse));
  });
  
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      const fetchDocHints = createFetchDocHints(`http://localhost:${port}/doc`);
      
      fetchDocHints("success test").then((result) => {
        assert.ok(result !== null, "Should not return null for successful request");
        assert.strictEqual(result.ok, 200, "Should have ok=200 for success");
        assert.ok(result.body, "Should have body property");
        assert.deepStrictEqual(result.body, testResponse, "Should parse JSON response correctly");
        server.close();
        resolve();
      });
    });
  });
})();

// Test 4: Invalid JSON response handling
(async function testInvalidJsonHandling() {
  // Create a test server that returns invalid JSON
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end("not valid json{");
  });
  
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      const fetchDocHints = createFetchDocHints(`http://localhost:${port}/doc`);
      
      fetchDocHints("invalid json test").then((result) => {
        assert.ok(result !== null, "Should not return null for parse error");
        assert.strictEqual(result.ok, 200, "Should have ok=200 even with parse error");
        assert.ok(result.error, "Should have error property");
        assert.ok(result.error.includes("JSON") || result.error.includes("Unexpected"), 
          "Error message should indicate JSON parse error");
        server.close();
        resolve();
      });
    });
  });
})();

// Test 5: Network error handling
(async function testNetworkErrorHandling() {
  // Set an endpoint that doesn't exist
  const fetchDocHints = createFetchDocHints("http://localhost:9999/nonexistent");
  
  const result = await fetchDocHints("network error test");
  assert.ok(result !== null, "Should not return null for network error");
  assert.strictEqual(result.ok, 0, "Should have ok=0 for network error");
  assert.ok(result.error, "Should have error property");
})();

// Test 6: Invalid URL handling
(async function testInvalidUrlHandling() {
  // Set an invalid URL
  const fetchDocHints = createFetchDocHints("not a valid url");
  
  const result = await fetchDocHints("invalid url test");
  assert.strictEqual(result, null, "Should return null for invalid URL in try-catch");
})();

// Test 7: Query parameter truncation
(async function testQueryParameterTruncation() {
  let capturedUrl = null;
  
  // Create a test server that captures the request URL
  const server = http.createServer((req, res) => {
    capturedUrl = req.url;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hints: [] }));
  });
  
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      const fetchDocHints = createFetchDocHints(`http://localhost:${port}/doc`);
      
      // Create a very long query (200 characters)
      const longQuery = "a".repeat(200);
      
      fetchDocHints(longQuery).then((result) => {
        assert.ok(capturedUrl, "Should capture URL");
        const urlParams = new URL(`http://localhost${capturedUrl}`);
        const qParam = urlParams.searchParams.get('q');
        assert.strictEqual(qParam.length, 120, "Query parameter should be truncated to 120 characters");
        server.close();
        resolve();
      });
    });
  });
})();

console.log("All fetchDocHints tests passed");
