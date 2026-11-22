import assert from 'node:assert/strict';
import { after, test, type TestContext } from 'node:test';
import { act, createElement } from 'react';
import { JSDOM } from 'jsdom';
import { MemoryRouter, Routes, Route, Link } from 'react-router';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { Change, Commit, PullRequest } from '../src/types/api.ts';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://frontend.test' });
const { window } = dom;
Object.assign(globalThis, {
  window, document: window.document, sessionStorage: window.sessionStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
});
sessionStorage.setItem('gitmind.session', JSON.stringify({ access_token: 'test-access', refresh_token: 'test-refresh' }));
const { createRoot } = await import('react-dom/client');

type RequestHandler = (path: string, options: RequestInit) => Response | Promise<Response>;
let respond: RequestHandler;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => respond(String(input), options ?? {});
const vite = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.tmp/vite-branch-workspace-test',
  plugins: [react()],
  server: { middlewareMode: true, watch: null, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
const { BranchWorkspacePage } = await vite.ssrLoadModule('/src/pages/BranchWorkspacePage.tsx') as typeof import('../src/pages/BranchWorkspacePage.tsx');
globalThis.fetch = originalFetch;
after(async () => {
  await vite.close();
  dom.window.close();
});

const time = '2026-01-01T00:00:00Z';
const later = '2026-01-01T00:00:02Z';
const dates = { created_at: time, updated_at: time };
const readyCommit: Commit = {
  ...dates, id: 'commit-a', type: 'fix', scope: 'ui', message: 'старое сообщение',
  status: 'done', is_edited_by_user: true,
};
const queuedCommit: Commit = {
  ...readyCommit, status: 'pending', type: null, scope: null, message: null, is_edited_by_user: false,
};
const readyPr: PullRequest = {
  ...dates, id: 'pr-a', branch_id: 'branch-a', status: 'done',
  title: 'Новый заголовок', description: 'Описание с сервера', is_edited_by_user: false,
};
const queuedPr: PullRequest = { ...readyPr, status: 'pending', title: null, description: null };

function change(sequence: number, status: Change['analysis']['status'] = 'done', commit: Commit | null = null): Change {
  return {
    id: `c${sequence}`, branch_id: 'branch-a', sequence_number: sequence, created_at: time, commit,
    analysis: { ...dates, id: `a${sequence}`, status, structured_changes: status === 'done' ? { files: ['main.ts'] } : null },
  };
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}

function failure(status: number, message: string) {
  return json({ error: { code: 'test_error', message } }, status);
}

function list(items: Change[], offset = 0, total = items.length) {
  return json({ items, offset, limit: 10, total });
}

function branch(id: string) {
  return json({ ...dates, id, workspace_id: 'workspace-a', name: id, status: 'active' });
}

const container = document.getElementById('root')!;

async function mount(t: TestContext, handler: RequestHandler) {
  respond = handler;
  const root = createRoot(container);
  t.after(async () => { await act(async () => root.unmount()); });
  await act(async () => root.render(createElement(MemoryRouter, { initialEntries: ['/branches/branch-a'] },
    createElement(Link, { to: '/branches/branch-b' }, 'Открыть другую ветку'),
    createElement(Routes, null,
      createElement(Route, { path: '/branches/:branchId', element: createElement(BranchWorkspacePage) }),
    ))));
}

function button(label: string, within: ParentNode = container) {
  const element = Array.from(within.querySelectorAll('button')).find(item => item.textContent?.trim() === label);
  assert.ok(element, `Button absent: ${label}`);
  return element;
}

function section(heading: string) {
  const element = Array.from(container.querySelectorAll('section')).find(item => item.querySelector('h3')?.textContent?.trim() === heading);
  assert.ok(element, `Section absent: ${heading}`);
  return element;
}

function click(element: HTMLElement) {
  return act(async () => element.click());
}

function historyButton(sequence: number) {
  const element = Array.from(section('История изменений').querySelectorAll('button'))
    .find(item => item.textContent?.includes(`Изменение №${sequence}`));
  assert.ok(element);
  return element;
}

async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    element.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype,
    'value',
  )?.set;
  assert.ok(setter);
  await act(async () => {
    setter.call(element, value);
    element.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

test('history selection loads Change, survives pagination and adds a newly submitted diff', async t => {
  const items = Array.from({ length: 11 }, (_, index) => change(index + 1));
  const added = change(12, 'pending', queuedCommit);
  const detailRequests: string[] = [];
  await mount(t, (path, options) => {
    if (path === '/branches/branch-a') return branch('branch-a');
    if (path.endsWith('/pull-request')) return failure(404, 'no PR');
    if (path === '/branches/branch-a/changes' && options.method === 'POST') {
      assert.equal(options.body, JSON.stringify({ raw_diff: '+new line' }));
      items.push(added);
      return json(added, 202);
    }
    if (path.includes('/changes?')) {
      const offset = Number(new URL(path, 'https://api.test').searchParams.get('offset'));
      return list(items.slice(offset, offset + 10), offset, items.length);
    }
    detailRequests.push(path);
    const item = items.find(value => path === `/changes/${value.id}`);
    assert.ok(item);
    return json(item);
  });

  await click(historyButton(11));
  assert.deepEqual(detailRequests, ['/changes/c11']);
  assert.equal(historyButton(11).getAttribute('aria-pressed'), 'true');
  assert.match(section('Сообщение коммита').textContent ?? '', /пока не создано/);
  await click(button('Далее'));
  assert.equal(historyButton(1).getAttribute('aria-pressed'), 'false');
  assert.match(container.textContent ?? '', /Изменение №11Анализ завершён/);
  await click(button('Назад'));
  assert.equal(historyButton(11).getAttribute('aria-pressed'), 'true');
  assert.deepEqual(detailRequests, ['/changes/c11']);

  await fill(container.querySelector('textarea')!, '+new line');
  await click(button('Анализировать изменения'));
  assert.equal(historyButton(12).getAttribute('aria-pressed'), 'true');
  assert.match(container.textContent ?? '', /Анализ выполняется/);
});

test('commit POST hides stale output, prevents duplicates, and PATCH retains drafts after failure', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let reads = 0;
  let posts = 0;
  let patches = 0;
  let accept!: (response: Response) => void;
  let allowOverwrite = false;
  const confirm = t.mock.method(window, 'confirm', () => allowOverwrite);
  const original = change(1, 'done', readyCommit);
  const generated = { ...readyCommit, updated_at: later, message: 'новое сообщение', is_edited_by_user: false };

  await mount(t, (path, options) => {
    if (path === '/branches/branch-a') return branch('branch-a');
    if (path.includes('/changes?')) return list([original]);
    if (path.endsWith('/pull-request')) return failure(404, 'no PR');
    if (path === '/changes/c1') {
      reads++;
      if (reads === 2) return json({ ...original, commit: null });
      return json(reads <= 3 ? original : { ...original, commit: generated });
    }
    assert.equal(path, '/changes/c1/commit');
    if (options.method === 'POST') {
      posts++;
      return new Promise(resolve => { accept = resolve; });
    }
    assert.equal(options.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(options.body)), { type: 'fix', scope: null, message: 'черновик' });
    if (++patches === 1) return failure(503, 'Коммиты временно недоступны');
    return json({ ...generated, scope: null, message: 'сохранено сервером', is_edited_by_user: true });
  });

  await click(historyButton(1));
  const commit = section('Сообщение коммита');
  await click(button('Сгенерировать заново', commit));
  assert.equal(posts, 0);
  assert.match(String(confirm.mock.calls[0]?.arguments[0]), /перезапишет/);
  allowOverwrite = true;
  const regenerate = button('Сгенерировать заново', commit);
  await act(async () => { regenerate.click(); regenerate.click(); });
  assert.equal(posts, 1);
  await act(async () => accept(json(queuedCommit, 202)));
  assert.match(commit.textContent ?? '', /Генерация сообщения коммита/);
  assert.doesNotMatch(container.textContent ?? '', /старое сообщение/);
  await act(async () => t.mock.timers.tick(2500));
  assert.doesNotMatch(container.textContent ?? '', /старое сообщение/);
  await act(async () => t.mock.timers.tick(2500));
  assert.match(commit.textContent ?? '', /новое сообщение/);
  await act(async () => t.mock.timers.tick(7500));
  assert.equal(reads, 4);

  await click(button('Редактировать', commit));
  await fill(commit.querySelector('input')!, '');
  await fill(commit.querySelector('textarea')!, 'черновик');
  await click(button('Сохранить', commit));
  assert.match(commit.textContent ?? '', /Коммиты временно недоступны/);
  assert.equal(commit.querySelector('textarea')?.value, 'черновик');
  await click(button('Сохранить', commit));
  assert.equal(commit.querySelector('textarea'), null);
  assert.match(commit.textContent ?? '', /fix: сохранено сервером/);
  assert.match(commit.textContent ?? '', /отредактировано пользователем/);
});

