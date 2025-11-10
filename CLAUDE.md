# Claude Code - Project Documentation Guide

This file tracks the location of key documentation files for the N8n Widget Designer Platform project.

## Documentation Structure

All documentation has been organized into the `docs/` directory with the following subdirectories:

### 📁 docs/development/
Development tracking and decision logs that are actively updated:

- **DEVELOPMENT_LOG.md** - Complete chronological development history
- **PROGRESS.md** - Current progress tracking across all phases
- **decisions.md** - Architectural decisions and design choices (ADRs)
- **SESSION_HANDOFF.md** - Session handoff instructions for context continuation
- **todo.md** - Task tracking and TODO lists

### 📁 docs/planning/
Project planning and requirements documentation:

- **PLANNING.md** - Overall project planning and roadmap
- **IMPLEMENTATION_BRIEF.md** - Implementation strategy and guidelines

### 📁 docs/reviews/
Code quality and compliance reviews:

- **PHASE2_CODE_REVIEW.md** - Phase 2 code quality review and bug reports
- *(Future reviews will be placed here)*

### 📁 docs/modules/
Module-specific documentation and summaries:

- **PHASE_2_SUMMARY.md** - Phase 2 module completion summary
- **MODULE_3_TEST_SUMMARY.md** - Module 3 testing summary
- *(Future module summaries will be placed here)*

### 📁 docs/testing/
Testing documentation and guides:

- **TEST_SUMMARY.md** - Overall test coverage and results
- **TESTING_QUICK_START.md** - Quick start guide for running tests

## Root Directory Files

The following files remain in the root for easy access:

- **README.md** - Project overview and setup instructions
- **package.json** - Dependencies and scripts
- **.env.local** - Environment variables (not committed)
- Configuration files (tsconfig.json, vitest.config.ts, etc.)

## Key Files for Active Development

When working on this project, the following files are most frequently updated:

1. **docs/development/DEVELOPMENT_LOG.md** - Log all significant changes here
2. **docs/development/decisions.md** - Document important architectural decisions
3. **docs/development/PROGRESS.md** - Update progress tracking as phases complete
4. **docs/reviews/** - Add new code review documents here

## File Movement History

**Last Reorganization:** 2025-11-09

Files moved from root to docs/:
- DEVELOPMENT_LOG.md → docs/development/
- decisions.md → docs/development/
- PROGRESS.md → docs/development/
- SESSION_HANDOFF.md → docs/development/
- todo.md → docs/development/
- PLANNING.md → docs/planning/
- IMPLEMENTATION_BRIEF.md → docs/planning/
- PHASE2_CODE_REVIEW.md → docs/reviews/
- PHASE_2_SUMMARY.md → docs/modules/
- MODULE_3_TEST_SUMMARY.md → docs/modules/
- TEST_SUMMARY.md → docs/testing/
- TESTING_QUICK_START.md → docs/testing/

Temporary files deleted:
- fix-mocks.js
- fix-routes.js
- dev.log
