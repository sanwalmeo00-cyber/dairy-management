import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import productsRoutes from './products.routes';
import ordersRoutes from './orders.routes';
import goatsRoutes from './goats.routes';
import breedingRoutes from './breeding.routes';
import kidsRoutes from './kids.routes';
import goatPurchasesRoutes from './goatPurchases.routes';
import salesRoutes from './sales.routes';
import expensesRoutes from './expenses.routes';
import workersRoutes from './workers.routes';
import workerPaymentsRoutes from './workerPayments.routes';
import inventoryRoutes from './inventory.routes';
import deletedRoutes from './deleted.routes';
import dashboardRoutes from './dashboard.routes';
import uploadsRoutes from './uploads.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/goats', goatsRoutes);
router.use('/breeding', breedingRoutes);
router.use('/kids', kidsRoutes);
router.use('/goat-purchases', goatPurchasesRoutes);
router.use('/sales', salesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/workers', workersRoutes);
router.use('/worker-payments', workerPaymentsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/deleted', deletedRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/uploads', uploadsRoutes);

export default router;
