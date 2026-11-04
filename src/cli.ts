#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  type Stats,
} from 'node:fs';
import { extname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { findIssues } from './check.js';
import { normalize, type ToneStyle } from './normalize.js';

const DEFAULT_EXT = 'md,mdx,txt,json,yml,yaml,html,vue,js,jsx,ts,tsx,po,csv';

const HELP = `Usage:
  vndau check <path...>   report words with misplaced tones or NFD characters
  vndau fix <path...>     rewrite files in place
  vndau < input.txt       normalize stdin to stdout

Options:
  -s, --style <new|old>              tone placement style (default: new)
  -e, --ext <list>                   extensions to scan in directories
                                     (default: ${DEFAULT_EXT})
  -f, --format <text|json|github>    output format for check (default: text)
  -x, --exclude <pattern>            skip files matching pattern (repeatable);
                                     also reads .vndauignore in the current dir
  -q, --quiet                        only print the summary
  -h, --help                         show this message

Exit codes: 0 = clean, 1 = issues found (check), 2 = bad usage`;

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

function fail(msg: string): never {
  process.stderr.write(`vndau: ${msg}\n`);
  process.exit(2);
}

/**
 * Convert a glob-like pattern into a RegExp.
 * `**` matches anything (including `/`), `*` matches anything except `/`.
 * Otherwise the pattern is treated as a substring.
 */
function patternToRegex(pattern: string): RegExp {
  if (!pattern.includes('*')) {
    // Plain substring — match if the path contains this text
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  // Split on ** first, escape the rest, then join with .* for ** and [^/]* for *
  const re = pattern
    .split('**')
    .map((seg) => seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*'))
    .join('.*');
  return new RegExp(re);
}

function isExcluded(filePath: string, patterns: RegExp[]): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return patterns.some((re) => re.test(normalized));
}

function loadIgnoreFile(): string[] {
  const p = join(process.cwd(), '.vndauignore');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

function collect(paths: string[], exts: Set<string>, excludePatterns: RegExp[]): string[] {
  const out: string[] = [];
  const walk = (p: string, explicit: boolean) => {
    let st: Stats;
    try {
      st = statSync(p);
    } catch {
      fail(`no such file or directory: ${p}`);
    }
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (SKIP_DIRS.has(name)) continue;
        walk(join(p, name), false);
      }
    } else if (explicit || exts.has(extname(p).slice(1).toLowerCase())) {
      if (!isExcluded(p, excludePatterns)) {
        // Files passed by name are always checked, whatever the extension.
        out.push(p);
      }
    }
  };
  for (const p of paths) walk(p, true);
  return out;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function parseCli() {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        style: { type: 'string', short: 's', default: 'new' },
        ext: { type: 'string', short: 'e', default: DEFAULT_EXT },
        format: { type: 'string', short: 'f', default: 'text' },
        exclude: { type: 'string', short: 'x', multiple: true },
        quiet: { type: 'boolean', short: 'q', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (err) {
    return fail((err as Error).message);
  }
}

async function main() {
  const { values, positionals } = parseCli();
  if (values.help) {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  const style = values.style as ToneStyle;
  if (style !== 'new' && style !== 'old') fail(`unknown style "${values.style}", use new or old`);

  const format = values.format as string;
  if (format !== 'text' && format !== 'json' && format !== 'github')
    fail(`unknown format "${format}", use text, json, or github`);

  const [command, ...paths] = positionals;

  if (command === undefined) {
    if (process.stdin.isTTY) {
      process.stdout.write(`${HELP}\n`);
      return;
    }
    process.stdout.write(normalize(await readStdin(), { style }));
    return;
  }

  if (command !== 'check' && command !== 'fix') fail(`unknown command "${command}"`);
  if (paths.length === 0) fail(`${command} needs at least one path`);

  const exts = new Set(values.ext.split(',').map((e) => e.trim().replace(/^\./, '').toLowerCase()));
  const rawPatterns = [...(values.exclude ?? []), ...loadIgnoreFile()];
  const excludePatterns = rawPatterns.map(patternToRegex);

  const files = collect(paths, exts, excludePatterns);
  let total = 0;
  let touched = 0;

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const issues = findIssues(text, style);
    if (issues.length === 0) continue;

    total += issues.length;
    touched++;

    if (command === 'fix') {
      writeFileSync(file, normalize(text, { style }));
      if (!values.quiet) process.stdout.write(`fixed ${file} (${issues.length})\n`);
    } else if (!values.quiet) {
      for (const i of issues) {
        if (format === 'json') {
          process.stdout.write(
            `${JSON.stringify({ file, line: i.line, column: i.column, found: i.found, expected: i.expected, kind: i.kind })}\n`,
          );
        } else if (format === 'github') {
          process.stdout.write(
            `::warning file=${file},line=${i.line},col=${i.column}::${i.found} -> ${i.expected}\n`,
          );
        } else {
          const note = i.kind === 'nfd' ? ' (NFD)' : '';
          process.stdout.write(
            `${file}:${i.line}:${i.column}  ${i.found} -> ${i.expected}${note}\n`,
          );
        }
      }
    }
  }

  const verb = command === 'fix' ? 'fixed' : 'found';
  process.stdout.write(
    total === 0
      ? `${files.length} file(s) checked, all clean\n`
      : `${verb} ${total} issue(s) in ${touched} of ${files.length} file(s)\n`,
  );

  if (command === 'check' && total > 0) process.exitCode = 1;
}

main();
