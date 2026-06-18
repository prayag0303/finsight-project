import api from './api';

export const getTransactions = (params) =>
  api.get('/transactions', { params }).then((r) => r.data);

export const getTransaction = (id) =>
  api.get(`/transactions/${id}`).then((r) => r.data.data);

export const createTransaction = (data) =>
  api.post('/transactions', data).then((r) => r.data.data);

export const updateTransaction = (id, data) =>
  api.patch(`/transactions/${id}`, data).then((r) => r.data.data);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then((r) => r.data);

export const reprocessCategories = () =>
  api.post('/ai/reprocess-categories').then((r) => r.data);

export const uploadCSV = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/transactions/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  }).then((r) => r.data);
};
