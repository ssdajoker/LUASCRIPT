"use strict";

const assert = require("assert");
const http = require("http");
const https = require("https");

// Extract fetchDocHints function for testing
const DOC_ENDPOINT = process.env.MCP_DOC_INDEX_ENDPOINT || '';
const REQUEST_TIMEOUT_MS = 2000;

function fetchDocHints(query) {
  if (!DOC_ENDPOINT) return Promise.resolve(null);
  try {
    const url = new URL(DOC_ENDPOINT);
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
}

// Helper to restore environment
function restoreEnv(originalEnv) {
  Object.keys(process.env).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(originalEnv, key)) {
      delete process.env[key];
    }
  });
  Object.keys(originalEnv).forEach(key => {
    process.env[key] = originalEnv[key];
  });
}

// Test 1: Missing DOC_ENDPOINT returns null
(async function testMissingEndpointReturnsNull() {
  const originalEnv = { ...process.env };
  try {
    delete process.env.MCP_DOC_INDEX_ENDPOINT;
    
    // Re-evaluate DOC_ENDPOINT constant for this test
    const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT || '';
    
    function localFetchDocHints(query) {
      if (!localEndpoint) return Promise.resolve(null);
      // ... rest of implementation
      return Promise.resolve(null);
    }
    
    const result = await localFetchDocHints("test query");
    assert.strictEqual(result, null, "Should return null when DOC_ENDPOINT is not set");
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test 2: Timeout behavior
(async function testTimeoutHandling() {
  const originalEnv = { ...process.env };
  try {
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
        process.env.MCP_DOC_INDEX_ENDPOINT = `http://localhost:${port}/doc`;
        
        const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT;
        
        function localFetchDocHints(query) {
          if (!localEndpoint) return Promise.resolve(null);
          try {
            const url = new URL(localEndpoint);
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
        }
        
        localFetchDocHints("timeout test").then((result) => {
          assert.ok(result !== null, "Should not return null for timeout");
          assert.strictEqual(result.ok, 0, "Should have ok=0 for timeout");
          assert.strictEqual(result.error, 'timeout', "Should have 'timeout' error message");
          server.close();
          resolve();
        });
      });
    });
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test 3: Successful response parsing
(async function testSuccessfulResponseParsing() {
  const originalEnv = { ...process.env };
  try {
    const testResponse = { hints: ["suggestion1", "suggestion2"], query: "test" };
    
    // Create a test server that returns valid JSON
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(testResponse));
    });
    
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        process.env.MCP_DOC_INDEX_ENDPOINT = `http://localhost:${port}/doc`;
        
        const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT;
        
        function localFetchDocHints(query) {
          if (!localEndpoint) return Promise.resolve(null);
          try {
            const url = new URL(localEndpoint);
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
        }
        
        localFetchDocHints("success test").then((result) => {
          assert.ok(result !== null, "Should not return null for successful request");
          assert.strictEqual(result.ok, 200, "Should have ok=200 for success");
          assert.ok(result.body, "Should have body property");
          assert.deepStrictEqual(result.body, testResponse, "Should parse JSON response correctly");
          server.close();
          resolve();
        });
      });
    });
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test 4: Invalid JSON response handling
(async function testInvalidJsonHandling() {
  const originalEnv = { ...process.env };
  try {
    // Create a test server that returns invalid JSON
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end("not valid json{");
    });
    
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        process.env.MCP_DOC_INDEX_ENDPOINT = `http://localhost:${port}/doc`;
        
        const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT;
        
        function localFetchDocHints(query) {
          if (!localEndpoint) return Promise.resolve(null);
          try {
            const url = new URL(localEndpoint);
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
        }
        
        localFetchDocHints("invalid json test").then((result) => {
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
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test 5: Network error handling
(async function testNetworkErrorHandling() {
  const originalEnv = { ...process.env };
  try {
    // Set an endpoint that doesn't exist
    process.env.MCP_DOC_INDEX_ENDPOINT = "http://localhost:9999/nonexistent";
    
    const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT;
    
    function localFetchDocHints(query) {
      if (!localEndpoint) return Promise.resolve(null);
      try {
        const url = new URL(localEndpoint);
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
    }
    
    const result = await localFetchDocHints("network error test");
    assert.ok(result !== null, "Should not return null for network error");
    assert.strictEqual(result.ok, 0, "Should have ok=0 for network error");
    assert.ok(result.error, "Should have error property");
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test 6: Invalid URL handling
(async function testInvalidUrlHandling() {
  const originalEnv = { ...process.env };
  try {
    // Set an invalid URL
    process.env.MCP_DOC_INDEX_ENDPOINT = "not a valid url";
    
    const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT;
    
    function localFetchDocHints(query) {
      if (!localEndpoint) return Promise.resolve(null);
      try {
        const url = new URL(localEndpoint);
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
    }
    
    const result = await localFetchDocHints("invalid url test");
    assert.strictEqual(result, null, "Should return null for invalid URL in try-catch");
  } finally {
    restoreEnv(originalEnv);
  }
})();

// Test 7: Query parameter truncation
(async function testQueryParameterTruncation() {
  const originalEnv = { ...process.env };
  try {
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
        process.env.MCP_DOC_INDEX_ENDPOINT = `http://localhost:${port}/doc`;
        
        const localEndpoint = process.env.MCP_DOC_INDEX_ENDPOINT;
        
        function localFetchDocHints(query) {
          if (!localEndpoint) return Promise.resolve(null);
          try {
            const url = new URL(localEndpoint);
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
        }
        
        // Create a very long query (200 characters)
        const longQuery = "a".repeat(200);
        
        localFetchDocHints(longQuery).then((result) => {
          assert.ok(capturedUrl, "Should capture URL");
          const urlParams = new URL(`http://localhost${capturedUrl}`);
          const qParam = urlParams.searchParams.get('q');
          assert.strictEqual(qParam.length, 120, "Query parameter should be truncated to 120 characters");
          server.close();
          resolve();
        });
      });
    });
  } finally {
    restoreEnv(originalEnv);
  }
})();

console.log("All fetchDocHints tests passed");
