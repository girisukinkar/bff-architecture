import fs from 'fs';
import path from 'path';
import { gql } from 'apollo-server-express';

/**
 * Loads all schema.graphql & resolvers.js under src/modules/*
 * Adds a base Query/Mutation so modules can `extend type Query` cleanly.
 */
export function loadModules() {
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  const typeDefs = [gql`type Query { _empty: String } type Mutation { _empty: String }`];
  const resolvers = [];

  if (!fs.existsSync(modulesDir)) return { typeDefs, resolvers };

  for (const name of fs.readdirSync(modulesDir)) {
    const modDir = path.join(modulesDir, name);
    if (!fs.statSync(modDir).isDirectory()) continue;

    const schemaPath = path.join(modDir, 'schema.graphql');
    if (fs.existsSync(schemaPath)) {
      typeDefs.push(gql(fs.readFileSync(schemaPath, 'utf8')));
    }

    const resolversPath = path.join(modDir, 'resolvers.js');
    if (fs.existsSync(resolversPath)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(resolversPath);
      resolvers.push(mod.default || mod);
    }
  }

  return { typeDefs, resolvers };
}
