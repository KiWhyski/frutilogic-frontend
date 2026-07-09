import { AuthenticationService } from "./authentication.service.js";
import { defineStore } from "pinia";
import { parseAuthResponse, persistSession, clearSession, hasValidSession } from "./auth.session.js";

const authenticationService = new AuthenticationService();

export const useAuthenticationStore = defineStore('authentication', {
    state: () => ({
        signedIn: false,
        userId: '',
        username: '',
        recoveryEmail: '',
    }),
    getters: {
        isSignedIn: (state) => state.signedIn,
        currentUserId: (state) => state.userId,
        currentUsername: (state) => state.username,
        currentToken: () => localStorage.getItem('token'),
        currentAccountId: () => localStorage.getItem('accountId'),
        currentRecoveryEmail: () => localStorage.getItem('recoveryEmail'),
        account: () => {
            const accountId = localStorage.getItem('accountId');
            const accountRole = localStorage.getItem('accountRole');
            if (!accountId) return null;
            return { accountId, accountRole };
        },
    },
    actions: {
        initializeFromStorage() {
            if (!hasValidSession()) {
                clearSession();
                this.signedIn = false;
                this.userId = '';
                this.username = '';
                return;
            }

            this.signedIn = true;
            this.userId = localStorage.getItem('userId') || '';
            this.username = localStorage.getItem('username') || '';
        },

        applySession(session) {
            persistSession(session);
            this.signedIn = true;
            this.userId = session.id;
            this.username = session.username;
        },

        async finishLogin(response, router) {
            const session = await authenticationService.completeSignIn(response);
            this.applySession(session);
            await router.push({ name: 'Dashboard' });
        },

        async signIn(signInRequest, router) {
            try {
                const response = await authenticationService.signIn(
                    signInRequest.username ?? signInRequest.email,
                    signInRequest.password
                );
                await this.finishLogin(response, router);
            } catch (error) {
                clearSession();
                this.signedIn = false;
                this.userId = '';
                this.username = '';
                throw error;
            }
        },

        async signUp(signUpRequest, router) {
            const email = signUpRequest.username ?? signUpRequest.email;
            const password = signUpRequest.password;

            try {
                const response = await authenticationService.signUp({ email, password });
                await this.finishLogin(response, router);
            } catch (error) {
                clearSession();
                this.signedIn = false;
                this.userId = '';
                this.username = '';
                throw error;
            }
        },

        async signOut(router) {
            clearSession();
            this.signedIn = false;
            this.userId = '';
            this.username = '';
            this.recoveryEmail = '';
            await router.push({ name: 'sign-in' });
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
        },
    },
});
