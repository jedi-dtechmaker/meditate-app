import type { Focus, Translation, Verse } from '@shared/domain';
import { localDateKey, TRANSLATIONS } from '@shared/domain';
type BibleBook = { name: string; abbrev: string; chapters: string[][] };
export function bible(translation: Translation): BibleBook[] {
  switch (translation) {
    case 'KJV': return require('../../../../data/bible/kjv.json');
    case 'BBE': return require('../../../../data/bible/bbe.json');
    case 'WEB': return require('../../../../data/bible/web.json');
    case 'ASV': return require('../../../../data/bible/asv.json');
    case 'YLT': return require('../../../../data/bible/ylt.json');
    default: throw new Error('This Bible translation is unavailable.');
  }
}
function availableVerse(book: string, chapter: number, verse: number, translation: Translation): Verse | null {
  const data = bible(translation).find((item) => item.name === book);
  const quote = data?.chapters[chapter - 1]?.[verse - 1]?.replace(/<[^>]*>/g, '').trim();
  if (!quote) return null;
  return { id: `${translation}:${book}:${chapter}:${verse}`, book, chapter, verse, quote, reference: `${book} ${chapter}:${verse}`, translation };
}
export function verseAt(book: string, chapter: number, verse: number, translation: Translation): Verse {
  const result = availableVerse(book, chapter, verse, translation);
  if (!result) throw new Error('This verse is unavailable in this translation.');
  return result;
}
export function versesInChapter(book: string, chapter: number, translation: Translation): Verse[] {
  const verses = bible(translation).find((item) => item.name === book)?.chapters[chapter - 1] || [];
  return verses.flatMap((_, index) => {
    const result = availableVerse(book, chapter, index + 1, translation);
    return result ? [result] : [];
  });
}
export function isOmittedReference(query: string, translation: Translation): boolean {
  const match = /^(.*?)\s+(\d+):(\d+)$/.exec(query.trim());
  if (!match) return false;
  const book = bible(translation).find((item) => item.name.toLowerCase().startsWith(match[1].toLowerCase()));
  const text = book?.chapters[Number(match[2]) - 1]?.[Number(match[3]) - 1];
  if (typeof text === 'string') return !text.replace(/<[^>]*>/g, '').trim();
  if (!book) return false;
  return TRANSLATIONS.some((candidate) => candidate !== translation &&
    Boolean(availableVerse(book.name, Number(match[2]), Number(match[3]), candidate)));

}
const focusVerses: Record<Focus, [string, number, number][]> = {
  Peace: [['Psalms', 46, 10], ['John', 14, 27], ['Isaiah', 26, 3], ['Philippians', 4, 7]],
  Joy: [['Psalms', 16, 11], ['Romans', 15, 13], ['Philippians', 4, 4]],
  Courage: [['Joshua', 1, 9], ['Isaiah', 41, 10], ['2 Timothy', 1, 7]],
  Healing: [['Jeremiah', 17, 14], ['Psalms', 147, 3], ['Matthew', 11, 28]],
  Gratitude: [['1 Thessalonians', 5, 18], ['Psalms', 100, 4], ['Colossians', 3, 15]],
};
// Keep the short mood suggestions separate from the larger daily rotation.
const dailyReferences: Record<Focus, [string, number, number][]> = {
  Peace: [...focusVerses.Peace, ['Psalms', 4, 8], ['Psalms', 29, 11], ['Psalms', 55, 22], ['Psalms', 62, 1], ['Psalms', 91, 1], ['Psalms', 119, 165], ['Isaiah', 26, 12], ['Isaiah', 32, 17], ['Isaiah', 54, 10], ['John', 16, 33], ['Romans', 8, 6], ['Romans', 15, 13], ['Philippians', 4, 6], ['Colossians', 3, 15], ['2 Thessalonians', 3, 16], ['1 Peter', 5, 7]],
  Joy: [...focusVerses.Joy, ['Psalms', 5, 11], ['Psalms', 30, 5], ['Psalms', 32, 11], ['Psalms', 47, 1], ['Psalms', 90, 14], ['Psalms', 98, 4], ['Psalms', 100, 2], ['Psalms', 118, 24], ['Proverbs', 17, 22], ['Isaiah', 12, 3], ['Isaiah', 61, 10], ['John', 15, 11], ['John', 16, 22], ['Romans', 12, 12], ['Galatians', 5, 22], ['1 Thessalonians', 5, 16], ['Nehemiah', 8, 10]],
  Courage: [...focusVerses.Courage, ['Deuteronomy', 31, 6], ['Deuteronomy', 31, 8], ['Joshua', 1, 7], ['Psalms', 18, 2], ['Psalms', 27, 1], ['Psalms', 27, 14], ['Psalms', 31, 24], ['Psalms', 56, 3], ['Psalms', 118, 6], ['Isaiah', 40, 31], ['Isaiah', 43, 2], ['John', 16, 33], ['Romans', 8, 31], ['1 Corinthians', 16, 13], ['Ephesians', 6, 10], ['Philippians', 4, 13], ['Hebrews', 13, 6]],
  Healing: [...focusVerses.Healing, ['Exodus', 15, 26], ['Psalms', 23, 3], ['Psalms', 30, 2], ['Psalms', 34, 18], ['Psalms', 41, 3], ['Psalms', 103, 3], ['Psalms', 107, 20], ['Proverbs', 3, 8], ['Proverbs', 4, 22], ['Isaiah', 40, 29], ['Isaiah', 41, 10], ['Isaiah', 57, 18], ['Jeremiah', 30, 17], ['Matthew', 11, 29], ['2 Corinthians', 1, 3], ['James', 5, 16], ['3 John', 1, 2]],
  Gratitude: [...focusVerses.Gratitude, ['1 Chronicles', 16, 34], ['Psalms', 9, 1], ['Psalms', 28, 7], ['Psalms', 34, 1], ['Psalms', 69, 30], ['Psalms', 92, 1], ['Psalms', 95, 2], ['Psalms', 103, 2], ['Psalms', 107, 1], ['Psalms', 118, 1], ['Psalms', 136, 1], ['Philippians', 4, 6], ['Colossians', 3, 17], ['Colossians', 4, 2], ['James', 1, 17], ['Hebrews', 12, 28], ['2 Corinthians', 9, 15]],
};

