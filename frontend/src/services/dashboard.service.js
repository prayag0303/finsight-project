import api from './api';

export const getLatestMonth = () =>
  api.get('/dashboard/latest-month').then((r) => r.data.data);

export const getMonthsWithData = () =>
  api.get('/dashboard/months-with-data').then((r) => r.data.data);

export const getSummary = (month) =>
  api.get('/dashboard/summary', { params: { month } }).then((r) => r.data.data);

export const getCharts = (month) =>
  api.get('/dashboard/charts', { params: { month } }).then((r) => r.data.data);

export const getTrends = () =>
  api.get('/dashboard/trends', { params: { months: 12 } }).then((r) => r.data.data);
