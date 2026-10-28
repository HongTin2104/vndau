# Changelog

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
