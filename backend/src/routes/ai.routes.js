const { Router } = require('express');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const router = Router();

router.use(authenticate);

router.post(
  '/chat',
  [body('message').trim().notEmpty().withMessage('Message is required')],
  validate,
  aiController.chat
);
router.get('/chat/history', aiController.getChatHistory);
router.get('/monthly-insights', aiController.getMonthlyInsights);
router.get('/anomalies', aiController.getAnomalies);
router.patch('/anomalies/:id/resolve', aiController.resolveAlert);
router.get('/subscriptions', aiController.getSubscriptions);
router.get('/savings-opportunities', aiController.getSavingsOpportunities);
router.post('/reprocess-categories', aiController.reprocessCategories);

module.exports = router;
