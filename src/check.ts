import { WORD_RE, normalizeWord, type ToneStyle } from './normalize.js';

export interface Issue {
  /** 1-based */
  line: number;
  /** 1-based, in UTF-16 code units of the original line */
  column: number;
  found: string;
  expected: string;
  /** `nfd`: decomposed characters; `tone`: tone mark in the wrong place */
  kind: 'nfd' | 'tone';
}

/** List every word that `normalize()` would change. */
export function findIssues(text: string, style: ToneStyle = 'new'): Issue[] {
  const issues: Issue[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const m of line.matchAll(WORD_RE)) {
      const found = m[0];
      const expected = normalizeWord(found, style);
      if (found === expected) continue;
      issues.push({
        line: i + 1,
        column: m.index + 1,
        found,
        expected,
        kind: found.normalize('NFC') === found ? 'tone' : 'nfd',
      });
    }
  }
  return issues;
}
