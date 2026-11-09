import { Button } from './Button';
export function RequestState({ loading, error, retry }: { loading?: boolean; error?: string | null; retry?: () => void }) {
  if (loading) return <p role="status" className="py-4 text-sm text-text-secondary">Загрузка...</p>;
  if (!error) return null;
  return <div role="alert" className="my-4 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}{retry && <Button variant="ghost" size="sm" onClick={retry}>Повторить</Button>}</div>;
}
