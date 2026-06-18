const transactionService = require('../services/transaction.service');
const csvService = require('../services/csv.service');
const aiService = require('../services/ai.service');
const { prisma } = require('../config/database');
const { success, created, paginated } = require('../utils/response');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const create = async (req, res, next) => {
  try {
    const transaction = await transactionService.create(req.user.userId, req.body);
    created(res, transaction, 'Transaction added');
  } catch (err) {
    next(err);
  }
};

const findAll = async (req, res, next) => {
  try {
    const { page, limit, category, type, merchant, search, startDate, endDate } = req.query;
    const result = await transactionService.findAll(
      req.user.userId,
      { category, type, merchant, search, startDate, endDate },
      { page, limit }
    );
    paginated(res, result.transactions, result.pagination);
  } catch (err) {
    next(err);
  }
};

const findById = async (req, res, next) => {
  try {
    const transaction = await transactionService.findById(req.user.userId, req.params.id);
    success(res, transaction);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const transaction = await transactionService.update(req.user.userId, req.params.id, req.body);
    success(res, transaction, 'Transaction updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await transactionService.remove(req.user.userId, req.params.id);
    success(res, null, 'Transaction deleted');
  } catch (err) {
    next(err);
  }
};

const uploadCSV = async (req, res, next) => {
  if (!req.file) return next(new AppError('No CSV file uploaded.', 400));

  const filePath = req.file.path;

  try {
    // Step 1: Parse and normalize CSV
    const { rows, bankFormat, total } = await csvService.parseCSV(filePath);

    if (total === 0) {
      csvService.deleteFile(filePath);
      return next(new AppError('No valid transactions found in the CSV file.', 400));
    }

    logger.info(`CSV parsed: ${total} rows, bank: ${bankFormat}`);

    // Step 2a: Split Format D (pre-classified) from rows that need AI classification
    const preclassified    = rows.filter((r) => r.skipPipeline && r.category);
    const needsAI          = rows.filter((r) => !r.skipPipeline || !r.category);

    logger.info(`Pre-classified: ${preclassified.length}, needs AI: ${needsAI.length}`);

    // Step 2b: Fetch merchant learning map only if there are rows that need AI
    let enrichedPreclassified = preclassified.map((row) => ({
      ...row,
      date: row.date.toISOString().split('T')[0],
      // category, confidence already set by Format D normalizer
      source: 'RULE_ENGINE',
    }));

    let enrichedFromAI = [];
    if (needsAI.length > 0) {
      const learnedMappings = await prisma.merchantLearning.findMany({
        where: { userId: req.user.userId },
        select: { merchantName: true, category: true },
      });
      const merchantLearningMap = Object.fromEntries(
        learnedMappings.map((m) => [m.merchantName.toUpperCase(), m.category])
      );

      // r.category is set for Format C rows with a mapped category — pass as merchant_category
      // so the AI pipeline returns it directly without extra API calls.
      const descriptionsForAI = needsAI.map((r) => {
        const merchantKey = (r.merchant || '').toUpperCase().trim();
        const merchantCategory = r.category || merchantLearningMap[merchantKey] || null;
        return {
          description: r.description,
          merchant: r.merchant,
          amount: r.amount,
          type: r.type,
          merchant_category: merchantCategory,
        };
      });

      const categorizations = await aiService.categorizeTransactions(descriptionsForAI);

      enrichedFromAI = needsAI.map((row, i) => ({
        ...row,
        date: row.date.toISOString().split('T')[0],
        category: categorizations[i]?.category || row.category || 'Others',
        confidence: categorizations[i]?.confidence || 0,
        source: categorizations[i]?.source || 'FALLBACK',
      }));
    }

    // Step 3: Merge — pre-classified first preserves insertion order
    const enriched = [...enrichedPreclassified, ...enrichedFromAI];

    // Step 4: Bulk insert
    const count = await transactionService.bulkCreate(req.user.userId, enriched);

    // Step 5: Trigger async anomaly detection on newly added transactions (best-effort)
    setImmediate(async () => {
      try {
        const recent = await prisma.transaction.findMany({
          where: { userId: req.user.userId },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: { id: true, amount: true, merchant: true, date: true, type: true, createdAt: true },
        });
        const userStats = await prisma.transaction.aggregate({
          where: { userId: req.user.userId },
          _avg: { amount: true },
        });
        const anomalyResult = await aiService.detectAnomalies(req.user.userId, recent, {
          avgAmount: parseFloat(userStats._avg.amount || 0),
        });
        if (anomalyResult.anomalies?.length > 0) {
          await prisma.fraudAlert.createMany({
            data: anomalyResult.anomalies.map((a) => ({
              userId: req.user.userId,
              transactionId: a.transactionId,
              alertType: a.alertType,
              description: a.description,
            })),
            skipDuplicates: true,
          });
        }
      } catch (err) {
        logger.warn('Background anomaly detection failed:', err.message);
      }
    });

    csvService.deleteFile(filePath);
    created(res, { imported: count, bankFormat }, `Successfully imported ${count} transactions`);
  } catch (err) {
    csvService.deleteFile(filePath);
    next(err);
  }
};

module.exports = { create, findAll, findById, update, remove, uploadCSV };
