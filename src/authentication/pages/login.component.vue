<script>

import {useAuthenticationStore} from "@/authentication/services/authentication.store.js";
import {SignInRequest} from "@/authentication/model/sign-in.request.js";
import { extractErrorMessage } from "@/authentication/services/authentication.service.js";
import {Toast as PvToast} from "primevue";
import {useToast} from "primevue/usetoast";
export default {
  name: "login",
  components: {PvToast},
  data() {
    return {
      hide: true,
      username: "",
      password: "",
      authenticationStore: useAuthenticationStore(),
      rememberMe: false,
      accountType: '',
      toast: useToast(),
    }
  },
  methods: {
    goToRegister() {
      this.$router.push({ name: 'sign-up' });
    },
    goToPasswordRecovery() {
      this.$router.push('/password-recovery');
    },
    togglePassword() {
      this.hide = !this.hide;
    },
    async onSignIn() {
      if (!this.username?.trim() || !this.password) {
        this.toast.add({
          severity: 'warn',
          summary: this.$t('toast.error'),
          detail: this.$t('sign-in.invalid-credentials'),
          life: 3000
        });
        return;
      }

      const signInRequest = new SignInRequest(this.username.trim(), this.password);
      try {
        await this.authenticationStore.signIn(signInRequest, this.$router);
      } catch (error) {
        this.toast.add({
          severity: 'error',
          summary: this.$t('toast.error'),
          detail: extractErrorMessage(error),
          life: 4000
        });
        console.error('Error to enter the system:', error);
      }
    }
  }
}
</script>

<template>
  <div class="authentication-container login-view">
    <div class="login-hero" aria-hidden="true">
      <img
        class="login-hero__img"
        src="@/assets/login-illustration.png"
        alt=""
      />
    </div>

    <!-- Login Section -->
    <div class="login-section">
      <h2>{{ $t('sign-in.title') }}</h2>
      <form @submit.prevent="onSignIn">
        <div class="form-group">
          <label for="username">{{ $t('sign-in.email') }}</label>
          <input
              id="username"
              v-model="username"
              type="email"
              :placeholder="$t('sign-in.placeholder-email')"
              class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">{{ $t('sign-in.password') }}</label>
          <div class="password-input">
            <input
                id="password"
                v-model="password"
                :type="hide ? 'password' : 'text'"
                :placeholder="$t('sign-in.placeholder-password')"
                class="form-input"
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

        <div class="remember-me">
          <label class="checkbox-container">
            <input
                type="checkbox"
                v-model="rememberMe"
            />
            <span class="checkmark"></span>
            <span>{{ $t('sign-in.rememberMe') }}</span>
          </label>
        </div>

        <button type="submit" class="sign-in-button">
          {{ $t('sign-in.signIn') }}
        </button>

        <div class="forgot-password">
          <a href="#" @click.prevent="goToPasswordRecovery">{{ $t('sign-in.forgotPassword') }}</a>
        </div>

        <p class="register-row">
          <span class="register-row__hint">¿Nuevo aquí?</span>
          <button type="button" class="register-row__link" @click="goToRegister">
            Crear cuenta
          </button>
        </p>

        <div class="divider">{{ $t('sign-in.or') }}</div>

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
/* Move @import to the top */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&family=Roboto:wght@400;500;700&display=swap');

/* Paleta solo verdes (sin grises fríos que tiren a morado/azul) */
.authentication-container {
  --login-green-deep: #0d3b26;
  --login-green-panel: #14532d;
  --login-green-accent: #2e7d32;
  --login-green-accent-hover: #1b5e20;
  --login-green-soft: #e8f5e9;
  --login-green-border: #a5d6a7;
  --login-green-muted: #3d5c48;
  --login-green-text: #1b3326;
  --login-white: #ffffff;
  --login-cream: #ffffff;
  /* Ancho de la *columna* (espacio hacia el formulario); la imagen va aparte (max-width). */
  --login-hero-column-grow: 1.55;
  /* La ilustración no escala con toda la columna: solo crece el margen por la derecha. */
  /* −2% adicional sobre el tope anterior */
  --login-hero-img-max: min(calc(32rem * 1.69 * 0.95 * 0.98), 100%);
  /* −70% de espacio respecto al clamp base (permanece el 30% del hueco) */
  --login-hero-gap-right: clamp(calc(1.75rem * 0.3), calc(6vw * 0.3), calc(4.5rem * 0.3));
  display: flex;
  align-items: center;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background-color: var(--login-cream);
  color: var(--login-green-text);
}

/* Texto y enlaces: tonos verdes; anula morados de visitados del navegador */
.authentication-container a:link,
.authentication-container a:visited {
  color: var(--login-green-accent);
}

.authentication-container a:hover {
  color: var(--login-green-accent-hover);
}

