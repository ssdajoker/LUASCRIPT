#!/usr/bin/env node
/**
 * Read audit/diff_upstream.json and propose merge candidates.
 * Emits audit/merge_candidates.md with rationale and potential integration path.
 */
const fs = require('fs');
const path = require('path');

const AUDIT = path.resolve(__dirname);

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return []; } }

function main() {
  const diffs = readJSON(path.join(AUDIT, 'diff_upstream.json'));
  const lines = ['# Merge Candidates (from Upstream)', ''];

  const addedIdeas = diffs.filter(d => d.entity_type === 'idea' && d.status === 'added');
  const addedDocs = diffs.filter(d => d.entity_type === 'doc' && d.status === 'added');
  const addedADRs = diffs.filter(d => d.entity_type === 'adr' && d.status === 'added');
  const addedFiles = diffs.filter(d => d.entity_type === 'file' && d.status === 'added');

  lines.push('## Prioritized Items');
  lines.push('');
  // Heuristic priority: ADRs > ideas > docs > files
  const priorities = [];
  priorities.push(...addedADRs.map(x => ({ kind: 'ADR', id: x.id, ptr: x.pointers?.upstream })));
  priorities.push(...addedIdeas.map(x => ({ kind: 'Idea', id: x.id, ptr: x.pointers?.upstream })));
  priorities.push(...addedDocs.map(x => ({ kind: 'Doc', id: x.id, ptr: x.pointers?.upstream })));
  priorities.push(...addedFiles.map(x => ({ kind: 'File', id: x.id, ptr: x.pointers?.upstream })));

  if (!priorities.length) {
    lines.push('- No upstream additions detected.');
  } else {
    for (const p of priorities) {
      const rationale = rationaleFor(p);
      const pathSuggestion = integrationPathFor(p);
      lines.push(`- [${p.kind}] ${p.id} — ${rationale}`);
      if (p.ptr) lines.push(`  - Upstream: ${p.ptr}`);
      lines.push(`  - Integration path: ${pathSuggestion}`);
    }
  }

  lines.push('', '## Next Steps');
  lines.push('', '- Triage with owners, create issues, and schedule integration sprints.');

  fs.writeFileSync(path.join(AUDIT, 'merge_candidates.md'), lines.join('\n'));
  console.log('merge_candidates.md written');
}

function rationaleFor(p) {
  switch (p.kind) {
    case 'ADR': return 'Architectural decision captured upstream; align local architecture to avoid divergence.';
    case 'Idea': return 'New plan/idea detected; evaluate for roadmap inclusion or rejection.';
    case 'Doc': return 'Documentation/plan present upstream; sync to ensure developer guidance parity.';
    case 'File': return 'Module present upstream but missing locally; consider porting or documenting rationale for omission.';
    default: return 'Candidate for alignment.';
  }
}

function integrationPathFor(p) {
  switch (p.kind) {
    case 'ADR': return 'Create local ADR with upstream reference; update code/docs accordingly.';
    case 'Idea': return 'Create issue with scope, acceptance criteria, and link to upstream context.';
    case 'Doc': return 'Mirror document under docs/ with attribution; reconcile overlaps.';
    case 'File': return 'Assess dependencies; cherry-pick or reimplement; add tests.';
    default: return 'Review and plan integration.';
  }
}

if (require.main === module) main();
