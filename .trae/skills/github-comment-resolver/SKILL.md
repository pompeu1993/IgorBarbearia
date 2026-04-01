---
name: "github-comment-resolver"
description: "Resolves GitHub review comments by mapping feedback to code changes and verification steps. Invoke when review feedback or requested fixes arrive."
---

# GitHub Comment Resolver

Use this skill to transform review comments into actionable fixes.

## When To Invoke

- A reviewer requests code changes
- A GitHub thread reports bugs, style issues, or missing tests
- Multiple comments target the same feature or file group
- The user asks to address PR feedback systematically

## Workflow

1. Group comments by theme
2. Identify impacted files, functions, and tests
3. Convert each comment into a concrete change
4. Check whether the request is code, behavior, or documentation
5. Apply fixes with minimal regression risk
6. Validate with lint, tests, and focused manual checks

## Expected Output

- Summary of comments grouped by topic
- Mapping from comment to affected files
- Implemented changes
- Validation evidence
- Remaining blockers, if any

## Project Guidance

- Prefer existing app patterns over introducing new abstractions
- Update docs when behavior changes
- Add or adjust tests for behavior-level review feedback

