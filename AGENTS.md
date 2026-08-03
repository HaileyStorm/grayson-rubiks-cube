# Project Agent Instructions

Global Codex defaults apply. Add project-specific build, test, and delivery rules here when they are established.

<!-- codex-project-policy:compression-v1 -->
## Compression, randomized breadth, and memory

- Give reuse, simplification, and deletion equal consideration to addition. Finish each task with an obsolescence audit covering code, tests, fixtures, comments, docs, configuration, and tracked work.
- When replacing X with Y, remove X throughout the owned scope unless a verified compatibility, migration, rollback, history, or provenance obligation requires both. Name that obligation and its removal gate.
- Avoid comments that narrate obvious function-body behavior. Remove stale comments and completed TODOs; preserve non-obvious intent, invariants, safety, interoperability, and provenance.
- For open-ended diversity work, recursive partition search or Verbalized Sampling must be bounded and seeded, with universe, coverage, candidate set/path, and draws recorded. Do not claim uniformity without proof or use it for deterministic gates.
- Keep memory content separate from mutable reference-recency metadata. Record only memories that influence the work; recency may delay compression but never outranks authority, corrections, or explicit retention. GC proposals are advisory and non-destructive.
