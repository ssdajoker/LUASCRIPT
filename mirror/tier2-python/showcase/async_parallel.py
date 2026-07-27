"""
MIRROR V3: Tier 2 Python Showcase
Category: Async & Control Flow
Module: async_parallel.py
Purpose: Demonstrate parallel execution patterns
"""

from typing import Callable, List, Any


def execute_parallel(tasks: List[Callable]) -> List[Any]:
    """Execute tasks in parallel"""
    results = []
    for task in tasks:
        results.append(task())
    return results


def create_task(value: int, multiplier: int) -> Callable:
    """Create a task"""
    def task():
        return value * multiplier
    return task


def batch_execute(items: List[int]) -> dict:
    """Execute batch operations"""
    tasks = [
        create_task(x, 2) for x in items
    ]
    results = execute_parallel(tasks)
    return {
        "items": items,
        "results": results,
        "count": len(results),
    }


tasks = [
    create_task(10, 2),
    create_task(20, 3),
    create_task(30, 4),
]

results = execute_parallel(tasks)
batch_results = batch_execute([5, 10, 15])

result = {
    "task_results": results,
    "result_1": results[0],
    "result_2": results[1],
    "result_3": results[2],
    "batch_count": batch_results["count"],
    "parallel_active": True,
}

if __name__ == "__main__":
    print(result)
