import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiClient, ApiError, errorMessage } from '../src/api/client.ts';
import type { TokenPair } from '../src/types/api.ts';

// Isolated transport fixtures only: never imported into the application.
const initial: TokenPair = { access_token: 'expired-access', refresh_token: 'original-refresh' };
const rotated: TokenPair = { access_token: 'fresh-access', refresh_token: 'rotated-refresh' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const unauthorized = () => json({ error: { code: 'unauthorized', message: 'Expired' } }, 401);
function setup(transport: typeof fetch, start: TokenPair | null = initial) {
  let tokens = start;
  const client = new ApiClient('https://api.example.test/', { get: () => tokens, set: value => { tokens = value; } }, transport);
  return { client, get: () => tokens, set: (value: TokenPair | null) => { tokens = value; } };
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

test('public auth requests have JSON but no bearer token', async () => {
  const { client } = setup(async (url, options) => {
    assert.equal(url, 'https://api.example.test/auth/login');
    assert.equal(new Headers(options?.headers).get('Authorization'), null);
    assert.equal(new Headers(options?.headers).get('Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(String(options?.body)), { email: 'person@example.test', password: 'test-password' });
    return json(rotated);
  });
  assert.deepEqual(await client.request('/auth/login', { public: true, method: 'POST', body: { email: 'person@example.test', password: 'test-password' } }), rotated);
});

test('transport is called without a receiver, as required by browser fetch', async () => {
  const { client } = setup(async function (this: unknown) {
    assert.equal(this, undefined);
    return json(rotated);
  });
  assert.deepEqual(await client.request('/auth/login', { public: true }), rotated);
});

test('protected request requires a session without sending HTTP', async () => {
  const { client } = setup(async () => { throw new Error('must not send'); }, null);
  await assert.rejects(client.request('/users/me'), (error: unknown) => error instanceof ApiError && error.status === 401);
});

test('204 logout revokes current refresh without authorization, clears local session', async () => {
  const state = setup(async (url, options) => {
    assert.equal(url, 'https://api.example.test/auth/logout');
    assert.equal(new Headers(options?.headers).get('Authorization'), null);
    assert.deepEqual(JSON.parse(String(options?.body)), { refresh_token: initial.refresh_token });
    assert.equal(state.get(), null);
    return new Response(null, { status: 204 });
  });
  await state.client.logout();
  assert.equal(state.get(), null);
});

test('failed logout still clears local session', async () => {
  const state = setup(async () => json({}, 503));
  await assert.rejects(state.client.logout(), ApiError);
  assert.equal(state.get(), null);
});

test('concurrent 401 requests share a single refresh and replace the whole pair', async () => {
  let refreshes = 0;
  const state = setup(async (url, options) => {
    if (String(url).endsWith('/auth/refresh')) {
      refreshes++;
      assert.equal(new Headers(options?.headers).get('Authorization'), null);
      assert.deepEqual(JSON.parse(String(options?.body)), { refresh_token: initial.refresh_token });
      await Promise.resolve();
      return json(rotated);
    }
    if (new Headers(options?.headers).get('Authorization') === `Bearer ${initial.access_token}`) return unauthorized();
    assert.equal(new Headers(options?.headers).get('Authorization'), `Bearer ${rotated.access_token}`);
    return json({ ok: true });
  });
  assert.deepEqual(await Promise.all([state.client.request('/workspaces'), state.client.request('/users/me'), state.client.request('/branches/one')]), [{ ok: true }, { ok: true }, { ok: true }]);
  assert.equal(refreshes, 1);
  assert.deepEqual(state.get(), rotated);
});

test('late 401 from an old access token reuses the rotated pair without another refresh', async () => {
  const late = deferred();
  let refreshes = 0;
  const state = setup(async (url, options) => {
    if (String(url).endsWith('/auth/refresh')) { refreshes++; return json(rotated); }
    if (new Headers(options?.headers).get('Authorization') === `Bearer ${initial.access_token}`) {
      if (String(url).endsWith('/slow')) await late.promise;
      return unauthorized();
    }
    return json({ ok: true });
  });
  const slow = state.client.request('/slow');
  await state.client.request('/fast');
  late.resolve();
  await slow;
  assert.equal(refreshes, 1);
});

test('failed refresh clears session and does not endlessly retry', async () => {
  let calls = 0;
  const state = setup(async () => { calls++; return unauthorized(); });
  await assert.rejects(state.client.request('/users/me'), ApiError);
  assert.equal(calls, 2);
  assert.equal(state.get(), null);
});

test('second 401 after successful refresh clears the session', async () => {
  let calls = 0;
  const state = setup(async url => { calls++; return String(url).endsWith('/auth/refresh') ? json(rotated) : unauthorized(); });
  await assert.rejects(state.client.request('/users/me'), ApiError);
  assert.equal(calls, 3);
  assert.equal(state.get(), null);
});

test('logout waits for refresh rotation and revokes the new refresh token', async () => {
  const wait = deferred();
  const started = deferred();
  const state = setup(async (url, options) => {
    if (String(url).endsWith('/auth/refresh')) { started.resolve(); await wait.promise; return json(rotated); }
    assert.equal(String(url).endsWith('/auth/logout'), true);
    assert.deepEqual(JSON.parse(String(options?.body)), { refresh_token: rotated.refresh_token });
    return new Response(null, { status: 204 });
  });
  const refreshing = state.client.refresh();
  await started.promise;
  const loggingOut = state.client.logout();
  wait.resolve();
  await Promise.all([refreshing, loggingOut]);
  assert.equal(state.get(), null);
});

test('stale refresh cannot restore a cleared session', async () => {
  const wait = deferred();
  const state = setup(async () => { await wait.promise; return json(rotated); });
  const refreshing = state.client.refresh();
  state.set(null);
  wait.resolve();
  await refreshing;
  assert.equal(state.get(), null);
});

for (const status of [400, 401, 409, 413, 503]) {
  test(`API error ${status} preserves code and message`, async () => {
    const { client } = setup(async () => json({ error: { code: 'backend_code', message: 'Backend explanation' } }, status));
    await assert.rejects(client.request('/auth/login', { public: true }), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      assert.equal(error.code, 'backend_code');
      assert.equal(errorMessage(error), 'Backend explanation');
      return true;
    });
  });
}

test('non-JSON HTTP error gets a readable fallback', async () => {
  const { client } = setup(async () => new Response('proxy unavailable', { status: 503 }));
  await assert.rejects(client.request('/users/me'), (error: unknown) => error instanceof ApiError && error.message.includes('недоступен'));
});

test('invalid success JSON is not treated as successful data', async () => {
  const { client } = setup(async () => new Response('<html>Vite</html>'));
  await assert.rejects(client.request('/users/me'), (error: unknown) => error instanceof ApiError && error.code === 'invalid_response');
});

test('AbortSignal reaches transport and cancellation never triggers refresh', async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const { client } = setup(async (_url, options) => {
    calls++;
    assert.equal(options?.signal, controller.signal);
    options?.signal?.throwIfAborted();
    throw new Error('unreachable');
  });
  await assert.rejects(client.request('/users/me', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('diff submission preserves raw_diff and 202 pending response', async () => {
  const rawDiff = 'diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new\n';
  const pending = { id: 'change-id', analysis: { status: 'pending' } };
  const { client } = setup(async (url, options) => {
    assert.equal(url, 'https://api.example.test/branches/branch-id/changes');
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(String(options?.body)), { raw_diff: rawDiff });
    return json(pending, 202);
  });
  assert.deepEqual(await client.request('/branches/branch-id/changes', { method: 'POST', body: { raw_diff: rawDiff } }), pending);
});

test('invalid refresh payload clears session instead of persisting broken tokens', async () => {
  const state = setup(async url => String(url).endsWith('/auth/refresh') ? json({ access_token: 'incomplete' }) : unauthorized());
  await assert.rejects(state.client.request('/users/me'), (error: unknown) => error instanceof ApiError && error.code === 'invalid_tokens');
  assert.equal(state.get(), null);
});

test('late unauthorized mutation cannot be retried under a different login', async () => {
  const wait = deferred();
  let calls = 0;
  const state = setup(async () => { calls++; await wait.promise; return unauthorized(); });
  const request = state.client.request('/workspaces', { method: 'POST', body: { name: 'Workspace' } });
  state.set(rotated); // Represents a fresh, independent login, not token rotation.
  wait.resolve();
  await assert.rejects(request, ApiError);
  assert.equal(calls, 1);
  assert.deepEqual(state.get(), rotated);
});
