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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
