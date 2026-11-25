import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TRANSLATIONS } from './shared/domain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BibleTranslationMeta {
  id: string;
  shortName: string;
  fullName: string;
  featured?: boolean;
  source: 'local' | 'bolls';
  description: string;
}

export const BIBLE_TRANSLATIONS: BibleTranslationMeta[] = [
  // Featured / Most Popular Translations
  { id: 'KJV', shortName: 'KJV', fullName: 'King James Version', featured: true, source: 'local', description: 'Classic 1769 Authorized Version' },
  { id: 'NLT', shortName: 'NLT', fullName: 'New Living Translation', featured: true, source: 'bolls', description: 'Warm, clear everyday modern English' },
  { id: 'MSG', shortName: 'MSG', fullName: 'The Message', featured: true, source: 'bolls', description: 'Contemporary conversational paraphrase' },
  { id: 'NKJV', shortName: 'NKJV', fullName: 'New King James Version', featured: true, source: 'bolls', description: 'Modernized classic reverence' },
  { id: 'ESV', shortName: 'ESV', fullName: 'English Standard Version', featured: true, source: 'bolls', description: 'Essentially literal modern translation' },
  { id: 'NASB', shortName: 'NASB', fullName: 'New American Standard Bible (1995)', featured: true, source: 'bolls', description: 'Word-for-word precision' },
  { id: 'AMP', shortName: 'AMP', fullName: 'Amplified Bible', featured: true, source: 'bolls', description: 'Expanded meanings & nuance' },
  { id: 'CSB17', shortName: 'CSB', fullName: 'Christian Standard Bible', featured: true, source: 'bolls', description: 'Optimal equivalence, clear & faithful' },
  { id: 'WEB', shortName: 'WEB', fullName: 'World English Bible', featured: true, source: 'local', description: 'Modern public domain English' },
  { id: 'BSB', shortName: 'BSB', fullName: 'Berean Standard Bible', featured: true, source: 'bolls', description: 'Clean, smooth contemporary English' },
  { id: 'NET', shortName: 'NET', fullName: 'New English Translation', featured: true, source: 'bolls', description: 'Scholarly modern English' },
  { id: 'BBE', shortName: 'BBE', fullName: 'Bible in Basic English', featured: true, source: 'local', description: 'Simple, accessible English' },

  // All Additional Available English Translations
  { id: 'CEB', shortName: 'CEB', fullName: 'Common English Bible', source: 'bolls', description: 'Natural, readable phrasing' },
  { id: 'GNTD', shortName: 'GNT', fullName: 'Good News Translation (US)', source: 'bolls', description: 'Clear thought-for-thought English' },
  { id: 'ERV', shortName: 'ERV', fullName: 'Easy-to-Read Version', source: 'bolls', description: 'Simple, clear modern wording' },
  { id: 'ASV', shortName: 'ASV', fullName: 'American Standard Version (1901)', source: 'local', description: 'Classic literal heritage' },
  { id: 'RSV', shortName: 'RSV', fullName: 'Revised Standard Version (1952)', source: 'bolls', description: 'Formal literary English' },
  { id: 'LSB', shortName: 'LSB', fullName: 'Legacy Standard Bible', source: 'bolls', description: 'Literal update to NASB 1995' },
  { id: 'MEV', shortName: 'MEV', fullName: 'Modern English Version', source: 'bolls', description: 'Updated King James tradition' },
  { id: 'CEVD', shortName: 'CEV', fullName: 'Contemporary English Version', source: 'bolls', description: 'Easy-to-read aloud' },
  { id: 'ISV', shortName: 'ISV', fullName: 'International Standard Version', source: 'bolls', description: 'Modern scholarly translation' },
  { id: 'YLT', shortName: 'YLT', fullName: "Young's Literal Translation", source: 'local', description: 'Strictly literal word order' },
  { id: 'CJB', shortName: 'CJB', fullName: 'Complete Jewish Bible', source: 'bolls', description: 'Messianic Jewish context' },
  { id: 'TLV', shortName: 'TLV', fullName: 'Tree of Life Version', source: 'bolls', description: 'Jewish roots & English flow' },
  { id: 'NRSVCE', shortName: 'NRSV', fullName: 'New Revised Standard Version (CE)', source: 'bolls', description: 'Academic & ecumenical standard' },
  { id: 'NABRE', shortName: 'NABRE', fullName: 'New American Bible Revised Edition', source: 'bolls', description: 'Modern Catholic translation' },
  { id: 'NJB1985', shortName: 'NJB', fullName: 'New Jerusalem Bible', source: 'bolls', description: 'Literary Catholic translation' },
  { id: 'DRB', shortName: 'DRB', fullName: 'Douay-Rheims Bible', source: 'bolls', description: 'Classic Catholic heritage' },
  { id: 'GNV', shortName: 'GNV', fullName: 'Geneva Bible (1599)', source: 'bolls', description: 'Historic Reformation English' },
  { id: 'LSV', shortName: 'LSV', fullName: 'Literal Standard Version', source: 'bolls', description: 'Modern literal translation' },
  { id: 'NLV', shortName: 'NLV', fullName: 'New Life Version', source: 'bolls', description: 'Limited vocabulary clarity' },
  { id: 'GNT', shortName: 'GNB', fullName: 'Good News Bible (1976)', source: 'bolls', description: 'Classic Good News phrasing' },
  { id: 'TS2009', shortName: 'TS2009', fullName: 'The Scriptures 2009', source: 'bolls', description: 'Restored Hebrew names' },
  { id: 'AUV', shortName: 'AUV', fullName: 'An Understandable Version', source: 'bolls', description: 'Plain-language translation' },
  { id: 'RSV2CE', shortName: 'RSV2CE', fullName: 'Revised Standard Version (2CE)', source: 'bolls', description: 'Second Catholic Edition' },
  { id: 'LBP', shortName: 'Lamsa', fullName: 'Peshitta Aramaic (Lamsa)', source: 'bolls', description: 'Translated from Aramaic Peshitta' },
  { id: 'LXXE', shortName: 'LXXE', fullName: 'English Septuagint (1851)', source: 'bolls', description: 'Brenton Greek Old Testament' },
  { id: 'WPNT', shortName: 'WPNT', fullName: "Wilbur Pickering's NT", source: 'bolls', description: 'Majority Text New Testament' },
];

