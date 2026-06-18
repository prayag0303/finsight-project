const { Router } = require('express');
const transactionController = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');
const {
  createTransactionValidators,
  updateTransactionValidators,
  listTransactionValidators,
} = require('../validators/transaction.validators');
const validate = require('../middleware/validate');

const router = Router();

router.use(authenticate);

router.get('/', listTransactionValidators, validate, transactionController.findAll);
router.post('/', createTransactionValidators, validate, transactionController.create);
router.post('/upload', upload.single('file'), transactionController.uploadCSV);
router.get('/:id', transactionController.findById);
router.patch('/:id', updateTransactionValidators, validate, transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
