import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
test('bundled playback clocks both end at exactly 30 minutes', () => {
  for (const filename of ['quiet.m4a', 'quiet-piano.m4a']) {
    const data = readFileSync(new URL(`../apps/mobile/assets/audio/${filename}`, import.meta.url));
    const header = data.indexOf(Buffer.from('mvhd'));
    assert.ok(header >= 0, `${filename} must have MP4 timing metadata`);
    const version = data[header + 4];
    const scale = data.readUInt32BE(header + (version === 1 ? 24 : 16));
    const duration = version === 1 ? Number(data.readBigUInt64BE(header + 28)) : data.readUInt32BE(header + 20);
    assert.equal(duration / scale, 1800, `${filename} must end without a background JavaScript timer`);
  }
});

test('the Still Waters track lasts 30 minutes and contains audible samples', () => {
  const data = readFileSync(new URL('../apps/mobile/assets/audio/still-waters.wav', import.meta.url));
  assert.equal(data.toString('ascii', 0, 4), 'RIFF');
  assert.equal(data.toString('ascii', 8, 12), 'WAVE');
  const sampleRate = data.readUInt32LE(24);
  const byteRate = data.readUInt32LE(28);
  const audioLength = data.readUInt32LE(40);
  assert.equal(sampleRate, 8000);
  assert.equal(audioLength / byteRate, 1800);
  assert.ok(data.subarray(44, 44 + sampleRate * 24).some((sample) => sample !== 128));
});
