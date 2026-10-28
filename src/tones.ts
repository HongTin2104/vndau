/**
 * The five Vietnamese tone marks as Unicode combining characters, indexed by
 * tone number. Tone 0 (thanh ngang) has no mark.
 */
export const TONE_MARKS = ['', '̀', '̉', '̃', '́', '̣'] as const;

export type Tone = 0 | 1 | 2 | 3 | 4 | 5;

const TONE_BY_MARK = new Map<string, Tone>([
  ['̀', 1], // huyền
  ['̉', 2], // hỏi
  ['̃', 3], // ngã
  ['́', 4], // sắc
  ['̣', 5], // nặng
]);

export const BASE_VOWELS = 'aăâeêioôơuưy';

/**
 * Split a single character into its toneless base and tone.
 * Works on any input form (NFC, NFD, or mixed) since we go through NFD.
 * Characters that carry no tone come back unchanged with tone 0.
 */
export function splitTone(ch: string): { base: string; tone: Tone } {
  const decomposed = ch.normalize('NFD');
  let tone: Tone = 0;
  let rest = '';
  for (const c of decomposed) {
    const t = TONE_BY_MARK.get(c);
    if (t !== undefined) tone = t;
    else rest += c;
  }
  return { base: rest.normalize('NFC'), tone };
}

/** Put a tone on a toneless base vowel, keeping its case. */
export function applyTone(base: string, tone: Tone): string {
  if (tone === 0) return base;
  return (base + TONE_MARKS[tone]).normalize('NFC');
}
