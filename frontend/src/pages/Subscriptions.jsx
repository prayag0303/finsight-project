import { useQuery } from '@tanstack/react-query';
import SubscriptionCard from '../components/subscriptions/SubscriptionCard';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { KPICardSkeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { getSubscriptions } from '../services/ai.service';

export default function Subscriptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
    staleTime: 1000 * 60 * 10,
  });

  const subs = data?.subscriptions || [];
  const totalMonthly = subs.reduce((sum, s) => sum + parseFloat(s.averageAmount || 0), 0);

  return (
    <div className="space-y-6">
      {!isLoading && subs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Active Subscriptions</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{subs.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Monthly Cost</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(totalMonthly)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Annual Cost</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{formatCurrency(totalMonthly * 12)}</p>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <KPICardSkeleton key={i} />)}
        </div>
      ) : subs.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((s, i) => <SubscriptionCard key={i} sub={s} />)}
        </div>
      ) : (
        <EmptyState
          icon="🔄"
          title="No subscriptions detected"
          description="Import at least 3 months of transactions to detect recurring charges."
        />
      )}
    </div>
  );
}
