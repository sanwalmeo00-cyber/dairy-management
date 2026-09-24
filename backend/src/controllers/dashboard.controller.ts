import { Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
  const data = await dashboardService.getOverview({ refresh });
  return sendSuccess(res, data);
});
