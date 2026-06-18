// Routes called by the AI service (FastAPI) for Gemini function calling.
// Authenticated by X-Internal-Key header, not JWT.

const { Router } = require('express');
const internalController = require('../controllers/internal.controller');
const { authenticateInternal } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticateInternal);

router.get('/category-total', internalController.getCategoryTotal);
router.get('/monthly-summary', internalController.getMonthlySummary);
router.get('/top-category', internalController.getTopCategory);
router.get('/budget-status', internalController.getBudgetStatus);
router.get('/subscription-list', internalController.getSubscriptionList);
router.get('/anomalies', internalController.getAnomalies);
router.get('/spending-trend', internalController.getSpendingTrend);

module.exports = router;
