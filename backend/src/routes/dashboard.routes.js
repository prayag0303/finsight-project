const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/latest-month',    dashboardController.getLatestMonth);
router.get('/months-with-data', dashboardController.getMonthsWithData);
router.get('/summary',         dashboardController.getSummary);
router.get('/charts',          dashboardController.getCharts);
router.get('/trends',          dashboardController.getTrends);

module.exports = router;
