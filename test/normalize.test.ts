import { describe, expect, it } from 'vitest';
import { normalize, normalizeWord } from '../src/index.js';
import { protectedSpans } from '../src/normalize.js';

describe('normalizeWord', () => {
  it.each([
    // oa / oe / uy are the only cases where the styles disagree
    ['hòa', 'hoà', 'hòa'],
    ['hoà', 'hoà', 'hòa'],
    ['khỏe', 'khoẻ', 'khỏe'],
    ['thủy', 'thuỷ', 'thủy'],
    ['lũy', 'luỹ', 'lũy'],
    ['hóa', 'hoá', 'hóa'],
  ])('%s -> new: %s, old: %s', (input, expectedNew, expectedOld) => {
    expect(normalizeWord(input, 'new')).toBe(expectedNew);
    expect(normalizeWord(input, 'old')).toBe(expectedOld);
  });

  it.each([
    // closed syllables: tone on the last vowel
    ['hoàng', 'hoàng'],
    ['toán', 'toán'],
    ['huýt', 'huýt'],
    ['xoòng', 'xoòng'],
    // modified vowels win
    ['người', 'người'],
    ['rượu', 'rượu'],
    ['thuở', 'thuở'],
    ['thuế', 'thuế'],
    ['xoắn', 'xoắn'],
    ['tuấn', 'tuấn'],
    ['cứu', 'cứu'],
    ['chuyện', 'chuyện'],
    ['yếu', 'yếu'],
    // open syllables, two vowels: first one
    ['của', 'của'],
    ['kìa', 'kìa'],
    ['núi', 'núi'],
    ['máy', 'máy'],
    ['kéo', 'kéo'],
    // open syllables, three vowels: middle one
    ['ngoài', 'ngoài'],
    ['xoáy', 'xoáy'],
    ['khuỷu', 'khuỷu'],
    ['ngoẹo', 'ngoẹo'],
  ])('%s stays %s', (input, expected) => {
    expect(normalizeWord(input, 'new')).toBe(expected);
    expect(normalizeWord(input, 'old')).toBe(expected);
  });

  it('moves a misplaced tone', () => {
    expect(normalizeWord('ngừơi')).toBe('người');
    expect(normalizeWord('ngưòi')).toBe('ngưòi'); // plain o, not ơ: invalid
    expect(normalizeWord('nguời')).toBe('nguời'); // not a valid nucleus, leave it
    expect(normalizeWord('tóan')).toBe('toán');
    expect(normalizeWord('cuả')).toBe('của');
  });

  describe('qu and gi onsets', () => {
    it.each([
      ['qúy', 'quý'],
      ['quý', 'quý'],
      ['qủa', 'quả'],
      ['quỳnh', 'quỳnh'],
      ['quyết', 'quyết'],
      ['gìa', 'già'],
      ['gì', 'gì'],
      ['gìn', 'gìn'],
      ['giữa', 'giữa'],
      ['giếng', 'giếng'],
    ])('%s -> %s', (input, expected) => {
      expect(normalizeWord(input, 'new')).toBe(expected);
      expect(normalizeWord(input, 'old')).toBe(expected);
    });
  });

  it('keeps letter case', () => {
    expect(normalizeWord('HÒA')).toBe('HOÀ');
    expect(normalizeWord('Thủy')).toBe('Thuỷ');
    expect(normalizeWord('QÚY')).toBe('QUÝ');
    // case follows the position, not the tone
    expect(normalizeWord('hÒa')).toBe('hOà');
  });

  it('leaves non-Vietnamese words alone', () => {
    for (const w of ['café', 'José', 'résumé', 'naïve', 'hello', 'Zürich']) {
      expect(normalizeWord(w)).toBe(w);
    }
  });
});

describe('normalize', () => {
  it('composes NFD input', () => {
    const nfd = 'Tiếng Việt'.normalize('NFD');
    expect(normalize(nfd)).toBe('Tiếng Việt'.normalize('NFC'));
  });

  it('fixes NFD and tone placement in one go', () => {
    expect(normalize('ho\u0300a')).toBe('hoà');
    expect(normalize('ho\u0300a', { style: 'old' })).toBe('hòa');
  });

  it('keeps punctuation, spacing and numbers', () => {
    expect(normalize('Hòa bình, 2025 — thủy điện!')).toBe('Hoà bình, 2025 — thuỷ điện!');
  });

  it('defaults to the new style', () => {
    expect(normalize('hòa')).toBe(normalize('hòa', { style: 'new' }));
  });

  it('is idempotent', () => {
    const text = 'Thủy điện Hòa Bình được khởi công năm 1979.';
    const once = normalize(text);
    expect(normalize(once)).toBe(once);
  });

  describe('URLs and e-mail addresses', () => {
    it('keeps words inside URLs unchanged', () => {
      expect(normalize('Xem https://x.vn/hòa nhé')).toBe('Xem https://x.vn/hòa nhé');
      expect(normalize('www.example.com/thủy điện')).toBe('www.example.com/thủy điện');
    });

    it('keeps NFD text inside a URL decomposed', () => {
      const url = 'https://x.vn/ho\u0300a';
      expect(normalize(url)).toBe(url);
    });

    it('keeps e-mail addresses unchanged', () => {
      expect(normalize('gửi tới hòa.bình@example.com nhé')).toBe(
        'gửi tới hòa.bình@example.com nhé',
      );
    });

    it('stays fast on long text without an @', () => {
      const text = '!'.repeat(100_000);
      const start = performance.now();
      expect(normalize(text)).toBe(text);
      expect(performance.now() - start).toBeLessThan(100);
    });

    it('still normalizes the words around a URL', () => {
      expect(normalize('hòa tại https://x.vn/hòa')).toBe('hoà tại https://x.vn/hòa');
    });

    it('merges an e-mail address inside a URL into one span', () => {
      const text = 'hòa https://x.vn/a?to=thủy@x.vn hòa';
      expect(protectedSpans(text)).toEqual([{ start: 4, end: 31 }]);
      expect(normalize(text)).toBe('hoà https://x.vn/a?to=thủy@x.vn hoà');
    });
  });
});
