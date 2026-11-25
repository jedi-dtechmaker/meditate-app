const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dailyVerse, versesForFocus } = require('../src/lib/bible.ts');

test('daily verses stay stable within the local day and change at midnight', () => {
  const beforeMidnight = new Date('2026-11-25T22:30:00Z');
  const earlier = new Date('2026-11-25T07:00:00Z');
  const afterMidnight = new Date('2026-11-25T23:30:00Z');
  const verse = (date) => dailyVerse('Peace', 'WEB', date, 'Africa/Lagos').id;
  assert.equal(verse(earlier), verse(beforeMidnight));
  assert.notEqual(verse(beforeMidnight), verse(afterMidnight));
  assert.equal(verse(afterMidnight), dailyVerse('Peace', 'WEB', new Date('2026-11-26T12:00:00Z'), 'Africa/Lagos').id);
});

test('each mood has a varied rotation without consecutive repeats', () => {
  for (const focus of ['Peace', 'Joy', 'Courage', 'Healing', 'Gratitude']) {
    const verses = Array.from({ length: 100 }, (_, day) => dailyVerse(focus, 'WEB', new Date(Date.UTC(2026, 0, day + 1)), 'UTC').id);
    assert.ok(new Set(verses).size >= 15, `${focus} should have a varied selection`);
    for (let day = 1; day < verses.length; day++) assert.notEqual(verses[day], verses[day - 1], `${focus} repeated on day ${day}`);
  }
});

test('daily selections have text in every available translation', () => {
  for (const translation of ['KJV', 'BBE', 'WEB', 'ASV', 'YLT']) {
    for (const focus of ['Peace', 'Joy', 'Courage', 'Healing', 'Gratitude']) {
      const result = dailyVerse(focus, translation, new Date('2026-11-25T12:00:00Z'), 'UTC');
      assert.ok(result.quote);
      assert.equal(result.translation, translation);
    }
  }
});

test('mood suggestions include the featured verse and change with the day', () => {
  const today = new Date('2026-11-25T12:00:00Z');
  const tomorrow = new Date('2026-11-26T12:00:00Z');
  const suggestions = versesForFocus('Joy', 'KJV', today, 'UTC');
  assert.equal(suggestions[0].id, dailyVerse('Joy', 'KJV', today, 'UTC').id);
  assert.equal(new Set(suggestions.map((verse) => verse.id)).size, suggestions.length);
  assert.notDeepEqual(suggestions.map((verse) => verse.id), versesForFocus('Joy', 'KJV', tomorrow, 'UTC').map((verse) => verse.id));
});
