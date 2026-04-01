---
name: "design-doc-creator"
description: "Creates concise design docs with context, scope, architecture, risks, and validation. Invoke when planning a feature, refactor, or integration."
---

# Design Doc Creator

Use this skill to write a design document before implementing a non-trivial change.

## Goals

- Clarify the problem and expected outcome
- Map impacted modules, routes, APIs, and data flow
- Compare implementation options and trade-offs
- Record risks, constraints, and rollout notes
- Define validation criteria before coding

## When To Invoke

- A feature touches multiple files or modules
- A backend and frontend flow must evolve together
- A payment, auth, or database integration will change
- The user asks for architecture, planning, or a technical proposal
- The expected change has regression risk

## Output Structure

Produce a markdown design doc with:

1. Context
2. Problem Statement
3. Goals
4. Non-Goals
5. Current Architecture
6. Proposed Design
7. Data Flow
8. Risks and Mitigations
9. Validation Plan
10. Open Questions

## Project Guidance

- Prefer the existing Next.js App Router patterns
- Reference Supabase, Asaas, and route handlers when relevant
- Keep names in English unless the UI requires Portuguese text
- Prefer small, maintainable modules over large files

