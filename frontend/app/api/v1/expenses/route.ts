import { apiRoute, jsonSuccess, parseWithSchema, readJson, requireAuth } from '@/server/api/http';
import { FARM_ROLES } from '@/server/api/roles';
import { expensesService } from '@/server/services/expenses.service';
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from '@/server/validators/expenses.validator';

export const GET = apiRoute(async (request) => {
  requireAuth(request, [...FARM_ROLES]);
  return jsonSuccess(await expensesService.findAll());
});

export const POST = apiRoute(async (request) => {
  const user = requireAuth(request, [...FARM_ROLES]);
  const body = parseWithSchema<CreateExpenseInput>(createExpenseSchema, await readJson(request));
  return jsonSuccess(await expensesService.create(body, user.userId), 201, 'Expense created');
});
