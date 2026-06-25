import {useAuthenticationStore} from "./authentication.store.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";

/**
 * Guard to check if user is authenticated
 * @summary
 * This guard checks if user is authenticated.
 * If user is not authenticated and tries to navigate to a route that requires authentication,
 * it redirects to the sign-in page, otherwise it allows navigation.
 * @param to - Route to navigate to
 * @param from - Route from which navigation is done
 * @param next - Function to call to navigate to the next route
 */
export const authenticationGuard = async (to, from, next) => {
    console.log('[Guard] Navigating to:', to.name)
    const authenticationStore = useAuthenticationStore();
    const isAnonymous = !authenticationStore.isSignedIn;
    const publicRoutes = ['/sign-in', '/sign-up', '/page-not-found', '/password-recovery', '/reset-password', '/confirmation-code', '/payments-success', '/payments-cancel', 'payments-upgrade-success'];
    const routeRequiresToBeAuthenticated = !publicRoutes.includes(to.path);
    const routeIsPublic = publicRoutes.includes(to.path);
    if (isAnonymous && routeRequiresToBeAuthenticated) return next({ name: 'sign-in'});

    const accountId = authenticationStore.currentAccountId;
    const skipAccountStatusCheck = isFrontendOnly();

    if (!isAnonymous && !routeIsPublic && to.name !== 'PlanChoose' && !skipAccountStatusCheck) {
        try {
            const accountService = new (await import('@/payment-and-subscriptions/services/account.service.js')).AccountService();
            const { accountStatus } = await accountService.getAccountStatus(accountId);

            if (accountStatus === 'INACTIVE') {
                if (from.name !== 'PlanChoose' && to.name !== 'PlanChoose') {
                    return next({ name: 'PlanChoose' });
                } else {
                    return next();
                }
            }
        } catch (error) {
            console.error('Error checking account status:', error);
            return next({ name: 'sign-in' });
        }
    }

    return next();
}