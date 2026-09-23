import app from './app';
import { appConfig } from './config';
import { logger } from './utils/logger';
import prisma from './database/prisma';

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port}`, {
        env: appConfig.env,
        api: `http://localhost:${appConfig.port}${appConfig.apiPrefix}`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
