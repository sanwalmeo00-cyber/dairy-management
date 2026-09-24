import { Router } from 'express';
import { Role } from '@prisma/client';
import * as expensesController from '../controllers/expenses.controller';
import { authenticate, authorize, validate } from '../middleware';
import {
  createExpenseSchema,
  expenseIdParamSchema,
  updateExpenseSchema,
} from '../validators/expenses.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPER_ADMIN, Role.USER, Role.ADMIN, Role.MANAGER));

router.get('/', expensesController.getExpenses);
router.get('/:id', validate(expenseIdParamSchema, 'params'), expensesController.getExpenseById);
router.post('/', validate(createExpenseSchema), expensesController.createExpense);
router.patch(
  '/:id',
  validate(expenseIdParamSchema, 'params'),
  validate(updateExpenseSchema),
  expensesController.updateExpense
);
router.delete('/:id', validate(expenseIdParamSchema, 'params'), expensesController.deleteExpense);

export default router;
