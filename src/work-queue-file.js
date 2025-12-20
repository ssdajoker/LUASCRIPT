/**
 * File-based work queue for agent coordination.
 * Avoids localhost/network sandbox issues by using the filesystem.
 */

const fs = require('fs');
const path = require('path');

class FileBasedWorkQueue {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), '.work-queue');
    this.pendingDir = path.join(this.baseDir, 'pending');
    this.processingDir = path.join(this.baseDir, 'processing');
    this.completedDir = path.join(this.baseDir, 'completed');
    this.failedDir = path.join(this.baseDir, 'failed');
    this.maxAttempts = options.maxAttempts || 3;
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.baseDir, this.pendingDir, this.processingDir, this.completedDir, this.failedDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  submitWork(item) {
    const id = `work_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const filePath = path.join(this.pendingDir, `${id}.json`);
    const workItem = {
      id,
      type: item.type || 'test-failure',
      priority: item.priority || 'medium',
      submittedBy: item.submittedBy || 'copilot-harness',
      assignee: item.assignee || 'gemini',
      createdAt: new Date().toISOString(),
      data: item.data || {},
      status: 'pending',
      attempts: 0,
      context: item.context || {},
      artifacts: item.artifacts || [],
    };
    fs.writeFileSync(filePath, JSON.stringify(workItem, null, 2));
    return workItem;
  }

  listWork(status = 'pending') {
    const dirMap = {
      pending: this.pendingDir,
      processing: this.processingDir,
      completed: this.completedDir,
      failed: this.failedDir,
    };
    const dir = dirMap[status];
    if (!dir) return [];
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
    return files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
  }

  claimWork(agentId) {
    const files = fs.readdirSync(this.pendingDir).filter((f) => f.endsWith('.json')).sort();
    for (const file of files) {
      const from = path.join(this.pendingDir, file);
      const item = JSON.parse(fs.readFileSync(from, 'utf-8'));
      const to = path.join(this.processingDir, file);
      item.status = 'processing';
      item.claimedBy = agentId;
      item.claimedAt = new Date().toISOString();
      item.attempts = (item.attempts || 0) + 1;
      fs.renameSync(from, to);
      fs.writeFileSync(to, JSON.stringify(item, null, 2));
      return item;
    }
    return null;
  }

  completeWork(id, agentId, result = {}) {
    const file = this.findProcessingFile(id, agentId);
    if (!file) return false;
    const { filePath, item } = file;
    const dest = path.join(this.completedDir, path.basename(filePath));
    item.status = 'completed';
    item.completedAt = new Date().toISOString();
    item.result = result;
    fs.renameSync(filePath, dest);
    fs.writeFileSync(dest, JSON.stringify(item, null, 2));
    return true;
  }

  failWork(id, agentId, errorMessage) {
    const file = this.findProcessingFile(id, agentId);
    if (!file) return false;
    const { filePath, item } = file;
    item.error = errorMessage;
    item.failedAt = new Date().toISOString();
    if ((item.attempts || 0) >= this.maxAttempts) {
      item.status = 'failed';
      const dest = path.join(this.failedDir, path.basename(filePath));
      fs.renameSync(filePath, dest);
      fs.writeFileSync(dest, JSON.stringify(item, null, 2));
      return true;
    }
    // Return to pending for retry
    item.status = 'pending';
    const dest = path.join(this.pendingDir, path.basename(filePath));
    fs.renameSync(filePath, dest);
    fs.writeFileSync(dest, JSON.stringify(item, null, 2));
    return true;
  }

  findProcessingFile(id, agentId) {
    const files = fs.readdirSync(this.processingDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const fp = path.join(this.processingDir, file);
      const item = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      if (item.id === id && item.claimedBy === agentId) {
        return { filePath: fp, item };
      }
    }
    return null;
  }

  getStats() {
    const count = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).length : 0);
    return {
      pending: count(this.pendingDir),
      processing: count(this.processingDir),
      completed: count(this.completedDir),
      failed: count(this.failedDir),
    };
  }
}

module.exports = { FileBasedWorkQueue };
