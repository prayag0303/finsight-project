import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import InsightCard from '../components/dashboard/InsightCard';
import CategoryPie from '../components/dashboard/CategoryPie';
import SpendingTrend from '../components/dashboard/SpendingTrend';
import Card from '../components/ui/Card';
import { ChartSkeleton, KPICardSkeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatPercent, currentMonth, formatMonthYear } from '../utils/formatters';
import { getMonthlyInsights } from '../services/ai.service';
import { useDashboardCharts, useDashboardTrends, useLatestMonth, useMonthsWithData } from '../hooks/useDashboard';
import { CATEGORY_COLORS } from '../utils/constants';

const adjacentDataMonth = (months, current, dir) => {
  if (dir === 'prev') return months.find((m) => m < current) || null;
  return [...months].reverse().find((m) => m > current) || null;
};

export default function Insights() {
  const [month, setMonth]     = useState(null);
  const initialized           = useRef(false);

  const { data: latestMonthData, isLoading: loadingLatest } = useLatestMonth();
  const { data: monthsData }                                = useMonthsWithData();

  useEffect(() => {
    if (!loadingLatest && !initialized.current) {
      initialized.current = true;
      setMonth(latestMonthData?.month ?? currentMonth());
    }
  }, [latestMonthData, loadingLatest]);

  const activeMonth = month ?? currentMonth();
  const months      = monthsData?.months || [];
  const prevMonth   = adjacentDataMonth(months, activeMonth, 'prev');
  const nextMonth   = adjacentDataMonth(months, activeMonth, 'next');

  const { data: insights,  isLoading: loadInsights } = useQuery({
    queryKey: ['insights', activeMonth],
    queryFn:  () => getMonthlyInsights(activeMonth),
    staleTime: 1000 * 60 * 30,
    retry: 0,
  });
  const { data: charts,  isLoading: loadCharts  } = useDashboardCharts(activeMonth);
  const { data: trends,  isLoading: loadTrends  } = useDashboardTrends();

  const categories = charts?.categoryBreakdown || [];
  const topCategory = categories[0];

  if (loadingLatest && !month) {
    return <div className="space-y-4">{[1,2,3].map((i) => <KPICardSkeleton key={i} />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">AI Insights</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monthly analysis for {formatMonthYear(activeMonth)}</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => prevMonth && setMonth(prevMonth)}
            disabled={!prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={prevMonth ? formatMonthYear(prevMonth) : 'No earlier data'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-900 w-[130px] text-center select-none">
            {formatMonthYear(activeMonth)}
          </span>
          <button
            onClick={() => nextMonth && setMonth(nextMonth)}
            disabled={!nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={nextMonth ? formatMonthYear(nextMonth) : 'No later data'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* AI narrative */}
      {loadInsights ? (
        <KPICardSkeleton />
      ) : insights?.insights ? (
        <InsightCard insights={insights.insights} highlights={insights.highlights} />
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-400 text-sm">No AI analysis available for this month. Upload transactions to generate insights.</p>
        </Card>
      )}

      {/* Metrics row */}
      {!loadCharts && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Categories</p>
            <p className="text-xl font-semibold text-gray-900">{categories.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Top Category</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{topCategory?.category || '—'}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Largest Spend</p>
            <p className="text-sm font-semibold text-red-500 mt-1">{formatCurrency(topCategory?.total || 0)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Top Share</p>
            <p className="text-xl font-semibold text-amber-500">{topCategory?.percentage ? `${parseFloat(topCategory.percentage).toFixed(0)}%` : '—'}</p>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-5 lg:col-span-3">
          <h2 className="text-sm font-medium text-gray-900 mb-4">6-Month Spending Trend</h2>
          {loadTrends ? <ChartSkeleton /> : <SpendingTrend data={trends?.monthlyTrend || []} />}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Category Distribution</h2>
          {loadCharts ? <ChartSkeleton height="h-[300px]" /> : <CategoryPie data={categories} />}
        </Card>
      </div>

      {/* Category breakdown table */}
      {!loadCharts && categories.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Detailed Breakdown — {formatMonthYear(activeMonth)}</h2>
          <div className="space-y-3">
            {categories.map((cat) => {
              const pct = parseFloat(cat.percentage || 0);
              const color = CATEGORY_COLORS[cat.category] || '#94a3b8';
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{cat.transactionCount} txns</span>
                      <span className="text-gray-500">{formatPercent(pct)}</span>
                      <span className="font-semibold text-gray-900 w-24 text-right">{formatCurrency(cat.total)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