function shuffled(length: number, cycle: number, focus: Focus): number[] {
  let seed = (cycle ^ [...focus].reduce((value, letter) => Math.imul(value, 31) + letter.charCodeAt(0), 0)) >>> 0;
  const order = Array.from({ length }, (_, index) => index);
  for (let index = length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const other = seed % (index + 1);
    [order[index], order[other]] = [order[other], order[index]];
  }
  return order;
}

function dailySelection(focus: Focus, translation: Translation, now: Date, timezone?: string): Verse[] {
  const day = Math.floor(Date.parse(`${localDateKey(now, timezone)}T00:00:00Z`) / 86400000);
  const available = dailyReferences[focus].flatMap(([book, chapter, verse]) => {
    const result = availableVerse(book, chapter, verse, translation);
    return result ? [result] : [];
  });
  if (!available.length) throw new Error('No verses are available for this focus in this translation.');
  const cycle = Math.floor(day / available.length);
  const position = ((day % available.length) + available.length) % available.length;
  const order = shuffled(available.length, cycle, focus);
  if (order.length > 2 && order[0] === shuffled(available.length, cycle - 1, focus).at(-1)) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return Array.from({ length: Math.min(4, available.length) }, (_, offset) => available[order[(position + offset) % order.length]]);
}
export function dailyVerse(focus: Focus, translation: Translation, now = new Date(), timezone?: string): Verse {
  return dailySelection(focus, translation, now, timezone)[0];
}
export function versesForFocus(focus: Focus, translation: Translation, now = new Date(), timezone?: string): Verse[] {
  return dailySelection(focus, translation, now, timezone);
}
export function searchBible(query: string, translation: Translation): Verse[] {
  const input = query.trim();
  if (input.length < 2) return [];
  const reference = /^(.*?)\s+(\d+)(?::(\d+))?$/.exec(input);
  if (reference) {
    const book = bible(translation).find((item) => item.name.toLowerCase().startsWith(reference[1].toLowerCase()));
    if (book) {
      const chapter = Number(reference[2]);
      if (reference[3]) { try { return [verseAt(book.name, chapter, Number(reference[3]), translation)]; } catch { return []; } }
      return versesInChapter(book.name, chapter, translation).slice(0, 60);
    }
  }
  const tokens = input.toLowerCase().split(/\s+/);
  const results: Verse[] = [];
  for (const book of bible(translation)) {
    for (let chapter = 0; chapter < book.chapters.length; chapter++) {
      for (let verse = 0; verse < book.chapters[chapter].length; verse++) {
        if (tokens.every((word) => book.chapters[chapter][verse].toLowerCase().includes(word))) {
          results.push(verseAt(book.name, chapter + 1, verse + 1, translation));
          if (results.length >= 40) return results;
        }
      }
    }
  }
  return results;
}
