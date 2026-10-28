import { applyTone, splitTone, type Tone } from './tones.js';
import { parseSyllable } from './syllable.js';

/**
 * - `new`: tone on the main vowel — hoà, hoè, thuỷ (kiểu mới)
 * - `old`: tone on the first vowel of oa/oe/uy — hòa, hòe, thủy (kiểu cũ)
 *
 * The two only differ for open syllables ending in oa, oe, uy.
 */
export type ToneStyle = 'new' | 'old';

export interface NormalizeOptions {
  /** Defaults to `new`. */
  style?: ToneStyle;
}

const MODIFIED = 'ăâêôơ';
const STYLE_SENSITIVE = new Set(['oa', 'oe', 'uy']);

/** Index inside the nucleus where the tone mark belongs. */
export function tonePosition(nucleus: string, hasCoda: boolean, style: ToneStyle): number {
  if (nucleus.length === 1) return 0;

  // A vowel with a breve, circumflex or horn always takes the tone. In "ươ"
  // that's the ơ, since ơ is in MODIFIED and ư is checked afterwards.
  for (let i = 0; i < nucleus.length; i++) {
    if (MODIFIED.includes(nucleus[i]!)) return i;
  }
  const u = nucleus.indexOf('ư');
  if (u !== -1) return u;

  if (hasCoda) return nucleus.length - 1;
  if (nucleus.length === 3) return 1;
  if (STYLE_SENSITIVE.has(nucleus)) return style === 'new' ? 1 : 0;
  return 0;
}

/**
 * Re-place the tone mark in a single word. Words that don't look like a
 * Vietnamese syllable (English, names, typos) are returned as-is.
 */
export function normalizeWord(word: string, style: ToneStyle = 'new'): string {
  const chars = [...word.normalize('NFC')];
  const bases: string[] = [];
  let tone: Tone = 0;
  let toneCount = 0;

  for (const ch of chars) {
    const s = splitTone(ch);
    bases.push(s.base);
    if (s.tone !== 0) {
      tone = s.tone;
      toneCount++;
    }
  }

  const nfc = chars.join('');
  // Nothing to move, or more than one tone which means it isn't Vietnamese.
  if (toneCount !== 1) return nfc;

  const lower = bases.join('').toLowerCase();
  const syl = parseSyllable(lower);
  if (!syl) return nfc;

  const target = syl.onset.length + tonePosition(syl.nucleus, syl.coda !== '', style);
  bases[target] = applyTone(bases[target]!, tone);
  return bases.join('');
}

// Letters plus combining marks, so NFD input stays in one token.
const WORD_RE = /[\p{L}\p{M}]+/gu;

/**
 * Normalize Vietnamese text: convert to NFC and put every tone mark in the
 * position required by `style`. Non-Vietnamese words are left untouched
 * apart from NFC composition.
 */
export function normalize(text: string, options: NormalizeOptions = {}): string {
  const style = options.style ?? 'new';
  return text.replace(WORD_RE, (w) => normalizeWord(w, style)).normalize('NFC');
}
