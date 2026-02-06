# .claude Frontmatter Schema

This file documents the recommended frontmatter schema for .claude agents and skills.

## Agents (.claude/agents/*.md)

Required fields:
- name (kebab-case)
- description (string)
- model (string)
- tools (array of strings)
- skills (array of skill ids)

Example:
---
name: frontend-architect
description: "Architects scalable React apps."
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
skills:
  - react-patterns
  - tanstack-query-patterns
---

## Skills (.claude/skills/*/SKILL.md)

Required fields:
- name (skill id, should match folder)
- description (string)
- allowed-tools (array of strings)

Example:
---
name: react-patterns
description: "React 19 patterns and best practices."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

## Naming Guidance
- Skill name should match folder name and references from agent skills lists.
- Avoid commas in tools fields; use YAML arrays for portability.

