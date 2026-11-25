import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withChatFallback, withTtsFallback } from '../api/ai.ts';

test('a busy chat model falls back once to an available model', async () => {
  const attempted: string[] = [];
  const result = await withChatFallback('preferred-model', async (model) => {
    attempted.push(model);
    if (model === 'preferred-model') throw { status: 503 };
    return 'reply';
  });
  assert.equal(result, 'reply');
  assert.deepEqual(attempted, ['preferred-model', 'gemini-3.5-flash-lite']);
});

test('authentication failures do not trigger fallback', async () => {
  let attempts = 0;
  await assert.rejects(withChatFallback('preferred-model', async () => {
    attempts++;
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }));
  assert.equal(attempts, 1);
});

test('a busy voice model retries with a compatible voice model', async () => {
  const attempted: string[] = [];
  const result = await withTtsFallback('preferred-voice', async (model) => {
    attempted.push(model);
    if (model === 'preferred-voice') throw { status: 503 };
    return 'audio';
  });
  assert.equal(result, 'audio');
  assert.deepEqual(attempted, ['preferred-voice', 'gemini-3.1-flash-tts-preview']);
});
