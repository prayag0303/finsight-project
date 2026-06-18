const aiService = require('../services/ai.service');
const dashboardService = require('../services/dashboard.service');
const budgetService = require('../services/budget.service');
const { prisma } = require('../config/database');
const { success } = require('../utils/response');
const logger = require('../utils/logger');

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Fetch last 10 messages for context
    const history = await prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true },
    });

    const result = await aiService.chat(userId, message.trim(), history.reverse());

    // Persist conversation
    await prisma.chatHistory.createMany({
      data: [
        { userId, role: 'USER', content: message.trim() },
        {
          userId,
          role: 'ASSISTANT',
          content: result.response,
          functionCalls: result.functionCalls || null,
        },
      ],
    });

    success(res, { response: result.response, functionCalls: result.functionCalls });
  } catch (err) {
    next(err);
  }
};

const getMonthlyInsights = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const month = req.query.month || currentMonth();

    const [summary, categoryBreakdown, budgets, subscriptions, fraudAlerts] = await Promise.all([
      dashboardService.getSummary(userId, month),
      dashboardService.getCategoryBreakdown(userId, month),
      budgetService.findAll(userId, month),
      prisma.subscription.findMany({ where: { userId, isActive: true } }),
      prisma.fraudAlert.findMany({ where: { userId, isResolved: false }, take: 10 }),
    ]);

    const result = await aiService.getMonthlyInsights(userId, month, {
      summary,
      categoryBreakdown,
      budgets,
      subscriptions,
      fraudAlerts,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

const getAnomalies = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    logger.info(`[getAnomalies] userId=${userId}`);

    let alerts = await prisma.fraudAlert.findMany({
      where: { userId },
      include: {
        transaction: {
          select: { id: true, amount: true, description: true, merchant: true, date: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    logger.info(`[getAnomalies] found ${alerts.length} existing alerts`);

    // If no alerts yet, run detection on-demand so the page is never empty
    if (alerts.length === 0) {
      logger.info('[getAnomalies] No alerts in DB — running on-demand anomaly detection');
      try {
        const recent = await prisma.transaction.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 500,
          select: { id: true, amount: true, merchant: true, date: true, type: true, createdAt: true },
        });
        const userStats = await prisma.transaction.aggregate({
          where: { userId },
          _avg: { amount: true },
        });
        if (recent.length > 0) {
          const anomalyResult = await aiService.detectAnomalies(userId, recent, {
            avgAmount: parseFloat(userStats._avg.amount || 0),
          });
          if (anomalyResult.anomalies?.length > 0) {
            await prisma.fraudAlert.createMany({
              data: anomalyResult.anomalies.map((a) => ({
                userId,
                transactionId: a.transactionId,
                alertType: a.alertType,
                description: a.description,
              })),
              skipDuplicates: true,
            });
            // Re-fetch with full include
            alerts = await prisma.fraudAlert.findMany({
              where: { userId },
              include: {
                transaction: {
                  select: { id: true, amount: true, description: true, merchant: true, date: true, type: true },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 50,
            });
            logger.info(`[getAnomalies] Saved ${anomalyResult.anomalies.length} new alerts`);
          }
        }
      } catch (detectionErr) {
        logger.warn('[getAnomalies] On-demand detection failed:', detectionErr.message);
      }
    }

    const unresolvedCount = alerts.filter((a) => !a.isResolved).length;
    success(res, { alerts, unresolvedCount });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const alert = await prisma.fraudAlert.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    await prisma.fraudAlert.update({ where: { id: req.params.id }, data: { isResolved: true } });
    success(res, null, 'Alert resolved');
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // First re-detect from recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId, type: 'DEBIT' },
      orderBy: { date: 'desc' },
      take: 500,
      select: { id: true, merchant: true, amount: true, date: true, description: true },
    });

    const aiResult = await aiService.detectSubscriptions(userId, recentTransactions);

    // Upsert detected subscriptions
    if (aiResult.subscriptions?.length > 0) {
      for (const sub of aiResult.subscriptions) {
        await prisma.subscription.upsert({
          where: { userId_merchant: { userId, merchant: sub.merchant } },
          update: {
            averageAmount: sub.averageAmount,
            lastCharged: new Date(sub.lastCharged),
            nextExpected: sub.nextExpected ? new Date(sub.nextExpected) : null,
            isActive: true,
            transactionCount: sub.transactionCount,
          },
          create: {
            userId,
            merchant: sub.merchant,
            averageAmount: sub.averageAmount,
            frequency: sub.frequency || 'MONTHLY',
            lastCharged: new Date(sub.lastCharged),
            nextExpected: sub.nextExpected ? new Date(sub.nextExpected) : null,
            transactionCount: sub.transactionCount,
            category: sub.category || 'Others',
          },
        });
      }
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { averageAmount: 'desc' },
    });

    const totalMonthly = subscriptions
      .filter((s) => s.isActive && s.frequency === 'MONTHLY')
      .reduce((sum, s) => sum + parseFloat(s.averageAmount), 0);

    success(res, { subscriptions, totalMonthlySpend: parseFloat(totalMonthly.toFixed(2)) });
  } catch (err) {
    next(err);
  }
};

const getSavingsOpportunities = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const month = currentMonth();

    const [summary, categoryBreakdown, subscriptions] = await Promise.all([
      dashboardService.getSummary(userId, month),
      dashboardService.getCategoryBreakdown(userId, month),
      prisma.subscription.findMany({ where: { userId, isActive: true } }),
    ]);

    const result = await aiService.getSavingsOpportunities(userId, {
      summary,
      categoryBreakdown,
      subscriptions,
    });

    success(res, result);
  } catch (err) {
    next(err);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const history = await prisma.chatHistory.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    success(res, history);
  } catch (err) {
    next(err);
  }
};

