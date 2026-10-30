# vndau

[![CI](https://github.com/HongTin2104/vndau/actions/workflows/ci.yml/badge.svg)](https://github.com/HongTin2104/vndau/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/vndau)](https://www.npmjs.com/package/vndau)
[![npm downloads](https://img.shields.io/npm/dm/vndau)](https://www.npmjs.com/package/vndau)
[![Node](https://img.shields.io/node/v/vndau)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Normalize Vietnamese tone marks so that `hòa` and `hoà` stop being two different strings.

```
$ echo "Khỏe không, thủy thủ? Qúy khách vui lòng chờ." | npx vndau
Khoẻ không, thuỷ thủ? Quý khách vui lòng chờ.
```

No dependencies, works in Node and the browser, ships with a CLI you can drop into CI.

## The problem

Vietnamese text in the wild is inconsistent in two ways:

1. **Tone placement.** Both `hòa` and `hoà` are in common use (old vs new style), and typing
   tools produce whichever they like. People also type outright mistakes like `qúy` or `tóan`.
2. **Unicode form.** Text copied from macOS, some PDFs, or older input methods is often in NFD
   (`a` + combining grave) instead of NFC (`à`). It looks identical but `===` fails.

The result is search that misses half the matches, duplicate keys in i18n files, and URLs
that differ by an invisible character. `vndau` fixes both.

> **Tóm tắt:** thư viện chuẩn hoá dấu tiếng Việt về một kiểu thống nhất (kiểu mới `hoà` hoặc
> kiểu cũ `hòa`), sửa lỗi bỏ dấu sai vị trí (`qúy` → `quý`) và chuyển văn bản NFD sang NFC.
> Có kèm CLI để kiểm tra file dịch / tài liệu trong CI.

## Install

```sh
npm install vndau
```

The package is ESM only. Node 20+ for the CLI; the library itself has no Node-specific code
and runs in any modern browser or bundler. From CommonJS on Node 20.19+ / 22.12+, plain
`require('vndau')` works; on older versions use `await import('vndau')`.

## Usage

```js
import { normalize, removeTones, removeDiacritics, slugify } from 'vndau';

normalize('Hòa bình, thủy điện');                  // 'Hoà bình, thuỷ điện'
normalize('Hoà bình, thuỷ điện', { style: 'old' }); // 'Hòa bình, thủy điện'
normalize('tóan học, qúy');                         // 'toán học, quý'

removeTones('Tiếng Việt');      // 'Tiêng Viêt'
removeDiacritics('Đà Nẵng');    // 'Da Nang'
slugify('Hà Nội mùa thu');      // 'ha-noi-mua-thu'
```

Words that aren't valid Vietnamese syllables are left alone, so mixed text is safe:

```js
normalize('café ở Zürich, hòa giải'); // 'café ở Zürich, hoà giải'
```

### Searching

Normalize both sides before comparing. For accent-insensitive search, strip diacritics too:

```js
const key = (s) => removeDiacritics(normalize(s)).toLowerCase();
key('Thủy') === key('thuỷ'); // true
key('Thủy') === key('THUY'); // true
```

For sorting, the built-in `Intl.Collator('vi')` already knows Vietnamese alphabet order, so
this library doesn't try to replace it.

## CLI

```
vndau check <path...>   report words with misplaced tones or NFD characters
vndau fix <path...>     rewrite files in place
vndau < input.txt       normalize stdin to stdout

  -s, --style <new|old>   tone placement style (default: new)
  -e, --ext <list>        extensions to scan in directories
  -q, --quiet             only print the summary
```

```
$ npx vndau check locales/
locales/vi.json:2:13  Hòa -> Hoà
locales/vi.json:3:12  Thủy -> Thuỷ
locales/vi.json:3:25  qúy -> quý
found 3 issue(s) in 1 of 1 file(s)
```

`check` exits with code 1 when it finds something, so it works as a CI step:

```yaml
- run: npx vndau check docs/ locales/
```

Directories are scanned recursively, skipping `node_modules`, `.git`, `dist`, `build` and
`coverage`. Files passed by name are always checked regardless of extension.

## Tone placement rules

The two styles only disagree on **open syllables ending in `oa`, `oe`, `uy`**:

| | new (default) | old |
|---|---|---|
| oa | hoà, hoá | hòa, hóa |
| oe | khoẻ | khỏe |
| uy | thuỷ, luỹ | thủy, lũy |

Everything else has one correct position, applied in this order:

1. One vowel: on it.
2. A vowel with a modifier (`ă â ê ô ơ`) takes the tone: `người`, `thuế`, `chuyện`, `thuở`.
3. Otherwise `ư` takes it: `cứu`, `lửa`, `gửi`.
4. Closed syllable (ends in a consonant): last vowel, e.g. `hoàng`, `toán`, `huýt`.
5. Three vowels, open: the middle one, e.g. `ngoài`, `khuỷu`.
6. Two vowels, open: the first one, e.g. `của`, `kìa`, `máy`.

`qu` and `gi` count as consonants when followed by another vowel (`quý`, `già`, `giữa`),
but `gi` on its own is `g` + `i` (`gì`, `gìn`).

Letter case is preserved per position, so `HÒA` becomes `HOÀ`.

## API

| Function | Description |
|---|---|
| `normalize(text, { style? })` | NFC + tone placement for every word |
| `normalizeWord(word, style?)` | Same, for a single word |
| `findIssues(text, style?)` | `{ line, column, found, expected, kind }[]`, what `check` prints |
| `removeTones(text)` | Drop tone marks, keep `ă â ê ô ơ ư đ` |
| `removeDiacritics(text)` | Drop everything, `đ` → `d` |
| `slugify(text, { separator?, lowercase? })` | URL slug |
| `parseSyllable(word)` | `{ onset, nucleus, coda }` or `null`, lowercase toneless input |

TypeScript types are included.

## Limitations

- Only Unicode input. Legacy encodings (VNI, TCVN3/ABC) need converting first.
- Validation is structural, not dictionary-based. A typo that still forms a valid syllable
  shape will be normalized, not flagged.
- Spelling variants like `quí`/`quý` or `kỹ`/`kĩ` are a different question from tone placement
  and are not changed.

## Contributing

Bug reports with a concrete word that comes out wrong are the most useful thing.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Tiếng Việt

`vndau` chuẩn hoá cách bỏ dấu tiếng Việt về một kiểu thống nhất, để `hòa` và `hoà` không còn là hai
chuỗi khác nhau. Thư viện không có dependency, chạy được trên Node 20+ và trình duyệt, kèm CLI.

```sh
npm install vndau
```

Dùng khi nào:

- **Tìm kiếm, khử trùng lặp dữ liệu:** chuẩn hoá cả từ khoá lẫn dữ liệu trước khi so sánh (xem mục
  [Searching](#searching)). Dữ liệu crawl từ nhiều nguồn thường lẫn kiểu dấu cũ, kiểu dấu mới và NFD.
- **Kiểm tra file dịch (i18n) và tài liệu trong CI:** `npx vndau check locales/` trả về mã lỗi 1 khi
  có từ bỏ dấu sai vị trí như `qúy`, `tóan`, hoặc ký tự NFD copy từ macOS hay PDF.
- **Tạo slug URL và tên file:** `slugify('Hà Nội mùa thu')` cho ra `'ha-noi-mua-thu'`.

Mặc định là kiểu dấu mới (`hoà`, `thuỷ`); dùng `{ style: 'old' }` hoặc `--style old` nếu dự án của
bạn theo kiểu cũ (`hòa`, `thủy`). Hai kiểu chỉ khác nhau ở vần `oa`, `oe`, `uy` (xem
[Tone placement rules](#tone-placement-rules)). URL và địa chỉ email trong văn bản được giữ nguyên.

Báo lỗi tốt nhất là đưa ra một từ cụ thể bị xử lý sai, kèm nguồn cho cách viết đúng:
[mở issue tại đây](https://github.com/HongTin2104/vndau/issues/new?template=wrong-result.yml).

## License

[MIT](LICENSE)
