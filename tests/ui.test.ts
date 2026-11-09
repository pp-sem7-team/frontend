import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { Change } from '../src/types/api.ts';

// Vite transpiles the existing TSX components; no test runner dependency needed.
const vite = await createServer({
  configFile: false,
  plugins: [react()],
  server: { middlewareMode: true, watch: null, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => vite.close());

const { DiffInput } = await vite.ssrLoadModule('/src/features/changes/DiffInput.tsx') as typeof import('../src/features/changes/DiffInput.tsx');
const { AnalysisStatus } = await vite.ssrLoadModule('/src/features/changes/AnalysisStatus.tsx') as typeof import('../src/features/changes/AnalysisStatus.tsx');
const { ChangeHistory } = await vite.ssrLoadModule('/src/features/history/ChangeHistory.tsx') as typeof import('../src/features/history/ChangeHistory.tsx');

function change(status: 'pending' | 'done' | 'failed'): Change {
  return {
    id: 'test-change', branch_id: 'test-branch', sequence_number: 1,
    created_at: '2026-01-01T00:00:00Z',
    analysis: { id: 'test-analysis', status, structured_changes: status === 'done' ? { summary: 'Updated text' } : null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    commit: { id: 'test-commit', status: 'pending', type: null, scope: null, message: null, is_edited_by_user: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  };
}

test('empty diff cannot be submitted even when analyze handler exists', () => {
  const html = renderToStaticMarkup(createElement(DiffInput, { onAnalyze: () => undefined }));
  assert.match(html, /type="submit" disabled=""/);
});

test('closed branch disables both diff input and submit', () => {
  const html = renderToStaticMarkup(createElement(DiffInput, { disabled: true, onAnalyze: () => undefined }));
  assert.match(html, /<textarea[^>]*disabled=""/);
  assert.match(html, /type="submit" disabled=""/);
});

test('in-flight diff submission shows sending state', () => {
  const html = renderToStaticMarkup(createElement(DiffInput, { isAnalyzing: true }));
  assert.match(html, /Отправляем/);
  assert.match(html, /type="submit" disabled=""/);
});

test('pending analysis never says analysis is complete', () => {
  const html = renderToStaticMarkup(createElement(AnalysisStatus, { change: change('pending') }));
  assert.match(html, /Анализ выполняется/);
  assert.doesNotMatch(html, /Анализ завершён/);
  assert.doesNotMatch(html, /<pre/);
});

test('done analysis renders only the actual result', () => {
  const html = renderToStaticMarkup(createElement(AnalysisStatus, { change: change('done') }));
  assert.match(html, /Анализ завершён/);
  assert.match(html, /Updated text/);
});

test('failed analysis renders failure', () => {
  const html = renderToStaticMarkup(createElement(AnalysisStatus, { change: change('failed') }));
  assert.match(html, /Анализ завершился ошибкой/);
});

test('history tolerates backend null commit without inventing a result', () => {
  const actual = { ...change('pending'), commit: null } as unknown as Change;
  const html = renderToStaticMarkup(createElement(ChangeHistory, { changes: [actual] }));
  assert.match(html, /Сообщение коммита недоступно/);
  assert.match(html, /выполняется/);
});

test('history distinguishes loading and empty data', () => {
  const loading = renderToStaticMarkup(createElement(ChangeHistory, { isLoading: true }));
  assert.match(loading, /Загрузка истории/);
  assert.doesNotMatch(loading, /История пока пуста/);
  const empty = renderToStaticMarkup(createElement(ChangeHistory));
  assert.match(empty, /История пока пуста/);
});
