import { ApolloServer } from 'apollo-server-express';
import { loadModules } from './loader.js';
import { makeTraceId } from '../utils/traceId.js';

/**
 * Creates an ApolloServer with dynamic modules and per-request traceId.
 */
export default function createGraphQLServer() {
  const { typeDefs, resolvers } = loadModules();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const traceId = makeTraceId();
      return { traceId, req };
    },
    formatError: (err) => ({
      message: err.message,
      code: err.extensions?.code || 'INTERNAL_SERVER_ERROR'
    })
  });

  return server;
}
