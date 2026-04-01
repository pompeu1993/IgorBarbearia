---
name: "coupling-analysis"
description: "Analyzes coupling, dependencies, and hidden impact across modules. Invoke when refactoring, debugging regressions, or evaluating architecture risk."
---

# Coupling Analysis

Use this skill to understand how tightly connected parts of the system are.

## When To Invoke

- A change spans many files unexpectedly
- A regression appears after a small edit
- A page, API, or hook is hard to modify safely
- The user asks for refactor strategy or architecture cleanup

## Analysis Focus

- Module dependencies
- Shared state and implicit contracts
- UI-to-data access coupling
- API-to-database coupling
- Reuse vs duplication trade-offs
- Breakpoints where a smaller seam can be introduced

## Output Format

Produce:

1. Coupling hotspots
2. Dependency map
3. Risk level per hotspot
4. Refactor opportunities
5. Safe extraction order

## Project Guidance

- Watch for route handlers mixing orchestration and persistence
- Watch for page components owning too much fetch and mutation logic
- Prefer extraction into `src/lib` or focused components when that reduces coupling

