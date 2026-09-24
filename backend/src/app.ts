import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { appConfig } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import goatsRoutes from './routes/goats.routes';
import breedingRoutes from './routes/breeding.routes';
import kidsRoutes from './routes/kids.routes';
import goatPurchasesRoutes from './routes/goatPurchases.routes';
import salesRoutes from './routes/sales.routes';
import expensesRoutes from './routes/expenses.routes';
import workersRoutes from './routes/workers.routes';
import workerPaymentsRoutes from './routes/workerPayments.routes';
import inventoryRoutes from './routes/inventory.routes';
import deletedRoutes from './routes/deleted.routes';
import dashboardRoutes from './routes/dashboard.routes';
import uploadsRoutes from './routes/uploads.routes';
import { sendSuccess } from './utils/response';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: appConfig.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(appConfig.env === 'development' ? 'dev' : 'combined'));

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' });
});

app.use(`${appConfig.apiPrefix}/auth`, authRoutes);
app.use(`${appConfig.apiPrefix}/users`, usersRoutes);
app.use(`${appConfig.apiPrefix}/products`, productsRoutes);
app.use(`${appConfig.apiPrefix}/orders`, ordersRoutes);
app.use(`${appConfig.apiPrefix}/goats`, goatsRoutes);
app.use(`${appConfig.apiPrefix}/breeding`, breedingRoutes);
app.use(`${appConfig.apiPrefix}/kids`, kidsRoutes);
app.use(`${appConfig.apiPrefix}/goat-purchases`, goatPurchasesRoutes);
app.use(`${appConfig.apiPrefix}/sales`, salesRoutes);
app.use(`${appConfig.apiPrefix}/expenses`, expensesRoutes);
app.use(`${appConfig.apiPrefix}/workers`, workersRoutes);
app.use(`${appConfig.apiPrefix}/worker-payments`, workerPaymentsRoutes);
app.use(`${appConfig.apiPrefix}/inventory`, inventoryRoutes);
app.use(`${appConfig.apiPrefix}/deleted`, deletedRoutes);
app.use(`${appConfig.apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${appConfig.apiPrefix}/uploads`, uploadsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
