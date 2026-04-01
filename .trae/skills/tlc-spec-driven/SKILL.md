---
name: "tlc-spec-driven"
description: "Drives implementation from a lightweight technical spec with acceptance criteria. Invoke when a request needs controlled execution and traceable validation."
---

# TLC Spec Driven

Use this skill to convert a request into a small but strict implementation spec.

## When To Invoke

- The feature has several acceptance criteria
- The user wants predictable execution with fewer regressions
- You need explicit requirements before touching code
- The task affects business rules, API contracts, or user flows

## Required Sections

1. Objective
2. Scope
3. Acceptance Criteria
4. Constraints
5. Impacted Files
6. Validation Plan

## Recommended Output Template

- Objective
- Business Context
- Scope
- Out of Scope
- Acceptance Criteria
- Constraints
- Impacted Routes and APIs
- Impacted Files
- Test Strategy
- Validation Plan

## Execution Rules

- Do not implement before the spec is clear
- Keep criteria testable and observable
- Link validation directly to the requested behavior
- Update the spec if scope changes during implementation
- Express acceptance criteria in observable user or API outcomes
- Prefer small specs that can be validated with lint, tests, and manual flow checks

## Project Guidance

- Mention specific routes, APIs, and Supabase tables when relevant
- Prefer short specs that map directly to tests
- Use this approach for payment, history, admin, and scheduling changes
- In this project, prioritize flows that touch Supabase auth, RLS, appointment status, Pix checkout, and admin permissions
