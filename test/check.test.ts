import { describe, expect, it } from 'vitest';
import { findIssues } from '../src/index.js';

describe('findIssues', () => {
  it('returns nothing for clean text', () => {
    expect(findIssues('Hoà bình và thuỷ điện')).toEqual([]);
  });

  it('reports line and column of each word', () => {
    const text = 'dòng một\nđây là hòa bình\n';
    expect(findIssues(text)).toEqual([
      { line: 2, column: 8, found: 'hòa', expected: 'hoà', kind: 'tone' },
    ]);
  });

  it('flags NFD words separately', () => {
    const [issue] = findIssues('tie\u0302\u0301ng');
    expect(issue?.kind).toBe('nfd');
    expect(issue?.expected).toBe('tiếng');
  });

  it('respects the style', () => {
    expect(findIssues('hoà', 'old')).toHaveLength(1);
    expect(findIssues('hòa', 'old')).toHaveLength(0);
  });

  it('handles CRLF line endings', () => {
    const issues = findIssues('a\r\nthủy');
    expect(issues[0]).toMatchObject({ line: 2, column: 1 });
  });

  it('ignores words inside URLs and e-mail addresses', () => {
    expect(findIssues('Xem https://x.vn/hòa và hòa.bình@example.com')).toEqual([]);
  });

  it('still reports the same word outside a URL', () => {
    expect(findIssues('hòa tại https://x.vn/hòa')).toEqual([
      { line: 1, column: 1, found: 'hòa', expected: 'hoà', kind: 'tone' },
    ]);
  });
});