test('PR checks later pages, supports 409, polls after 202, retries failed GET, copies and edits', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const first = Array.from({ length: 10 }, (_, index) => change(index + 1));
  let posts = 0;
  let prReads = 0;
  let patchCount = 0;
  let lastPageReady = false;
  let analysisReads = 0;
  let completeAnalysis!: (value: Response) => void;
  let allowOverwrite = false;
  const confirm = t.mock.method(window, 'confirm', () => allowOverwrite);
  const editedPr = { ...readyPr, title: 'Заголовок после сохранения', description: 'Сохранённое описание', is_edited_by_user: true };
  const copied: string[] = [];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true, value: { clipboard: { writeText: async (text: string) => { copied.push(text); } } },
  });
  t.after(() => {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');
  });
  await mount(t, (path, options) => {
    if (path === '/branches/branch-a') return branch('branch-a');
    if (path.includes('offset=0')) return list(first, 0, 11);
    if (path.includes('offset=10')) return list([change(11, lastPageReady ? 'done' : 'pending')], 10, 11);
    if (path === '/changes/c11') {
      analysisReads++;
      return new Promise(resolve => { completeAnalysis = resolve; });
    }
    assert.equal(path, '/branches/branch-a/pull-request');
    if (options.method === 'POST') {
      if (++posts === 1) return failure(409, 'Анализ нового изменения ещё выполняется');
      return json(queuedPr, 202);
    }
    if (options.method === 'PATCH') {
      assert.deepEqual(JSON.parse(String(options.body)), { title: 'Ручной заголовок', description: 'Ручное описание' });
      if (++patchCount === 1) return failure(500, 'Ошибка сохранения');
      return json(editedPr);
    }
    ++prReads;
    if (prReads === 1) return failure(404, 'no PR');
    if (prReads === 2) return failure(503, 'Сервис временно недоступен');
    if (prReads === 3) return json(queuedPr);
    if (prReads === 5) return json(editedPr);
    if (prReads === 6) return json({ ...queuedPr, status: 'failed', updated_at: later });
    return json(readyPr);
  });

  const pr = section('Pull Request');
  assert.match(pr.textContent ?? '', /Описание PR пока не создано/);
  assert.equal(button('Сгенерировать PR', pr).disabled, true);
  await click(historyButton(11));
  await act(async () => t.mock.timers.tick(10_000));
  assert.equal(analysisReads, 1);
  await click(button('Далее'));
  assert.match(historyButton(1).textContent ?? '', /готов/);
  assert.equal(button('Сгенерировать PR', pr).disabled, true);
  await act(async () => completeAnalysis(json(change(11))));
  assert.equal(button('Сгенерировать PR', pr).disabled, false);

  // The fresh preflight can see a new pending analysis that the history did not see.
  await click(button('Сгенерировать PR', pr));
  assert.match(pr.textContent ?? '', /Дождитесь завершения анализа всех изменений/);
  assert.equal(posts, 0);
  // Release the last page, then test a conflict returned by the POST itself.
  lastPageReady = true;
  await click(button('Сгенерировать PR', pr));
  assert.match(pr.textContent ?? '', /Анализ нового изменения ещё выполняется/);
  await click(button('Сгенерировать PR', pr));
  assert.match(pr.textContent ?? '', /Генерация описания PR/);
  assert.match(pr.textContent ?? '', /Сервис временно недоступен/);
  await click(button('Повторить', pr));
  await act(async () => t.mock.timers.tick(2500));
  assert.match(pr.textContent ?? '', /Новый заголовок/);
  await click(pr.querySelector<HTMLButtonElement>('[aria-label="Скопировать заголовок PR"]')!);
  await click(pr.querySelector<HTMLButtonElement>('[aria-label="Скопировать описание PR"]')!);
  assert.deepEqual(copied, ['Новый заголовок', 'Описание с сервера']);

  await click(button('Редактировать', pr));
  await fill(pr.querySelector('input')!, 'Ручной заголовок');
  await fill(pr.querySelector('textarea')!, 'Ручное описание');
  await click(button('Сохранить', pr));
  assert.match(pr.textContent ?? '', /Ошибка сохранения/);
  assert.equal(pr.querySelector('input')?.value, 'Ручной заголовок');
  assert.equal(pr.querySelector('textarea')?.value, 'Ручное описание');
  await click(button('Сохранить', pr));
  assert.match(pr.textContent ?? '', /Заголовок после сохранения/);
  assert.match(pr.textContent ?? '', /отредактировано пользователем/);

  const regenerate = button('Сгенерировать заново', pr);
  await click(regenerate);
  assert.equal(posts, 2);
  assert.match(String(confirm.mock.calls[0]?.arguments[0]), /перезапишет/);
  allowOverwrite = true;
  await act(async () => { regenerate.click(); regenerate.click(); });
  assert.equal(posts, 3);
  assert.match(pr.textContent ?? '', /Генерация описания PR/);
  assert.doesNotMatch(pr.textContent ?? '', /Заголовок после сохранения/);
  await act(async () => t.mock.timers.tick(2500));
  assert.match(pr.textContent ?? '', /Не удалось сгенерировать описание PR/);
  await act(async () => t.mock.timers.tick(7500));
  assert.equal(prReads, 6);
});

