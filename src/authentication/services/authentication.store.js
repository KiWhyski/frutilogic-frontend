import {AuthenticationService} from "./authentication.service.js";
import {defineStore} from "pinia";
import {SignInResponse} from "../model/sign-in.response.js";
import {SignUpResponse} from "../model/sign-up.response.js";
import { AccountService } from "@/payment-and-subscriptions/services/account.service.js";
import { isFrontendOnly } from "@/shared/config/frontend-only.js";

const authenticationService = new AuthenticationService();

/** Perfil demo para guards (catalog/order) que leen userService.getCurrentUserProfile() */
function setDemoUserForGuards(username) {
    const email = username || 'demo@local.dev';
    const profile = {
        profileId: '0',
        name: 'Demo',
        email,
        role: 'Liquor Store Owner',
    };
    const currentUser = {
        id: '0',
        profileId: '0',
        profile,
        accountId: '00000000-0000-0000-0000-000000000001',
        account: { accountId: '00000000-0000-0000-0000-000000000001' },
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

/** Token stored for offline / no-backend UI preview (Register button). */
export const LOCAL_PREVIEW_TOKEN = 'dev-local-preview-token';

/**
 * Store definition for authentication
 * @summary
 * This store is responsible to manage the authentication state.
 * It contains state for signed-in status, user ID, and username.
 * It contains actions to sign-in, sign-up, and sign-out.
 */
export const useAuthenticationStore = defineStore('authentication',{
    state: () => ({ signedIn: false, userId: '', username: '' , recoveryEmail: ''}),
    getters: {
        /**
         * Getter to check if user is signed in
         * @param state - Current state of the store
         * @returns {boolean} - True if user is signed in, false otherwise
         */
        isSignedIn: (state) => state['signedIn'],
        /**
         * Getter to get the current user ID
         * @param state - Current state of the store
         * @returns {number} - Current user ID
         */
        currentUserId: (state) => state['userId'],
        /**
         * Getter to get the current username
         * @param state - Current state of the store
         * @returns {string} - Current username
         */
        currentUsername: (state) => state['username'],
        /**
         * Getter to get the current token
         * @returns {string} - Current token
         */
        currentToken: () => localStorage.getItem('token'),

        /**
         * Getter to get the current account ID
         * @returns {string} - Current account ID from local storage
         */
        currentAccountId: () => localStorage.getItem('accountId'),

        /**
         * Getter to get the current account role
         * @returns {string} - Current email to recover the account
         */
        currentRecoveryEmail: () => localStorage.getItem('recoveryEmail'),

        account: () => {
            const accountId = localStorage.getItem('accountId');
            const accountRole = localStorage.getItem('accountRole');
            if (accountId && accountRole) {
                return {
                    accountId,
                    accountRole
                };
            }
            return null;
        }
    },
    actions: {
        /**
         * Initialize the store from local storage
         * @summary
         * This action checks local storage for a token and sets the signed-in status accordingly.
         * It also retrieves the user ID and username from local storage.
         * @description
         * This action is called when the application starts to restore the authentication state.
         */
        initializeFromStorage() {
            const token = localStorage.getItem('token');
            const accountId = localStorage.getItem('accountId');
            const userId = localStorage.getItem('userId');
            const username = localStorage.getItem('username');

            this.signedIn = !!token;
            this.userId = userId || '';
            this.username = username || '';
        },

        /**
         * Sign in with mock storage so the UI works without a running API (e.g. Register).
         * Works in dev, vite preview, and production builds so you can demo the shell.
         */
        enterLocalPreview(router) {
            const token = LOCAL_PREVIEW_TOKEN;
            const accountId = '00000000-0000-0000-0000-000000000001';
            const userId = '0';
            const username = 'demo@local.dev';
            const accountRole = 'LiquorStoreOwner';

            this.signedIn = true;
            this.userId = userId;
            this.username = username;

            localStorage.setItem('token', token);
            localStorage.setItem('accountId', accountId);
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', username);
            localStorage.setItem('accountRole', accountRole);
            localStorage.setItem('devBypassAuth', 'true');
            localStorage.setItem(
                'currentAccount',
                JSON.stringify({ accountId, accountRole, username })
            );

            setDemoUserForGuards(username);

            router.push({ name: 'Dashboard' });
        },
        /**
         * Action to sign-in
         * @summary
         * This action calls the sign-in API and updates the store state.
         * If sign-in is successful, it sets the signed-in status, user ID, and username.
         * It also saves the token in local storage.
         * If sign-in fails, it redirects to the sign-in page.
         * @param signInRequest - The {@link SignInRequest} object to sign-in
         * @param router - Vue router instance
         */
        async signIn(signInRequest, router) {
            try {
                const response = await authenticationService.signIn(signInRequest);
                const data = response.data;
                const id = data.id ?? data.userId;
                const username = data.username ?? data.email;
                const { token, accountId } = data;
                let accountRole = data.accountRole;

                if (!accountRole && accountId) {
                    accountRole = await authenticationService.fetchAccountRole(accountId);
                }

                const signInResponse = new SignInResponse(id, username, token, accountId);

                this.signedIn = true;
                this.userId = signInResponse.id;
                this.username = signInResponse.username;

                localStorage.setItem('token', token);
                localStorage.setItem('accountId', accountId);
                localStorage.setItem('userId', id);
                localStorage.setItem('username', username);
                localStorage.setItem('accountRole', accountRole);

                const currentAccount = {
                    accountId,
                    accountRole,
                    username
                };
                localStorage.setItem('currentAccount', JSON.stringify(currentAccount));

                if (isFrontendOnly()) {
                    setDemoUserForGuards(username);
                }

                const accountService = new AccountService();
                const { accountStatus } = await accountService.getAccountStatus(accountId);
                console.log("✅ Account Status:", accountStatus);

                if (accountStatus === "INACTIVE") {
                    router.push({ name: "PlanChoose" });
                } else {
                    router.push({ name: "Dashboard" });
                }

            } catch (error) {
                console.error("❌ Sign-in error:", error);
                router.push({ name: 'sign-in' });
            }
        },
        async signUp(signUpdRequest, router) {
            /**
             * Action to sign-up
             * @summary
             * This action calls the sign-up API.
             * If sign-up is successful, it redirects to the sign-in page.
             * If sign-up fails, it redirects to the sign-up page.
             * @param signUpdRequest - The {@link SignUpRequest} object to sign-up
             * @param router - Vue router instance
             */
            if (isFrontendOnly()) {
                router.push({ name: 'sign-in' });
                return Promise.resolve();
            }
            authenticationService.signUp(signUpdRequest)
                .then(response => {
                    let signUpResponse = new SignUpResponse(response.data.message);
                    router.push({ name: 'sign-in' });
                    console.log(signUpResponse);
                })
                .catch(error => {
                    console.log(error);
                    router.push({ name: 'sign-up' });
                });
        },
        /**
         * Action to sign-out
         * @summary
         * This action signs out the user.
         * It sets the signed-in status to false, user ID to 0, and username to empty string.
         * It also removes the token from local storage.
         * It redirects to the sign-in page.
         * @param router - Vue router instance
         */
        async signOut(router) {
            this.signedIn = false;
            this.userId = '';
            this.username = '';
            localStorage.removeItem('token');
            localStorage.removeItem('accountId');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('accountRole');
            localStorage.removeItem('currentAccount');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('devBypassAuth');
            console.log('Signed out');
            router.push({ name: 'sign-in' });
        },
        setRecoveryEmail(email) {
            this.recoveryEmail = email;
            localStorage.setItem('recoveryEmail', email);
        },

        getRecoveryEmail() {
            return this.recoveryEmail || localStorage.getItem('recoveryEmail');
        },

        clearRecoveryEmail() {
            this.recoveryEmail = '';
            localStorage.removeItem('recoveryEmail');
        }
    }
});