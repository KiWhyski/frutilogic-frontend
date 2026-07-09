import { BaseService } from '@/shared/services/base.service.js';
import axios from 'axios';
import { isFrontendOnly } from '@/shared/config/frontend-only.js';
import { getBackendBaseUrl, joinApiPath } from '@/shared/config/backend-url.js';

class UserService extends BaseService {
    constructor() {
        super();
        this.apiUrl = getBackendBaseUrl() || import.meta.env.VITE_API_URL;

        // Rutas específicas del micro‑frontend JSON‑server o API real
        this.resourceEndpoint  = import.meta.env.VITE_USER_ENDPOINT_PATH;      // '/users'
        this.profileEndpoint   = import.meta.env.VITE_PROFILE_ENDPOINT_PATH;   // '/profiles'
        this.accountEndpoint   = import.meta.env.VITE_ACCOUNT_ENDPOINT_PATH;   // '/api/v1/accounts'
    }

    /* ───────────────────────────────  AUTH  ─────────────────────────────── */

    /**
     * Inicia sesión: guarda user, profile y account en localStorage.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    async login(username, password) {
        if (isFrontendOnly()) {
            const profile = {
                profileId: '0',
                name: 'Demo',
                email: username,
                role: 'Fruit Store Owner',
            };
            const currentUser = {
                id: '0',
                profileId: '0',
                profile,
                accountId: '00000000-0000-0000-0000-000000000001',
                account: { accountId: '00000000-0000-0000-0000-000000000001' },
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            return true;
        }
        try {
            // 1) Buscar usuario
            const { data: users } = await axios.get(
                joinApiPath(this.apiUrl, this.resourceEndpoint),
                { params: { username, password } }
            );
            if (users.length === 0) return false;

            const user = users[0];

            // 2) Obtener perfil
            const { data: profile } = await axios.get(
                joinApiPath(this.apiUrl, `${this.profileEndpoint}/${user.profileId}`)
            );
            if (!profile) throw new Error('Profile not found');

            // 3) Obtener cuenta (vía e‑mail)
            const { data: accountList } = await axios.get(
                joinApiPath(this.apiUrl, this.accountEndpoint),
                { params: { email: username } }
            );
            const account = accountList?.length ? accountList[0] : null;
            if (!account) console.warn('No se encontró cuenta para', username);

            // 4) Consolidar y persistir
            const currentUser = {
                ...user,
                profileId:   profile.profileId,
                profile,
                accountId:   account?.accountId ?? null,
                account      // objeto completo o null
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /* ─────────────────────────────  HELPERS  ────────────────────────────── */

    getCurrentUser() {
        const saved = localStorage.getItem('currentUser') ?? sessionStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    }

    getCurrentUserProfile() {
        return this.getCurrentUser()?.profile ?? null;
    }

    /** Nuevo: devuelve la cuenta actual o null */
    getCurrentUserAccount() {
        return this.getCurrentUser()?.account ?? null;
    }

    /* ───────────────────────────  SEARCH BY EMAIL  ──────────────────────── */

    async getProfileByEmail(email) {
        if (isFrontendOnly()) {
            return {
                profileId: '0',
                email,
                name: 'Demo',
            };
        }
        try {
            const { data: profiles } = await axios.get(joinApiPath(this.apiUrl, this.profileEndpoint), {
                params: { email }
            });
            return profiles.length ? profiles[0] : null;
        } catch (e) {
            console.error('Error al obtener perfil por email:', e);
            return null;
        }
    }

    async getAccountByEmail(email) {
        if (isFrontendOnly()) {
            return {
                accountId: '00000000-0000-0000-0000-000000000001',
                email,
            };
        }
        try {
            const { data: accounts } = await axios.get(joinApiPath(this.apiUrl, this.accountEndpoint), {
                params: { email }
            });
            return accounts.length ? accounts[0] : null;
        } catch (e) {
            console.error('Error al obtener cuenta por email:', e);
            return null;
        }
    }

    /* ──────────────────────────────  REGISTER  ──────────────────────────── */

    async register({ name, email, password, role }) {
        if (isFrontendOnly()) {
            return { id: '0', username: email };
        }
        try {
            // lógica mock con JSON‑server
            const { data: newUser } = await axios.post(`${this.apiUrl}/users`, {
                username: email,
                password
            });

            const profile = {
                id: newUser.id,
                profileId: newUser.id,
                userId: newUser.id,
                name,
                email,
                role
            };

            await axios.post(`${this.apiUrl}/profiles`, profile);
            await axios.patch(`${this.apiUrl}/users/${newUser.id}`, { profileId: newUser.id });

            return newUser;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
}

export default new UserService();