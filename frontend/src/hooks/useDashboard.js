import { useQuery } from '@tanstack/react-query';
import {
  getLatestMonth,
  getMonthsWithData,
  getSummary,
  getCharts,
  getTrends,
} from '../services/dashboard.service';
import { currentMonth } from '../utils/formatters';

// staleTime: 0 on all dashboard queries ensures fresh data on every mount after any mutation

export const useLatestMonth = () =>
  useQuery({ queryKey: ['latestMonth'], queryFn: getLatestMonth, staleTime: 0 });

export const useMonthsWithData = () =>
  useQuery({ queryKey: ['monthsWithData'], queryFn: getMonthsWithData, staleTime: 0 });

export const useDashboardSummary = (month = currentMonth()) =>
  useQuery({ queryKey: ['dashboard', 'summary', month], queryFn: () => getSummary(month), staleTime: 0 });

export const useDashboardCharts = (month = currentMonth()) =>
  useQuery({ queryKey: ['dashboard', 'charts', month], queryFn: () => getCharts(month), staleTime: 0 });

export const useDashboardTrends = () =>
  useQuery({ queryKey: ['dashboard', 'trends'], queryFn: getTrends, staleTime: 0 });
