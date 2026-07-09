import httpInstance from '@/shared/services/http.instance.js';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import { isFrontendOnly } from '@/shared/config/frontend-only.js';

const mockProfile = () => {
    const authStore = useAuthenticationStore();
    return {
        profileId: '0',
        userId: authStore.currentUserId || '0',
        name: authStore.currentUsername || 'Usuario',
        email: authStore.currentUsername || '',
        businessName: '',
        businessAddress: '',
        phone: '',
        role: authStore.account?.accountRole || '',
    };
};

function mapProfile(data) {
    const authStore = useAuthenticationStore();
    return {
        profileId: data?.id ?? data?.Id ?? '',
        userId: data?.userId ?? data?.UserId ?? authStore.currentUserId,
        name: data?.fullName ?? data?.FullName ?? `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim(),
        email: authStore.currentUsername || '',
        businessName: '',
        businessAddress: '',
        phone: data?.phoneNumber ?? data?.PhoneNumber ?? data?.contactNumber ?? data?.ContactNumber ?? '',
        role: data?.assignedRole ?? data?.AssignedRole ?? authStore.account?.accountRole ?? '',
    };
}

class ProfileService {
    async getMyProfile() {
        if (isFrontendOnly()) return mockProfile();
        const { data } = await httpInstance.get('profiles/me');
        return mapProfile(data);
    }

    async getProfileById(profileId) {
        if (isFrontendOnly()) return mockProfile();
        const { data } = await httpInstance.get(`profiles/${profileId}`);
        return mapProfile(data);
    }

    async editProfile(profile) {
        if (isFrontendOnly()) return { ...mockProfile(), ...profile };
        const profileId = profile.profileId || profile.id;
        const { data } = await httpInstance.put(`profiles/${profileId}`, {
            firstName: profile.name?.split(' ')[0] || profile.name,
            lastName: profile.name?.split(' ').slice(1).join(' ') || '',
            phoneNumber: profile.phone,
            profilePictureUrl: profile.profilePictureUrl || '',
        });
        return mapProfile(data);
    }
}

export default new ProfileService();