.authentication-container .register-row__link,
.authentication-container .register-row__link:visited {
  color: var(--login-green-accent);
}

.authentication-container .register-row__link:hover {
  color: var(--login-green-accent-hover);
}

.login-section {
  flex: 1 1 0;
  min-width: 0;
  /* Alineado al borde interior de la columna (junto a la ilustración) */
  padding: 2rem 2rem 2rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  background-color: transparent;
}

.login-section form {
  width: 100%;
  max-width: 22rem;
  align-self: flex-start;
}

.form-group {
  width: 100%;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--login-green-accent);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--login-green-border);
  border-radius: 45px;
  font-family: 'Inter', sans-serif;
  color: var(--login-green-text);
  background-color: var(--login-white);
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  caret-color: var(--login-green-accent);
}

.form-input::placeholder {
  color: rgba(27, 94, 32, 0.45);
}

.form-input:focus {
  border-color: var(--login-green-accent);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--login-green-soft);
  border: none;
  color: var(--login-green-accent);
  cursor: pointer;
  padding: 0.45rem 0.55rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
}

.toggle-password:hover {
  background: var(--login-green-soft);
  color: var(--login-green-accent);
}

.toggle-password:active {
  transform: translateY(-50%) scale(0.92);
}

.form-select {
  width: 240px;
  padding: 0.8rem 1rem;
  border: 1px solid var(--login-green-border);
  border-radius: 45px;
  font-family: 'Inter', sans-serif;
  color: var(--login-white);
  background-color: transparent;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.form-select option {
  color: var(--login-green-muted);
  background-color: var(--login-white);
}

.login-section h2 {
  align-self: flex-start;
  width: 100%;
  max-width: 22rem;
  text-align: left;
  color: var(--login-green-deep);
  font-size: 2.6rem;
  font-family: 'Poppins', sans-serif;
  margin-bottom: 2rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--login-green-text);
}

.checkbox-container input {
  margin-right: 0.5rem;
}

.checkbox-container .checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--login-green-accent);
  border-radius: 3px;
  margin-right: 0.5rem;
  position: relative;
}

.checkbox-container input:checked + .checkmark:after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid var(--login-green-accent);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.sign-in-button {
  align-items: center;
  justify-content: center;
  font-family: 'Poppins', sans-serif;
  background-color: var(--login-green-accent);
  color: var(--login-white);
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
  width: 100%;
  max-width: 280px;
  min-height: 3.125rem;
  padding: 0.75rem 1.75rem;
  border-radius: 999px;
  border: none;
  margin: 1rem 0 0 0;
  display: flex;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(27, 94, 32, 0.35);
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease,
    background-color 0.2s ease;
}

.sign-in-button:hover {
  transform: translateY(-2px);
  background-color: var(--login-green-accent-hover);
  box-shadow: 0 8px 22px rgba(27, 94, 32, 0.4);
}

.sign-in-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(27, 94, 32, 0.35);
}

.sign-in-button:focus-visible {
  outline: none;
  box-shadow:
    0 4px 14px rgba(27, 94, 32, 0.35),
    0 0 0 3px var(--login-white),
    0 0 0 6px rgba(46, 125, 50, 0.45);
}

.login-hero {
  flex: var(--login-hero-column-grow) 1 0;
  min-width: 0;
  padding: 0 var(--login-hero-gap-right) 0 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  align-self: center;
  width: 100%;
  height: auto;
  overflow: visible;
  border-radius: 12px;
  background-color: #ffffff;
  box-sizing: border-box;
}

/* Proporción natural; ancho limitado: el “crece” es espacio en blanco a la derecha, no la foto entera. */
.login-hero__img {
  display: block;
  width: auto;
  max-width: var(--login-hero-img-max);
  height: auto;
  flex-shrink: 0;
}

.register-row {
  text-align: left;
  margin-top: 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: var(--login-green-text);
}

.register-row__hint {
  margin-right: 0.35rem;
}

.register-row__link {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  color: var(--login-green-accent);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.register-row__link:hover {
  color: var(--login-green-accent-hover);
}

.register-row__link:focus-visible {
  outline: 2px solid var(--login-green-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  margin: 1.5rem 0;
  color: var(--login-green-muted);
}

.divider::before {
  content: '';
  flex: 0 0 2rem;
  height: 1px;
  background-color: rgba(46, 125, 50, 0.2);
}

.divider::after {
  content: '';
  flex: 1 1 auto;
  min-width: 0;
  height: 1px;
  background-color: rgba(46, 125, 50, 0.2);
}

.forgot-password {
  text-align: left;
  margin-top: 1rem;
}

.forgot-password a {
  color: var(--login-green-accent);
  text-decoration: none;
  transition: color 0.3s;
}

.forgot-password a:hover {
  color: var(--login-green-accent-hover);
}

.local-preview-row {
  text-align: left;
  margin-top: 1.15rem;
}

.local-preview-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 1.15rem;
  background-color: var(--login-white);
  border: 1.5px solid var(--login-green-border);
  border-radius: 999px;
  color: var(--login-green-accent-hover);
  text-decoration: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.08);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease;
}

