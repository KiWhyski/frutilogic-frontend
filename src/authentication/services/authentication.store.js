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
            const token = localStorage.getItem('token');
            if (token === 'dev-local-preview-token' || localStorage.getItem('devBypassAuth') === 'true') {
                clearSession();
                this.signedIn = false;
                this.userId = '';
                this.username = '';
                return;
            }

            if (!hasValidSession()) {
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

        async signIn(signInRequest, router) {
            try {
                const response = await authenticationService.signIn(
                    signInRequest.username ?? signInRequest.email,
                    signInRequest.password
                );

                const session = parseAuthResponse(response.data);
                if (!session.token) {
                    throw new Error('El servidor no devolviù un token de sesiùn');
                }

                localStorage.setItem('token', session.token);
                this.signedIn = true;

                if (session.accountId) {
                    await authenticationService.ensureFreePlanActivated(session.accountId);
                    if (!session.accountRole) {
                        try {
                            session.accountRole = await authenticationService.fetchAccountRole(session.accountId);
                        } catch {
                            session.accountRole = 'Liquor Store Owner';
                        }
                    }
                }

                this.applySession(session);
                await router.push({ name: 'Dashboard' });
            } catch (error) {
                clearSession();
                this.signedIn = false;
                this.userId = '';
                this.username = '';
                throw error;
            }
        },

        async signUp(signUpRequest, router) {
            await authenticationService.signUp({
                email: signUpRequest.username,
                password: signUpRequest.password,
                name: signUpRequest.name ?? signUpRequest.businessName,
                businessName: signUpRequest.businessName ?? signUpRequest.name,
                role: signUpRequest.accountRole,
            });

            await this.signIn(
                { username: signUpRequest.username, password: signUpRequest.password },
                router
            );
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
