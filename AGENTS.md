# Matchbox Lexer

Treat this repository as public-facing. Keep documentation focused on setup, contracts, methodology, measured results and verified limitations. Keep session handoffs, personal paths, internal PR status, working hypotheses and run-by-run decision narratives outside the repository.

Use published Matchbox packages, with no workspace links, internal imports, modified weights, threshold overrides or local framework patches. Keep versioned reports with exact package versions, dataset hashes, timing and outcomes. Preserve earlier results and never tune against the test split. Changes to corpus selection require a new dataset identity.

Use Bun, React, Vite, TypeScript, Oxlint and Oxfmt. Keep files focused, names kebab-case, components in separate files and directory barrels as pure re-exports. Task entry points are direct imports. Run bun run check and bun run benchmark after training. Do not publish packages or deploy automatically.

The audience is developers evaluating Matchbox's public API. The UI is a restrained, functional experiment workbench: editable source, honest highlighting, and understandable measurements. Do not hide uncertainty or call diagnostic predictions accepted results.

Training data and generated artifacts remain ignored. Preserve source licenses and provenance. Shiki is an offline teacher and an explicitly loaded reference, never a Matchbox runtime fallback. No syntax dictionaries or semantic rules in the decoder.
