const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const { PAGINATION_DEFAULTS } = require('../config/constants');

const create = async (userId, data) => {
  return prisma.transaction.create({
    data: {
      userId,
      amount: parseFloat(data.amount),
      description: data.description,
      merchant: data.merchant || null,
      date: new Date(data.date),
      type: data.type,
      category: data.category || 'Others',
      confidence: data.confidence || 0,
      source: data.source || 'MANUAL',
      isCorrected: data.category ? true : false,
      notes: data.notes || null,
    },
  });
};

const findAll = async (userId, filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = Math.min(parseInt(pagination.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const where = { userId };

  if (filters.category) where.category = filters.category;
  if (filters.type) where.type = filters.type;
  if (filters.merchant) where.merchant = { contains: filters.merchant, mode: 'insensitive' };
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { merchant: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findById = async (userId, id) => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!transaction) throw new AppError('Transaction not found.', 404);
  return transaction;
};

const update = async (userId, id, data) => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!transaction) throw new AppError('Transaction not found.', 404);

  const updateData = {};

  if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
  if (data.description !== undefined) updateData.description = data.description;
  if (data.merchant !== undefined) updateData.merchant = data.merchant;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.type !== undefined) updateData.type = data.type;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Category correction: update merchant learning
  if (data.category && data.category !== transaction.category) {
    updateData.category = data.category;
    updateData.source = 'MANUAL';
    updateData.isCorrected = true;
    updateData.confidence = 1.0;

    const merchantName = data.merchant || transaction.merchant;
    if (merchantName) {
      await prisma.merchantLearning.upsert({
        where: { userId_merchantName: { userId, merchantName } },
        update: {
          category: data.category,
          correctionCount: { increment: 1 },
        },
        create: {
          userId,
          merchantName,
          category: data.category,
          correctionCount: 1,
        },
      });
    }
  }

  return prisma.transaction.update({ where: { id }, data: updateData });
};

const remove = async (userId, id) => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!transaction) throw new AppError('Transaction not found.', 404);
  await prisma.transaction.delete({ where: { id } });
};

const bulkCreate = async (userId, transactions) => {
  const data = transactions.map((t) => ({
    userId,
    amount: parseFloat(t.amount),
    description: t.description,
    merchant: t.merchant || null,
    date: new Date(t.date),
    type: t.type,
    category: t.category || 'Others',
    confidence: parseFloat(t.confidence) || 0,
    source: t.source || 'FALLBACK',
    isCorrected: false,
  }));

  const result = await prisma.transaction.createMany({ data, skipDuplicates: false });
  return result.count;
};

module.exports = { create, findAll, findById, update, remove, bulkCreate };
