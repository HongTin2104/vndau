import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const CLI = join(__dirname, '..', 'dist', 'cli.js');

function run(args: string[], input?: string) {
  const r = spawnSync(process.execPath, [CLI, ...args], { input, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

beforeAll(() => {
  execFileSync(process.execPath, [join('node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.build.json']);
}, 60_000);

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'vndau-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('cli', () => {
  it('normalizes stdin', () => {
    const r = run([], 'Khỏe không, thủy thủ?');
    expect(r.code).toBe(0);
    expect(r.out).toBe('Khoẻ không, thuỷ thủ?');
  });

  it('honours --style on stdin', () => {
    expect(run(['-s', 'old'], 'hoà').out).toBe('hòa');
  });

  it('check exits 1 and prints file:line:col', () => {
    const file = join(dir, 'a.md');
    writeFileSync(file, 'xin chào\nhòa bình\n');
    const r = run(['check', file]);
    expect(r.code).toBe(1);
    expect(r.out).toContain(`${file}:2:1  hòa -> hoà`);
  });

  it('check exits 0 on clean files', () => {
    const file = join(dir, 'a.md');
    writeFileSync(file, 'hoà bình\n');
    expect(run(['check', file]).code).toBe(0);
  });

  it('fix rewrites files and keeps line endings', () => {
    const file = join(dir, 'a.txt');
    writeFileSync(file, 'ho\u0300a\r\nthủy\r\n');
    const r = run(['fix', file]);
    expect(r.code).toBe(0);
    expect(readFileSync(file, 'utf8')).toBe('hoà\r\nthuỷ\r\n');
  });

  it('scans directories by extension and skips node_modules', () => {
    mkdirSync(join(dir, 'node_modules'));
    writeFileSync(join(dir, 'node_modules', 'x.md'), 'hòa');
    writeFileSync(join(dir, 'a.json'), '{"t":"hòa"}');
    writeFileSync(join(dir, 'b.bin'), 'hòa');
    const r = run(['check', dir]);
    expect(r.out).toContain('a.json');
    expect(r.out).not.toContain('node_modules');
    expect(r.out).not.toContain('b.bin');
  });

  it('exits 2 on bad usage', () => {
    expect(run(['check']).code).toBe(2);
    expect(run(['nope', 'x']).code).toBe(2);
    expect(run(['-s', 'weird'], 'a').code).toBe(2);
    expect(run(['check', join(dir, 'missing.md')]).code).toBe(2);
  });
});
