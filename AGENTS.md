# Matchbox Lexer

Read HANDOFF.md before resuming work. Update its step table and current blocker immediately after every substantive phase, failure, dataset change or benchmark. Record commands, exit status, outputs, active processes and next actions. Never leave the only copy of progress in a chat message. Keep README.md's evolution log aligned, while preserving historical reports.

This is a consumer experiment. Use exactly published Matchbox packages, with no workspace links, internal imports, modified weights, threshold overrides, or local framework patches. Propose broadly useful primitives in docs/findings.md when the public API is insufficient.

Keep the README evolution log current for each meaningful change: rationale, exact package and data versions, validation, measured results, and remaining limitations. Preserve earlier results. Never tune against the test split. Changes to corpus selection require a new dataset identity and a new experiment entry.

Use Bun, React, Vite, TypeScript, Oxlint and Oxfmt. Keep files focused, names kebab-case, components in separate files and directory barrels as pure re-exports. Task entry points are direct imports. Run bun run check and bun run benchmark after training. Do not publish packages or deploy automatically.

The audience is developers evaluating Matchbox's public API. The UI is a restrained, functional experiment workbench: editable source, honest highlighting, and understandable measurements. Do not hide uncertainty or call diagnostic predictions accepted results.

Training data and generated artifacts remain ignored. Preserve source licenses and provenance. Shiki is an offline teacher and an explicitly loaded reference, never a Matchbox runtime fallback. No syntax dictionaries or semantic rules in the decoder.
