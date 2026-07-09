<script>
import { ref, reactive, computed, onMounted } from 'vue';
import ProfileEdit from './profile-edit.component.vue';
import SideNavbar from '@/public/components/side-navbar.vue';
import ToolbarContent from '@/public/components/toolbar-content.component.vue';
import { useAuthenticationStore } from '@/authentication/services/authentication.store.js';
import profileService from '@/profile-management/services/profile.service.js';
import { useI18n } from 'vue-i18n';
import { isFruitStoreOwner, normalizeAccountRole } from '@/shared/utils/account-role.js';

export default {
  name: 'ProfileComponent',
  components: {
    ToolbarContent,
    SideNavbar,
    ProfileEdit
  },
  setup() {
    const fileInput = ref(null);
    const authStore = useAuthenticationStore();
    const { t } = useI18n();
    const loading = ref(true);

    const userData = reactive({
      profileId: 0,
      name: '',
      email: '',
      role: '',
      businessName: '',
      businessAddress: '',
      phone: ''
    });

    const roleLabel = computed(() => {
      const r = normalizeAccountRole(authStore.account?.accountRole ?? userData.role);
      if (isFruitStoreOwner(r)) return t('sign-up.role-liquor');
      if (r === 'Supplier') return t('sign-up.role-supplier');
      if (r) return r;
      return '—';
    });

    onMounted(async () => {
      try {
        const profile = await profileService.getMyProfile();
        Object.assign(userData, profile);
        userData.email = profile.email || authStore.currentUsername || '';
        userData.role = normalizeAccountRole(authStore.account?.accountRole ?? profile.role);
      } catch (error) {
        console.error('Error loading profile:', error);
        userData.email = authStore.currentUsername || '';
        userData.name = authStore.currentUsername || '';
        userData.role = normalizeAccountRole(authStore.account?.accountRole);
      } finally {
        loading.value = false;
      }
    });

    const uploadNewPhoto = () => {
      fileInput.value.click();
    };

    const onFileSelected = (event) => {
      const input = event.target;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {};
        reader.readAsDataURL(file);
      }
    };

    return {
      userData,
      loading,
      fileInput,
      uploadNewPhoto,
      onFileSelected,
      roleLabel
    };
  },
};
</script>

<template>
  <div class="profile-page profile-page--apple dashboard-view--white">
    <SideNavbar>
      <ToolbarContent :pageTitle="$t('profile.title')" />
      <div class="profile-container">
        <div class="profile-stack">
          <div class="profile-row">
            <aside class="profile-aside">
              <p class="apple-section-label">{{ $t('profile.section-profile') }}</p>
              <div class="user-card apple-elevated">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="visually-hidden"
                  @change="onFileSelected"
                />
                <div class="avatar-wrap">
                  <div class="avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="user-info">
                  <h2 class="user-name">{{ userData.name }}</h2>
                  <p class="user-email">{{ userData.email }}</p>
                  <button type="button" class="upload apple-btn apple-btn--primary" @click="uploadNewPhoto">
                    {{ $t('profile.choose-photo') }}
                  </button>
                </div>
              </div>

              <p class="apple-section-label profile-aside__role-label">{{ $t('profile.role-label') }}</p>
              <div class="role-pill apple-elevated">
                <span class="role-pill__text">{{ roleLabel }}</span>
              </div>
            </aside>

            <div class="profile-main">
              <ProfileEdit />
            </div>
          </div>
        </div>
      </div>
    </SideNavbar>
  </div>
</template>

<style scoped>
.profile-page {
  --apple-bg: #ffffff;
  --apple-card: #ffffff;
  --apple-label: rgba(60, 60, 67, 0.6);
  --apple-text: #1d1d1f;
  /* Títulos: negro + stack del sistema (alineado con secciones del formulario) */
  --profile-title-color: #111111;
  /* Mismo verde que dashboard / sidebar (--app-green-accent) */
  --stocksip-green: var(--app-green-accent, #16a34a);
  --stocksip-green-hover: var(--app-green-accent-hover, #15803d);
  --apple-separator: rgba(60, 60, 67, 0.12);
  --apple-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  /* Misma cápsula que inputs / perfil edit */
  --apple-input-radius: 999px;
  width: 100%;
  min-height: 100vh;
  font-family: var(--apple-font);
}

.profile-page--apple.dashboard-view--white :deep(.custom-toolbar) {
  background-color: var(--apple-bg) !important;
  border-bottom: 1px solid var(--apple-separator) !important;
}

.profile-page--apple.dashboard-view--white :deep(.toolbar-title) {
  background-color: transparent !important;
  color: var(--profile-title-color) !important;
  font-family: var(--apple-font) !important;
  font-size: 1.375rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.02em !important;
  padding-left: 1.25rem !important;
  line-height: 1.2 !important;
}

.profile-page--apple.dashboard-view--white :deep(main.content) {
  background-color: var(--apple-bg);
}

.profile-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  background-color: var(--apple-bg);
  min-height: 100vh;
  padding: 1.25rem 1.25rem 2.5rem;
  width: 100%;
  box-sizing: border-box;
}

.profile-stack {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.profile-row {
  display: grid;
  grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  gap: 2rem;
  align-items: start;
  width: 100%;
}

.profile-aside {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.profile-main {
  min-width: 0;
}

.profile-main :deep(.profile-edit--apple.profile-edit-container) {
  max-width: none;
  width: 100%;
}

.profile-aside .apple-section-label:first-child {
  margin-top: 0.25rem;
}

.profile-aside__role-label {
  margin-top: 1rem;
}

.apple-section-label {
  font-family: var(--apple-font);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--profile-title-color);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 1.25rem 0 0.375rem 0.25rem;
}

.apple-elevated {
  background: var(--apple-card);
  border-radius: var(--apple-input-radius);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.user-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1.25rem 1.25rem;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(180deg, #e8e8ed 0%, #d1d1d6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(60, 60, 67, 0.45);
}

.avatar svg {
  width: 44px;
  height: 44px;
}

.user-info {
  flex: 1;
  min-width: 0;
  text-align: left;
  margin: 0;
}

.user-name {
  margin: 0 0 0.25rem 0;
  font-family: var(--apple-font);
  color: var(--profile-title-color);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.user-email {
  margin: 0 0 0.75rem 0;
  color: var(--apple-label);
  font-size: 0.9375rem;
  line-height: 1.35;
}

.apple-btn {
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  padding: 0.55rem 1.25rem;
  border-radius: var(--apple-input-radius);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.apple-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.apple-btn--primary {
  background: var(--stocksip-green);
  color: #fff;
}

.upload:hover {
  background: var(--stocksip-green-hover);
  filter: none;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  padding: 0.65rem 1.15rem;
  border-radius: var(--apple-input-radius);
  font-family: var(--apple-font);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--profile-title-color);
  box-sizing: border-box;
}

.role-pill__text {
  letter-spacing: -0.02em;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .profile-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .profile-aside__role-label {
    margin-top: 0.5rem;
  }
}

@media (max-width: 1024px) {
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-info {
    width: 100%;
  }
}
</style>
