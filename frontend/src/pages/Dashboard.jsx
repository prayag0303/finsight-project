import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useDashboardSummary,
  useDashboardCharts,
  useDashboardTrends,
  useLatestMonth,
  useMonthsWithData,
} from '../hooks/useDashboard';
import KPICard      from '../components/dashboard/KPICard';
import CategoryPie  from '../components/dashboard/CategoryPie';
import IncomeExpenseBar from '../components/dashboard/IncomeExpenseBar';
import Card         from '../components/ui/Card';
import { KPICardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatDate, formatMonthYear, currentMonth } from '../utils/formatters';
import { getAnomalies, getSubscriptions, getSavingsOpportunities } from '../services/ai.service';
import { getTransactions } from '../services/transaction.service';
import { CATEGORY_COLORS, ALERT_TYPE_LABELS, ALERT_TYPE_COLORS } from '../utils/constants';
import CSVUpload from '../components/transactions/CSVUpload';
import { CategoryBadge, TypeBadge } from '../components/ui/Badge';

// Find adjacent month in the months-with-data list (skip empty calendar months)
const adjacentDataMonth = (months, current, dir) => {
  if (dir === 'prev') return months.find((m) => m < current) || null;
  return [...months].reverse().find((m) => m > current) || null;
};

// ─── HealthScoreCard ──────────────────────────────────────────────────────────

