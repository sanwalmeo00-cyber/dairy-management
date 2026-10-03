import { invalidateDashboardCache } from '../services/dashboard.service';
import { invalidateWalletCache } from './wallet';

/** Call after money or herd-changing writes so overview stays fresh without extra waits. */
export function invalidateAppCaches() {
  invalidateDashboardCache();
  invalidateWalletCache();
}
