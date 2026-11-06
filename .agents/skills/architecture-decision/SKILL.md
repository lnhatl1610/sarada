---
name: architecture-decision
description: Use when selecting/changing a framework, major package, service boundary, data flow, deployment shape, or cross-module architecture decision.
---

# Architecture Decision

1. Read `docs/architecture/system-overview.md` and relevant NFR/domain docs.
2. State context and constraints; compare at least two viable options with tradeoffs.
3. Record the chosen option in a sequential `docs/adr/NNNN-*.md` file using `references/adr-template.md`.
4. Update `docs/architecture/system-overview.md`, the architecture index when needed, C4 diagram, affected docs, contracts, and dependency guard configuration.
5. Record residual risk and migration/rollback path. Keep the ADR short and decision-focused.
