const TONE_MARKS_RE = /[\u0300\u0301\u0303\u0309\u0323]/g;
const ALL_MARKS_RE = /\p{M}/gu;

/**
 * Remove only the five tone marks, keeping ă â ê ô ơ ư đ.
 * "Tiếng Việt" -> "Tiêng Viêt"
 */
export function removeTones(text: string): string {
  return text.normalize('NFD').replace(TONE_MARKS_RE, '').normalize('NFC');
}

/**
 * Remove every diacritic and map đ/Đ to d/D.
 * "Tiếng Việt" -> "Tieng Viet"
 */
export function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(ALL_MARKS_RE, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export interface SlugifyOptions {
  /** Defaults to "-". */
  separator?: string;
  /** Defaults to true. */
  lowercase?: boolean;
}

/** "Hà Nội mùa thu" -> "ha-noi-mua-thu" */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  const sep = options.separator ?? '-';
  let s = removeDiacritics(text);
  if (options.lowercase ?? true) s = s.toLowerCase();
  return s
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .join(sep);
}
