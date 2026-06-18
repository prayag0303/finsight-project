export const invalidateAllFinancialData = (qc) => {
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['budgets'] });
  qc.invalidateQueries({ queryKey: ['subscriptions'] });
  qc.invalidateQueries({ queryKey: ['anomalies'] });
  qc.invalidateQueries({ queryKey: ['savings'] });
  qc.invalidateQueries({ queryKey: ['insights'] });
  qc.invalidateQueries({ queryKey: ['latestMonth'] });
  qc.invalidateQueries({ queryKey: ['monthsWithData'] });
};
