# Data sources and licenses

Bible Study Lab only uses public domain or openly licensed data. Every source below was downloaded, its license text was read, and its size and hash were recorded in `scripts/sources.lock.json`. `npm run data:fetch` refuses to continue if a hash changes unless it is run with `--update`.

The app code is MIT licensed (see `LICENSE`). The Strong's lexicon files under `public/data/v1/strongs/lex/` are derived from a CC BY-SA source, so they are released under CC BY-SA 3.0 too, with attribution to Open Scriptures. The book overviews, study prompts and help text were written for this project and are released under CC BY 4.0.

## Sources

### King James Version, 1769 text, with Strong's numbers (eBible `eng-kjv2006`)

- Used for: Bible text, red letters, KJV footnotes, original word study
- License: Public domain outside the United Kingdom. In the UK the Crown holds letters patent over printing the KJV. This app only serves text, and the license statement is in `copr.htm` inside the package.
- Source: https://ebible.org/Scriptures/eng-kjv2006_usfm.zip
- Retrieved: 2026-11-21, 2,466,537 bytes, sha256 `b6faa67117ccaba49df9e7df224a553f11758ae7c5d58f0f7979e2b73ac4480b`

### World English Bible, 2020 stable text (eBible `engwebp`)

- Used for: Bible text, red letters, footnotes
- License: Public domain. "World English Bible" is a trademark; the text is not changed, so the name may be used.
- Source: https://ebible.org/Scriptures/engwebp_usfm.zip
- Retrieved: 2026-11-21, 2,908,360 bytes, sha256 `79ab3dd654e5852abe241e40a8007e4d364c8ffaaf56c35d63b494b70a1b9a34`

### American Standard Version, 1901 (eBible `eng-asv`)

- Used for: Bible text
- License: Public domain.
- Source: https://ebible.org/Scriptures/eng-asv_usfm.zip
- Retrieved: 2026-11-21, 2,875,616 bytes, sha256 `00b7b6c76cb1eb67b22ca51bd5ac13c2df526c13e1c38e78b862a7a2367f7071`

### Young's Literal Translation (eBible `engylt`)

- Used for: Bible text
- License: Public domain.
- Source: https://ebible.org/Scriptures/engylt_usfm.zip
- Retrieved: 2026-11-21, 1,386,206 bytes, sha256 `c526b4e362fef13916a14765a7e331267f6a1227db58549fc61d3288a930a12b`

### OpenBible.info cross references, generated 2026-11-16

- Used for: The cross reference connections, arcs, paths and insights
- License: CC BY 4.0. Cross references from OpenBible.info, licensed CC BY 4.0. Mostly drawn from the public domain Treasury of Scripture Knowledge, with votes from OpenBible.info readers.
- Source: https://a.openbible.info/data/cross-references.zip
- Retrieved: 2026-11-21, 1,982,822 bytes, sha256 `b54a2a381e3eb587ca4ea34ba3f1d052923c49625d857014041f3254eb7c4f1e`

### OpenBible.info topical Bible scores, generated 2026-11-16

- Used for: Topics and the verse of the day
- License: CC BY 4.0.
- Source: https://a.openbible.info/data/topic-scores.zip
- Retrieved: 2026-11-21, 418,825 bytes, sha256 `2da2d1672e283eb3387fdbf3200c8a1df9956e4c3adb30ee1d126b3ede81fb65`

### Open Scriptures Strong's Greek dictionary

- Used for: Word study
- License: CC BY-SA. The underlying Strong's dictionary (1890) is public domain; the JSON edition says "Copyright 2009, Open Scriptures. CC-BY-SA".
- Source: https://github.com/openscriptures/strongs/raw/0acd2f251c2d35ff8db2dece4e0593979d3ac223/greek/strongs-greek-dictionary.js
- Retrieved: 2026-11-21, 1,200,839 bytes, sha256 `7624ee738ae47e80f1a352223e28a26d011c9cd4898822cee52f47a010c04efd`

### Open Scriptures Strong's Hebrew dictionary

- Used for: Word study
- License: CC BY-SA. The underlying Strong's dictionary (1894) is public domain; the JSON edition says "Copyright 2010, Open Scriptures. CC-BY-SA".
- Source: https://github.com/openscriptures/strongs/raw/0acd2f251c2d35ff8db2dece4e0593979d3ac223/hebrew/strongs-hebrew-dictionary.js
- Retrieved: 2026-11-21, 2,003,130 bytes, sha256 `5ce6aeed551c709f49bcfa341cadf2f34bc7599b85d9de9e6ac2ecbf60fc3739`

### M'Cheyne reading calendar

- Used for: one of the reading plans
- License: public domain. Robert Murray M'Cheyne wrote the calendar in 1842.
- Transcription: `scripts/plans/mcheyne.json`, checked by `npm run data:verify` and a unit test: 365 days, 4 readings a day, the New Testament and Psalms twice, the rest of the Old Testament once.

### Fonts

- Gentium Book Plus (SIL), Atkinson Hyperlegible Next (Braille Institute), Noto Serif Hebrew. SIL Open Font License 1.1. Bundled through Fontsource, so no request goes to a font service.

## What the pipeline does

`npm run data` runs `scripts/fetch.ts`, then every `build-*.ts` step, then `scripts/verify-data.ts`. The output is deterministic and committed under `public/data/v1/`, so a deploy does not depend on eBible or OpenBible being up, and every change to the data shows in a diff.

- Verse ids are positions in KJV order, 0 to 31,101. WEB has one extra verse slot (Romans 14 and 16 hold the closing doxology differently, listed in `scripts/out/versification-report.txt`). Translations keep their own chapter and verse numbers in the text files.
- WEB and ASV leave out some verses that the KJV has (for example Matthew 17:21). Those verses stay as empty slots with their footnote.
- Cross references: 1,982,822 byte download, 344,799 rows. One row (`3John.1.15` as a source) does not match a KJV verse and is logged as the only allowed exception. A few ranges end at `3John.1.15`, one past the KJV chapter, and are clamped to 3 John 1:14.
- Strong's numbers come from the KJV tags only. The WEB and ASV packages also carry Strong's tags, but they are machine aligned and visibly wrong in places (John 1:16 "his" is tagged G3956 "all"), so they are not used.
- The verse of the day list is chosen from the best scored single verses in encouraging topics and then reviewed by hand; verses that read badly on their own are listed in `scripts/build-votd.ts`.

## Attribution text

Cross references and topics: OpenBible.info, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Strong's dictionaries: Open Scriptures, CC BY-SA, derived from Strong's Exhaustive Concordance (James Strong, 1890 and 1894). Bible texts: eBible.org and the translators who placed their work in the public domain.

The same list, in plain words, is on the About page of the app.