function HealthScoreCard({ score }) {
  const isLoaded = score !== null && score !== undefined;
  const tier =
    !isLoaded ? 'none'
    : score >= 70 ? 'good'
    : score >= 40 ? 'fair'
    : 'bad';

  const palette = {
    none: { color: '#aaa',    bar: '#e0e0e0', label: '—',                sublabel: '' },
    good: { color: '#16a34a', bar: '#16a34a', label: 'Looking good',     sublabel: '' },
    fair: { color: '#d97706', bar: '#f59e0b', label: 'Could be better',  sublabel: '' },
    bad:  { color: '#dc2626', bar: '#dc2626', label: 'Needs attention',  sublabel: '' },
  }[tier];

  return (
    <div className="card p-5">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
          Financial health
        </p>
        <span style={{ fontSize: 16, opacity: 0.6 }}>🩺</span>
      </div>
      <p style={{ fontSize: 21, fontWeight: 500, color: palette.color, letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1 }}>
        {isLoaded ? `${score}/100` : '—'}
      </p>
      <p style={{ fontSize: 12, color: '#aaa', marginTop: 2, marginBottom: 8 }}>{palette.label}</p>
      <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', borderRadius: 99,
            width: `${isLoaded ? score : 0}%`,
            backgroundColor: palette.bar,
            transition: 'width 0.7s',
          }}
        />
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onUpload }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 8 }}>Welcome to FinSight</h2>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 28, maxWidth: 280, lineHeight: 1.6 }}>
        Upload your bank statement to get AI-powered insights, spending breakdowns, and financial health tracking.
      </p>
      <button onClick={onUpload} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}>
        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload CSV
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [month, setMonth]         = useState(null);
  const initialized               = useRef(false);
  const [showCSV, setShowCSV]     = useState(false);

  const { data: latestMonthData, isLoading: loadingLatest } = useLatestMonth();
  const { data: monthsData }                                = useMonthsWithData();

  useEffect(() => {
    if (!loadingLatest && !initialized.current) {
      initialized.current = true;
      setMonth(latestMonthData?.month ?? currentMonth());
    }
  }, [latestMonthData, loadingLatest]);

  const activeMonth = month ?? currentMonth();

  const { data: summary,  isLoading: loadSummary  } = useDashboardSummary(activeMonth);
  const { data: charts,   isLoading: loadCharts   } = useDashboardCharts(activeMonth);
  const { data: trends,   isLoading: loadTrends   } = useDashboardTrends();

  const { data: anomalyData,  isLoading: loadAlerts } = useQuery({
    queryKey: ['anomalies'],
    queryFn:  getAnomalies,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });
  const { data: subsData, isLoading: loadSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn:  getSubscriptions,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });
  const { data: savingsData, isLoading: loadSavings } = useQuery({
    queryKey: ['savings'],
    queryFn:  getSavingsOpportunities,
    staleTime: 1000 * 60 * 10,
    retry: 0,
  });
  const { data: recentData, isLoading: loadRecent } = useQuery({
    queryKey: ['transactions', { limit: 5, page: 1 }],
    queryFn:  () => getTransactions({ limit: 5, page: 1 }),
    staleTime: 0,
  });

  const months         = monthsData?.months || [];
  const prevDataMonth  = adjacentDataMonth(months, activeMonth, 'prev');
  const nextDataMonth  = adjacentDataMonth(months, activeMonth, 'next');
  const hasNoData      = !loadingLatest && !latestMonthData?.month;

  const alerts         = (anomalyData?.alerts || []).filter((a) => !a.isResolved).slice(0, 3);
  const subscriptions  = (subsData?.subscriptions || []).slice(0, 5);
  const subMonthly     = subscriptions.reduce((s, x) => s + parseFloat(x.averageAmount || 0), 0);
  const topSaving      = savingsData?.opportunities?.[0] || null;
  const recentTxns     = recentData?.data || [];

  if (loadingLatest && !month) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="p-5 lg:col-span-3"><ChartSkeleton /></Card>
          <Card className="p-5 lg:col-span-2"><ChartSkeleton height="h-[280px]" /></Card>
        </div>
      </div>
    );
  }

  if (hasNoData) {
    return (
      <>
        <EmptyState onUpload={() => setShowCSV(true)} />
        {showCSV && <CSVUpload onClose={() => setShowCSV(false)} />}
      </>
    );
  }

  const savingsRate = summary?.savingsRate ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Month Navigator ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, color: '#aaa' }}>
          Viewing <span style={{ color: '#111', fontWeight: 500 }}>{formatMonthYear(activeMonth)}</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 10, padding: 4 }}>
          <button
            onClick={() => prevDataMonth && setMonth(prevDataMonth)}
            disabled={!prevDataMonth}
            style={{
              padding: '4px 8px', borderRadius: 7, border: 'none', background: 'none',
              color: prevDataMonth ? '#555' : '#ddd', cursor: prevDataMonth ? 'pointer' : 'not-allowed',
            }}
            title={prevDataMonth ? formatMonthYear(prevDataMonth) : 'No earlier data'}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111', width: 120, textAlign: 'center', userSelect: 'none' }}>
            {formatMonthYear(activeMonth)}
          </span>
          <button
            onClick={() => nextDataMonth && setMonth(nextDataMonth)}
            disabled={!nextDataMonth}
            style={{
              padding: '4px 8px', borderRadius: 7, border: 'none', background: 'none',
              color: nextDataMonth ? '#555' : '#ddd', cursor: nextDataMonth ? 'pointer' : 'not-allowed',
            }}
            title={nextDataMonth ? formatMonthYear(nextDataMonth) : 'No later data'}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loadSummary ? (
          [1,2,3,4].map((i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <KPICard
              title="Spent this month"
              value={summary?.totalExpenses ?? 0}
              icon="💳"
              change={summary?.expensesChangePct}
              invertChange
            />
            <KPICard
              title="Earned this month"
              value={summary?.totalIncome ?? 0}
              icon="💰"
              change={summary?.incomeChangePct}
            />
            <KPICard
              title="Saved this month"
              value={summary?.savings ?? 0}
              icon="🏦"
              changeLabel={`Savings rate: ${savingsRate}%`}
            />
            <HealthScoreCard score={summary?.healthScore ?? null} />
          </>
        )}
      </div>

      {/* ── Row 2: Charts ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-5 lg:col-span-3">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>
            Monthly Spending Trend
            <span style={{ fontSize: 12, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>last 12 months</span>
          </h2>
          {loadTrends ? <ChartSkeleton /> : <IncomeExpenseBar data={trends?.monthlyTrend || []} />}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>
            Category Breakdown
            <span style={{ fontSize: 12, fontWeight: 400, color: '#aaa', marginLeft: 8 }}>{formatMonthYear(activeMonth)}</span>
          </h2>
          {loadCharts
            ? <ChartSkeleton height="h-[280px]" />
            : <CategoryPie
                data={charts?.categoryBreakdown || []}
                total={summary?.totalExpenses ?? null}
              />
          }
        </Card>
      </div>

      {/* ── Row 3: Intelligence Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Categories */}
        <Card className="p-5">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Top Categories</h2>
          {loadCharts ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: 80 }} />
                    <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: 60 }} />
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99 }} />
                </div>
              ))}
            </div>
          ) : (charts?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {(charts.categoryBreakdown).slice(0, 5).map((item) => {
                const pct = parseFloat(item.percentage || 0);
                return (
                  <div key={item.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#777' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: CATEGORY_COLORS[item.category] || '#d0d0d0' }} />
                        {item.category}
                      </span>
                      <span style={{ fontWeight: 500, color: '#111' }}>{formatCurrency(item.total)}</span>
                    </div>
                    <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: 99,
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[item.category] || '#d0d0d0',
                          transition: 'width 0.5s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '24px 0' }}>No transactions this month</p>
          ))}
        </Card>

        {/* Subscriptions */}
        <Card className="p-5">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Subscriptions</h2>
            {subscriptions.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                {formatCurrency(subMonthly)}<span style={{ color: '#aaa', fontWeight: 400 }}>/mo</span>
              </span>
            )}
          </div>
          {loadSubs ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => (
                <div key={i} className="animate-pulse" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: 100 }} />
                  <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: 60 }} />
                </div>
              ))}
            </div>
          ) : subscriptions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subscriptions.map((sub) => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{sub.merchant}</span>
                  <span style={{ color: '#777', fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>
                    {formatCurrency(parseFloat(sub.averageAmount))}
                    <span style={{ color: '#bbb' }}>/mo</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '24px 0', lineHeight: 1.6 }}>
              Upload 3+ months of data<br />to detect subscriptions
            </p>
          )}
        </Card>

        {/* Alerts & Insights */}
        <Card className="p-5">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Alerts & Insights</h2>
          {loadAlerts && loadSavings ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2].map((i) => (
                <div key={i} className="animate-pulse" style={{ height: 44, background: '#f5f5f5', borderRadius: 10 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#16a34a', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
                  <span>✓</span>
                  <span>No unusual activity detected</span>
                </div>
              )}
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`text-xs rounded-xl px-3 py-2.5 border ${ALERT_TYPE_COLORS[a.alertType] || 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>{ALERT_TYPE_LABELS[a.alertType] || a.alertType}</p>
                  <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{a.description}</p>
                </div>
              ))}
              {topSaving && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, background: '#f8f5ff', border: '0.5px solid #e9d5ff', borderRadius: 10, padding: '10px 12px' }}>
                  <span style={{ marginTop: 1 }}>💡</span>
                  <div>
                    <p style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 2 }}>{topSaving.category}</p>
                    <p style={{ color: '#777', lineHeight: 1.5, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topSaving.description}</p>
                    {topSaving.estimatedSaving > 0 && (
                      <p style={{ color: '#16a34a', marginTop: 4 }}>Save ~{formatCurrency(topSaving.estimatedSaving)}/mo</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Recent Transactions ───────────────────────────────────── */}
      <Card className="p-5">
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Recent Transactions</h2>
        {loadRecent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="animate-pulse" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: 70 }} />
                <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, flex: 1 }} />
                <div style={{ height: 10, background: '#f0f0f0', borderRadius: 4, width: 80 }} />
                <div style={{ height: 18, background: '#f0f0f0', borderRadius: 4, width: 55 }} />
              </div>
            ))}
          </div>
        ) : recentTxns.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No transactions yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                  {['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Type'].map((h) => (
                    <th key={h} style={{ textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 500, color: '#aaa', paddingBottom: 8, paddingRight: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '0.5px solid #f8f8f8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 12px 10px 0', color: '#aaa', whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                    <td style={{ padding: '10px 12px 10px 0', color: '#555', maxWidth: 160 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</span>
                    </td>
                    <td style={{ padding: '10px 12px 10px 0', color: '#777' }}>{tx.merchant || '—'}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', color: tx.type === 'CREDIT' ? '#16a34a' : '#dc2626' }}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                    </td>
                    <td style={{ padding: '10px 12px 10px 0' }}><CategoryBadge category={tx.category} /></td>
                    <td style={{ padding: '10px 0' }}><TypeBadge type={tx.type} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCSV && <CSVUpload onClose={() => setShowCSV(false)} />}
    </div>
  );
}
