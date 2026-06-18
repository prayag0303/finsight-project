import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as svc from '../services/budget.service';
import { currentMonth } from '../utils/formatters';

export const useBudgets = (month = currentMonth()) =>
  useQuery({ queryKey: ['budgets', month], queryFn: () => svc.getBudgets(month) });

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.createBudget,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create budget'),
  });
};

export const useUpdateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => svc.updateBudget(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update budget'),
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: svc.deleteBudget,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete budget'),
  });
};