test('switching branches aborts in-flight change and PR polls and ignores late responses', async t => {
  let changeSignal: AbortSignal | undefined;
  let prSignal: AbortSignal | undefined;
  let finishChange!: (response: Response) => void;
  let finishPr!: (response: Response) => void;
  await mount(t, (path, options) => {
    if (path === '/branches/branch-a') return branch('branch-a');
    if (path === '/branches/branch-b') return branch('branch-b');
    if (path === '/branches/branch-a/pull-request') {
      prSignal = options.signal!;
      return new Promise(resolve => { finishPr = resolve; });
    }
    if (path === '/branches/branch-b/pull-request') return failure(404, 'no PR');
    if (path.includes('branch-a/changes?')) return list([change(1, 'pending')]);
    if (path.includes('branch-b/changes?')) return list([]);
    assert.equal(path, '/changes/c1');
    changeSignal = options.signal!;
    return new Promise(resolve => { finishChange = resolve; });
  });

  await click(container.querySelector<HTMLAnchorElement>('[href="/branches/branch-b"]')!);
  assert.equal(changeSignal?.aborted, true);
  assert.equal(prSignal?.aborted, true);
  await act(async () => {
    finishChange(json(change(1)));
    finishPr(json(readyPr));
  });
  assert.match(container.textContent ?? '', /История пока пуста/);
  assert.doesNotMatch(container.textContent ?? '', /Новый заголовок|Изменение №1/);
});
