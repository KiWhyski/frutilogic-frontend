import {useAuthenticationStore} from "./authentication.store.js";

/**
 * Guard to check if user is authenticated
 */
export const authenticationGuard = async (to, from, next) => {
    const authenticationStore = useAuthenticationStore();
    const isAnonymous = !authenticationStore.isSignedIn;
    const publicRoutes = ['/sign-in', '/sign-up', '/page-not-found', '/password-recovery', '/reset-password', '/confirmation-code', '/payments-success', '/payments-cancel', 'payments-upgrade-success'];
    const routeRequiresToBeAuthenticated = !publicRoutes.includes(to.path);
    const routeIsPublic = publicRoutes.includes(to.path);

    if (isAnonymous && routeRequiresToBeAuthenticated) {
        return next({ name: 'sign-in' });
    }

    const accountId = authenticationStore.currentAccountId;

    if (!isAnonymous && !routeIsPublic && to.name !== 'PlanChoose' && accountId) {
        try {
            const accountService = new (await import('@/payment-and-subscriptions/services/account.service.js')).AccountService();
            const { accountStatus } = await accountService.getAccountStatus(accountId);

            if (String(accountStatus).toUpperCase() === 'INACTIVE') {
                if (from.name !== 'PlanChoose' && to.name !== 'PlanChoose') {
                    return next({ name: 'PlanChoose' });
                }
            }
        } catch (error) {
            console.warn('Could not verify account status, allowing navigation:', error);
        }
    }

    return next();
};
