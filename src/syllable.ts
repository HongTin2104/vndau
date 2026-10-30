// Onsets ordered longest-first so greedy matching picks "ngh" over "ng".
// biome-ignore format: grouped by length for readability
const ONSETS = [
  'ngh', 'ng', 'nh', 'ch', 'gh', 'gi', 'kh', 'ph', 'qu', 'th', 'tr',
  'b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x',
];

const CODAS = new Set(['', 'c', 'ch', 'm', 'n', 'ng', 'nh', 'p', 't']);

// Every vowel nucleus that occurs in standard Vietnamese, without tones.
// Anything outside this list is treated as a non-Vietnamese word.
// biome-ignore format: grouped by number of vowels
const NUCLEI = new Set([
  'a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y',
  'ai', 'ao', 'au', 'ay', 'âu', 'ây', 'eo', 'êu', 'ia', 'iê', 'iu',
  'oa', 'oă', 'oe', 'oi', 'ôi', 'ơi', 'oo', 'ôô', 'ua', 'uâ', 'uê', 'ui',
  'uô', 'uơ', 'uy', 'ưa', 'ưi', 'ưu', 'ươ', 'yê',
  'iêu', 'yêu', 'oai', 'oao', 'oay', 'oeo', 'uây', 'uôi', 'uya', 'uyê',
  'uyu', 'ươi', 'ươu',
]);

const VOWEL_RE = /[aăâeêioôơuưy]+/;

export interface Syllable {
  onset: string;
  nucleus: string;
  coda: string;
}

/**
 * Parse a lowercase, toneless word into onset + nucleus + coda.
 * Returns null when the word can't be a Vietnamese syllable.
 */
export function parseSyllable(word: string): Syllable | null {
  const m = VOWEL_RE.exec(word);
  if (!m) return null;

  let onset = word.slice(0, m.index);
  let nucleus = m[0];
  const coda = word.slice(m.index + nucleus.length);

  // "qu" and "gi" swallow the following u/i as part of the onset, as long as
  // another vowel remains: "qua" = qu + a, "gia" = gi + a, but "gì" = g + i.
  if (onset === 'q' && nucleus.length > 1 && nucleus[0] === 'u') {
    onset = 'qu';
    nucleus = nucleus.slice(1);
  } else if (onset === 'g' && nucleus.length > 1 && nucleus[0] === 'i') {
    onset = 'gi';
    nucleus = nucleus.slice(1);
  }

  if (onset !== '' && !ONSETS.includes(onset)) return null;
  if (!CODAS.has(coda)) return null;
  if (!NUCLEI.has(nucleus)) return null;

  return { onset, nucleus, coda };
}
