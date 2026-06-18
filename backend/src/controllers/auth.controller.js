const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    created(res, result, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const logout = (_req, res) => {
  // JWT is stateless — client discards token; server just acknowledges
  success(res, null, 'Logged out successfully');
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.userId);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getProfile };
