import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { expensesService } from '@/server/services/expenses.service';
import {
  expenseIdParamSchema,
  updateExpenseSchema,
  type UpdateExpenseInput,
} from '@/server/validators/expenses.validator';

export const GET = apiRoute(async (request, { params }) => {
  requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(expenseIdParamSchema, await params);
  return jsonSuccess(await expensesService.findById(id));
});

export const PATCH = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(expenseIdParamSchema, await params);
  const body = parseWithSchema<UpdateExpenseInput>(updateExpenseSchema, await readJson(request));
  return jsonSuccess(
    await expensesService.update(id, body, user.userId, user.role),
    200,
    'Expense updated'
  );
});

export const DELETE = apiRoute(async (request, { params }) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const { id } = parseWithSchema<{ id: string }>(expenseIdParamSchema, await params);
  return jsonSuccess(
    await expensesService.remove(id, user.userId, user.role),
    200,
    'Expense deleted'
  );
});
