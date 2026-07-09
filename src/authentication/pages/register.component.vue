<script>
import {useAuthenticationStore} from "../services/authentication.store.js";
import {SignUpRequest} from "../model/sign-up.request.js";
import { extractErrorMessage } from "../services/authentication.service.js";
import { useToast } from 'primevue/usetoast';
import {Toast as PvToast} from "primevue";

export default {
  name: "register",
  components: {PvToast},
  data() {
    return {
      hide: true,
      loading: false,
      authenticationStore: useAuthenticationStore(),
      email: "",
      password: "",
      toast: useToast(),
    }
  },
  methods: {
    goToSignIn() {
      this.$router.push('/sign-in');
    },
    togglePassword() {
      this.hide = !this.hide;
    },
    async onSignUp() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(this.email.trim())) {
        this.toast.add({ severity: 'error', summary: this.$t('sign-up.invalid-email-title'), detail: this.$t('sign-up.invalid-email'), life: 3000 });
        return;
      }

      if (this.password.length < 8) {
        this.toast.add({ severity: 'warn', summary: this.$t('toast.error'), detail: 'La contraseña debe tener al menos 8 caracteres', life: 3000 });
        return;
      }

      this.loading = true;

      const signUpRequest = new SignUpRequest(
          this.email.trim().toLowerCase(),
          this.password,
          this.password,
          this.email.split('@')[0],
          'LiquorStoreOwner'
      );

      try {
        await this.authenticationStore.signUp(signUpRequest, this.$router);
        this.toast.add({ severity: 'success', summary: this.$t('toast.success'), detail: 'Cuenta creada. Bienvenido.', life: 3000 });
      } catch (error) {
        this.toast.add({ severity: 'error', summary: this.$t('toast.error'), detail: extractErrorMessage(error), life: 4000 });
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>


<template>
  <div class="auth-container">
    <div class="register-section">
      <h2>{{ $t('sign-up.welcome-back') }}</h2>
      <p>{{ $t('sign-up.subtitle') }}</p>

      <button type="button" class="sign-in-button" @click="goToSignIn">
        {{ $t('sign-up.go-to-login') }}
      </button>
    </div>

    <div class="registration-form">
      <h2>{{ $t('sign-up.create-account-title') }}</h2>
      <form @submit.prevent="onSignUp">
        <div class="form-group">
          <label for="email">{{ $t('sign-up.email-label') }}</label>
          <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              :placeholder="$t('sign-up.placeholder-email-reg')"
              required
          />
        </div>

        <div class="form-group">
          <label for="password">{{ $t('sign-up.password') }}</label>
          <div class="password-input">
            <input
                id="password"
                v-model="password"
                :type="hide ? 'password' : 'text'"
                class="form-input"
                :placeholder="$t('sign-up.placeholder-password-reg')"
                required
                minlength="8"
            />
            <button
                type="button"
                class="toggle-password"
                @click="togglePassword"
            >
              <i :class="hide ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <button class="register-button" type="submit" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : $t('sign-up.create-account-button') }}
        </button>
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
  .sign-in-button,
  .register-button {
    width: 100%;
  }
}
</style>
