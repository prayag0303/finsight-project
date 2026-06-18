import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as svc from '../services/transaction.service';
import { invalidateAllFinancialData } from '../utils/invalidations';

export const useTransactions = (params) =>
  useQuery({
    queryKey: ['transactions', params],
    queryFn: () => svc.getTransactions(params),
  });

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.createTransaction,
    onSuccess: () => {
      invalidateAllFinancialData(qc);
      toast.success('Transaction added');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add'),
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => svc.updateTransaction(id, data),
    onSuccess: () => {
      invalidateAllFinancialData(qc);
      toast.success('Transaction updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.deleteTransaction,
    onSuccess: () => {
      invalidateAllFinancialData(qc);
      toast.success('Transaction deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });
};

export const useReprocessCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.reprocessCategories,
    onSuccess: (data) => {
      invalidateAllFinancialData(qc);
      const updated = data?.data?.updated ?? 0;
      const total   = data?.data?.total   ?? 0;
      if (updated > 0) {
        toast.success(`Reprocessed ${updated} of ${total} transactions`);
      } else {
        toast.success('All transactions already categorised');
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Reprocess failed'),
  });
};

export const useUploadCSV = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }) => svc.uploadCSV(file, onProgress),
    onSuccess: (data) => {
      invalidateAllFinancialData(qc);
      // Backend returns { data: { imported: N, bankFormat: '...' } }
      const count = data?.data?.imported ?? 0;
      toast.success(`Imported ${count} transaction${count !== 1 ? 's' : ''}`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });
};
