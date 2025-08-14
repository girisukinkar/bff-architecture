import { createAPIWrappers } from '../../utils/apiFactory.js';
import { toAccount } from './transform.js';

const API = createAPIWrappers();

export default {
  Query: {
    account: async (_, { id }, { traceId }) => {
      const raw = await API.salesforce.getAccount([id], {}, traceId);
      return toAccount(raw);
    }
  },
  Mutation: {
    createAccount: async (_, { input }, { traceId }) => {
      // Salesforce sObject create expects fields in request body
      const data = await API.salesforce.createAccount([], { data: input }, traceId);
      // SF returns { id, success, errors: [] }
      return { id: data.id, success: data.success };
    }
  }
};
