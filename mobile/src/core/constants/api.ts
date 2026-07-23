import { Platform } from 'react-native';

/**
 * ============================================================
 *  IMPORTANT: Update YOUR_LAN_IP to your computer's local IP.
 *  Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
 * ============================================================
 */
const YOUR_LAN_IP = '172.20.10.3';

// Physical devices MUST use the LAN IP. Emulators can use special aliases.
const getApiHost = (): string => {
  if (__DEV__) {
    // Always use LAN IP for Expo Go on physical devices
    return `http://${YOUR_LAN_IP}:8000`;
  }
  return 'https://your-production-url.com';
};

export const API_BASE_URL = `${getApiHost()}/api/v1`;

console.log('[API] Base URL:', API_BASE_URL);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REFRESH: '/auth/refresh/',
    ME: '/auth/me/',
  },
  CATALOG: {
    BOOKS: '/catalog/books/',
    CATEGORIES: '/catalog/categories/',
    COPIES: '/catalog/copies/',
  },
  TRANSACTIONS: {
    CHECKOUT: '/transactions/checkout/',
    RETURN: '/transactions/return/',
    MY_LOANS: '/transactions/my-loans/',
    OVERDUE: '/transactions/overdue/',
  },
  RESERVATIONS: {
    RESERVE: '/reservations/reserve/',
    LIST: '/reservations/list/',
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
    DETAIL: (id: number) => `/policies/${id}/`,
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview/',
    POLICIES: '/analytics/policies/',
  },
};
