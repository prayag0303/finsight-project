import api from './api';

export const getBudgets = (month) =>
  api.get('/budgets', { params: { month } }).then((r) => r.data.data);

export const createBudget = (data) =>
  api.post('/budgets', data).then((r) => r.data.data);

export const updateBudget = (id, data) =>
  api.patch(`/budgets/${id}`, data).then((r) => r.data.data);

export const deleteBudget = (id) =>
  api.delete(`/budgets/${id}`).then((r) => r.data);
