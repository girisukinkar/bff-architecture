/**
 * Auto-generates strongly-typed looking wrappers from apiConfig.
 * Usage: const API = createAPIWrappers(); API.salesforce.getAccount([id], {}, traceId)
 */
import { callAPI } from './apiCaller.js';
import apiConfig from '../config/apiConfig.js';

export function createAPIWrappers() {
  const wrappers = {};
  for (const [serviceName, service] of Object.entries(apiConfig)) {
    wrappers[serviceName] = {};
    for (const endpointKey of Object.keys(service.endpoints)) {
      wrappers[serviceName][endpointKey] = (args = [], options = {}, traceId) =>
        callAPI(serviceName, endpointKey, args, options, traceId);
    }
  }
  return wrappers;
}
