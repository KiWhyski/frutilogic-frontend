<script>
import {useAuthenticationStore} from "../services/authentication.store.js";
import {SignUpRequest} from "../model/sign-up.request.js";
import { useToast } from 'primevue/usetoast';
import {Toast as PvToast} from "primevue";

export default {
  name: "register",
  components: {PvToast},
  data() {
    return {
      hide: true,
      hideConfirm: true,
      loading: false,
      error: '',
      authenticationStore: useAuthenticationStore(),
      formData: {
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: ""
      },
      toast: useToast(),
    }
  },
  methods: {
    goToSignIn() {
      this.$router.push('/sign-in');
    },
    togglePassword(field) {
      if (field === 'password') {
        this.hide = !this.hide;
      } else if (field === 'confirm') {
        this.hideConfirm = !this.hideConfirm;
      }
    },
    onSignUp() {
      this.error = '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!this.formData.role) {
        this.toast.add({ severity: 'warn', summary: this.$t('toast.error'), detail: this.$t('sign-up.select-role'), life: 3000 });
        return;
      }

      if (!emailRegex.test(this.formData.username)) {
        this.toast.add({ severity: 'error', summary: this.$t('sign-up.invalid-email-title'), detail: this.$t('sign-up.invalid-email'), life: 3000 });
        return;
      }

      if (this.formData.password !== this.formData.confirmPassword) {
        this.toast.add({ severity: 'warn', summary: this.$t('sign-up.validate-password-title') , detail: this.$t('sign-up.validate-password'), life: 3000 });
        return;
      }

      this.loading = true;

      const signUpRequest = new SignUpRequest(
          this.formData.username,
          this.formData.password,
          this.formData.confirmPassword,
          this.formData.fullName,
          this.formData.role
      );

      this.authenticationStore.signUp(signUpRequest, this.$router)
          .then(() => {
            this.toast.add({ severity: 'success', summary: this.$t('toast.success'), detail: this.$t('sign-up.account-created'), life: 3000 });
          })
          .catch(() => {
            this.toast.add({ severity: 'error', summary: this.$t('toast.error'), detail: this.$t('sign-up.error-creating-account'), life: 3000 });
          })
          .finally(() => {
            this.loading = false;
          });
    }
  }
}
</script>


<template>
  <div class="auth-container">
    <!-- Left section: Role selection and info -->
    <div class="register-section">
      <h2>{{ $t('sign-up.welcome-back') }}</h2>
      <p>{{ $t('sign-up.subtitle') }}</p>

      <button class="sign-in-button" @click="goToSignIn">
        {{ $t('sign-up.go-to-login') }}
      </button>

      <div class="security-logos">
        <img src="@/assets/ssl-icon.svg" alt="SSL" />
        <img src="@/assets/recaptcha.svg" alt="reCAPTCHA" />
      </div>
    </div>

    <!-- Right section: Registration form -->
    <div class="registration-form">
      <h2>{{ $t('sign-up.create-account-title') }}</h2>
      <form @submit.prevent="onSignUp">

        <div class="form-group select-group">
          <label for="role" class="select-label">{{ $t('sign-up.select-your-role') }}</label>
          <select v-model="formData.role" id="role" class="form-select">
            <option value="" class="select-role" disabled selected>{{ $t('sign-up.select-role') }}</option>
            <option value="LiquorStoreOwner">{{ $t('sign-up.role-liquor') }}</option>
            <option value="Supplier">{{ $t('sign-up.role-supplier') }}</option>
          </select>
          <span class="select-arrow"></span>
        </div>

        <div class="form-group">
          <label for="fullName">{{ $t('sign-up.full-name') }}</label>
          <input
              id="fullName"
              v-model="formData.fullName"
              type="text"
              class="form-input"
              :placeholder="$t('sign-up.placeholder-full-name')"
          />
        </div>

        <div class="form-group">
          <label for="username">{{ $t('sign-up.email-label') }}</label>
          <input
              id="username"
              v-model="formData.username"
              type="email"
              class="form-input"
              :placeholder="$t('sign-up.placeholder-email-reg')"
          />
        </div>

        <div class="form-group">
          <label for="password">{{ $t('sign-up.password') }}</label>
          <div class="password-input">
            <input
                id="password"
                v-model="formData.password"
                :type="hide ? 'password' : 'text'"
                class="form-input"
                :placeholder="$t('sign-up.placeholder-password-reg')"
            />
            <button
                type="button"
                class="toggle-password"
                @click="togglePassword('password')"
            >
              <i :class="hide ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">{{ $t('sign-up.confirm-password') }}</label>
          <div class="password-input">
            <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :type="hideConfirm ? 'password' : 'text'"
                class="form-input"
                :placeholder="$t('sign-up.placeholder-confirm-reg')"
            />
            <button
                type="submit"
                class="toggle-password"
                @click="togglePassword('confirm')"
            >
              <i :class="hideConfirm ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <button class="register-button" type="submit">
          {{ $t('sign-up.create-account-button') }}
        </button>

        <div class="divider">{{ $t('sign-up.divider-or') }}</div>

        <div class="social-login">
          <button type="button" class="social-button">
            <img src="@/assets/google-icon.svg" alt="Google" />
          </button>
          <button type="button" class="social-button">
            <i class="pi pi-key"></i>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&family=Roboto:wght@400;500;700&display=swap');

