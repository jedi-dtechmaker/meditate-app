# Bible text sources

- **ASV:** American Standard Version (1901), public domain. Source: https://github.com/scrollmapper/bible_databases/blob/master/formats/json/ASV.json
- **YLT:** Young's Literal Translation (1898), public domain. Source: https://github.com/scrollmapper/bible_databases/blob/master/formats/json/YLT.json

- **WEB:** World English Bible, public domain. Source: https://github.com/midvash/bible-data/blob/main/versions/en/web/web.json; publisher notice: https://ebible.org/bible/details.php?id=engwebp. Midvash labels this data public domain: https://github.com/midvash/bible-data/blob/main/versions/en/web/metadata.json.

The Scrollmapper source collection is distributed under the MIT license: https://github.com/scrollmapper/bible_databases/blob/master/LICENSE. These files were converted to the app's book/chapter/verse array structure. Book names were normalized to match the existing King James Version; verse text and numbering were retained. ASV and YLT contain 66 books and the same chapter and verse slots as the existing KJV dataset. ASV retains 16 empty slots where the source omits verses. WEB contains 66 books, with four omitted verses represented as empty slots. WEB uses its source's verse numbering, including Romans 14:24–26 and Romans 16 ending at verse 24.
# Source collection license

MIT License

Copyright (c) 2024 Scrollmapper

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
