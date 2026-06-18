import { useQuery } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { KPICardSkeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { SAVINGS_PRIORITY_COLORS } from '../utils/constants';
import { getSavingsOpportunities } from '../services/ai.service';

const PriorityBadge = ({ priority }) => {
  const colors = SAVINGS_PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors}`}>
      {priority}
    </span>
  );
};

const OpportunityCard = ({ opp }) => (
  <Card className="p-5" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={{ fontSize: 28, flexShrink: 0 }}>{opp.icon || '💡'}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{opp.title}</h3>
        <PriorityBadge priority={opp.priority} />
      </div>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 12, lineHeight: 1.5 }}>{opp.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>Current Spend</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#dc2626' }}>{formatCurrency(opp.currentSpend)}</p>
        </div>
        <div style={{ width: 1, height: 28, background: '#f0f0f0' }} />
        <div>
          <p style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>Potential Savings</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>{formatCurrency(opp.potentialSaving)}</p>
        </div>
      </div>
    </div>
  </Card>
);

export default function Savings() {
  const { data, isLoading } = useQuery({
    queryKey: ['savings'],
    queryFn: getSavingsOpportunities,
    staleTime: 1000 * 60 * 10,
  });

  const opps = data?.opportunities || [];
  const totalSavings = data?.totalPotentialSaving || 0;
  const highPriority = opps.filter((o) => o.priority === 'HIGH').length;

  return (
    <div className="space-y-6">
      {!isLoading && opps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Opportunities Found</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{opps.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Total Potential Savings</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{formatCurrency(totalSavings)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>High Priority</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>{highPriority}</p>
          </Card>
        </div>
      )}

      {!isLoading && opps.length > 0 && (
        <Card className="p-4" style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0' }}>
          <p style={{ fontSize: 13, color: '#555' }}>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>AI Analysis: </span>
            You could save up to{' '}
            <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(totalSavings)}</span>
            {' '}per month by acting on the{' '}
            <span style={{ fontWeight: 600 }}>{highPriority} high-priority</span> opportunities below.
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map((i) => <KPICardSkeleton key={i} />)}
        </div>
      ) : opps.length ? (
        <div className="space-y-3">
          {opps.map((opp, i) => <OpportunityCard key={i} opp={opp} />)}
        </div>
      ) : (
        <EmptyState
          icon="🌱"
          title="Your spending looks healthy"
          description="No savings opportunities found right now. Add more transactions so AI can analyze your spending patterns."
        />
      )}
    </div>
  );
}
