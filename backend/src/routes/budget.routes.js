const { Router } = require('express');
const budgetController = require('../controllers/budget.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { createBudgetValidators, updateBudgetValidators, listBudgetValidators } = require('../validators/budget.validators');
const validate = require('../middleware/validate');

const router = Router();

router.use(authenticate);

router.get('/', listBudgetValidators, validate, budgetController.findAll);
router.post('/', createBudgetValidators, validate, budgetController.create);
router.patch('/:id', updateBudgetValidators, validate, budgetController.update);
router.delete('/:id', budgetController.remove);

module.exports = router;