interface RawBibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

export interface BibleBookMeta {
  index: number;
  name: string;
  testament: 'OT' | 'NT';
  chapterCount: number;
  verseCount: number;
}

export interface NormalizedVerse {
  id: string;
  reference: string;
  quote: string;
  book: string;
  chapter: number;
  verse: number;
  category: string;
  reflectionPrompts: string[];
  themeImageUrl: string;
}

const SCENIC_VERSE_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
];

const localBibleCache: Partial<Record<LocalBibleKey, RawBibleBook[]>> = {};
// Cache remote Bolls chapters: key = `${translation}:${bookNum}:${chapter}` -> string[] (1-indexed verses mapped to 0-indexed array)
const remoteChapterCache = new Map<string, string[]>();

type LocalBibleKey = 'kjv' | 'bbe' | 'web' | 'asv' | 'ylt';

function loadLocalBible(translation: LocalBibleKey): RawBibleBook[] {
  if (localBibleCache[translation]) return localBibleCache[translation]!;
  const filePath = path.join(__dirname, 'data', 'bible', `${translation}.json`);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(raw) as RawBibleBook[];
  localBibleCache[translation] = parsed;
  return parsed;
}

export function resolveTranslationMeta(raw?: unknown): BibleTranslationMeta {
  const input = typeof raw === 'string' ? raw.trim().toUpperCase() : 'KJV';
  const aliasMap: Record<string, string> = {
    CSB: 'CSB17',
    GNT: 'GNTD',
    NRSV: 'NRSVCE',
    NJB: 'NJB1985',
    CEV: 'CEVD',
  };
  const targetId = aliasMap[input] || input;
  return (
    BIBLE_TRANSLATIONS.find((t) => t.id.toUpperCase() === targetId) ||
    BIBLE_TRANSLATIONS[0]
  );
}

