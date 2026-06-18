import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FraudAlertCard from '../components/fraud/FraudAlertCard';
import Card from '../components/ui/Card';
import { KPICardSkeleton } from '../components/ui/Skeleton';
import { getAnomalies } from '../services/ai.service';
import api from '../services/api';
import { ALERT_TYPE_LABELS } from '../utils/constants';

const ShieldIcon = () => (
  <svg className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

export default function FraudAlerts() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: getAnomalies,
    staleTime: 0,
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId) => api.patch(`/ai/anomalies/${alertId}/resolve`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['anomalies'] }),
  });

  // Backend returns { alerts, unresolvedCount } — was incorrectly keyed as anomalies
  const alerts         = data?.alerts || [];
  const unresolvedCount = data?.unresolvedCount ?? alerts.filter((a) => !a.isResolved).length;
  const typeCounts     = alerts.reduce((acc, a) => {
    acc[a.alertType] = (acc[a.alertType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Unusual activity</h1>
        <p className="text-sm text-gray-500 mt-0.5">Potential duplicates, spending spikes, and large transactions</p>
      </div>

      {!isLoading && alerts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Total Alerts</p>
            <p className="text-xl font-semibold text-gray-900">{alerts.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Unresolved</p>
            <p className="text-xl font-semibold text-red-500">{unresolvedCount}</p>
          </Card>
          {Object.entries(typeCounts).slice(0, 2).map(([type, count]) => (
            <Card key={type} className="p-4 text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">{ALERT_TYPE_LABELS[type] || type}</p>
              <p className="text-xl font-semibold text-amber-500">{count}</p>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <KPICardSkeleton key={i} />)}
        </div>
      ) : alerts.length ? (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <FraudAlertCard
              key={alert.id || i}
              alert={alert}
              onResolve={() => resolveMutation.mutate(alert.id)}
              resolving={resolveMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card className="p-16 text-center">
          <ShieldIcon />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">All clear</h3>
          <p className="text-sm text-gray-400">No unusual activity detected. Your transactions look normal.</p>
        </Card>
      )}
    </div>
  );
}
