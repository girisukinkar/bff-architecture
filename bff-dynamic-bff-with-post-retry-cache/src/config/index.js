import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: process.env.PORT || 4000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  services: {
    salesforce: {
      baseURL: process.env.SF_BASE_URL,
      token: process.env.SF_TOKEN
    },
    hubspot: {
      baseURL: process.env.HUBSPOT_BASE_URL,
      token: process.env.HUBSPOT_TOKEN
    }
  }
};

export default config;
