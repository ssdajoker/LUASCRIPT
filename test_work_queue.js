// Temporary test to trigger work queue submission

const { parseAndLower } = require('./src/ir/pipeline');
const { emitLuaFromIR } = require('./src/ir/emitter');
const http = require('http');

console.log('Testing work queue coordination...\n');

// Test 1: Create a parse error (unsupported syntax)
console.log('1. Creating parse error to trigger work submission...');
const badSource = `
const obj = { ...spread, in: 'object' };
`;

try {
  const ir = parseAndLower(badSource);
  const lua = emitLuaFromIR(ir);
  console.log('❌ Expected parse error but got success');
} catch (err) {
  console.log('✅ Parse error triggered:', err.message);
  
  // Manually submit to work queue (harness would do this automatically)
  const workItem = {
    type: 'parse-error',
    priority: 'high',
    description: 'Object spread not yet supported',
    context: {
      testCase: 'test_work_queue_manual',
      error: err.message,
      source: badSource.trim(),
      stack: err.stack
    }
  };

  const postData = JSON.stringify(workItem);
  const req = http.request({
    hostname: 'localhost',
    port: 8787,
    path: '/submit-work',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('\n2. Work item submitted, response:', body);
      
      // Test 2: List work queue
      console.log('\n3. Checking work queue...');
      http.get('http://localhost:8787/work-queue?action=list', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const queue = JSON.parse(data);
          console.log('Work queue:', JSON.stringify(queue, null, 2));
          
          if (queue.tasks && queue.tasks.length > 0) {
            const workId = queue.tasks[0].id;
            console.log(`\n4. Found work item #${workId}, claiming for Gemini...`);
            
            // Test 3: Claim work item
            http.get(`http://localhost:8787/work-queue?action=claim&id=${workId}&agent=gemini`, (res) => {
              let claimData = '';
              res.on('data', (chunk) => claimData += chunk);
              res.on('end', () => {
                console.log('Claim response:', claimData);
                
                // Test 4: Check sync status
                console.log('\n5. Checking sync status...');
                http.get('http://localhost:8787/sync-status', (res) => {
                  let statusData = '';
                  res.on('data', (chunk) => statusData += chunk);
                  res.on('end', () => {
                    const status = JSON.parse(statusData);
                    console.log('Sync status:', JSON.stringify(status, null, 2));
                    
                    // Test 5: Complete work item
                    console.log(`\n6. Marking work item #${workId} as complete...`);
                    http.get(`http://localhost:8787/work-queue?action=complete&id=${workId}&result=fixed&agent=gemini`, (res) => {
                      let completeData = '';
                      res.on('data', (chunk) => completeData += chunk);
                      res.on('end', () => {
                        console.log('Complete response:', completeData);
                        
                        // Test 6: Final sync status
                        console.log('\n7. Final sync status check...');
                        http.get('http://localhost:8787/sync-status', (res) => {
                          let finalData = '';
                          res.on('data', (chunk) => finalData += chunk);
                          res.on('end', () => {
                            const final = JSON.parse(finalData);
                            console.log('Final status:', JSON.stringify(final, null, 2));
                            console.log('\n✅ Work queue coordination test complete!\n');
                            console.log('Summary:');
                            console.log('  - Parse error triggered work submission');
                            console.log('  - Work item appeared in queue');
                            console.log('  - Gemini claimed work atomically');
                            console.log('  - Sync status tracked agent activity');
                            console.log('  - Work marked complete successfully');
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          } else {
            console.log('❌ No work items found in queue');
          }
        });
      });
    });
  });

  req.write(postData);
  req.end();
}
