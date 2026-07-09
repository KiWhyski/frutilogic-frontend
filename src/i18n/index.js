import es from '../locales/es.json';
import {createI18n} from "vue-i18n";

const i18n = createI18n({
    legacy: true,
    locale: 'es',
    fallbackLocale: 'es',
    globalInjection: true,
    messages: { es },
});

export default i18n;