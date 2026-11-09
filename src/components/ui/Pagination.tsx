import { Button } from './Button';
export function Pagination({ offset, count, total, onPage }: { offset: number; count: number; total: number; onPage: (offset: number) => void }) {
  if (total <= 10 && offset === 0) return null;
  return <div className="mt-5 flex items-center gap-4 text-sm text-text-secondary">
    <Button variant="secondary" disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - 10))}>Назад</Button>
    <span>{count ? offset + 1 : 0}–{offset + count} из {total}</span>
    <Button variant="secondary" disabled={!count || offset + count >= total} onClick={() => onPage(offset + count)}>Далее</Button>
  </div>;
}
