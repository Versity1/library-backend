import { Platform } from 'react-native';

/**
 * Production Server Configuration
 */
const PRODUCTION_SERVER = 'https://learnpro.com.ng';

const getApiHost = (): string => {
  return PRODUCTION_SERVER;
};

export const API_BASE_URL = `${getApiHost()}/api/v1`;

console.log('[API] Connected to Production Server:', API_BASE_URL);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    REFRESH: '/auth/refresh/',
    ME: '/auth/me/',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request/',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
  },
  CATALOG: {
    BOOKS: '/catalog/books/',
    CATEGORIES: '/catalog/categories/',
    COPIES: '/catalog/copies/',
    SCAN: '/catalog/copies/scan/',
  },
  TRANSACTIONS: {
    CHECKOUT: '/transactions/checkout/',
    RETURN: '/transactions/return/',
    MY_LOANS: '/transactions/my-loans/',
    RENEW: '/transactions/renew/',
    OVERDUE: '/transactions/overdue/',
    ACCESS_LOGS: '/transactions/access-logs/',
    ACCESS_LOGS_SCAN: '/transactions/access-logs/scan/',
    ACCESS_LOGS_MANUAL_CHECKOUT: '/transactions/access-logs/manual-checkout/',
  },
  RESERVATIONS: {
    RESERVE: '/reservations/reserve/',
    LIST: '/reservations/queue/',
    MY_RESERVATIONS: '/reservations/my-reservations/',
    QUEUE: '/reservations/queue/',
    FULFILL: '/reservations/fulfill/',
    CANCEL: '/reservations/cancel/',
  },
  FINES: {
    MY_FINES: '/fines/my-fines/',
    PAY: '/fines/pay/',
    RECEIPT: (id: string) => `/fines/receipt/${id}/`,
  },
  POLICIES: {
    LIST: '/policies/',
    DETAIL: (id: number | string) => `/policies/${id}/`,
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview/',
    POLICIES: '/policies/',
  },
  ADMIN: {
    USERS: '/auth/admin/users/',
    SYSTEM_LOGS: '/analytics/system/logs/',
    SYSTEM_BACKUP: '/analytics/system/backup/',
    SYSTEM_RESTORE: '/analytics/system/restore/',
  }
};
