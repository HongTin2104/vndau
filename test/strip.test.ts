import { describe, expect, it } from 'vitest';
import { removeDiacritics, removeTones, slugify } from '../src/index.js';

describe('removeTones', () => {
  it('drops tone marks but keeps vowel modifiers', () => {
    expect(removeTones('Tiếng Việt')).toBe('Tiêng Viêt');
    expect(removeTones('người đẹp')).toBe('ngươi đep');
  });

  it('handles NFD input', () => {
    expect(removeTones('Hà Nội'.normalize('NFD'))).toBe('Ha Nôi');
  });
});

describe('removeDiacritics', () => {
  it('strips everything down to ASCII letters', () => {
    expect(removeDiacritics('Tiếng Việt')).toBe('Tieng Viet');
    expect(removeDiacritics('Đà Nẵng, đường Ưng')).toBe('Da Nang, duong Ung');
  });

  it('works on uppercase', () => {
    expect(removeDiacritics('THỪA THIÊN HUẾ')).toBe('THUA THIEN HUE');
  });
});

describe('slugify', () => {
  it.each([
    ['Hà Nội mùa thu', 'ha-noi-mua-thu'],
    ['  Đường   Lê Lợi, Q.1  ', 'duong-le-loi-q-1'],
    ['Chuyện "nhỏ" thôi!!!', 'chuyen-nho-thoi'],
    ['', ''],
  ])('%j -> %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('accepts a custom separator', () => {
    expect(slugify('Sài Gòn', { separator: '_' })).toBe('sai_gon');
  });

  it('can keep case', () => {
    expect(slugify('Sài Gòn', { lowercase: false })).toBe('Sai-Gon');
  });
});
