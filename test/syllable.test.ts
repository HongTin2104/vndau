import { describe, expect, it } from 'vitest';
import { parseSyllable, tonePosition } from '../src/index.js';
import { applyTone, splitTone } from '../src/tones.js';

describe('parseSyllable', () => {
  it.each([
    ['nghiêng', { onset: 'ngh', nucleus: 'iê', coda: 'ng' }],
    ['thuy', { onset: 'th', nucleus: 'uy', coda: '' }],
    ['ăn', { onset: '', nucleus: 'ă', coda: 'n' }],
    ['đươc', { onset: 'đ', nucleus: 'ươ', coda: 'c' }],
    ['khuyên', { onset: 'kh', nucleus: 'uyê', coda: 'n' }],
  ])('splits %s', (word, expected) => {
    expect(parseSyllable(word)).toEqual(expected);
  });

  it('reads qu and gi as onsets only when another vowel follows', () => {
    expect(parseSyllable('qua')).toEqual({ onset: 'qu', nucleus: 'a', coda: '' });
    expect(parseSyllable('gia')).toEqual({ onset: 'gi', nucleus: 'a', coda: '' });
    expect(parseSyllable('gi')).toEqual({ onset: 'g', nucleus: 'i', coda: '' });
  });

  it.each([
    ['xyz', 'no vowel'],
    ['brown', 'onset not in Vietnamese'],
    ['bas', 'coda not in Vietnamese'],
    ['baeu', 'nucleus not in Vietnamese'],
    ['', 'empty string'],
  ])('rejects %j (%s)', (word) => {
    expect(parseSyllable(word)).toBeNull();
  });
});

describe('tonePosition', () => {
  it.each([
    ['a', false, 'new', 0],
    ['ươ', true, 'new', 1], // the modified vowel ơ takes the tone
    ['ưa', false, 'new', 0], // ư when no other modified vowel
    ['oa', true, 'new', 1], // with a coda the last vowel takes it
    ['uya', false, 'new', 1], // three-vowel nucleus without coda
    ['oa', false, 'new', 1],
    ['oa', false, 'old', 0],
    ['ai', false, 'new', 0],
  ] as const)('%s, coda=%s, %s style -> %i', (nucleus, hasCoda, style, expected) => {
    expect(tonePosition(nucleus, hasCoda, style)).toBe(expected);
  });
});

describe('splitTone and applyTone', () => {
  it('splits NFC and NFD forms the same way', () => {
    expect(splitTone('ệ')).toEqual({ base: 'ê', tone: 5 });
    expect(splitTone('ệ')).toEqual({ base: 'ê', tone: 5 });
  });

  it('returns tone 0 for characters without a tone', () => {
    expect(splitTone('ơ')).toEqual({ base: 'ơ', tone: 0 });
    expect(splitTone('b')).toEqual({ base: 'b', tone: 0 });
  });

  it('leaves the base alone for tone 0', () => {
    expect(applyTone('A', 0)).toBe('A');
  });

  it('round-trips every tone and keeps case', () => {
    for (const ch of ['à', 'Ả', 'ẫ', 'Ớ', 'ự']) {
      const { base, tone } = splitTone(ch);
      expect(applyTone(base, tone)).toBe(ch);
    }
  });
});