.local-preview-link:hover {
  background-color: var(--login-green-soft);
  border-color: var(--login-green-accent);
  color: var(--login-green-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.18);
}

.local-preview-link:active {
  transform: translateY(0);
}

.local-preview-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.35);
}

.local-preview-link__icon {
  font-size: 0.95rem;
  opacity: 0.85;
}

.social-login {
  display: flex;
  justify-content: flex-start;
  gap: 1.1rem;
  margin-top: 1rem;
}

.social-button {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1.5px solid var(--login-green-border);
  background-color: var(--login-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(46, 125, 50, 0.12);
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.social-button:hover {
  transform: translateY(-3px) scale(1.04);
  background-color: var(--login-green-soft);
  border-color: var(--login-green-accent);
  box-shadow: 0 8px 18px rgba(46, 125, 50, 0.22);
}

.social-button:active {
  transform: translateY(0) scale(0.98);
}

.social-button:focus-visible {
  outline: none;
  box-shadow:
    0 3px 10px rgba(46, 125, 50, 0.15),
    0 0 0 3px rgba(46, 125, 50, 0.35);
}

.social-button img {
  width: 24px;
  height: 24px;
}

.social-button i {
  font-size: 22px;
  color: var(--login-green-accent);
}

/* Responsive Design */
@media (max-width: 768px) {
  .authentication-container {
    flex-direction: column;
    align-items: stretch;
  }

  .login-hero {
    height: auto;
    flex: none;
    align-self: stretch;
    border-radius: 0;
    justify-content: center;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .login-hero__img {
    max-width: var(--login-hero-img-max);
  }

  .login-section {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .form-input,
  .form-select,
  .sign-in-button {
    width: 100%;
  }
}

.select-group {
  position: relative;
  width: 240px;
}

.select-label {
  display: block;
  margin-bottom: 0.5rem;
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
}

.form-select {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  outline: none;
  appearance: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.form-select option {
  color: var(--login-green-muted);
  background-color: var(--login-green-panel);
  padding: 8px;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 65%;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid white;
  pointer-events: none;
}

/*
  Vuetify aplica --v-theme-primary (morado) a <a> y a veces a botones nativos.
  Forzamos verdes solo en esta vista (.login-view).
*/
.v-application .login-view .login-section > h2 {
  color: var(--login-green-deep) !important;
}

.v-application .login-view .form-group > label {
  color: var(--login-green-accent) !important;
}

.v-application .login-view .form-input {
  color: var(--login-green-text) !important;
  -webkit-text-fill-color: var(--login-green-text) !important;
}

.v-application .login-view .form-input::placeholder {
  color: rgba(27, 94, 32, 0.5) !important;
  -webkit-text-fill-color: rgba(27, 94, 32, 0.5) !important;
  opacity: 1 !important;
}

.v-application .login-view .form-input:-webkit-autofill,
.v-application .login-view .form-input:-webkit-autofill:hover,
.v-application .login-view .form-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: var(--login-green-text) !important;
  caret-color: var(--login-green-accent) !important;
}

.v-application .login-view button.sign-in-button {
  background-color: var(--login-green-accent) !important;
  background-image: none !important;
  color: var(--login-white) !important;
  border: none !important;
  opacity: 1 !important;
}

.v-application .login-view button.sign-in-button:hover {
  background-color: var(--login-green-accent-hover) !important;
  color: var(--login-white) !important;
}

.v-application .login-view .forgot-password a {
  color: var(--login-green-accent) !important;
}

.v-application .login-view .forgot-password a:hover {
  color: var(--login-green-accent-hover) !important;
}

.v-application .login-view .register-row,
.v-application .login-view .register-row__hint {
  color: var(--login-green-text) !important;
}

.v-application .login-view .register-row__link,
.v-application .login-view .register-row__link:visited {
  color: var(--login-green-accent) !important;
}

.v-application .login-view .register-row__link:hover {
  color: var(--login-green-accent-hover) !important;
}

.v-application .login-view .local-preview-link {
  color: var(--login-green-accent-hover) !important;
  border-color: var(--login-green-border) !important;
}

.v-application .login-view .local-preview-link:hover {
  color: var(--login-green-accent) !important;
  border-color: var(--login-green-accent) !important;
}

.v-application .login-view .divider {
  color: var(--login-green-muted) !important;
}

.v-application .login-view .checkbox-container {
  color: var(--login-green-text) !important;
}

.v-application .login-view .checkbox-container input[type='checkbox'] {
  accent-color: var(--login-green-accent);
}
</style>