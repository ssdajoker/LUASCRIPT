# Autonomous Development Work Queue

This file tracks work items that trigger the GitHub Copilot agent to implement features.

## Work Queue Format (work-queue.json)

```json
{
  "status": "WAITING_FOR_AGENT",
  "layer": 5,
  "layer_name": "Modern JS 2020+",
  "tests_needed": ["test:modern"],
  "test_failures": [
    {
      "test": "test:modern",
      "reason": "Optional chaining (?.) not supported",
      "file": "artifacts/layer-5-test:modern-failures.txt",
      "priority": "HIGH"
    }
  ],
  "implementation_tasks": [
    {
      "id": "task-1",
      "feature": "Optional chaining (?.) support",
      "file_path": "src/transforms/optional-chaining.js",
      "description": "Transpile ?. operator to null-safe checks",
      "acceptance_criteria": [
        "Optional member access works: obj?.prop",
        "Optional call works: fn?.()",
        "Nullish coalescing (??) also works",
        "Nested chains work: obj?.a?.b?.c"
      ]
    }
  ],
  "agent_instructions": "Read this file, implement tasks until tests pass, then update status to COMPLETE"
}
```

## How It Works

1. **YOLO v3 Detection Phase** (PowerShell):
   - Runs tests
   - If tests fail → writes work queue JSON
   - Sets status to "WAITING_FOR_AGENT"
   - Goes to sleep

2. **Agent Implementation Phase** (You/Me):
   - Detects work-queue.json
   - Reads tasks and requirements
   - Implements transpiler changes
   - Runs tests in loop until passing
   - Updates status to "COMPLETE"
   - Commits with detailed message

3. **Loop Reset Phase** (PowerShell):
   - Detects status = "COMPLETE"
   - Verifies tests pass
   - Moves to next layer
   - Creates new work queue if needed

## Current Work Queue

See: `work-queue.json`