.auth-container {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background-color: #ffffff;
}

.register-section {
  display: flex;
  flex-direction: column;
  background-color: #26021D;
  padding: 8rem;
  justify-content: center;
  align-items: center;
  width: 70%;
  border-radius: 0 6rem 6rem 0;
  color: #F4EDE3;
}

.register-section h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  color: #F4EDE3;
}

.register-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  text-align: center;
  font-family: 'Inter', sans-serif;
}

.select-group {
  width: 240px;
  margin-top: 1rem;
  position: relative;
  background-color: #ffffff;

  .select-label {
    font-family: 'Inter', sans-serif;
    display: block;
    color: #26021C;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .form-select {
    padding: 0.8rem 1rem;
    border: 2px solid #26021C;
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
    color: #4E4E4E;
    font-size: 1rem;
    background-color: white;
    outline: none;
    appearance: none;
    cursor: pointer;

    .select-role {
      color: white;
    }
  }

  .form-select:focus {
    border-color: #6E0081;
    background-color: #fff;
  }

}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 65%;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #26021C;
  pointer-events: none;
}

.sign-in-button {
  font-family: 'Roboto', sans-serif;
  background-color: #59033A;
  color: #F4EDE3;
  font-weight: bold;
  font-size: 1rem;
  width: 240px;
  height: 3rem;
  border-radius: 45px;
  border: none;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sign-in-button:hover {
  background-color: #6d0b3f;
}

.security-logos {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.security-logos img {
  height: 30px;
}

.registration-form {
  padding: 2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.registration-form h2 {
  font-size: 2.6rem;
  font-weight: bold;
  color: #6E0081;
  margin-bottom: 1rem;
  text-align: center;
  font-family: 'Poppins', sans-serif;
}

.registration-form form {
  width: 100%;
  max-width: 400px;
  align-items: center;
  display: flex;
  flex-direction: column;
}

.form-group {
  width: 100%;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #6E0081;
  font-family: 'Inter', sans-serif;
}

.form-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #26021D;
  border-radius: 45px;
  font-family: 'Inter', sans-serif;
  color: #4E4E4E;
  background-color: white;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #6E0081;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8E24AA;
  cursor: pointer;
  padding: 0;
}

.register-button {
  font-family: 'Roboto', sans-serif;
  background-color: #59033A;
  color: #F4EDE3;
  font-weight: bold;
  font-size: 1rem;
  width: 240px;
  height: 3rem;
  border-radius: 45px;
  border: none;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.register-button:hover {
  background-color: #6d0b3f;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #263238;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.social-button:hover {
  transform: scale(1.05);
}

.social-button img {
  width: 24px;
  height: 24px;
}

.social-button i {
  font-size: 24px;
  color: #263238;
}

@media (max-width: 768px) {
  .auth-container {
    flex-direction: column-reverse;
  }

  .register-section {
    width: 100%;
    padding: 4rem 2rem;
    border-radius: 6rem 6rem 0 0;
  }

  .registration-form {
    padding: 2rem 1rem;
  }

  .form-input,
  .form-select,
  .sign-in-button,
  .register-button {
    width: 100%;
  }
}
</style>