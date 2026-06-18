import api from './api';

export const sendChatMessage = (data) =>
  api.post('/ai/chat', data).then((r) => r.data.data);

export const getMonthlyInsights = (month) =>
  api.get('/ai/monthly-insights', { params: { month } }).then((r) => r.data.data);

export const getAnomalies = () =>
  api.get('/ai/anomalies').then((r) => r.data.data);

export const getSubscriptions = () =>
  api.get('/ai/subscriptions').then((r) => r.data.data);

export const getSavingsOpportunities = () =>
  api.get('/ai/savings-opportunities').then((r) => r.data.data);

export const getChatHistory = () =>
  api.get('/ai/chat/history').then((r) => r.data.data);
