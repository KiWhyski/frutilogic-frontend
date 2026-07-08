import {useAuthenticationStore} from "./authentication.store.js";

const PUBLIC_ROUTES = new Set([
    '/sign-in',
    '/sign-up',
    '/page-not-found',
    '/password-recovery',
    '/reset-password',
    '/confirmation-code',
    '/payments-success',
    '/payments-cancel',
]);

export const authenticationGuard = async (to, from, next) => {
    const authenticationStore = useAuthenticationStore();
    const isPublic = PUBLIC_ROUTES.has(to.path);

    if (!authenticationStore.isSignedIn && !isPublic) {
        return next({ name: 'sign-in' });
    }

    if (authenticationStore.isSignedIn && (to.name === 'sign-in' || to.name === 'sign-up')) {
        return next({ name: 'Dashboard' });
    }

    return next();
};
