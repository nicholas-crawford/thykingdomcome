# ADR-0001: Test strategy

Status: accepted (2026-11-18)

## Context

The game was prototyped in a single file (`src/App.tsx`) with no tests, and CI
only built and deployed. Game rules (seasons, find-food probabilities, farm
yields) are tangled with React state and `Math.random`, and balance numbers
change often (see the "Changed Spring balancing" commit).

## Decision

- **Runner: Vitest, via Vite+.** Run with `vp test`. The project moved from
  Vite, ESLint and Prettier to the Vite+ toolchain (Oxlint, Oxfmt, `vp check`)
  in the same effort, so tests, lint and format share one config in
  `vite.config.ts`.
- **Unit-test pure game logic first.** Rules are extracted from `App.tsx` into
  plain modules under `src/game/`, with the test file colocated
  (`season.ts` / `season.test.ts`). Component tests (Testing Library) are
  deferred until there is UI behaviour worth protecting.
- **Assert rules, not balance numbers.** Structural rules (the 90-day season
  boundaries) are pinned literally. Tunable values (probabilities, yields) are
  tested by invariants and relationships: probabilities sum to 1, each is in
  [0, 1], winter is likeliest to find nothing, summer yields more than spring.
  Rebalancing should not break tests; a typo like `0.45 -> 4.5` should.
- **CI gates everything.** `ci.yml` runs `vp check` (format, lint, typecheck),
  `vp test run` and the build on pull requests, and `deploy.yml` calls it as a
  reusable workflow (`workflow_call`) so a red check cannot ship to Pages.

## Consequences

- Extracting logic for testing also splits up the single-file prototype, which
  was a known trade-off. Randomness is still read inside `App`; the next
  extraction target is the tick logic with the random value passed in as an
  argument (a seam for deterministic tests).
- Oxlint replaces ESLint. The React hooks rules (`rules-of-hooks`,
  `exhaustive-deps`) were verified to fire after migration with a deliberately
  broken probe file.
- Vite+ is young. The `vite` dependency is aliased to Vite+'s core package via
  `overrides`, which is its supported setup but unusual to read in
  `package.json`.
- No pre-commit hooks and no coverage threshold for now; CI is the gate. Revisit
  hooks if red commits keep getting pushed, and thresholds if the logic grows.

## Alternatives considered

- **Jest:** more established, but needs transform configuration to work with a
  Vite and TypeScript project.
- **Pin current balance values in tests:** change-detector tests that fail on
  every rebalance without catching bugs.
- **`workflow_run` to gate deploy:** separate trigger, default-branch context,
  harder to debug than `workflow_call`.
