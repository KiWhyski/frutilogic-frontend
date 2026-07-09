/**
 * Respuestas mock para axios (httpInstance) en modo solo-frontend.
 * @param {import('axios').InternalAxiosRequestConfig} config
 */

import {
  warehouseDevList,
  warehouseDevCountPayload,
  warehouseDevCreateFromFormData,
  warehouseDevUpdateFromFormData,
  warehouseDevDelete,
  warehouseDevGetByIdOrPlaceholder,
} from '@/inventory-management/services/warehouse.dev-store.js';

const DEMO_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

const DEMO_PRODUCTS_CATALOG = [
  {
    productId: 'demo-p-1',
    name: 'Manzana Fuji',
    brandName: 'Fruticultores del Sur',
    liquorType: 'Apples',
    unitPriceAmount: 45.9,
    minimumStock: 10,
    imageUrl: '',
    accountId: DEMO_ACCOUNT_ID,
  },
  {
    productId: 'demo-p-2',
    name: 'Mango Ataulfo',
    brandName: 'ExportPerú',
    liquorType: 'Mangos',
    unitPriceAmount: 120,
    minimumStock: 5,
    imageUrl: '',
    accountId: DEMO_ACCOUNT_ID,
  },
];

/**
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
function requestPath(config) {
  const u = config.url || '';
  if (/^https?:\/\//i.test(u)) {
    return u;
  }
  const base = (config.baseURL || '').replace(/\/$/, '');
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${base}${path}`;
}

/**
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
export function resolveFrontendMockPayload(config) {
  const raw = requestPath(config);
  const url = raw.toLowerCase();
  const method = (config.method || 'get').toLowerCase();
  const pathNoQuery = raw.split(/[?#]/)[0].replace(/\/+$/, '');

  if (url.includes('/status')) {
    return { accountStatus: 'ACTIVE' };
  }

  if (url.includes('current-benefits-limits')) {
    return { maxProducts: 50, maxWarehouses: 5, limits: [] };
  }

  if (url.includes('current-plan')) {
    return 'plan_free';
  }

  if (url.includes('/plans')) {
    return [
      {
        planId: 'plan_free',
        planType: 'Free',
        description: 'Plan gratuito',
        price: 0,
        maxWarehouses: 1,
        minWarehouses: 0,
        maxProducts: 50,
      },
      {
        planId: 'plan_premium_monthly',
        planType: 'PremiumMonthly',
        description: 'Plan Premium',
        price: 19.9,
        maxWarehouses: 5,
        minWarehouses: 0,
        maxProducts: 500,
      },
    ];
  }

  if (url.includes('subscriptions')) {
    if (method === 'get') return { status: 'ACTIVE' };
    return { success: true };
  }

  if (url.includes('/orders')) {
    if (method === 'get') return [];
    if (method === 'post' || method === 'patch' || method === 'put') {
      return { id: '00000000-0000-0000-0000-000000000099', status: 0 };
    }
  }

  if (url.includes('warehouse') || url.includes('warehouses')) {
    if (method === 'get' && url.includes('counts')) {
      return warehouseDevCountPayload();
    }

    if (method === 'get' && /\/warehouses\/[^/]+\/inventories\/?$/i.test(pathNoQuery)) {
      const exp = new Date();
      exp.setDate(exp.getDate() + 30);
      const ymd = exp.toISOString().slice(0, 10);
      return [
        {
          id: 'demo-inv-1',
          productId: 'demo-p-1',
          name: 'Manzana Fuji',
          type: 'Manzana',
          imageUrl: '',
          unitPriceAmount: 45.9,
          minimumStock: 10,
          currentStock: 4,
          status: 'WithStock',
          bestBeforeDate: ymd,
        },
        {
          id: 'demo-inv-2',
          productId: 'demo-p-2',
          name: 'Mango Ataulfo',
          type: 'Mango',
          imageUrl: '',
          unitPriceAmount: 120,
          minimumStock: 5,
          currentStock: 2,
          status: 'WithStock',
          bestBeforeDate: ymd,
        },
      ];
    }

    if (method === 'post' && /\/accounts\/[^/]+\/warehouses\/?$/i.test(pathNoQuery)) {
      return warehouseDevCreateFromFormData(config.data);
    }

    if (
      method === 'put' &&
      /\/warehouses\/[^/]+\/?$/i.test(pathNoQuery) &&
      !pathNoQuery.toLowerCase().includes('/inventories')
    ) {
      const m = pathNoQuery.match(/\/warehouses\/([^/]+)\/?$/i);
      const id = m?.[1];
      if (id) {
        return warehouseDevUpdateFromFormData(id, config.data);
      }
      return { success: true };
    }

    if (
      method === 'delete' &&
      /\/warehouses\/[^/]+\/?$/i.test(pathNoQuery) &&
      !pathNoQuery.toLowerCase().includes('/inventories')
    ) {
      const m = pathNoQuery.match(/\/warehouses\/([^/]+)\/?$/i);
      const id = m?.[1];
      if (id) warehouseDevDelete(id);
      return { success: true };
    }

    if (method === 'get' && /\/accounts\/[^/]+\/warehouses\/?$/i.test(pathNoQuery)) {
      return warehouseDevList();
    }

    if (
      method === 'get' &&
      /\/warehouses\/[^/]+\/?$/i.test(pathNoQuery) &&
      !pathNoQuery.toLowerCase().includes('/inventories')
    ) {
      const m = pathNoQuery.match(/\/warehouses\/([^/]+)\/?$/i);
      const id = m?.[1];
      return warehouseDevGetByIdOrPlaceholder(id);
    }

    if (method === 'get') {
      return [];
    }
  }

  if (url.includes('product') && method === 'get') {
    const segs = pathNoQuery.split('/').filter(Boolean);
    const last = (segs[segs.length - 1] || '').toLowerCase();
    const secondLast = segs.length >= 2 ? segs[segs.length - 2].toLowerCase() : '';

    if (secondLast === 'products' && last === 'counts') {
      return { count: DEMO_PRODUCTS_CATALOG.length };
    }

    if (secondLast === 'products' && last !== 'products' && last !== 'counts') {
      if (last === 'additions' || last === 'substractions') {
        return [];
      }
      const match = DEMO_PRODUCTS_CATALOG.find((p) => p.productId.toLowerCase() === last);
      if (match) {
        return { ...match };
      }
      return {
        productId: last,
        name: 'Producto demo',
        brandName: 'Marca demo',
        liquorType: 'Manzana',
        unitPriceAmount: 10,
        minimumStock: 1,
        imageUrl: '',
        accountId: DEMO_ACCOUNT_ID,
      };
    }

    if (last === 'products') {
      return [...DEMO_PRODUCTS_CATALOG];
    }

    return [];
  }

  if (url.includes('authentication/sign-in') || (url.includes('sign-in') && method === 'post')) {
    let username = 'demo@local.dev';
    try {
      const bodyRaw = config.data;
      const body = typeof bodyRaw === 'string' ? JSON.parse(bodyRaw || '{}') : bodyRaw;
      if (body?.username) username = body.username;
    } catch (_) {
      /* ignore */
    }
    return {
      id: '0',
      username,
      token: 'dev-local-preview-token',
      accountId: DEMO_ACCOUNT_ID,
      accountRole: 'LiquorStoreOwner',
    };
  }

  if (url.includes('sign-up') || url.includes('/accounts/sign-up')) {
    return { message: 'ok' };
  }

  if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
    return { success: true, id: '00000000-0000-0000-0000-000000000099' };
  }

  if (method === 'get') {
    return [];
  }

  return {};
}
