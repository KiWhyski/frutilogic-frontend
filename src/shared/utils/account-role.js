const FRUIT_STORE_OWNER_ROLES = new Set([
    'LiquorStoreOwner',
    'Liquor Store Owner',
    'Fruit Store Owner',
]);

export function normalizeAccountRole(role) {
    if (!role) return '';
    if (FRUIT_STORE_OWNER_ROLES.has(role)) return 'Fruit Store Owner';
    return role;
}

export function isFruitStoreOwner(role) {
    if (!role) return false;
    return FRUIT_STORE_OWNER_ROLES.has(role);
}

export function isLiquorStoreOwner(role) {
    return isFruitStoreOwner(role);
}

export function isSupplier(role) {
    return role === 'Supplier';
}
