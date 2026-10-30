# Contributing

## Reporting a wrong result

Open an issue with:

- the input word or sentence
- what you got and what you expected
- which style (`new` / `old`)

If you can point to a source for the expected form (dictionary, MOET guideline), even better.

## Development

```sh
npm install
npm test          # vitest
npm run coverage  # vitest with coverage; fails below the thresholds in vitest.config.ts
npm run typecheck
npm run build     # outputs to dist/
```

CI runs these on Node 18, 20, 22 and 24, smoke-tests the CLI, and runs CodeQL.

Try the CLI against your local build:

```sh
echo "hòa" | node dist/cli.js
```

## Pull requests

- Add a test case for any rule change. Most of them go in `test/normalize.test.ts`.
- Keep the package dependency-free.
- One topic per PR.

When writing combining characters in source, use `\u` escapes (`'à'`) rather than the
raw character, otherwise they are invisible in review.
