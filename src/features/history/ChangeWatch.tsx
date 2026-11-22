import { resources } from '../../api/resources';
import { usePolling } from '../../hooks/useGeneration';
import { RequestState } from '../../components/ui/RequestState';
import type { Change } from '../../types/api';

export function ChangeWatch({
  change, loadingDetail, onDetail,
}: {
  change: Change;
  loadingDetail: boolean;
  onDetail: (updated: Change) => Change;
}) {
  const { error, retry } = usePolling(
    true,
    signal => resources.change(change.id, signal),
    response => {
      const updated = onDetail(response);
      return updated.analysis.status === 'pending' || updated.commit?.status === 'pending';
    },
  );
  if (loadingDetail && !error) return <p role="status" className="mt-4 text-sm text-text-secondary">Загрузка подробностей изменения…</p>;
  return <RequestState error={error && `Изменение №${change.sequence_number}. ${error}`} retry={retry} />;
}
