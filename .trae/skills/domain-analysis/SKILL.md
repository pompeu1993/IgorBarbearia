---
name: "domain-analysis"
description: "Analyzes business rules, entities, workflows, and invariants. Invoke when adding features, clarifying requirements, or aligning code with the domain."
---

# Domain Analysis

Use this skill to map the real business behavior before changing code.

## When To Invoke

- The user requests a new rule or workflow
- A bug depends on status transitions or role permissions
- A feature touches payments, appointments, admin rules, or auth
- You need to identify entities, invariants, and edge cases

## Analysis Checklist

- Core entities and their responsibilities
- Status transitions and forbidden transitions
- User roles and permissions
- External dependencies and side effects
- Validation rules and deadlines
- Failure states and recovery paths

## Output Format

Provide:

1. Domain vocabulary
2. Entities and relations
3. Workflow steps
4. Invariants
5. Edge cases
6. Implementation implications

## Project Guidance

- Model appointments, services, profiles, settings, and payments explicitly
- Treat Supabase auth, RLS, and Asaas payment state as domain constraints
- Keep UI wording separate from core rule definitions

