import axios from 'axios';
import logger from './logger.js';

const client = axios.create({ timeout: 15000 });

client.interceptors.request.use((cfg) => {
  logger.info('HTTP Request', {
    method: cfg.method,
    url: cfg.baseURL ? cfg.baseURL + cfg.url : cfg.url,
    traceId: cfg.headers?.['x-trace-id']
  });
  return cfg;
});

client.interceptors.response.use(
  (res) => {
    logger.info('HTTP Response', {
      status: res.status,
      url: res.config.baseURL ? res.config.baseURL + res.config.url : res.config.url,
      traceId: res.config.headers?.['x-trace-id']
    });
    return res;
  },
  (err) => {
    logger.error('HTTP Error', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: err.config?.baseURL ? err.config?.baseURL + err.config?.url : err.config?.url,
      traceId: err.config?.headers?.['x-trace-id']
    });
    return Promise.reject(err);
  }
);

export default client;
