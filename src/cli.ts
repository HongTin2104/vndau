#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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
  -s, --style <new|old>   tone placement style (default: new)
  -e, --ext <list>        extensions to scan in directories
                          (default: ${DEFAULT_EXT})
  -q, --quiet             only print the summary
  -h, --help              show this message

Exit codes: 0 = clean, 1 = issues found (check), 2 = bad usage`;

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

function fail(msg: string): never {
  process.stderr.write(`vndau: ${msg}\n`);
  process.exit(2);
}

function collect(paths: string[], exts: Set<string>): string[] {
  const out: string[] = [];
  const walk = (p: string, explicit: boolean) => {
    let st;
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
      // Files passed by name are always checked, whatever the extension.
      out.push(p);
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

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        style: { type: 'string', short: 's', default: 'new' },
        ext: { type: 'string', short: 'e', default: DEFAULT_EXT },
        quiet: { type: 'boolean', short: 'q', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (err) {
    fail((err as Error).message);
  }

  const { values, positionals } = parsed;
  if (values.help) {
    process.stdout.write(HELP + '\n');
    return;
  }

  const style = values.style as ToneStyle;
  if (style !== 'new' && style !== 'old') fail(`unknown style "${values.style}", use new or old`);

  const [command, ...paths] = positionals;

  if (command === undefined) {
    if (process.stdin.isTTY) {
      process.stdout.write(HELP + '\n');
      return;
    }
    process.stdout.write(normalize(await readStdin(), { style }));
    return;
  }

  if (command !== 'check' && command !== 'fix') fail(`unknown command "${command}"`);
  if (paths.length === 0) fail(`${command} needs at least one path`);

  const exts = new Set(values.ext.split(',').map((e) => e.trim().replace(/^\./, '').toLowerCase()));
  const files = collect(paths, exts);
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
        const note = i.kind === 'nfd' ? ' (NFD)' : '';
        process.stdout.write(`${file}:${i.line}:${i.column}  ${i.found} -> ${i.expected}${note}\n`);
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
