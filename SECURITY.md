# Security policy

vndau has no runtime dependencies and makes no network requests. The library only transforms
strings; the CLI reads the files you pass it and, with `vndau fix`, rewrites them in place.

If you find a security problem (for example input that makes it hang, or a way to make the CLI
write outside the paths it was given), please do not open a public issue. Report it privately
through [GitHub's private vulnerability reporting](https://github.com/HongTin2104/vndau/security/advisories/new)
or by email to hongtin2104@gmail.com. You should get a reply within a week.

A word that comes out wrong is not a security issue; please use the
[wrong result](https://github.com/HongTin2104/vndau/issues/new?template=wrong-result.yml) form.

Only the latest release on npm is supported.
