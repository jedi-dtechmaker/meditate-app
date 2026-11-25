const assert = require('node:assert/strict');
const { test } = require('node:test');
const { bible, dailyVerse, isOmittedReference, searchBible, versesForFocus, versesInChapter } = require('../src/lib/bible.ts');

test('mobile reading skips omitted verses without changing verse numbers', () => {
  const chapter = versesInChapter('Matthew', 17, 'ASV');
  assert.deepEqual(chapter.filter((verse) => verse.verse >= 20 && verse.verse <= 22).map((verse) => verse.verse), [20, 22]);
  assert.equal(isOmittedReference('Matthew 17:21', 'ASV'), true);
  assert.equal(isOmittedReference('Matthew 17:999', 'ASV'), false);
  assert.deepEqual(searchBible('Matthew 17:21', 'ASV'), []);
  assert.equal(searchBible('Matthew 17', 'ASV').some((verse) => verse.verse === 22), true);
});

test('focus verses remain usable when a translation omits one', () => {
  const psalms = bible('ASV').find((book) => book.name === 'Psalms');
  const original = psalms.chapters[45][9];
  try {
    psalms.chapters[45][9] = '';
    assert.equal(versesForFocus('Peace', 'ASV').some((verse) => verse.reference === 'Psalms 46:10'), false);
    for (let day = 0; day < 5; day++) {
      assert.notEqual(dailyVerse('Peace', 'ASV', new Date(Date.UTC(2026, 0, day + 1))).reference, 'Psalms 46:10');
    }
  } finally {
    psalms.chapters[45][9] = original;
  }
});

test('WEB keeps omitted and extra verse numbers', () => {
  assert.equal(isOmittedReference('Luke 17:36', 'WEB'), true);
  assert.equal(isOmittedReference('Romans 16:25', 'WEB'), true);
  assert.equal(isOmittedReference('Romans 14:26', 'KJV'), true);
  assert.equal(versesInChapter('Romans', 14, 'WEB').at(-1).verse, 26);
  assert.equal(searchBible('Romans 14:26', 'WEB')[0].reference, 'Romans 14:26');
});
