# Changelog

## 0.2.0 - 2026-10-30

- **Breaking:** Node 18 is no longer supported; `engines.node` is now `>=20`. Node 18 reached end
  of life in April 2025. Stay on 0.1.x if you still need it.
- URLs and e-mail addresses are left untouched: `normalize()` no longer rewrites them, and
  `findIssues()` / `vndau check` no longer report them (#10)

## 0.1.1 - 2026-10-28

- `engines.node` corrected to `>=18.11` (the CLI relies on `parseArgs` defaults)
- `sideEffects: false` for better tree-shaking, `vndau/package.json` is now importable
- CLI test suite

## 0.1.0 - 2026-10-28

First version.

- `normalize()` with `new` and `old` tone placement styles, NFC composition
- `removeTones()`, `removeDiacritics()`, `slugify()`
- `findIssues()` for reporting words that would change
- `vndau check` / `vndau fix` CLI, plus stdin mode
