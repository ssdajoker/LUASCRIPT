/**
 * YOLO-EVOLVED: AUTONOMOUS CODING THEATER
 * Real-time dashboard and live code viewer
 * Shows agent activity, file changes, test results in real-time
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

const PORT = 3141;
const ACTIVITY_LOG = 'artifacts/agent-activity.jsonl';
const STATUS_FILE = 'artifacts/agent-status.json';

// Ensure artifacts directory exists
if (!fs.existsSync('artifacts')) {
    fs.mkdirSync('artifacts', { recursive: true });
}

// Initialize status
const status = {
    active: true,
    layer: 0,
    phase: 'Starting',
    progress: 0,
    files_modified: [],
    tests_running: [],
    last_update: new Date().toISOString(),
    agent_thoughts: []
};

function updateStatus(updates) {
    Object.assign(status, updates);
    status.last_update = new Date().toISOString();
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

function logActivity(type, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        type,
        ...data
    };
    fs.appendFileSync(ACTIVITY_LOG, JSON.stringify(entry) + '\n');
}

// Dashboard HTML
const dashboardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>YOLO-EVOLVED: Autonomous Coding Theater</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 {
            text-align: center;
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            text-align: center;
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .panel {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .panel h2 {
            margin-bottom: 15px;
            font-size: 1.5em;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            padding-bottom: 10px;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        .active { background: #4ade80; }
        .inactive { background: #ef4444; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .progress-bar {
            width: 100%;
            height: 30px;
            background: rgba(0,0,0,0.3);
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4ade80, #22c55e);
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        .file-list {
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .file-item {
            padding: 5px;
            margin: 3px 0;
            background: rgba(0,0,0,0.2);
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
        .activity-feed {
            max-height: 300px;
            overflow-y: auto;
            font-size: 0.9em;
        }
        .activity-item {
            padding: 8px;
            margin: 5px 0;
            background: rgba(0,0,0,0.2);
            border-radius: 5px;
            border-left: 3px solid #4ade80;
        }
        .activity-item.test { border-left-color: #3b82f6; }
        .activity-item.error { border-left-color: #ef4444; }
        .timestamp {
            opacity: 0.7;
            font-size: 0.8em;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        .stat-card {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #4ade80;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 5px;
        }
        .fullwidth { grid-column: 1 / -1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 YOLO-EVOLVED</h1>
        <div class="subtitle">Autonomous Coding Theater • Live Agent Activity</div>

        <div class="grid">
            <div class="panel">
                <h2>🎬 Current Status</h2>
                <div>
                    <span class="status-indicator active" id="statusDot"></span>
                    <strong>Layer <span id="layer">0</span></strong> - <span id="phase">Initializing</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressBar" style="width: 0%">0%</div>
                </div>
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value" id="filesModified">0</div>
                        <div class="stat-label">Files Modified</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="testsRun">0</div>
                        <div class="stat-label">Tests Run</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="layersComplete">0</div>
                        <div class="stat-label">Layers Complete</div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <h2>💭 Agent Thoughts</h2>
                <div class="activity-feed" id="thoughts">
                    <div class="activity-item">Waiting for agent to start...</div>
                </div>
            </div>

            <div class="panel">
                <h2>📁 Files Being Modified</h2>
                <div class="file-list" id="fileList">
                    <div class="file-item">No files yet...</div>
                </div>
            </div>

            <div class="panel">
                <h2>🧪 Test Results</h2>
                <div class="activity-feed" id="testResults">
                    <div class="activity-item">No tests run yet...</div>
                </div>
            </div>

            <div class="panel fullwidth">
                <h2>📊 Live Activity Feed</h2>
                <div class="activity-feed" id="activityFeed">
                    <div class="activity-item">System started. Waiting for activity...</div>
                </div>
            </div>
        </div>

        <div style="text-align: center; opacity: 0.7; margin-top: 20px;">
            Last Update: <span id="lastUpdate">Never</span>
        </div>
    </div>

    <script>
        let activityCount = 0;

        function updateDashboard() {
            fetch('/api/status')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('layer').textContent = data.layer;
                    document.getElementById('phase').textContent = data.phase;
                    document.getElementById('progressBar').style.width = data.progress + '%';
                    document.getElementById('progressBar').textContent = data.progress + '%';
                    document.getElementById('filesModified').textContent = data.files_modified.length;
                    document.getElementById('lastUpdate').textContent = new Date(data.last_update).toLocaleTimeString();

                    // Files list
                    const fileList = document.getElementById('fileList');
                    if (data.files_modified.length > 0) {
                        fileList.innerHTML = data.files_modified.map(f =>
                            \`<div class="file-item"><span>\${f}</span><span>✏️</span></div>\`
                        ).join('');
                    }

                    // Thoughts
                    const thoughts = document.getElementById('thoughts');
                    if (data.agent_thoughts.length > 0) {
                        thoughts.innerHTML = data.agent_thoughts.slice(-5).map(t =>
                            \`<div class="activity-item"><div class="timestamp">\${new Date(t.time).toLocaleTimeString()}</div>\${t.thought}</div>\`
                        ).join('');
                        thoughts.scrollTop = thoughts.scrollHeight;
                    }
                });

            fetch('/api/activity')
                .then(r => r.json())
                .then(activities => {
                    if (activities.length > activityCount) {
                        const feed = document.getElementById('activityFeed');
                        const newActivities = activities.slice(activityCount);
                        newActivities.forEach(a => {
                            const div = document.createElement('div');
                            div.className = 'activity-item ' + (a.type || '');
                            div.innerHTML = \`<div class="timestamp">\${new Date(a.timestamp).toLocaleTimeString()}</div>\${a.message || JSON.stringify(a)}\`;
                            feed.appendChild(div);
                        });
                        feed.scrollTop = feed.scrollHeight;
                        activityCount = activities.length;
                    }
                });
        }

        setInterval(updateDashboard, 1000);
        updateDashboard();
    </script>
</body>
</html>
`;

// HTTP Server
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboardHTML);
    } else if (req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
    } else if (req.url === '/api/activity') {
        const activities = fs.existsSync(ACTIVITY_LOG)
            ? fs.readFileSync(ACTIVITY_LOG, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
            : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(activities));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🎭 YOLO-EVOLVED: AUTONOMOUS CODING THEATER');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  🎬 Dashboard: http://localhost:' + PORT);
    console.log('  📊 Status API: http://localhost:' + PORT + '/api/status');
    console.log('  📋 Activity API: http://localhost:' + PORT + '/api/activity');
    console.log('');
    console.log('  Open the dashboard in your browser to watch the show!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Initialize
    updateStatus({ phase: 'Ready', active: true });
    logActivity('system', { message: '🎭 Theater opened and ready for action!' });
});

// Export utilities for agent to use
module.exports = {
    updateStatus,
    logActivity,
    PORT
};
