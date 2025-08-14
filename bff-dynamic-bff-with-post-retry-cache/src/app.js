import express from 'express';
import logger from './config/logger.js';
import config from './config/index.js';
import createGraphQLServer from './graphql/server.js';

async function bootstrap() {
  const app = express();

  // Health endpoint
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const server = createGraphQLServer();
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.listen(config.PORT, () => {
    logger.info(`🚀 BFF running at http://localhost:${config.PORT}/graphql`);
  });
}

bootstrap();
