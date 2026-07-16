const http = require('http');
const querystring = require('querystring');

/**
 * Claim a work item from the work queue.
 *
 * @param {Object} options
 * @param {number|string} options.id - The work item ID to claim.
 * @param {string} options.agent - The agent claiming the work.
 * @param {string} [options.hostname='localhost'] - Work-queue hostname.
 * @param {number} [options.port=8787] - Work-queue port.
 * @returns {Promise<string>} Resolves with the response body.
 */
function claimWork(options) {
  const {
    id,
    agent,
    hostname = 'localhost',
    port = 8787
  } = options || {};

  const query = querystring.stringify({
    action: 'claim',
    id,
    agent
  });

  const requestOptions = {
    hostname,
    port,
    path: `/work-queue?${query}`,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

module.exports = {
  claimWork
};

// Preserve existing behavior when run directly.
if (require.main === module) {
  claimWork({ id: 1, agent: 'gemini' })
    .then((data) => {
      console.log(data);
    })
    .catch(() => {
      // Error is already logged in claimWork; no additional handling required.
    });
}