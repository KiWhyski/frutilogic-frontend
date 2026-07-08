import httpInstance from "@/shared/services/http.instance.js";
import { normalizeApiPath } from "@/shared/config/backend-url.js";

function mapAccountRole(role) {
    if (role === 'LiquorStoreOwner') return 'Liquor Store Owner';
    return role;
}

/**
 * Service class to call authentication APIs
 * @summary
 * This class is responsible to call authentication APIs.
 * It contains methods to call sign-in and sign-up APIs.
 */
export class AuthenticationService
{
    /**
     * Method to call sign-in API
     * @param signInRequest {SignInRequest} - Request object to sign-in
     * @returns {Promise<httpInstance.AxiosResponse<SignInResponse>>} - Response from the API
     *
     */
    signIn(signInRequest) {
        return httpInstance.post(normalizeApiPath(import.meta.env.VITE_AUTH_SIGNIN_ENDPOINT || 'sign-in'), {
            email: signInRequest.username ?? signInRequest.email,
            password: signInRequest.password,
        });
    }

    /**
     * Method to call sign-up API
     * @param signUpRequest {SignUpRequest} - Request object to sign-up
     * @returns {Promise<httpInstance.AxiosResponse<SignUpResponse>>} - Response from the API
     */
    signUp(signUpRequest) {
        return httpInstance.post(normalizeApiPath(import.meta.env.VITE_AUTH_SIGNUP_ENDPOINT || 'sign-up'), {
            email: signUpRequest.username,
            password: signUpRequest.password,
            name: signUpRequest.name ?? signUpRequest.businessName,
            businessName: signUpRequest.businessName ?? signUpRequest.name,
            role: signUpRequest.accountRole,
        });
    }

    async sendRecoveryCode(username) {
        return httpInstance.post(import.meta.env.VITE_SEND_RECOVERY_CODE_ENDPOINT, { email: username });
    }

    async verifyRecoveryCode(username, recoveryCode) {
        try {
            const response = await httpInstance.post(import.meta.env.VITE_VERIFY_RECOVERY_CODE_ENDPOINT, {
                email: username,
                code: recoveryCode,
            });
            return response.data;
        } catch (error) {
            console.error('Backend error:', error.response?.data || error.message);
            throw error;
        }
    }

    async resetPassword(username, newPassword) {
        try {
            const response = await httpInstance.put(import.meta.env.VITE_RESET_PASSWORD_ENDPOINT, {
                email: username,
                newPassword,
            });
            return response.data;
        } catch (error) {
            console.error('Backend error:', error.response?.data || error.message);
            throw error;
        }
    }

    async fetchAccountRole(accountId) {
        const response = await httpInstance.get(`accounts/${accountId}`);
        return mapAccountRole(response.data?.role);
    }
}

export { mapAccountRole };
