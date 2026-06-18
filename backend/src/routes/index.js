const { Router } = require('express');
const authRoutes = require('./auth.routes');
const transactionRoutes = require('./transaction.routes');
const dashboardRoutes = require('./dashboard.routes');
const budgetRoutes = require('./budget.routes');
const aiRoutes = require('./ai.routes');
const internalRoutes = require('./internal.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/budgets', budgetRoutes);
router.use('/ai', aiRoutes);
router.use('/internal', internalRoutes);

module.exports = router;
