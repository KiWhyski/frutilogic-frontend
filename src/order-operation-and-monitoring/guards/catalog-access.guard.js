import userService from '@/authentication/services/user.service';
import { isFruitStoreOwner } from '@/shared/utils/account-role.js';

export function catalogAccessGuard(to, from, next) {
    const profile = userService.getCurrentUserProfile();

    if (isFruitStoreOwner(profile?.role)) {
        next();
    } else {
        next('/unauthorized');
    }
}