const reprocessCategories = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetch uncorrected transactions still sitting at the fallback state
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        isCorrected: false,
        OR: [{ category: 'Others' }, { confidence: 0 }],
      },
      select: { id: true, description: true, merchant: true, amount: true, type: true },
    });

    if (transactions.length === 0) {
      return success(res, { updated: 0 }, 'No transactions need reprocessing');
    }

    logger.info(`Reprocessing ${transactions.length} uncategorised transactions for user ${userId}`);

    // Layer 1 pre-check: fetch merchant learning map
    const learnedMappings = await prisma.merchantLearning.findMany({
      where: { userId },
      select: { merchantName: true, category: true },
    });
    const merchantLearningMap = Object.fromEntries(
      learnedMappings.map((m) => [m.merchantName.toUpperCase(), m.category])
    );

    const descriptionsForAI = transactions.map((t) => {
      const merchantKey = (t.merchant || '').toUpperCase().trim();
      return {
        description: t.description,
        merchant: t.merchant,
        amount: parseFloat(t.amount),
        type: t.type,
        merchant_category: merchantLearningMap[merchantKey] || null,
      };
    });

    const categorizations = await aiService.categorizeTransactions(descriptionsForAI);

    let updated = 0;
    for (let i = 0; i < transactions.length; i++) {
      const cat = categorizations[i];
      if (!cat || cat.category === 'Others') continue;

      await prisma.transaction.update({
        where: { id: transactions[i].id },
        data: {
          category: cat.category,
          confidence: parseFloat(cat.confidence) || 0,
          source: cat.source || 'FALLBACK',
        },
      });
      updated++;
    }

    success(res, { updated, total: transactions.length }, `Reprocessed ${updated} of ${transactions.length} transactions`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat,
  getMonthlyInsights,
  getAnomalies,
  resolveAlert,
  getSubscriptions,
  getSavingsOpportunities,
  getChatHistory,
  reprocessCategories,
};