export function cleanBibleText(raw: string): string {
  return raw
    .replace(/<S>[^<]*<\/S>/gi, '')
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/\s+/g, ' ')
    .trim();
}

const BOOK_ALIASES: Record<string, string> = {
  gen: 'Genesis',
  ge: 'Genesis',
  gn: 'Genesis',
  ex: 'Exodus',
  exo: 'Exodus',
  exod: 'Exodus',
  lev: 'Leviticus',
  le: 'Leviticus',
  lv: 'Leviticus',
  num: 'Numbers',
  nu: 'Numbers',
  nm: 'Numbers',
  deut: 'Deuteronomy',
  deu: 'Deuteronomy',
  dt: 'Deuteronomy',
  josh: 'Joshua',
  jos: 'Joshua',
  judg: 'Judges',
  jdg: 'Judges',
  jg: 'Judges',
  ru: 'Ruth',
  rth: 'Ruth',
  '1sam': '1 Samuel',
  '1sa': '1 Samuel',
  '1sm': '1 Samuel',
  '2sam': '2 Samuel',
  '2sa': '2 Samuel',
  '2sm': '2 Samuel',
  '1kgs': '1 Kings',
  '1ki': '1 Kings',
  '1kg': '1 Kings',
  '1king': '1 Kings',
  '2kgs': '2 Kings',
  '2ki': '2 Kings',
  '2kg': '2 Kings',
  '2king': '2 Kings',
  '1chr': '1 Chronicles',
  '1ch': '1 Chronicles',
  '1chron': '1 Chronicles',
  '2chr': '2 Chronicles',
  '2ch': '2 Chronicles',
  '2chron': '2 Chronicles',
  ezr: 'Ezra',
  neh: 'Nehemiah',
  ne: 'Nehemiah',
  esth: 'Esther',
  est: 'Esther',
  es: 'Esther',
  jb: 'Job',
  ps: 'Psalms',
  psa: 'Psalms',
  psm: 'Psalms',
  psalm: 'Psalms',
  psalms: 'Psalms',
  prov: 'Proverbs',
  pro: 'Proverbs',
  pr: 'Proverbs',
  prv: 'Proverbs',
  eccl: 'Ecclesiastes',
  ecc: 'Ecclesiastes',
  ec: 'Ecclesiastes',
  song: 'Song of Solomon',
  sos: 'Song of Solomon',
  so: 'Song of Solomon',
  canticles: 'Song of Solomon',
  songofsongs: 'Song of Solomon',
  isa: 'Isaiah',
  is: 'Isaiah',
  jer: 'Jeremiah',
  je: 'Jeremiah',
  jr: 'Jeremiah',
  lam: 'Lamentations',
  la: 'Lamentations',
  ezek: 'Ezekiel',
  eze: 'Ezekiel',
  ezk: 'Ezekiel',
  dan: 'Daniel',
  da: 'Daniel',
  dn: 'Daniel',
  hos: 'Hosea',
  ho: 'Hosea',
  jl: 'Joel',
  joe: 'Joel',
  am: 'Amos',
  amo: 'Amos',
  obad: 'Obadiah',
  oba: 'Obadiah',
  ob: 'Obadiah',
  jon: 'Jonah',
  jnh: 'Jonah',
  mic: 'Micah',
  mi: 'Micah',
  nah: 'Nahum',
  na: 'Nahum',
  hab: 'Habakkuk',
  zeph: 'Zephaniah',
  zep: 'Zephaniah',
  hag: 'Haggai',
  hg: 'Haggai',
  zech: 'Zechariah',
  zec: 'Zechariah',
  mal: 'Malachi',
  ml: 'Malachi',
  matt: 'Matthew',
  mat: 'Matthew',
  mt: 'Matthew',
  mk: 'Mark',
  mrk: 'Mark',
  mar: 'Mark',
  lk: 'Luke',
  luk: 'Luke',
  lu: 'Luke',
  jn: 'John',
  joh: 'John',
  jhn: 'John',
  act: 'Acts',
  ac: 'Acts',
  rom: 'Romans',
  ro: 'Romans',
  rm: 'Romans',
  '1cor': '1 Corinthians',
  '1co': '1 Corinthians',
  '2cor': '2 Corinthians',
  '2co': '2 Corinthians',
  gal: 'Galatians',
  ga: 'Galatians',
  eph: 'Ephesians',
  ep: 'Ephesians',
  phil: 'Philippians',
  php: 'Philippians',
  ph: 'Philippians',
  col: 'Colossians',
  '1thess': '1 Thessalonians',
  '1thes': '1 Thessalonians',
  '1th': '1 Thessalonians',
  '2thess': '2 Thessalonians',
  '2thes': '2 Thessalonians',
  '2th': '2 Thessalonians',
  '1tim': '1 Timothy',
  '1ti': '1 Timothy',
  '1tm': '1 Timothy',
  '2tim': '2 Timothy',
  '2ti': '2 Timothy',
  '2tm': '2 Timothy',
  tit: 'Titus',
  ti: 'Titus',
  philem: 'Philemon',
  phlm: 'Philemon',
  phm: 'Philemon',
  heb: 'Hebrews',
  he: 'Hebrews',
  jas: 'James',
  jam: 'James',
  jm: 'James',
  '1pet': '1 Peter',
  '1pe': '1 Peter',
  '1pt': '1 Peter',
  '2pet': '2 Peter',
  '2pe': '2 Peter',
  '2pt': '2 Peter',
  '1jn': '1 John',
  '1jo': '1 John',
  '1joh': '1 John',
  '2jn': '2 John',
  '2jo': '2 John',
  '2joh': '2 John',
  '3jn': '3 John',
  '3jo': '3 John',
  '3joh': '3 John',
  jud: 'Jude',
  rev: 'Revelation',
  re: 'Revelation',
  revelations: 'Revelation',
};

function normalizeBookInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^iii\s+/, '3 ')
    .replace(/^ii\s+/, '2 ')
    .replace(/^i\s+/, '1 ')
    .replace(/^first\s+/, '1 ')
    .replace(/^second\s+/, '2 ')
    .replace(/^third\s+/, '3 ')
    .replace(/^1st\s+/, '1 ')
    .replace(/^2nd\s+/, '2 ')
    .replace(/^3rd\s+/, '3 ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

function resolveBookIndex(rawBookQuery: string): number {
  const books = loadLocalBible('kjv');
  const normalized = normalizeBookInput(rawBookQuery);
  const compact = normalized.replace(/\s+/g, '');

  const exactIdx = books.findIndex(
    (b) =>
      b.name.toLowerCase() === normalized ||
      b.name.toLowerCase().replace(/\s+/g, '') === compact
  );
  if (exactIdx !== -1) return exactIdx;

  const aliasTarget = BOOK_ALIASES[compact] || BOOK_ALIASES[normalized];
  if (aliasTarget) {
    const aliasIdx = books.findIndex((b) => b.name === aliasTarget);
    if (aliasIdx !== -1) return aliasIdx;
  }

  if (normalized.length >= 2) {
    const prefixIdx = books.findIndex(
      (b) =>
        b.name.toLowerCase().startsWith(normalized) ||
        b.name.toLowerCase().replace(/\s+/g, '').startsWith(compact)
    );
    if (prefixIdx !== -1) return prefixIdx;
  }

  return -1;
}

function buildNormalizedVerse(
  bookName: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | null,
  quote: string,
  translationShortName: string
): NormalizedVerse {
  const reference =
    verseEnd && verseEnd > verseStart
      ? `${bookName} ${chapter}:${verseStart}-${verseEnd}`
      : `${bookName} ${chapter}:${verseStart}`;

  const cleanQuote = cleanBibleText(quote);
  const imageIndex =
    (bookName.length + chapter + verseStart) % SCENIC_VERSE_IMAGES.length;
  const id = `bible-${reference
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${translationShortName.toLowerCase()}`;

  return {
    id,
    reference,
    quote: cleanQuote,
    book: bookName,
    chapter,
    verse: verseStart,
    category: translationShortName,
    reflectionPrompts: [
      `Slowly meditate on ${reference} (${translationShortName}). Which word or phrase brings stillness to your heart?`,
      'What does this passage reveal about God’s character, promises, or guidance for today?',
      'Take a deep breath and turn this scripture into a quiet personal prayer.',
    ],
    themeImageUrl: SCENIC_VERSE_IMAGES[imageIndex],
  };
}

export function getBibleBooks(): BibleBookMeta[] {
  const books = loadLocalBible('kjv');
  return books.map((b, index) => ({
    index: index + 1,
    name: b.name,
    testament: index < 39 ? 'OT' : 'NT',
    chapterCount: b.chapters.length,
    verseCount: b.chapters.reduce((sum, ch) => sum + ch.length, 0),
  }));
}

async function fetchChapterTexts(
  bookIndex: number,
  chapterNum: number,
  meta: BibleTranslationMeta
): Promise<string[] | null> {
  if (meta.source === 'local') {
    const key = meta.id.toLowerCase() as LocalBibleKey;
    const books = loadLocalBible(key);
    const ch = books[bookIndex]?.chapters[chapterNum - 1];
    return ch ? ch.map((t) => cleanBibleText(t)) : null;
  }

  const bookNumber = bookIndex + 1; // Bolls uses 1-66
  const cacheKey = `${meta.id}:${bookNumber}:${chapterNum}`;
  if (remoteChapterCache.has(cacheKey)) {
    return remoteChapterCache.get(cacheKey)!;
  }

  const url = `https://bolls.life/get-text/${encodeURIComponent(
    meta.id
  )}/${bookNumber}/${chapterNum}/`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{
    verse?: number;
    text?: string;
  }>;

  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Build ordered verse array
  const sorted = [...rows].sort((a, b) => (a.verse || 0) - (b.verse || 0));
  const texts: string[] = [];
  for (const row of sorted) {
    if (row.verse && row.verse > 0) texts[row.verse - 1] = cleanBibleText(row.text || '');
  }
  for (let index = 0; index < texts.length; index++) texts[index] ||= '';

  // Prevent unbounded cache growth
  if (remoteChapterCache.size > 400) {
    const firstKey = remoteChapterCache.keys().next().value;
    if (firstKey) remoteChapterCache.delete(firstKey);
  }
  remoteChapterCache.set(cacheKey, texts);
  return texts;
}

export async function getBibleChapter(
  bookQuery: string,
  chapterNum: number,
  rawTranslation?: string
) {
  const meta = resolveTranslationMeta(rawTranslation);
  const kjvBooks = loadLocalBible('kjv');
  const bookIndex = resolveBookIndex(bookQuery);
  if (bookIndex === -1) return null;

  const bookMeta = kjvBooks[bookIndex];
  const safeChapter = Math.max(1, Math.min(chapterNum, bookMeta.chapters.length));
  const texts = await fetchChapterTexts(bookIndex, safeChapter, meta);
  if (!texts) return null;

  return {
    book: bookMeta.name,
    bookIndex: bookIndex + 1,
    testament: bookIndex < 39 ? ('OT' as const) : ('NT' as const),
    chapter: safeChapter,
    totalChapters: bookMeta.chapters.length,
    translation: meta.id,
    translationShortName: meta.shortName,
    translationName: meta.fullName,
    verses: texts.flatMap((text, idx) => text.trim() ? [{
      verse: idx + 1,
      text,
      normalized: buildNormalizedVerse(
        bookMeta.name,
        safeChapter,
        idx + 1,
        null,
        text,
        meta.shortName
      ),
    }] : []),
  };
}

interface ParsedReference {
  bookPart: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

function parseReference(query: string): ParsedReference | null {
  const cleaned = query.trim().replace(/[–—]/g, '-');
  const fullMatch = cleaned.match(
    /^([1-3]?\s*[a-zA-Z][a-zA-Z.\s]*?)\s+(\d+)(?:(?::|\s+|\.)(\d+)(?:\s*-\s*(\d+))?)?$/
  );
  if (!fullMatch) return null;

  const bookPart = fullMatch[1].trim();
  const chapter = parseInt(fullMatch[2], 10);
  const verseStart = fullMatch[3] ? parseInt(fullMatch[3], 10) : undefined;
  const verseEnd = fullMatch[4] ? parseInt(fullMatch[4], 10) : undefined;

  if (!Number.isFinite(chapter) || chapter < 1) return null;
  return { bookPart, chapter, verseStart, verseEnd };
}

export async function searchFullBible(
  rawQuery: string,
  rawTranslation?: string,
  limit = 40
) {
  const query = rawQuery.trim();
  const meta = resolveTranslationMeta(rawTranslation);
  const kjvBooks = loadLocalBible('kjv');

  // 1. Try Bible Reference Lookup (supports any reference from Genesis 1:1 to Revelation 22:21 in ANY translation)
  const parsed = parseReference(query);
  if (parsed) {
    const bookIndex = resolveBookIndex(parsed.bookPart);
    if (bookIndex !== -1) {
      const bookMeta = kjvBooks[bookIndex];
      let chapterNum = parsed.chapter;
      let verseStart = parsed.verseStart;
      let verseEnd = parsed.verseEnd;

      if (bookMeta.chapters.length === 1 && !verseStart && parsed.chapter > 1) {
        chapterNum = 1;
        verseStart = parsed.chapter;
      }

      if (chapterNum >= 1 && chapterNum <= bookMeta.chapters.length) {
        const chapterArr = await fetchChapterTexts(bookIndex, chapterNum, meta);
        if (chapterArr && chapterArr.length > 0) {
          if (verseStart !== undefined) {
            const startIdx = verseStart;
            const endIdx = verseEnd ?? startIdx;
            const entries = chapterArr
              .map((text, index) => ({ text, number: index + 1 }))
              .filter(({ text, number }) => number >= startIdx && number <= endIdx && text.trim());
            if (entries.length === 0) {
              return { found: false, mode: 'reference' as const, translation: meta.id,
                translationName: meta.fullName, unavailable: endIdx >= startIdx && (
                  startIdx <= chapterArr.length || TRANSLATIONS.some((candidate) => {
                    const otherChapter = loadLocalBible(candidate.toLowerCase() as LocalBibleKey)[bookIndex]?.chapters[chapterNum - 1];
                    return Boolean(otherChapter?.[startIdx - 1]?.trim());
                  })),
                totalMatches: 0, matches: [] };
            }
            const primaryVerse = buildNormalizedVerse(bookMeta.name, chapterNum, entries[0].number,
              entries.length > 1 ? entries[entries.length - 1].number : null,
              entries.map(({ text }) => text).join(' '), meta.shortName);
            const individualMatches = entries.map(({ text, number }) =>
              buildNormalizedVerse(bookMeta.name, chapterNum, number, null, text, meta.shortName));
            return {
              found: true, mode: 'reference' as const, translation: meta.id,
              translationName: meta.fullName, totalMatches: individualMatches.length,
              verse: primaryVerse, matches: individualMatches,
            };
          }

          // Keep original verse numbers when a translation omits a verse.
          const available = chapterArr.map((text, index) => ({ text, number: index + 1 }))
            .filter(({ text }) => text.trim());
          const preview = available.slice(0, 3);
          const chapterOverview = preview.length ? buildNormalizedVerse(
            bookMeta.name, chapterNum, preview[0].number,
            preview.length > 1 ? preview[preview.length - 1].number : null,
            preview.map(({ text }) => text).join(' '), meta.shortName
          ) : undefined;
          const chapterMatches = available.slice(0, limit).map(({ text, number }) =>
            buildNormalizedVerse(bookMeta.name, chapterNum, number, null, text, meta.shortName));
          return {
            found: available.length > 0, mode: 'chapter' as const, translation: meta.id,
            translationName: meta.fullName, totalMatches: available.length,
            verse: chapterOverview, matches: chapterMatches,
          };
        }
      }
    }
  }

  // 2. Book name only query (e.g., "Isaiah", "Genesis", "Revelation")
  const bookOnlyIndex = resolveBookIndex(query);
  if (bookOnlyIndex !== -1 && query.length >= 3) {
    const bookMeta = kjvBooks[bookOnlyIndex];
    const ch1 = await fetchChapterTexts(bookOnlyIndex, 1, meta);
    if (ch1 && ch1.length > 0) {
      const matches = ch1
        .map((text, index) => ({ text, number: index + 1 }))
        .filter(({ text }) => text.trim())
        .slice(0, 15)
        .map(({ text, number }) => buildNormalizedVerse(bookMeta.name, 1, number, null, text, meta.shortName));
      return {
        found: matches.length > 0,
        mode: 'book' as const,
        translation: meta.id,
        translationName: meta.fullName,
        totalMatches: matches.length,
        verse: matches[0],
        matches,
      };
    }
  }

  // 3. Keyword / Phrase Search
  if (meta.source === 'bolls') {
    try {
      const searchUrl = `https://bolls.life/v2/find/${encodeURIComponent(
        meta.id
      )}?search=${encodeURIComponent(query)}&limit=${limit}&page=1`;
      const res = await fetch(searchUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(9000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{
            book?: number;
            chapter?: number;
            verse?: number;
            text?: string;
          }>;
          total?: number;
        };
        const rows = data.results || [];
        const matches: NormalizedVerse[] = rows
          .filter((r) => r.book && r.chapter && r.verse && r.text)
          .slice(0, limit)
          .map((r) => {
            const bookName = kjvBooks[(r.book! - 1)]?.name || `Book ${r.book}`;
            return buildNormalizedVerse(
              bookName,
              r.chapter!,
              r.verse!,
              null,
              r.text!,
              meta.shortName
            );
          });

        if (matches.length > 0) {
          return {
            found: true,
            mode: 'keyword' as const,
            translation: meta.id,
            translationName: meta.fullName,
            totalMatches: data.total || matches.length,
            verse: matches[0],
            matches,
          };
        }
      }
    } catch {
      // Fall through to not found if remote keyword search fails
    }
  }

  // Never substitute KJV text while keeping a remote translation's label.
  if (meta.source === 'bolls') {
    return { found: false, mode: 'keyword' as const, translation: meta.id,
      translationName: meta.fullName, totalMatches: 0, matches: [] };
  }

  // Local keyword search
  const localKey = meta.id.toLowerCase() as LocalBibleKey;
  const localBooks = loadLocalBible(localKey);
  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return {
      found: false,
      mode: 'keyword' as const,
      translation: meta.id,
      translationName: meta.fullName,
      totalMatches: 0,
      matches: [],
    };
  }

  const scored: { verse: NormalizedVerse; score: number }[] = [];
  let totalMatches = 0;

  for (const book of localBooks) {
    for (let cIdx = 0; cIdx < book.chapters.length; cIdx++) {
      const ch = book.chapters[cIdx];
      for (let vIdx = 0; vIdx < ch.length; vIdx++) {
        const text = ch[vIdx];
        const lowerText = text.toLowerCase();
        let allPresent = true;
        for (const t of tokens) {
          if (!lowerText.includes(t)) {
            allPresent = false;
            break;
          }
        }
        if (!allPresent) continue;

        totalMatches++;
        if (scored.length < 300) {
          let score = 10;
          if (lowerText.includes(lowerQuery)) score += 50;
          if (text.length < 180) score += 10;
          scored.push({
            verse: buildNormalizedVerse(
              book.name,
              cIdx + 1,
              vIdx + 1,
              null,
              text,
              meta.shortName
            ),
            score,
          });
        }
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, limit).map((item) => item.verse);

  return {
    found: topMatches.length > 0,
    mode: 'keyword' as const,
    translation: meta.id,
    translationName: meta.fullName,
    totalMatches,
    verse: topMatches[0],
    matches: topMatches,
  };
}
