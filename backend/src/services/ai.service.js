const axios = require('axios');
const logger = require('../utils/logger');

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 60000,
  headers: { 'X-Internal-Key': process.env.INTERNAL_API_KEY },
});

// Graceful fallback when AI service is unavailable
const safePost = async (url, data, fallback) => {
  try {
    const res = await aiClient.post(url, data);
    return res.data;
  } catch (err) {
    logger.warn(`AI service unavailable (${url}): ${err.message}. Using fallback.`);
    return fallback;
  }
};

const safeGet = async (url, params, fallback) => {
  try {
    const res = await aiClient.get(url, { params });
    return res.data;
  } catch (err) {
    logger.warn(`AI service unavailable (${url}): ${err.message}. Using fallback.`);
    return fallback;
  }
};

// Categorize a batch of transactions
// FastAPI returns { results: [...] } — unwrap to array so callers get results[i] directly.
const categorizeTransactions = async (transactions) => {
  const fallback = transactions.map(() => ({
    category: 'Others',
    confidence: 0,
    source: 'FALLBACK',
    layer: 5,
  }));

  const result = await safePost('/categorize/batch', { transactions }, { results: fallback });
  return result?.results || fallback;
};

// Finance chatbot
const chat = async (userId, message, history = []) => {
  return safePost(
    '/chat',
    { userId, message, history },
    { response: "I'm unable to process your request right now. Please try again later." }
  );
};

// Monthly AI insights report
const getMonthlyInsights = async (userId, month, summaryData) => {
  return safePost(
    '/insights/monthly',
    { userId, month, ...summaryData },
    { insights: 'Monthly insights are temporarily unavailable.' }
  );
};

// Anomaly / fraud detection
const detectAnomalies = async (userId, transactions, userStats) => {
  return safePost(
    '/anomalies/detect',
    { userId, transactions, userStats },
    { anomalies: [] }
  );
};

// Subscription detection
const detectSubscriptions = async (userId, transactions) => {
  return safePost(
    '/subscriptions/detect',
    { userId, transactions },
    { subscriptions: [] }
  );
};

// Savings opportunity analysis
const getSavingsOpportunities = async (userId, summaryData) => {
  return safePost(
    '/savings/opportunities',
    { userId, ...summaryData },
    { opportunities: [] }
  );
};

module.exports = {
  categorizeTransactions,
  chat,
  getMonthlyInsights,
  detectAnomalies,
  detectSubscriptions,
  getSavingsOpportunities,
};
