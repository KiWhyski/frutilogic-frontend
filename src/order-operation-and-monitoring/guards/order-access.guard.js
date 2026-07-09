import userService from '@/authentication/services/user.service';
import { isFruitStoreOwner, isSupplier } from '@/shared/utils/account-role.js';

export function orderAccessGuard(to, from, next) {
    const profile = userService.getCurrentUserProfile();

    if (isFruitStoreOwner(profile?.role) || isSupplier(profile?.role)) {
        next();
    } else {
        next('/unauthorized');
    }
}
