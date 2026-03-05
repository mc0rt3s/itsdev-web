import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, clearRateLimitsForTest } from '../src/lib/rate-limit.ts';

test.beforeEach(() => {
  clearRateLimitsForTest();
});

test('permite solicitudes dentro del límite', () => {
  const first = checkRateLimit({ key: 'u1', limit: 2, windowMs: 1000 });
  const second = checkRateLimit({ key: 'u1', limit: 2, windowMs: 1000 });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.remaining, 0);
});

test('bloquea solicitudes sobre el límite', () => {
  checkRateLimit({ key: 'u1', limit: 1, windowMs: 1000 });
  const blocked = checkRateLimit({ key: 'u1', limit: 1, windowMs: 1000 });

  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
});
