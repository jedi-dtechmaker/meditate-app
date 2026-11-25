import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TRANSLATIONS, defaultProfile } from '../shared/domain.ts';
import { dataSchemas, verseSchema } from '../shared/validation.ts';
import { getBibleBooks, getBibleChapter, searchFullBible } from '../bibleService.ts';

test('bundled translations provide the full Bible and exact verse lookup', async () => {
  assert.equal(getBibleBooks().length, 66);
  for (const translation of TRANSLATIONS) {
    const chapter = await getBibleChapter('John', 3, translation);
    assert.equal(chapter?.verses.length, 36);
    const verse = await searchFullBible('John 3:16', translation);
    assert.equal(verse.translation, translation); assert.equal(verse.found, true);
    assert.equal(verse.verse?.quote, chapter?.verses[15].text);
  }
});
test('a failed remote translation never returns KJV text under the wrong label', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  const result = await searchFullBible('peace', 'NLT');
  assert.equal(result.translation, 'NLT'); assert.equal(result.found, false); assert.equal(result.matches.length, 0);
});


test('additional translations preserve their text and are accepted for sync', async () => {
  const kjv = await getBibleChapter('John', 3, 'KJV');
  for (const translation of TRANSLATIONS) {
    assert.equal(dataSchemas.profile.safeParse({ ...defaultProfile('Reader'), translation }).success, true);
    const chapter = await getBibleChapter('John', 3, translation);
    assert.ok(chapter?.verses[15].text);
    const verse = { id: `${translation}:John:3:16`, book: 'John', chapter: 3, verse: 16,
      reference: 'John 3:16', quote: chapter.verses[15].text, translation };
    assert.equal(verseSchema.safeParse(verse).success, true);
    if (translation !== 'KJV') assert.notEqual(verse.quote, kjv?.verses[15].text);
    const search = await searchFullBible(verse.quote.slice(0, 25), translation);
    assert.equal(search.found, true);
    assert.equal(search.translation, translation);
  }
});

test('omitted verses are skipped without shifting their neighbors', async () => {
  const chapter = await getBibleChapter('Matthew', 17, 'ASV');
  assert.ok(chapter);
  assert.deepEqual(chapter.verses.filter((verse) => verse.verse >= 20 && verse.verse <= 22).map((verse) => verse.verse), [20, 22]);
  const missing = await searchFullBible('Matthew 17:21', 'ASV');
  assert.equal(missing.found, false);
  assert.equal('unavailable' in missing && missing.unavailable, true);
  const range = await searchFullBible('Matthew 17:20-22', 'ASV');
  assert.deepEqual(range.matches.map((verse) => verse.reference), ['Matthew 17:20', 'Matthew 17:22']);
  const wholeChapter = await searchFullBible('Matthew 17', 'ASV');
  assert.equal(wholeChapter.matches.some((verse) => verse.reference === 'Matthew 17:21'), false);
  assert.equal(wholeChapter.matches.some((verse) => verse.reference === 'Matthew 17:22'), true);
});

test('WEB retains omitted and extra verse numbering', async () => {
  const omitted = await searchFullBible('Luke 17:36', 'WEB');
  assert.equal(omitted.found, false);
  assert.equal('unavailable' in omitted && omitted.unavailable, true);
  const shorter = await searchFullBible('Romans 16:25', 'WEB');
  assert.equal(shorter.found, false);
  assert.equal('unavailable' in shorter && shorter.unavailable, true);
  const extra = await searchFullBible('Romans 14:26', 'WEB');
  assert.equal(extra.found, true);
  assert.equal(extra.verse?.reference, 'Romans 14:26');
  const chapter = await getBibleChapter('Romans', 14, 'WEB');
  assert.equal(chapter?.verses.at(-1)?.verse, 26);
});
